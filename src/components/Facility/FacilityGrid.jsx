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
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { fetchCityAndState } from "../../api/location";
import "./facility-grid.scss";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CheckboxEditorModule,
  GridStateModule,
  PaginationModule,
  RowSelectionModule,
  ValidationModule,
]);

const FacilityGrid = ({ rowData, onRowSelected }) => {
  const [processedData, setProcessedData] = useState([]);
  const [error, setError] = useState(null);

  const columnDefs = useMemo(
    () => [
      { headerName: "Campground Name", field: "FacilityName" },
      { headerName: "City", field: "City" },
      { headerName: "State", field: "State" },
    ],
    []
  );

  useEffect(() => {
    const updateLocations = async () => {
      try {
        const updatedData = await Promise.all(
          rowData.map(async (row) => {
            try {
              const { city, state } = await fetchCityAndState(row.FacilityID);
              return { ...row, City: city, State: state };
            } catch (err) {
              console.error(
                `Failed to fetch location for facility ${row.FacilityID}:`,
                err
              );
              return { ...row, City: "Unknown", State: "Unknown" };
            }
          })
        );
        setProcessedData(updatedData);
        setError(null);
      } catch (err) {
        console.error("Failed to update locations:", err);
        setError("Failed to load facility locations");
        setProcessedData(rowData);
      }
    };

    updateLocations();
  }, [rowData]);

  const gridConfig = useMemo(
    () => ({
      defaultColDef: {
        flex: 1,
        minWidth: 100,
      },
      rowSelection: {
        mode: "singleRow",
        checkboxes: false,
        enableClickSelection: true,
      },
      pagination: true,
      paginationPageSize: 20,
      headerHeight: 30,
    }),
    []
  );

  const onSelectionChanged = (event) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      onRowSelected(selectedRows[0]);
    }
  };

  return (
    <div className="facility-grid-container">
      {error && <div className="error-message">{error}</div>}
      <AgGridReact
        columnDefs={columnDefs}
        rowData={processedData}
        {...gridConfig}
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
