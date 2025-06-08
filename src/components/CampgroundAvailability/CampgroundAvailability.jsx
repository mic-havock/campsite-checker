import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  ModuleRegistry,
  RowSelectionModule,
  TextFilterModule,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import { isNonReservableStatus } from "../../config/reservationStatus";
import AlertModal from "../Common/AlertModal/AlertModal";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./campground-availability.scss";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  CellStyleModule,
  TextFilterModule,
  RowSelectionModule,
]);

const getNextMonths = () => {
  const months = [];
  const currentDate = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();

    months.push({
      value: date.toISOString(),
      label: `${monthName} ${year}`,
      month: monthName,
      year: year,
    });
  }
  return months;
};

const getStatusColors = (status) => {
  const colors = {
    NYR: { base: "#4a90e2", hover: "#67a7ed" },
    Reserved: { base: "#d65140", hover: "#ff6b5b" },
    default: { base: "#707070", hover: "#8a8a8a" },
  };

  return colors[status] || colors.default;
};

const calculateGridStyle = (rowData, tableWidth, rowHeight, headerHeight) => {
  const calculatedHeight = rowData.length * rowHeight + headerHeight + 20;
  const gridHeight = Math.min(calculatedHeight, 700);

  return {
    height: `${gridHeight}px`,
    width: `${tableWidth * 0.96}px`,
  };
};

