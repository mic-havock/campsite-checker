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

  const [columnDefs] = useState([
    { headerName: "Campground Name", field: "FacilityName" },
    { headerName: "City", field: "City" },
    { headerName: "State", field: "State" },
  ]);

  useEffect(() => {
    const updateLocations = async () => {
      const updatedData = await Promise.all(
        rowData.map(async (row) => {
          const { city, state } = await fetchCityAndState(row.FacilityID);
          return { ...row, City: city, State: state };
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
    <div className="facility-grid-container">
      <AgGridReact
        columnDefs={columnDefs}
        rowData={processedData}
        pagination={true}
        paginationPageSize={20} // Default page size of 20
        rowSelection={rowSelection}
        defaultColDef={defaultColDef}
        onSelectionChanged={onSelectionChanged}
        headerHeight={30}
      />
    </div>
  );
};

FacilityGrid.propTypes = {
  rowData: PropTypes.array.isRequired,
  onRowSelected: PropTypes.func.isRequired,
};

export default FacilityGrid;
