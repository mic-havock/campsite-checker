import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  ModuleRegistry,
  TextFilterModule,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import reservationsAPI from "../../api/reservations";
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
  const [alertModal, setAlertModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [tableWidth, setTableWidth] = useState(window.innerWidth);
  const [gridApi, setGridApi] = useState(null);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleUnavailableClick = (campsite) => {
    setSelectedCampsite(campsite);
    setAlertModal(true);
  };

  const handleCreateAlert = async () => {
    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    const reservationData = {
      name,
      email_address: email,
      campsite_id: selectedCampsite.campsite_id,
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
          Object.keys(campsite.quantities).map(
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
          available: campsite.quantities[`${date}T00:00:00Z`] > 0,
          quantity: campsite.quantities[`${date}T00:00:00Z`],
        };
      });

      return row;
    });

    const gridStyle = {
      height: "auto",
      //height: `${gridHeight}px`,
      width: `${tableWidth * 0.9}px`,
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
        headerName: new Date(date).toLocaleDateString(),
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
            return (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backgroundColor: "#d65140",
                  transition: "background-color 0.2s ease",
                  margin: "-1px",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff6b5b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#d65140";
                }}
                onClick={() => handleUnavailableClick(params.data.campsiteObj)}
              >
                X
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

    return (
      <div className="calendar-container" style={gridStyle}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={{
            sortable: true,
            resizable: true,
            filter: true,
          }}
          onGridReady={(params) => {
            setGridApi(params.api);
            params.api.sizeColumnsToFit();
          }}
          rowSelection="none"
          headerHeight={30}
          rowHeight={30}
          domLayout="autoHeight"
        />
      </div>
    );
  };

  return (
    <div className="reservation-details-container">
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
            {isLoading ? "Loading..." : "Check Availability"}
          </button>
        </div>

        <div className="info-text">
          <p>
            Click on an unavailable date (marked with X) to create a reservation
            alert
          </p>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading availability data...</p>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>

      <button className="back-button" onClick={() => navigate(-1)}>
        <span>←</span> Back to Campsites
      </button>

      {alertModal && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setAlertModal(false)}
          ></div>
          <div className="modal">
            <h2>Create Availability Alert</h2>
            <p>{`Campsite: ${selectedCampsite.site} - ${selectedCampsite.loop}`}</p>
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
                setAlertDetails((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <label>Start Date:</label>
            <input
              type="date"
              value={alertDetails.startDate || selectedCampsite?.selectedDate} // Use selected column date
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

export default ReservationDetailsPage;
