import {
  CheckboxEditorModule,
  ClientSideRowModelModule,
  GridStateModule,
  ModuleRegistry,
  PaginationModule,
  RowSelectionModule,
  ValidationModule,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CheckboxEditorModule,
  GridStateModule,
  PaginationModule,
  RowSelectionModule,
  ValidationModule,
]);

// Function to fetch city and state using HERE API
const fetchCityAndState = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://revgeocode.search.hereapi.com/v1/revgeocode`,
      {
        params: {
          at: `${latitude},${longitude}`,
          apiKey: "8hq7xHTF1kE7gJS_4o6H4dUf2vsBpQ_pLuWrB0HVvsA", // Replace with your HERE API key
        },
      }
    );

    const data = response.data.items[0];
    const state = data.address.state || "Unknown State";
    return { state };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { city: "Unknown City", state: "Unknown State" };
  }
};

const FacilityGrid = ({ rowData, onRowSelected }) => {
  const [processedData, setProcessedData] = useState([]);

  const [columnDefs] = useState([
    { headerName: "Facility Name", field: "FacilityName" },
    { headerName: "State", field: "NearestState" },
    { headerName: "Facility Type", field: "FacilityTypeDescription" },
  ]);

  useEffect(() => {
    const updateLocations = async () => {
      const updatedData = await Promise.all(
        rowData.map(async (row) => {
          const { city, state } = await fetchCityAndState(
            row.FacilityLatitude,
            row.FacilityLongitude
          );
          return { ...row, NearestCity: city, NearestState: state };
        })
      );
      setProcessedData(updatedData);
    };

    updateLocations();
  }, [rowData]);

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
    };
  }, []);

  const rowSelection = useMemo(() => {
    return {
      mode: "singleRow",
      checkboxes: false,
      enableClickSelection: true,
    };
  }, []);

  const onSelectionChanged = (event) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      onRowSelected(selectedRows[0]);
    }
  };

  return (
    <div style={{ height: "600px", width: "1000px" }}>
      <AgGridReact
        modules={[ClientSideRowModelModule]}
        columnDefs={columnDefs}
        rowData={processedData}
        pagination={true}
        rowSelection={rowSelection}
        defaultColDef={defaultColDef}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  );
};

FacilityGrid.propTypes = {
  rowData: PropTypes.array.isRequired,
  onRowSelected: PropTypes.func.isRequired,
};

export default FacilityGrid;
