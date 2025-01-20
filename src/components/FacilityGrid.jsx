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
import { useMemo, useState } from "react";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CheckboxEditorModule,
  GridStateModule,
  PaginationModule,
  RowSelectionModule,
  ValidationModule,
]);

const FacilityGrid = ({ rowData, onRowSelected }) => {
  // Accept onRowSelected as a prop
  const [columnDefs] = useState([
    { headerName: "Facility Name", field: "FacilityName" },
    { headerName: "Facility ID", field: "FacilityID" },
    { headerName: "Facility Latitude", field: "FacilityLatitude" },
    { headerName: "Facility Longitude", field: "FacilityLongitude" },
    { headerName: "Facility Type", field: "FacilityTypeDescription" },
    { headerName: "Facility Phone", field: "FacilityPhone" },
    { headerName: "Facility Description", field: "FacilityDescription" },
    { headerName: "Facility Address", field: "FACILITYADDRESS" },
    { headerName: "Facility Directions", field: "FacilityDirections" },
    { headerName: "Facility Email", field: "FacilityEmail" },
    { headerName: "Facility Media", field: "MEDIA" },
  ]);

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

  const initialState = useMemo(() => {
    return {
      rowSelection: ["2"],
    };
  }, []);

  const onSelectionChanged = (event) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      onRowSelected(selectedRows[0]); // Pass the selected row to the parent
    }
  };

  return (
    <div style={{ height: "600px", width: "1000px" }}>
      <AgGridReact
        modules={[ClientSideRowModelModule]}
        columnDefs={columnDefs}
        rowData={rowData}
        pagination={true}
        rowSelection={rowSelection}
        defaultColDef={defaultColDef}
        initialState={initialState}
        onSelectionChanged={onSelectionChanged} // Attach the selection change event handler
      />
    </div>
  );
};

FacilityGrid.propTypes = {
  rowData: PropTypes.array.isRequired,
  onRowSelected: PropTypes.func.isRequired, // Add prop type for the onRowSelected function
};

export default FacilityGrid;