const CampgroundAvailability = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [availabilityData, setAvailabilityData] = useState(
    location.state?.availabilityData
  );
  const facilityID = location.state?.facilityID;
  const campsiteName = location.state?.campsiteName;
  const [alertModal, setAlertModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [tableWidth, setTableWidth] = useState(window.innerWidth);
  const [gridApi, setGridApi] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });
  const [startDate, setStartDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [hideNotReservable, setHideNotReservable] = useState(false);
  const isMounted = useRef(true);
  const rowHeight = 30;
  const headerHeight = 30;
  const [selectedCampsites, setSelectedCampsites] = useState([]);
  const [bulkAlertModal, setBulkAlertModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setTableWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gridApi]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { dates, rowData } = useMemo(() => {
    if (!availabilityData || !availabilityData.campsites) {
      return { dates: [], rowData: [] };
    }

    const campsitesData = Object.values(availabilityData.campsites);
    const datesArray = Array.from(
      new Set(
        campsitesData.flatMap((campsite) =>
          Object.keys(campsite.availabilities).map(
            (date) => new Date(date).toISOString().split("T")[0]
          )
        )
      )
    ).sort();

    const rowDataArray = campsitesData.map((campsite) => {
      const row = {
        campsite: `${campsite.site}`,
        loop: `${campsite.loop}`,
        campsiteObj: campsite,
      };

      datesArray.forEach((date) => {
        const status = campsite.availabilities[`${date}T00:00:00Z`];
        row[date] = {
          available: status === "Available" || status === "Open",
          status: status,
        };
      });

      return row;
    });

    return { dates: datesArray, rowData: rowDataArray };
  }, [availabilityData]);

  const notReservableMap = useMemo(() => {
    const map = new Map();

    if (!dates.length || !rowData.length) return map;

    rowData.forEach((row) => {
      const isNotReservable = dates.every((date) => {
        const status = row.campsiteObj?.availabilities[`${date}T00:00:00Z`];
        return isNonReservableStatus(status);
      });
      map.set(row.campsite, isNotReservable);
    });
    return map;
  }, [rowData, dates]);

  const filteredRows = useMemo(() => {
    if (!rowData.length) return [];
    if (!hideNotReservable) return rowData;
    return rowData.filter((row) => !notReservableMap.get(row.campsite));
  }, [rowData, hideNotReservable, notReservableMap]);

  if (!availabilityData || !availabilityData.campsites) {
    return (
      <div>
        <h1>Campground Availability For Details</h1>
        <p>No availability data found. Please go back and try again.</p>
        <button onClick={() => navigate(-1)}>Back to Campsites</button>
      </div>
    );
  }

  const handleUnavailableClick = (campsite, date) => {
    setSelectedCampsite(campsite);
    setAlertDetails((prev) => ({
      ...prev,
      startDate: date,
      endDate: date,
    }));
    setAlertModal(true);
  };

  const handleSelectChange = async (event) => {
    setSelectedMonth(event.target.value);
    const startDate = new Date(event.target.value);
    const utcDate = new Date(
      Date.UTC(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0)
    );
    setStartDate(utcDate.toISOString());
  };

  const handleMonthChange = async () => {
    setSelectedMonth(event.target.value);
    setIsLoading(true);

    try {
      if (!facilityID) {
        throw new Error("Facility ID not found");
      }

      const data = await fetchCampgroundAvailability(facilityID, startDate);
      setAvailabilityData(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleSelectionChanged = (event) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedCampsites(selectedRows);
  };

  const handleBulkAlertClick = () => {
    if (selectedCampsites.length === 0) return;

    setAlertDetails((prev) => ({
      ...prev,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    }));
    setBulkAlertModal(true);
  };

  const renderCalendar = () => {
    const gridStyle = calculateGridStyle(
      rowData,
      tableWidth,
      rowHeight,
      headerHeight
    );

    const columnDefs = [
      {
        headerName: "",
        field: "checkbox",
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        pinned: "left",
        lockPinned: true,
        suppressSizeToFit: false,
        resizable: false,
        filter: false,
        cellStyle: {
          backgroundColor: "#f8f9fa",
        },
      },
      {
        headerName: "Campsite",
        field: "campsite",
        pinned: "left",
        lockPinned: true,
        width: 130,
        suppressSizeToFit: false,
        resizable: true,
        cellStyle: {
          backgroundColor: "#f8f9fa",
          textAlign: "center",
        },
        headerClass: "ag-header-cell-center",
      },
      ...(rowData.some((row) => row.loop)
        ? [
            {
              headerName: "Loop",
              field: "loop",
              pinned: "left",
              lockPinned: true,
              suppressSizeToFit: false,
              resizable: true,
              width: 200,
              headerClass: "ag-header-cell-center",
              cellStyle: {
                backgroundColor: "#f8f9fa",
              },
            },
          ]
        : []),
      ...dates.map((date) => ({
        headerName: new Date(date).toLocaleDateString("en-US", {
          timeZone: "UTC",
          month: "numeric",
          day: "numeric",
        }),
        field: date,
        width: 90,
        headerClass: "ag-header-cell-center",
        valueFormatter: (params) => {
          return params.value.available ? "A" : "X";
        },
        cellStyle: {
          padding: "0",
          textAlign: "center",
          border: "none",
          borderRight: "1px solid #e0e0e0",
        },
        cellRenderer: (params) => {
          const data = params.value;
          if (data.available) {
            return (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "not-allowed",
                  backgroundColor: "#4caf50",
                  transition: "all 0.2s ease",
                  position: "relative",
                  boxShadow: "none",
                  transform: "scale(1)",
                  opacity: "1",
                  color: "#f8f9fa",
                  fontSize: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#90ff88";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.opacity = "0.95";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#4caf50";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                A
              </div>
            );
          } else {
            const { base: baseColor, hover: hoverColor } = getStatusColors(
              data.status
            );

            return (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isNonReservableStatus(data.status)
                    ? "not-allowed"
                    : "pointer",
                  backgroundColor: baseColor,
                  transition: "all 0.2s ease",
                  position: "relative",
                  boxShadow: "none",
                  transform: "scale(1)",
                  opacity: "1",
                  color: "#f8f9fa",
                  fontSize: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverColor;
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.opacity = "0.95";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = baseColor;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
                onClick={() =>
                  !isNonReservableStatus(data.status) &&
                  handleUnavailableClick(params.data.campsiteObj, date)
                }
                title={data.status}
              >
                {data.status === "NYR"
                  ? "NYR"
                  : data.status === "Reserved"
                  ? "R"
                  : "NR"}
              </div>
            );
          }
        },
      })),
    ];

    const availabilitySchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Campground Availability Calendar",
      description: "Real-time availability calendar for campground bookings",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        availabilityStarts: startDate,
        availabilityEnds: alertDetails.endDate,
      },
    };

    return (
      <>
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(availabilitySchema)}
          </script>
        </Helmet>
        <div className="campground-availability-container">
          {isLoading && <LoadingSpinner fullPage />}

          <div className="campground-availability-header">
            <h1>Campground Availability</h1>

            <div className="availability-card">
              <div className="availability-header">
                <h2>Check Campground Availability</h2>
              </div>
              <div className="availability-body">
                <div className="availability-row">
                  <select
                    id="month-select"
                    value={selectedMonth}
                    onChange={handleSelectChange}
                    className="month-select"
                    disabled={isLoading}
                  >
                    <option value="">
                      Select a month to see availability...
                    </option>
                    {getNextMonths().map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleMonthChange}
                    className="check-availability-btn"
                    disabled={!selectedMonth || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span style={{ marginLeft: "8px" }}>Loading...</span>
                      </>
                    ) : (
                      "Check"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="info-text">
              <h3>How to use:</h3>
              <div className="info-content">
                <div className="info-item">
                  <span className="bullet">•</span>
                  <span>
                    Click on any Reserved or Not Yet Released date to create an
                    alert for that date
                  </span>
                </div>
                <div className="info-item">
                  <span className="bullet">•</span>
                  <span>
                    Use checkboxes to select multiple campsites, then click
                    &quot;Create Alert for Selected&quot; to create an alert for
                    them
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="availability-container">
            <div className="availability-legend">
              <span className="legend-item">
                <strong>A</strong> = Available
              </span>
              <span className="legend-item reserved">
                <strong>R</strong> = Reserved
              </span>
              <span className="legend-item not-yet-released">
                <strong>NYR</strong> = Not Yet Released
              </span>
              <span className="legend-item not-reservable">
                <strong>NR</strong> = Not Reservable/Not Available
              </span>
              <div className="legend-controls">
                <input
                  type="checkbox"
                  id="hideNotReservable"
                  checked={hideNotReservable}
                  onChange={(e) => setHideNotReservable(e.target.checked)}
                />
                <label htmlFor="hideNotReservable">
                  Hide campsites that are not reservable for all dates
                </label>
                {selectedCampsites.length > 0 && (
                  <button
                    onClick={handleBulkAlertClick}
                    className="bulk-alert-button"
                  >
                    Create Alert for {selectedCampsites.length} Selected
                    Campsite
                    {selectedCampsites.length !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>

            <div className="ag-theme-alpine" style={gridStyle}>
              <AgGridReact
                rowData={filteredRows}
                columnDefs={columnDefs}
                suppressHorizontalScroll={false}
                defaultColDef={{
                  sortable: true,
                  resizable: true,
                  filter: true,
                }}
                onGridReady={(params) => {
                  setGridApi(params.api);
                }}
                headerHeight={headerHeight}
                rowHeight={rowHeight}
                domLayout="normal"
                rowSelection="multiple"
                onSelectionChanged={handleSelectionChanged}
                suppressCellSelection={true}
                suppressRowClickSelection={true}
                enableCellTextSelection={true}
              />
            </div>
          </div>

          <button className="back-button" onClick={() => navigate(-1)}>
            <span>←</span> Back to Campsites
          </button>

          <AlertModal
            isOpen={alertModal}
            onClose={() => setAlertModal(false)}
            title="Availability Alert"
            subtitle={
              selectedCampsite
                ? `Campsite: ${selectedCampsite.site} - ${selectedCampsite.loop}`
                : ""
            }
            alertDetails={alertDetails}
            setAlertDetails={setAlertDetails}
            isCreatingAlert={isCreatingAlert}
            setIsCreatingAlert={setIsCreatingAlert}
            selectedCampsite={selectedCampsite}
            campsiteName={campsiteName}
          />

          <AlertModal
            isOpen={bulkAlertModal}
            onClose={() => setBulkAlertModal(false)}
            title="Bulk Availability Alert"
            subtitle={`${selectedCampsites.length} Campsites Selected`}
            alertDetails={alertDetails}
            setAlertDetails={setAlertDetails}
            isCreatingAlert={isCreatingAlert}
            setIsCreatingAlert={setIsCreatingAlert}
            selectedCampsites={selectedCampsites}
            campsiteName={campsiteName}
            isBulkAlert={true}
          />
        </div>
      </>
    );
  };

  return renderCalendar();
};

export default CampgroundAvailability;
