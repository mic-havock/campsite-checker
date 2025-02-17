import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  ModuleRegistry,
  TextFilterModule,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import reservationsAPI from "../../api/reservations";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./reservation-details.scss";

// Register all required modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  CellStyleModule,
  TextFilterModule,
]);

const ReservationDetailsPage = () => {
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
  const [hideNotReservable, setHideNotReservable] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setTableWidth(window.innerWidth);
      if (gridApi) {
        gridApi.sizeColumnsToFit();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gridApi]);

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

  const handleCreateAlert = async () => {
    console.log("Creating alert:", alertDetails);
    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    const reservationData = {
      name,
      email_address: email,
      campsite_id: selectedCampsite.campsite_id,
      campsite_number: selectedCampsite.site,
      campsite_name: campsiteName,
      reservation_start_date: startDate,
      reservation_end_date: endDate,
      monitoring_active: true,
      attempts_made: 0,
      success_sent: false,
    };

    try {
      const result = await reservationsAPI.create(reservationData);
      setAlertModal(false);
      alert(
        `\nAlert created successfully! Reservation ID: ${result.id} \n\nIf your selection becomes available, you will receive an email.`
      );
      setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create alert. Please try again.");
    }
  };

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

      // Update the state with new data
      setAvailabilityData(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
      setIsLoading(false);
    }
  };

  const renderCalendar = () => {
    const campsites = Object.values(availabilityData.campsites);
    const dates = Array.from(
      new Set(
        campsites.flatMap((campsite) =>
          Object.keys(campsite.availabilities).map(
            (date) => new Date(date).toISOString().split("T")[0]
          )
        )
      )
    ).sort();

    // Transform data for AG Grid
    const rowData = campsites.map((campsite) => {
      const row = {
        campsite: `${campsite.site}`,
        loop: `${campsite.loop}`,
        campsiteObj: campsite, // Store full campsite object for reference
      };

      dates.forEach((date) => {
        row[date] = {
          available:
            campsite.availabilities[`${date}T00:00:00Z`] === "Available",
          status: campsite.availabilities[`${date}T00:00:00Z`],
        };
      });

      return row;
    });

    // Calculate dynamic height based on number of rows
    const rowHeight = 30; // height of each row
    const headerHeight = 30; // height of the header
    const calculatedHeight = rowData.length * rowHeight + headerHeight + 20;
    const gridHeight = Math.min(calculatedHeight, 700); // Cap at 700px

    const gridStyle = {
      height: `${gridHeight}px`,
      width: `${tableWidth * 0.96}px`,
    };

    const columnDefs = [
      {
        headerName: "Campsite",
        field: "campsite",
        pinned: "left",
        lockPinned: true,
        width: 150,
        cellStyle: {
          backgroundColor: "#f8f9fa",
          //borderRight: "1px solid#c4c4c4",
        },
      },
      {
        headerName: "Loop",
        field: "loop",
        pinned: "left",
        lockPinned: true,
        width: 150,
        cellStyle: {
          backgroundColor: "#f8f9fa",
          //borderRight: "1px solid #dde2eb",
        },
      },
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
                  backgroundColor: "#7ee875",
                  transition: "background-color 0.2s ease",
                  margin: "-1px",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#90ff88";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#7ee875";
                }}
              >
                A
              </div>
            );
          } else {
            const getBackgroundColor = (status) => {
              switch (status) {
                case "NYR":
                  return "#4a90e2"; // blue for NYR
                case "Not Reservable":
                  return "#707070"; // gray for Not Reservable
                default:
                  return "#d65140"; // red for other unavailable statuses
              }
            };

            const getHoverColor = (status) => {
              switch (status) {
                case "NYR":
                  return "#67a7ed"; // lighter blue for NYR hover
                case "Not Reservable":
                  return "#8a8a8a"; // lighter gray for Not Reservable hover
                default:
                  return "#ff6b5b"; // lighter red for other statuses
              }
            };

            const baseColor = getBackgroundColor(data.status);
            const hoverColor = getHoverColor(data.status);

            return (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    data.status === "Not Reservable"
                      ? "not-allowed"
                      : "pointer",
                  backgroundColor: baseColor,
                  transition: "background-color 0.2s ease",
                  margin: "-1px",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = baseColor;
                }}
                onClick={() =>
                  data.status !== "Not Reservable" &&
                  handleUnavailableClick(params.data.campsiteObj, date)
                }
                title={data.status}
              >
                {data.status === "NYR"
                  ? "NYR"
                  : data.status === "Not Reservable"
                  ? "NR"
                  : data.status === "Reserved"
                  ? "R"
                  : "X"}
              </div>
            );
          }
        },
        cellStyle: {
          padding: "0",
          textAlign: "center",
        },
      })),
    ];

    // Precompute a map of row IDs to their "Not Reservable" status
    const notReservableMap = useMemo(() => {
      const map = new Map();
      rowData.forEach((row) => {
        const isNotReservable = dates.every(
          (date) =>
            row.campsiteObj.availabilities[`${date}T00:00:00Z`] ===
            "Not Reservable"
        );
        map.set(row.campsite, isNotReservable);
      });
      return map;
    }, [rowData, dates]);

    // Use the precomputed map to filter rows
    const filteredRows = useMemo(() => {
      if (!hideNotReservable) return rowData;
      return rowData.filter((row) => !notReservableMap.get(row.campsite));
    }, [rowData, hideNotReservable, notReservableMap]);

    return (
      <div className="reservation-details-container">
        {isLoading && <LoadingSpinner fullPage />}

        <div className="reservation-details-header">
          <h1>Campground Availability</h1>

          <div className="availability-section">
            <select
              id="month-select"
              value={selectedMonth}
              onChange={handleSelectChange}
              disabled={isLoading}
            >
              <option value="">Select a month to see availability...</option>
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
                "Check Availability"
              )}
            </button>
          </div>

          <div className="info-text">
            <p>Click on an unavailable date to create a reservation alert</p>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            paddingLeft: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "10px",
              fontSize: "14px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                backgroundColor: "#4caf50",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              A = Available
            </span>
            <span
              style={{
                backgroundColor: "#d65140",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              R = Reserved
            </span>
            <span
              style={{
                backgroundColor: "#4a90e2",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              NYR = Not Yet Released
            </span>
            <span
              style={{
                backgroundColor: "#707070",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              NR = Not Reservable
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginLeft: "20px",
                borderLeft: "1px solid #ccc",
                paddingLeft: "20px",
              }}
            >
              <input
                type="checkbox"
                id="hideNotReservable"
                checked={hideNotReservable}
                onChange={(e) => setHideNotReservable(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="hideNotReservable" style={{ cursor: "pointer" }}>
                Hide campsites that are not reservable for all dates
              </label>
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
                params.api.sizeColumnsToFit();
              }}
              headerHeight={headerHeight}
              rowHeight={rowHeight}
              domLayout="normal"
            />
          </div>
        </div>

        <button className="back-button" onClick={() => navigate(-1)}>
          <span>←</span> Back to Campsites
        </button>

        {alertModal && (
          <>
            <div className="modal">
              <h2>Create Availability Alert</h2>
              <h3>{`Campsite: ${selectedCampsite.site} - ${selectedCampsite.loop}`}</h3>
              <input
                type="text"
                placeholder="Name"
                value={alertDetails.name}
                onChange={(e) =>
                  setAlertDetails((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={alertDetails.email}
                onChange={(e) =>
                  setAlertDetails((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <label>Start Date:</label>
              <input
                type="date"
                value={alertDetails.startDate}
                onChange={(e) =>
                  setAlertDetails((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
              <label>End Date:</label>
              <input
                type="date"
                value={alertDetails.endDate}
                onChange={(e) =>
                  setAlertDetails((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
              <button onClick={handleCreateAlert}>Create Alert</button>
              <button onClick={() => setAlertModal(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>
    );
  };

  return renderCalendar();
};

export default ReservationDetailsPage;
