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

const FacilityGrid = ({ rowData, onRowSelected, selectedState }) => {
  const [processedData, setProcessedData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const columnDefs = useMemo(
    () => [
      { headerName: "Campground Name", field: "FacilityName" },
      { headerName: "City", field: "City" },
      { headerName: "State", field: "AddressStateCode" },
    ],
    []
  );

  useEffect(() => {
    const updateLocations = async () => {
      setIsLoading(true);
      try {
        const updatedData = await Promise.all(
          rowData.map(async (row) => {
            try {
              const { city, state } = await fetchCityAndState(row.FacilityID);
              return { ...row, City: city, AddressStateCode: state };
            } catch (err) {
              console.error(
                `Failed to fetch location for facility ${row.FacilityID}:`,
                err
              );
              return { ...row, City: "N/A", AddressStateCode: "N/A" };
            }
          })
        );

        // Always filter if we have a selected state
        let filteredData = updatedData;
        if (selectedState) {
          filteredData = updatedData.filter((facility) => {
            // Normalize the state code for comparison
            const facilityState =
              facility.AddressStateCode?.toUpperCase() || "";
            const selectedStateCode = selectedState.code.toUpperCase();

            return (
              facilityState === selectedStateCode ||
              facilityState === "UNKNOWN" ||
              facilityState === "N/A" ||
              !facilityState ||
              facilityState === ""
            );
          });
        }

        setProcessedData(filteredData);
        setError(null);
      } catch (err) {
        console.error("Failed to update locations:", err);
        setError("Failed to load facility locations");
        setProcessedData(rowData);
      } finally {
        setIsLoading(false);
      }
    };

    updateLocations();
  }, [rowData, selectedState]);

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
      <div className="grid-wrapper">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={processedData}
          {...gridConfig}
          onSelectionChanged={onSelectionChanged}
        />
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

FacilityGrid.propTypes = {
  rowData: PropTypes.array.isRequired,
  onRowSelected: PropTypes.func.isRequired,
  selectedState: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
  }),
};

export default FacilityGrid;
