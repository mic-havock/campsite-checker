import {
  CheckboxEditorModule,
  ClientSideRowModelModule,
  GridStateModule,
  ModuleRegistry,
  PaginationModule,
  RowSelectionModule,
  ValidationModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridReact } from "ag-grid-react";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const GRID_PAGE_SIZE_OPTIONS = [20, 50, 100];

/** Shown while city/state are still fetching; distinguishes real N/A responses. */
const LOCATION_CELL_PENDING = "\u2026";

/**
 * @param {object} row Recreation.gov facility RECDATA row.
 * @returns {object} Row wired for AG Grid prior to fetchCityAndState settling.
 */
const buildStubFacilityRow = (row) => {
  return {
    ...row,
    FacilityName: row.FacilityName?.toUpperCase(),
    City: LOCATION_CELL_PENDING,
    AddressStateCode: LOCATION_CELL_PENDING,
    _locationPending: true,
  };
};

/**
 * Enriches a raw API row with uppercase name, addresses API location, then Nominatim reverse fallback.
 * @param {object} row
 * @returns {Promise<object>}
 */
const buildEnrichedFacilityRow = async (row) => {
  try {
    const { city, state } = await fetchCityAndState(row.FacilityID, row);
    return {
      ...row,
      FacilityName: row.FacilityName?.toUpperCase(),
      City: city,
      AddressStateCode: state,
    };
  } catch (err) {
    console.error(
      `Failed to fetch location for facility ${row.FacilityID}:`,
      err,
    );
    return {
      ...row,
      FacilityName: row.FacilityName?.toUpperCase(),
      City: "N/A",
      AddressStateCode: "N/A",
    };
  }
};

const FacilityGrid = ({
  rowData,
  onRowSelected,
  selectedState,
  applySelectedStateRowFilter = true,
}) => {
  const gridApiRef = useRef(null);
  const locationCacheRef = useRef(new Map());
  const facilityHydrationGenerationRef = useRef(0);
  const [enrichedRows, setEnrichedRows] = useState([]);
  /** True while some rows await fetchCityAndState (grid stays interactive). */
  const [isHydratingLocations, setIsHydratingLocations] = useState(false);
  const prevProcessedRowCountRef = useRef(0);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Campground Name",
        field: "FacilityName",
        flex: 3,
        cellClass: "left-cell name-cell",
        headerClass: "left-header",
      },
      {
        headerName: "City",
        field: "City",
        flex: 1,
        cellClass: "left-cell uppercase-text",
        headerClass: "left-header",
        cellClassRules: {
          "location-placeholder-cell": (params) =>
            Boolean(params.data?._locationPending),
        },
      },
      {
        headerName: "State",
        field: "AddressStateCode",
        flex: 1,
        cellClass: "center-aligned-cell uppercase-text",
        headerClass: "center-aligned-header",
        cellClassRules: {
          "location-placeholder-cell": (params) =>
            Boolean(params.data?._locationPending),
        },
      },
      {
        headerName: "Facility Type",
        field: "FacilityTypeDescription",
        flex: 1,
        cellClass: "center-aligned-cell uppercase-text",
        headerClass: "center-aligned-header",
      },
      {
        headerName: "Reservable",
        colId: "reservable",
        flex: 1,
        sortable: true,
        valueGetter: (params) => (params.data?.Reservable === true ? "Y" : "N"),
        cellClass: "center-aligned-cell reservable-cell",
        headerClass: "center-aligned-header",
      },
    ],
    [],
  );

  useEffect(() => {
    facilityHydrationGenerationRef.current += 1;
    const generation = facilityHydrationGenerationRef.current;

    if (!rowData || rowData.length === 0) {
      locationCacheRef.current.clear();
      setEnrichedRows([]);
      setIsHydratingLocations(false);
      return;
    }

    const idsInData = new Set(rowData.map((r) => String(r.FacilityID)));
    for (const key of locationCacheRef.current.keys()) {
      if (!idsInData.has(key)) {
        locationCacheRef.current.delete(key);
      }
    }

    /** @type {object[]} */
    const idsNeedingFetch = [];

    const stubs = rowData.map((row) => {
      const id = String(row.FacilityID);
      if (locationCacheRef.current.has(id)) {
        const cachedRow = locationCacheRef.current.get(id);
        return { ...cachedRow };
      }
      idsNeedingFetch.push(row);
      return buildStubFacilityRow(row);
    });

    setEnrichedRows(stubs);

    if (idsNeedingFetch.length === 0) {
      setIsHydratingLocations(false);
      return;
    }

    setIsHydratingLocations(true);

    let rowsRemaining = idsNeedingFetch.length;

    idsNeedingFetch.forEach((row) => {
      const id = String(row.FacilityID);
      buildEnrichedFacilityRow(row)
        .then((enriched) => {
          if (facilityHydrationGenerationRef.current !== generation) {
            return;
          }
          locationCacheRef.current.set(id, enriched);
          setEnrichedRows((prior) =>
            prior.map((r) =>
              String(r.FacilityID) === id ? enriched : r,
            ),
          );
        })
        .catch((err) => {
          console.error(
            `Failed to load location row for Facility ID ${row.FacilityID}:`,
            err,
          );
          if (facilityHydrationGenerationRef.current !== generation) {
            return;
          }
          const fallbackRow = {
            ...row,
            FacilityName: row.FacilityName?.toUpperCase(),
            City: "N/A",
            AddressStateCode: "N/A",
          };
          locationCacheRef.current.set(id, fallbackRow);
          setEnrichedRows((prior) =>
            prior.map((r) =>
              String(r.FacilityID) === id ? fallbackRow : r,
            ),
          );
        })
        .finally(() => {
          if (facilityHydrationGenerationRef.current !== generation) {
            return;
          }
          rowsRemaining -= 1;
          if (rowsRemaining <= 0) {
            setIsHydratingLocations(false);
          }
        });
    });
  }, [rowData]);

  const processedData = useMemo(() => {
    if (!selectedState || !applySelectedStateRowFilter) {
      return enrichedRows;
    }
    return enrichedRows.filter((facility) => {
      const facilityState = facility.AddressStateCode?.toUpperCase() || "";
      const selectedStateCode = selectedState.code.toUpperCase();
      const awaitingLocation =
        facility._locationPending === true ||
        facilityState === LOCATION_CELL_PENDING;

      return (
        awaitingLocation ||
        facilityState === selectedStateCode ||
        facilityState === "UNKNOWN" ||
        facilityState === "N/A" ||
        !facilityState ||
        facilityState === ""
      );
    });
  }, [enrichedRows, selectedState, applySelectedStateRowFilter]);

  useEffect(() => {
    const api = gridApiRef.current;
    const newLen = processedData.length;
    const oldLen = prevProcessedRowCountRef.current;

    if (
      api &&
      newLen > oldLen &&
      oldLen > 0 &&
      typeof api.paginationGetCurrentPage === "function" &&
      typeof api.paginationGetTotalPages === "function" &&
      typeof api.paginationGoToPage === "function"
    ) {
      try {
        const currentPage = api.paginationGetCurrentPage();
        const totalPages = api.paginationGetTotalPages();
        if (totalPages > 0) {
          const clamped = Math.min(
            currentPage,
            Math.max(0, totalPages - 1),
          );
          api.paginationGoToPage(clamped);
        }
      } catch {
        /* Pagination API may not be ready during rapid row updates */
      }
    }

    prevProcessedRowCountRef.current = newLen;
  }, [processedData.length]);

  const gridConfig = useMemo(
    () => ({
      defaultColDef: {
        minWidth: 100,
      },
      rowSelection: {
        mode: "singleRow",
        checkboxes: false,
        enableClickSelection: true,
      },
      getRowId: (params) => String(params.data.FacilityID),
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: GRID_PAGE_SIZE_OPTIONS,
      headerHeight: 30,
      rowHeight: 30,
    }),
    [],
  );

  const onGridReady = useCallback((event) => {
    gridApiRef.current = event.api;
  }, []);

  const onSelectionChanged = (event) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      onRowSelected(selectedRows[0]);
    }
  };

  return (
    <div
      className="facility-grid-container"
      aria-busy={isHydratingLocations}
      aria-label="Campground search results"
    >
      {isHydratingLocations && (
        <span className="location-resolve-live" aria-live="polite" role="status">
          Loading city and state for some campgrounds.
        </span>
      )}
      <div className="grid-wrapper facility-grid-wrapper ag-theme-alpine">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={processedData}
          {...gridConfig}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
        />
      </div>
    </div>
  );
};

FacilityGrid.propTypes = {
  rowData: PropTypes.array.isRequired,
  onRowSelected: PropTypes.func.isRequired,
  /** When false, rows are not filtered by state (e.g. federal search already scoped by state). */
  applySelectedStateRowFilter: PropTypes.bool,
  selectedState: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
  }),
};

export default FacilityGrid;
