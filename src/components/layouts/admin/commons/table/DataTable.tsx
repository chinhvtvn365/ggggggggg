/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, {
  Fragment,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button, Modal } from "@heroui/react";
import { useFormContext } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import {
  optionQuery,
  pageChange,
  reset,
  setId,
  updateTotalRows,
  updateAdditionalTotalRows,
  onSelectMultipleRows,
} from "@/lib/features/datatable/datatableSlice";

import {
  DATATABLE_DEFAULT_PAGE_SIZE,
  DELETE_TYPE_MULTI,
  DELETE_TYPE_SINGLE,
} from "@/constants/datatable.enum";

import utilsService from "@/services/utils/utils.service";
import CrudButtons from "./CrudButtons";
import FilterTools from "./FilterTools";
import UpdateModal from "./UpdateModal";
import { proxyService } from "@/services";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface TableColumn {
  dataField: string;
  name: string;
  align?: string;
  alignHeader?: string;
  width?: string;
  sortable?: boolean;
  filterBy?: boolean;
  style?: React.CSSProperties;
  dataFormat?: (rowData: Record<string, unknown>) => React.ReactNode;
  dataFormatEdit?: (rowData: Record<string, unknown>) => React.ReactNode;
}

interface CustomListItem {
  title: string;
  icon?: string;
  label?: string;
  className?: string;
  color?: string; // success | danger | warning | info
  text?: boolean;
  raised?: boolean;
  outlined?: boolean;
  rounded?: boolean;
  onClick: (rowData: Record<string, unknown>) => void;
}

interface RowExpansionConfig {
  field: string;
  label: (rowData: Record<string, unknown>) => React.ReactNode;
  columns: TableColumn[];
  isDeletable?: boolean;
  showGridlines?: boolean;
  customClassName?: string;
  actionItem?: (rowData: Record<string, unknown>) => React.ReactNode;
}

interface TableStyles {
  className?: string;
  stripedRows?: boolean;
  showGridlines?: boolean;
  verticalGridlines?: boolean;
  rowSpacing?: "normal" | "comfortable";
  softActionIcons?: boolean;
  alignHeader?: string;
}

interface TableConfig {
  pagination: boolean;
  columns: TableColumn[];
  key?: string;
  stickyLeftColumns?: number;
  unifiedToolbar?: boolean;
  tableStyles: TableStyles;
  topTableCustom?: () => React.ReactNode;
  customList?: CustomListItem[];
  rowExpansion?: RowExpansionConfig;
  headerColumnGroup?: React.ReactNode;
  hideTotal?: boolean;
  additionalHeader?: (totalRecord: number) => React.ReactNode;
}

interface CustomTopTagItem {
  title: string;
  value: string | number;
  severity?: string;
  icon?: string;
  style?: React.CSSProperties;
}

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface DataTableProps {
  metadata: Record<string, unknown>;
  data?: Record<string, unknown>[];
  colFilterTools?: string;
  readOnly?: boolean;
  isPageMultipleTable?: boolean;
  id?: string;
  rowClassNameCustom?: ((rowData: Record<string, unknown>) => string) | string;
  forceReload?: boolean;
  params?: Record<string, unknown>;
  onEditAction?: (row: Record<string, unknown>) => void;
  groupRowsBy?: string;
  showGroupCount?: boolean;
  customGroupHeaderTemplate?: (
    groupValue: Record<string, unknown>,
    groupIndex: Record<string, number>,
    calculateGroupNumber: (field: string, value: unknown) => number,
    groupRowsBy: string,
  ) => React.ReactNode;
  customTopTag?: CustomTopTagItem[];
}

export interface DataTableRef {
  updateData: (newData: Record<string, unknown>) => void;
  deleteIds: (ids: string | string[]) => boolean;
  addData: (
    newData: Record<string, unknown> | Record<string, unknown>[],
  ) => void;
  getData: (id: string) => Record<string, unknown> | undefined;
  getAllData: () => Record<string, unknown>[];
  getTotalRows: () => string;
  showUpdateModal: (newData: Record<string, unknown>) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const DataTableComponent = forwardRef<DataTableRef, DataTableProps>(
  (props, ref) => {
    const {
      metadata,
      data,
      colFilterTools,
      readOnly = false,
      isPageMultipleTable = false,
      id = "",
      rowClassNameCustom,
      forceReload = false,
      params,
      onEditAction,
      groupRowsBy,
      showGroupCount = false,
      customGroupHeaderTemplate,
      customTopTag = [],
    } = props;

    // ─── REDUX ──────────────────────────────────────────────────────────────────
    const dispatch = useAppDispatch();
    const datatableReducer = useAppSelector((state) => state.datatableReducer);
    const socketReducer = useAppSelector((state) => state.socketReducer);

    // Since there is no appConfigReducer in this project, always treat auth as ready
    // Try to get from appConfigReducer if it exists, otherwise use a permissive fallback
    const appConfigReducer = useAppSelector(
      (state: any) => state.appConfigReducer,
    );
    const granted: Record<string, unknown> =
      appConfigReducer?.data?.auth?.grantedPolicies ||
      new Proxy(
        {},
        {
          has: () => true, // Make `prop in obj` always return true
          get: (target, prop) => {
            // Handle hasOwnProperty specially
            if (prop === "hasOwnProperty") {
              return function () {
                return true;
              };
            }
            return true;
          },
        },
      );
    const isAuthReady = true;

    // react-hook-form context (may not be inside a FormProvider)
    const methods = useFormContext();

    // ─── DESTRUCTURE metadata.table ─────────────────────────────────────────────
    const tableConfig = metadata.table as TableConfig;
    const {
      pagination,
      columns,
      stickyLeftColumns = 0,
      unifiedToolbar = false,
      tableStyles,
      topTableCustom,
      customList,
      rowExpansion,
      headerColumnGroup,
    } = tableConfig;

    const crudButtons = (
      metadata as { crudButtons: Record<string, Record<string, unknown>> }
    ).crudButtons;

    // ─── STATE ──────────────────────────────────────────────────────────────────
    const [, setHasChangeData] = useState(false);
    const [dataBinding, setDataBinding] = useState<Record<string, unknown>[]>(
      [],
    );
    const [totalRecord, setTotalRecord] = useState(0);
    const [pageRows, setPageRows] = useState(DATATABLE_DEFAULT_PAGE_SIZE);
    const [rowsPerPageOptionsList] = useState([10, 25, 50, 100]);
    const [isPageRowsReady] = useState(false);
    const [dataEdit, setDataEdit] = useState<Record<string, unknown> | null>(
      null,
    );
    const [selected, setSelected] = useState<Record<string, unknown>[]>([]);
    const [lazyState, setLazyState] = useState({ first: 0, page: 0 });
    const [modal, setModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState("");
    const [firstCall, setFirstCall] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(
      {},
    );
    const [groupIndex, setGroupIndex] = useState<Record<string, number>>({});

    // ─── HELPERS ────────────────────────────────────────────────────────────────

    const toggle = () => setModal((prev) => !prev);

    const formatNumberWithDots = (
      value: number | string | null | undefined,
    ): string => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") ?? "0";

    const hasEditableColumn = (cols: TableColumn[]): boolean =>
      cols.some(
        (col) => col.dataFormatEdit && typeof col.dataFormatEdit === "function",
      );

    const allowExpansion = (rowData: Record<string, unknown>): boolean => {
      if (!rowExpansion) return false;
      const nested = rowData[rowExpansion.field] as unknown[] | null;
      return nested != null && nested.length > 0;
    };

    const getDeletePermission = (): boolean =>
      Boolean(crudButtons.delete.active) &&
      crudButtons.delete.type === DELETE_TYPE_MULTI &&
      (!crudButtons.delete.permission ||
        (crudButtons.delete.permission as string) in granted);

    const calculateGroupNumber = (
      groupByField: string,
      value: unknown,
    ): number => {
      let total = 0;
      for (const row of dataBinding) {
        if (row[groupByField] === value) total++;
      }
      return total;
    };

    const removeCheckedItem = (ids: string[]) => {
      dispatch(updateTotalRows((datatableReducer.totalRows ?? 0) - ids.length));
      setDataBinding((prev) =>
        prev.filter((x) => !ids.includes(x.id as string)),
      );
    };

    const getRowClassName = (rowData: Record<string, unknown>): string => {
      if (typeof rowClassNameCustom === "function")
        return rowClassNameCustom(rowData);
      if (typeof rowClassNameCustom === "string") return rowClassNameCustom;
      return rowData.disabled ? "opacity-50" : "";
    };

    const hasVerticalGridlines = tableStyles?.verticalGridlines !== false;
    const rowCellPaddingY =
      tableStyles?.rowSpacing === "comfortable" ? "py-3" : "py-2.5";
    const softActionIcons = Boolean(tableStyles?.softActionIcons);

    const getStickyStyles = (
      physicalIndex: number,
      isHeader: boolean,
      backgroundClass: string,
    ): { className: string; style: React.CSSProperties } => {
      if (stickyLeftColumns <= 0 || physicalIndex >= stickyLeftColumns) {
        return { className: "", style: {} };
      }

      if (physicalIndex === 0) {
        return {
          className: `sticky left-0 z-30 ${backgroundClass}`,
          style: {
            minWidth: 44,
            width: 44,
            boxShadow: isHeader
              ? "inset -1px 0 0 #f1f5f9"
              : "inset -1px 0 0 #f1f5f9",
          },
        };
      }

      if (physicalIndex === 1) {
        return {
          className: `sticky z-20 ${backgroundClass}`,
          style: {
            left: 44,
            boxShadow: "8px 0 10px -10px rgba(15, 23, 42, 0.35)",
          },
        };
      }

      return { className: "", style: {} };
    };

    // ─── REF METHODS ────────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      updateData: (newData) => {
        setDataBinding((prev) =>
          prev.map((item) =>
            (item.id as string) === (newData.id as string)
              ? { ...item, ...newData }
              : item,
          ),
        );
      },
      deleteIds: (ids) => {
        const formattedIds = Array.isArray(ids) ? ids : [ids];
        let deleted = false;
        setDataBinding((prev) => {
          const next = prev.filter(
            (item) => !formattedIds.includes(item.id as string),
          );
          deleted = next.length !== prev.length;
          return next;
        });
        return deleted;
      },
      addData: (newData) => {
        const handle = crudButtons.create.handleResponseData as
          | ((x: Record<string, unknown>) => Record<string, unknown>)
          | undefined;
        const tempArray = Array.isArray(newData) ? newData : [newData];
        const finalData = handle ? tempArray.map((x) => handle(x)) : tempArray;
        const newDataBinding = [...finalData, ...dataBinding];
        setDataBinding(newDataBinding);
        dispatch(updateTotalRows(newDataBinding.length));
      },
      getData: (id) => dataBinding.find((x) => (x.id as string) === id),
      getAllData: () => dataBinding,
      getTotalRows: () =>
        formatNumberWithDots(
          isPageMultipleTable ? totalRecord : datatableReducer.totalRows,
        ),
      showUpdateModal: (newData) => {
        setDataEdit(newData);
        setModal(true);
      },
    }));

    // ─── SOCKET EFFECT ──────────────────────────────────────────────────────────

    useEffect(() => {
      if (!metadata.socket) return;
      try {
        const dataReceive = socketReducer.data;
        if (dataReceive?.data) {
          const socketList = metadata.socket as Array<{
            type: string;
            transformData: (
              data: Record<string, unknown>[],
              receive: unknown,
            ) => Record<string, unknown>[];
          }>;
          socketList.forEach((socket) => {
            if (
              dataReceive.type === socket.type &&
              socket.transformData &&
              typeof socket.transformData === "function"
            ) {
              const transformed = socket.transformData(
                dataBinding,
                JSON.parse(dataReceive.data as string),
              );
              setDataBinding(transformed);
              dispatch(updateTotalRows(transformed.length));
              setSelected((prev) => {
                const receive = JSON.parse(dataReceive.data as string) as {
                  id: string;
                };
                return prev.filter(
                  (item) => (item.id as string) !== receive.id,
                );
              });
            }
          });
        }
      } catch {}
    }, [socketReducer]);

    // ─── INITIAL LOAD EFFECT ────────────────────────────────────────────────────

    useEffect(() => {
      let DEFAULT_QUERY = pagination
        ? `?SkipCount=${lazyState.first}&MaxResultCount=${pageRows}`
        : "";

      // Apply optionQuery filters (only for known filterTools components)
      if (datatableReducer.optionQuery) {
        const filterToolsConfig = metadata.filterTools as
          | { components?: Array<{ name: string }> }
          | undefined;
        for (const [key, value] of Object.entries(
          datatableReducer.optionQuery,
        )) {
          const comps = filterToolsConfig?.components;
          if (comps && !comps.some((x) => x.name === key)) continue;
          if (value !== null && value !== undefined && value !== "") {
            DEFAULT_QUERY += `${DEFAULT_QUERY ? "&" : "?"}${key}=${value}`;
          }
        }
      }

      const newParams: Record<string, unknown> = { ...params };
      let allowDispatch = false;

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== null && value !== undefined && value !== "") {
            DEFAULT_QUERY += `${DEFAULT_QUERY ? "&" : "?"}${key}=${value}`;
          }
        }
        allowDispatch = true;
      }

      // Apply filterTools default values
      const filterToolsConfig = metadata.filterTools as
        | {
            components?: Array<{
              name?: string;
              type?: string;
              startFieldName?: string;
              endFieldName?: string;
              startDefaultValue?: unknown;
              endDefaultValue?: unknown;
              defaultValue?: { value: unknown };
              filterByDataField?: string;
              default?: { value: unknown };
            }>;
          }
        | undefined;

      if (filterToolsConfig?.components) {
        filterToolsConfig.components.forEach((item, index) => {
          if (
            item?.type === "startEndDatePicker" ||
            item?.type === "yearFilter"
          ) {
            if (item.startDefaultValue) {
              DEFAULT_QUERY += `${!DEFAULT_QUERY ? "?" : "&"}${
                item.startFieldName
              }=${utilsService.formattedDateValue(item.startDefaultValue as Date)}`;
              if (!allowDispatch) allowDispatch = true;
              if (item.startFieldName)
                newParams[item.startFieldName] =
                  utilsService.formattedDateValue(
                    item.startDefaultValue as Date,
                  );
            }
            if (item.endDefaultValue) {
              DEFAULT_QUERY += `&${item.endFieldName}=${utilsService.formattedDateValue(
                item.endDefaultValue as Date,
              )}`;
              if (!allowDispatch) allowDispatch = true;
              if (item.endFieldName)
                newParams[item.endFieldName] = utilsService.formattedDateValue(
                  item.endDefaultValue as Date,
                );
            }
          }
          if (item?.type === "yearnumber" && item?.defaultValue?.value) {
            DEFAULT_QUERY += DEFAULT_QUERY.includes("?")
              ? `&${item.name}=${item.defaultValue.value}`
              : `?${item.name}=${item.defaultValue.value}`;
          } else if (item?.type === "weeknumber" && item?.defaultValue?.value) {
            DEFAULT_QUERY += `&${item.name}=${item.defaultValue.value}`;
          } else if (
            item?.defaultValue?.value &&
            item?.type !== "yearnumber" &&
            item?.type !== "weeknumber"
          ) {
            if (index === 0) {
              DEFAULT_QUERY += DEFAULT_QUERY.includes("?")
                ? `&${item.filterByDataField}=${item.defaultValue.value}`
                : `?${item.filterByDataField}=${item.defaultValue.value}`;
            } else {
              DEFAULT_QUERY += `&${item.filterByDataField}=${item.defaultValue.value}`;
            }
          }
          if (item?.type === "immediateDropdown" || item?.default?.value) {
            DEFAULT_QUERY += `${!DEFAULT_QUERY ? "?" : "&"}${item.name}=${item.defaultValue?.value}`;
            if (!allowDispatch) allowDispatch = true;
            if (item.filterByDataField)
              newParams[item.filterByDataField] = item.defaultValue?.value;
          }
        });
      }

      if (allowDispatch) {
        dispatch(optionQuery(newParams));
      }

      setFirstCall(true);

      const serverSide = metadata.serverSide as {
        api?: string;
        transformStrategy: (
          data?: Record<string, unknown>[],
        ) => Record<string, unknown>[];
        datatableValues?: unknown;
      };

      if (serverSide.api) {
        proxyService
          .get(serverSide.api + DEFAULT_QUERY)
          .then((result) => {
            if (result?.data) {
              const resData = result.data as {
                items: Record<string, unknown>[];
                totalCount: number;
                [key: string]: unknown;
              };
              dispatch(updateTotalRows(resData.totalCount));
              const transformed = serverSide.transformStrategy
                ? serverSide.transformStrategy(resData.items ?? [])
                : (resData.items ?? []);
              setDataBinding(transformed);
              setTotalRecord(resData.totalCount);

              const additionalFields = Object.entries(resData).filter(
                ([key, value]) =>
                  key !== "totalCount" &&
                  key !== "items" &&
                  typeof value === "number",
              );
              if (additionalFields.length > 0) {
                dispatch(
                  updateAdditionalTotalRows(
                    Object.fromEntries(additionalFields) as Record<
                      string,
                      number
                    >,
                  ),
                );
              }

              if (groupRowsBy) {
                const temp: Record<string, number> = {};
                let i = 1;
                transformed.forEach((element) => {
                  const gVal = element[groupRowsBy] as string;
                  if (!temp[gVal]) {
                    temp[gVal] = i;
                    i++;
                  }
                });
                setGroupIndex(temp);
              }
            }
          })
          .catch(() => {});
      } else {
        const transformed = serverSide.transformStrategy();
        setDataBinding(transformed || []);
      }
    }, [
      data,
      dispatch,
      crudButtons.delete.active,
      forceReload,
      pageRows,
      rowsPerPageOptionsList,
      isPageRowsReady,
    ]);

    // ─── CLEANUP EFFECT ─────────────────────────────────────────────────────────

    useEffect(() => {
      return () => {
        dispatch(reset());
      };
    }, []);

    // ─── MEMOIZED QUERY ─────────────────────────────────────────────────────────

    const memoizedQuery = useMemo(
      () => datatableReducer.query,
      [datatableReducer.query],
    );

    // ─── QUERY CHANGE EFFECT ────────────────────────────────────────────────────

    useEffect(() => {
      const serverSide = metadata.serverSide as {
        api?: string;
        transformStrategy: (
          data: Record<string, unknown>[],
        ) => Record<string, unknown>[];
        datatableValues?: unknown;
      };
      if (serverSide.datatableValues) return;
      if (memoizedQuery && firstCall) {
        if ((id && datatableReducer.id === id) || !id) {
          proxyService
            .get(serverSide.api! + memoizedQuery)
            .then((result) => {
              if (result?.data) {
                const resData = result.data as {
                  items: Record<string, unknown>[];
                  totalCount: number;
                  [key: string]: unknown;
                };
                dispatch(updateTotalRows(resData.totalCount));
                const transformed = serverSide.transformStrategy
                  ? serverSide.transformStrategy(resData.items ?? [])
                  : (resData.items ?? []);

                const additionalFields = Object.entries(resData).filter(
                  ([key, value]) =>
                    key !== "totalCount" &&
                    key !== "items" &&
                    typeof value === "number",
                );
                if (additionalFields.length > 0) {
                  dispatch(
                    updateAdditionalTotalRows(
                      Object.fromEntries(additionalFields) as Record<
                        string,
                        number
                      >,
                    ),
                  );
                }

                if (groupRowsBy) {
                  const temp: Record<string, number> = {};
                  let i = 1;
                  transformed.forEach((element) => {
                    const gVal = element[groupRowsBy] as string;
                    if (!temp[gVal]) {
                      temp[gVal] = i;
                      i++;
                    }
                  });
                  setGroupIndex(temp);
                }

                setDataBinding(transformed);
                setTotalRecord(resData.totalCount);
              }
            })
            .catch(() => {});
        }
      }
    }, [memoizedQuery]);

    // ─── PAGE CHANGE ────────────────────────────────────────────────────────────

    const onPage = (first: number, page: number, rows: number) => {
      setLazyState({ first, page });
      dispatch(pageChange({ current: page + 1, size: rows }));
      setPageRows(rows);
      if (id) dispatch(setId(id));
    };

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    const deleteSingle = async () => {
      setDeleteDialog(false);
      const response = await proxyService.deleteAPI(
        `${crudButtons.delete.api as string}/${deleteId}`,
      );
      if (response?.status === 204) {
        removeCheckedItem([deleteId]);
        if (typeof crudButtons.delete.callback === "function") {
          (crudButtons.delete.callback as () => void)();
        }
      }
    };

    // ─── SELECTION ──────────────────────────────────────────────────────────────

    const onSelectionChange = (value: Record<string, unknown>[]) => {
      if (
        getDeletePermission() &&
        value &&
        value.every((item) => item.disabled === undefined || !item.disabled)
      ) {
        setSelected(value);
        dispatch(onSelectMultipleRows(value));
      }
    };

    const toggleRowSelection = (
      rowData: Record<string, unknown>,
      checked: boolean,
    ) => {
      let _selected = [...(selected || [])];
      if (checked) _selected.push(rowData);
      else
        _selected = _selected.filter(
          (item) => (item.id as string) !== (rowData.id as string),
        );
      onSelectionChange(_selected);
    };

    // ─── TABLE INFO ─────────────────────────────────────────────────────────────

    const renderTableInfo = () => {
      const hideTotal =
        tableConfig?.hideTotal ||
        (metadata?.filterTools as Record<string, unknown>)?.hideTotal !==
          undefined;
      const totalRows = datatableReducer.totalRows ?? 0;

      return (
        <div className="flex flex-row flex-wrap gap-2 mr-2">
          {!hideTotal && (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-semibold">
                  <i className="fa-regular fa-circle-dot mr-1 text-[10px] text-blue-600" />
                  Tổng:{" "}
                  {formatNumberWithDots(
                    isPageMultipleTable ? totalRecord : totalRows,
                  )}
                </span>
                {customTopTag.map((item, index) => (
                  <span
                    key={index}
                    style={item?.style}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      item.severity === "success"
                        ? "bg-green-100 text-green-700"
                        : item.severity === "warning"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.severity === "danger"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.icon && (
                      <i className={`${item.icon} mr-1 text-[10px]`} />
                    )}
                    {item.title}: {item.value}
                  </span>
                ))}
              </div>
              {selected && selected.length > 0 && (
                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-amber-600 text-white font-semibold shadow-sm">
                    <i className="fas fa-check-circle mr-1 text-[10px]" />
                    Đã chọn: {selected.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      );
    };

    // ─── FILTER HEADER ──────────────────────────────────────────────────────────

    const filterToolsCfg = metadata.filterTools as
      | {
          customHeader?: () => React.ReactNode;
          component?: (() => React.ReactNode) | null;
          smallMode?: boolean;
          inputPlaceholderStyle?: string;
          hideTotal?: boolean;
        }
      | undefined;

    const renderHeader = () => {
      if (filterToolsCfg?.customHeader) {
        return filterToolsCfg.customHeader();
      }
      return (
        <>
          {tableConfig.additionalHeader &&
            tableConfig.additionalHeader(
              isPageMultipleTable
                ? totalRecord
                : (datatableReducer.totalRows ?? 0),
            )}
          <div className={filterToolsCfg?.smallMode ? "p-2" : ""}>
            {filterToolsCfg && filterToolsCfg.component == null ? (
              <FilterTools
                metadata={metadata}
                id={id}
                params={params}
                renderTableInfo={renderTableInfo}
                onInteract={() => dispatch(setId(id))}
              />
            ) : (
              <div
                className={colFilterTools || "col-md-9"}
                onClick={() => dispatch(setId(id))}
              >
                {filterToolsCfg?.component?.()}
              </div>
            )}
          </div>
        </>
      );
    };

    // ─── CUSTOM BUTTON RENDERER ─────────────────────────────────────────────────

    const renderCustomButton = (
      item: CustomListItem,
      rowData: Record<string, unknown>,
      index: number,
    ) => {
      const base = `inline-flex items-center justify-center px-2 py-1 text-sm transition-all duration-200 ${
        item.rounded ? "rounded-full" : "rounded"
      } ${item.raised ? "shadow-md hover:shadow-lg" : ""}`;

      let colorCls = "";
      if (item.text && !item.outlined) {
        colorCls =
          item.color === "success"
            ? "text-green-600 hover:bg-green-50"
            : item.color === "danger"
              ? "text-red-600 hover:bg-red-50"
              : item.color === "warning"
                ? "text-yellow-600 hover:bg-yellow-50"
                : item.color === "info"
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50";
      } else if (item.outlined) {
        colorCls =
          item.color === "success"
            ? "border border-green-600 text-green-600 hover:bg-green-50"
            : item.color === "danger"
              ? "border border-red-600 text-red-600 hover:bg-red-50"
              : item.color === "warning"
                ? "border border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                : item.color === "info"
                  ? "border border-blue-600 text-blue-600 hover:bg-blue-50"
                  : "border border-gray-600 text-gray-600 hover:bg-gray-50";
      } else {
        colorCls =
          item.color === "success"
            ? "bg-green-600 text-white hover:bg-green-700"
            : item.color === "danger"
              ? "bg-red-600 text-white hover:bg-red-700"
              : item.color === "warning"
                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                : item.color === "info"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-600 text-white hover:bg-gray-700";
      }

      return (
        <button
          key={index}
          type="button"
          title={item.title}
          className={`${base} ${colorCls} ${item.className || ""}`}
          onClick={() => item.onClick(rowData)}
        >
          {item.icon && <i className={`${item.icon}${item.label ? "" : ""}`} />}
          {item.label && <span>{item.label}</span>}
        </button>
      );
    };

    // ─── ROW EXPANSION TEMPLATE ─────────────────────────────────────────────────

    const renderRowExpansion = (rowData: Record<string, unknown>) => {
      if (!rowExpansion || !rowExpansion.columns) return null;
      const parentId = rowData.id as string;
      const nestedRows =
        (rowData[rowExpansion.field] as Record<string, unknown>[]) ?? [];

      return (
        <div>
          <div className="text-md my-2 ml-4">{rowExpansion.label(rowData)}</div>
          <table
            className={`w-full text-sm ${
              rowExpansion.showGridlines
                ? "border-collapse border border-gray-300"
                : ""
            } ${rowExpansion.customClassName || ""}`}
          >
            <thead className="text-xs  bg-gray-50">
              <tr>
                {crudButtons.delete.active &&
                  crudButtons.delete.type === DELETE_TYPE_MULTI &&
                  rowExpansion.isDeletable &&
                  (!crudButtons.delete.permission ||
                    (crudButtons.delete.permission as string) in granted) && (
                    <th className="px-4 py-2 w-12 capitalize bg-slate-50">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer"
                        checked={
                          nestedRows.length > 0 &&
                          nestedRows.every((item) =>
                            selected?.some(
                              (sel) =>
                                (sel.id as string) === (item.id as string),
                            ),
                          )
                        }
                        onChange={(e) => {
                          const _sel = [...(selected || [])];
                          if (e.target.checked) {
                            setSelected([..._sel, ...nestedRows]);
                          } else {
                            setSelected(
                              _sel.filter(
                                (sel) =>
                                  !nestedRows.some(
                                    (item) =>
                                      (item.id as string) ===
                                      (sel.id as string),
                                  ),
                              ),
                            );
                          }
                        }}
                      />
                    </th>
                  )}
                {rowExpansion.columns.map((col) => (
                  <th
                    key={col.name}
                    className="px-4 py-2 text-left font-semibold text-gray-600"
                    style={col.style}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nestedRows.map((nestedRow, idx) => (
                <tr
                  key={(nestedRow.id as string) || idx}
                  className="border-b hover:bg-gray-50"
                >
                  {crudButtons.delete.active &&
                    crudButtons.delete.type === DELETE_TYPE_MULTI &&
                    rowExpansion.isDeletable &&
                    (!crudButtons.delete.permission ||
                      (crudButtons.delete.permission as string) in granted) && (
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer"
                          checked={selected?.some(
                            (sel) =>
                              (sel.id as string) === (nestedRow.id as string),
                          )}
                          disabled={Boolean(nestedRow.disabled)}
                          onChange={(e) =>
                            toggleRowSelection(nestedRow, e.target.checked)
                          }
                        />
                      </td>
                    )}
                  {rowExpansion.columns.map((col) => (
                    <td key={col.name} className="px-4 py-2" style={col.style}>
                      {col.dataFormatEdit &&
                      typeof col.dataFormatEdit === "function" &&
                      (!crudButtons.update.permission ||
                        (crudButtons.update.permission as string) in
                          granted) ? (
                        !readOnly ? (
                          <a
                            href="#"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggle();
                              setDataEdit({ ...nestedRow, parentId });
                            }}
                          >
                            {col.dataFormatEdit({ ...nestedRow, parentId })}
                          </a>
                        ) : (
                          <span>
                            {col.dataFormatEdit({ ...nestedRow, parentId })}
                          </span>
                        )
                      ) : col.dataFormat &&
                        typeof col.dataFormat === "function" ? (
                        col.dataFormat({ ...nestedRow, parentId })
                      ) : (
                        (nestedRow[col.dataField] as React.ReactNode)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rowExpansion.actionItem &&
            typeof rowExpansion.actionItem === "function" && (
              <div className="text-md ml-4">
                {rowExpansion.actionItem(rowData)}
              </div>
            )}
        </div>
      );
    };

    // ─── GROUP HEADER TEMPLATE ──────────────────────────────────────────────────

    const renderGroupHeader = (groupValue: Record<string, unknown>) => {
      if (!groupRowsBy) return null;
      if (customGroupHeaderTemplate) {
        return customGroupHeaderTemplate(
          groupValue,
          groupIndex,
          calculateGroupNumber,
          groupRowsBy,
        );
      }
      return (
        <div className="p-1">
          {showGroupCount && (
            <span className="font-bold text-lg ml-6 mr-5">
              {groupIndex[groupValue[groupRowsBy] as string]}{" "}
            </span>
          )}
          {showGroupCount && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-600 text-white font-semibold shadow-sm ml-2 mr-2">
              <i className="fas fa-circle text-[6px] mr-1" />
              Tổng:{" "}
              {formatNumberWithDots(
                calculateGroupNumber(groupRowsBy, groupValue[groupRowsBy]),
              )}
            </span>
          )}
          <span className="font-bold">
            {groupValue[groupRowsBy] as string}{" "}
          </span>
        </div>
      );
    };

    // ─── SORTED DATA ─────────────────────────────────────────────────────────────

    const sortedDataBinding = useMemo(() => {
      if (!groupRowsBy) return dataBinding;
      return [...dataBinding].sort((a, b) => {
        if ((a[groupRowsBy] as string) < (b[groupRowsBy] as string)) return -1;
        if ((a[groupRowsBy] as string) > (b[groupRowsBy] as string)) return 1;
        return 0;
      });
    }, [dataBinding, groupRowsBy]);

    // ─── COLUMN COUNT ───────────────────────────────────────────────────────────

    const getTotalColCount = (): number => {
      let count = columns.length;
      if (
        crudButtons.delete.active &&
        crudButtons.delete.type === DELETE_TYPE_MULTI &&
        (!crudButtons.delete.permission ||
          (crudButtons.delete.permission as string) in granted)
      )
        count++;
      if (rowExpansion) count++;
      if (
        crudButtons.update.active &&
        hasEditableColumn(columns) &&
        isAuthReady
      )
        count++;
      if (
        crudButtons.delete.active &&
        crudButtons.delete.type === DELETE_TYPE_SINGLE &&
        isAuthReady
      )
        count++;
      return count;
    };

    // ─── TABLE ROWS ──────────────────────────────────────────────────────────────

    const renderTableRows = () => {
      const rows: React.ReactNode[] = [];
      let lastGroupValue: unknown = undefined;

      sortedDataBinding.forEach((item, rowIndex) => {
        // Group subheader row
        if (groupRowsBy && item[groupRowsBy] !== lastGroupValue) {
          lastGroupValue = item[groupRowsBy];
          rows.push(
            <tr
              key={`group-${String(lastGroupValue)}-${rowIndex}`}
              className="bg-gray-100"
            >
              <td colSpan={getTotalColCount()} className="px-4 py-2">
                {renderGroupHeader(item)}
              </td>
            </tr>,
          );
        }

        const stripedClass =
          tableStyles?.stripedRows && rowIndex % 2 === 1
            ? "bg-slate-100/70"
            : "bg-white";
        const rowCls = `group/row border-b border-slate-100 transition-all duration-200 ${stripedClass} hover:bg-blue-50/30 hover:shadow-md hover:-translate-y-[1px] relative z-0 hover:z-10 ${getRowClassName(item)}`;

        rows.push(
          <tr key={(item.id as string) || rowIndex} className={rowCls}>
            {/* Multi-delete checkbox */}
            {crudButtons.delete.active &&
              crudButtons.delete.type === DELETE_TYPE_MULTI &&
              (!crudButtons.delete.permission ||
                (crudButtons.delete.permission as string) in granted) && (
                <td
                  className={`px-3 ${rowCellPaddingY} ${hasVerticalGridlines ? "border-r border-slate-100" : ""} ${
                    getStickyStyles(
                      0,
                      false,
                      stripedClass,
                    ).className
                  }`}
                  style={{
                    ...getStickyStyles(0, false, stripedClass).style,
                  }}
                >
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 cursor-pointer accent-[#0f6bbf]"
                    checked={selected?.some(
                      (sel) => (sel.id as string) === (item.id as string),
                    )}
                    disabled={Boolean(item.disabled)}
                    onChange={(e) => toggleRowSelection(item, e.target.checked)}
                  />
                </td>
              )}

            {/* Row expansion toggle */}
            {rowExpansion && (
              <td className="px-3 py-1 w-10">
                {allowExpansion(item) && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 text-xs"
                    onClick={() => {
                      const rowId = item.id as string;
                      setExpandedRows((prev) => {
                        const next = { ...prev };
                        if (next[rowId]) delete next[rowId];
                        else next[rowId] = true;
                        return next;
                      });
                    }}
                  >
                    <i
                      className={`fas ${
                        expandedRows[item.id as string]
                          ? "fa-chevron-down"
                          : "fa-chevron-right"
                      }`}
                    />
                  </button>
                )}
              </td>
            )}

            {/* Data columns */}
            {columns.map((col, colIdx) => (
              <td
                key={col.name}
                className={`px-2 ${rowCellPaddingY} ${hasVerticalGridlines ? "border-r border-slate-100" : ""} ${
                  getStickyStyles(
                    colIdx +
                      (crudButtons.delete.active &&
                      crudButtons.delete.type === DELETE_TYPE_MULTI &&
                      (!crudButtons.delete.permission ||
                        (crudButtons.delete.permission as string) in granted)
                        ? 1
                        : 0),
                    false,
                    stripedClass,
                  ).className
                }`}
                style={{
                  textAlign: (col.align ||
                    "left") as React.CSSProperties["textAlign"],
                  fontSize: "13px",
                  ...getStickyStyles(
                    colIdx +
                      (crudButtons.delete.active &&
                      crudButtons.delete.type === DELETE_TYPE_MULTI &&
                      (!crudButtons.delete.permission ||
                        (crudButtons.delete.permission as string) in granted)
                        ? 1
                        : 0),
                    false,
                    stripedClass,
                  ).style,
                  ...col.style,
                }}
              >
                {col.dataFormatEdit &&
                typeof col.dataFormatEdit === "function" &&
                (!crudButtons.update.permission ||
                  (crudButtons.update.permission as string) in granted) ? (
                  !readOnly ? (
                    <a
                      href="#"
                      className="inline-flex items-center h-7 px-2 rounded-md text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle();
                        setDataEdit(item);
                      }}
                    >
                      {col.dataFormatEdit(item)}
                    </a>
                  ) : (
                    <span>{col.dataFormatEdit(item)}</span>
                  )
                ) : col.dataField === "trangThaiDuyet" &&
                  (
                    metadata as {
                      crudButtons: Record<string, Record<string, unknown>>;
                    }
                  ).crudButtons.approve?.permission ? (
                  (!(
                    metadata as {
                      crudButtons: Record<string, Record<string, unknown>>;
                    }
                  ).crudButtons.approve?.permission ||
                    ((
                      metadata as {
                        crudButtons: Record<string, Record<string, unknown>>;
                      }
                    ).crudButtons.approve?.permission as string) in granted) &&
                  col.dataFormat ? (
                    col.dataFormat(item)
                  ) : null
                ) : col.dataFormat ? (
                  col.dataFormat(item)
                ) : (
                  (item[col.dataField] as React.ReactNode)
                )}
              </td>
            ))}

            {/* Update action column */}
            {crudButtons.update.active &&
              hasEditableColumn(columns) &&
              isAuthReady && (
                <td className="px-3 py-1">
                  <div className="flex gap-1.5 justify-end">
                    {customList?.map((btn, btnIdx) =>
                      renderCustomButton(btn, item, btnIdx),
                    )}
                    {crudButtons.update.active &&
                      hasEditableColumn(columns) &&
                      (!crudButtons.update.permission ||
                        (crudButtons.update.permission as string) in
                          granted) && (
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          className={
                            softActionIcons
                              ? "inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 transition-colors group-hover/row:text-blue-600 group-hover/row:bg-blue-50 hover:text-blue-700 hover:bg-blue-50"
                              : "inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          }
                          onClick={() => {
                            if (
                              onEditAction &&
                              typeof onEditAction === "function"
                            ) {
                              onEditAction(item);
                              return;
                            }
                            toggle();
                            setDataEdit(item);
                          }}
                        >
                          <i className="fas fa-edit text-sm" />
                        </button>
                      )}
                  </div>
                </td>
              )}

            {/* Delete single action column */}
            {crudButtons.delete.active &&
              crudButtons.delete.type === DELETE_TYPE_SINGLE &&
              isAuthReady && (
                <td className="px-3 py-1">
                  <div className="flex gap-1.5 justify-end">
                    {customList?.map((btn, btnIdx) =>
                      renderCustomButton(btn, item, btnIdx),
                    )}
                    {crudButtons.delete.active &&
                      crudButtons.delete.type === DELETE_TYPE_SINGLE &&
                      (!crudButtons.delete.permission ||
                        (crudButtons.delete.permission as string) in
                          granted) && (
                        <button
                          type="button"
                          title="Xóa"
                          className={
                            softActionIcons
                              ? "inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 transition-colors group-hover/row:text-rose-600 group-hover/row:bg-rose-50 hover:text-rose-700 hover:bg-rose-50"
                              : "inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
                          }
                          onClick={() => {
                            setDeleteDialog(true);
                            setDeleteId(item.id as string);
                          }}
                        >
                          <i className="fas fa-trash-alt text-sm" />
                        </button>
                      )}
                  </div>
                </td>
              )}
          </tr>,
        );

        // Expansion row
        if (rowExpansion && expandedRows[item.id as string]) {
          rows.push(
            <tr
              key={`expand-${(item.id as string) || rowIndex}`}
              className="bg-gray-50"
            >
              <td colSpan={getTotalColCount()} className="px-4 py-2">
                {renderRowExpansion(item)}
              </td>
            </tr>,
          );
        }
      });

      return rows;
    };

    // ─── HEADER COLUMNS ──────────────────────────────────────────────────────────

    const renderHeaderColumns = () => (
      <tr className="bg-slate-100/50 border-b-2 border-slate-200">
        {crudButtons.delete.active &&
          crudButtons.delete.type === DELETE_TYPE_MULTI &&
          (!crudButtons.delete.permission ||
            (crudButtons.delete.permission as string) in granted) && (
            <th
              className={`sticky top-0 z-20 px-3 py-3 text-xs uppercase tracking-wider text-slate-500 ${hasVerticalGridlines ? "border-r border-slate-100" : ""} ${
                getStickyStyles(0, true, "bg-slate-50").className
              }`}
              style={{ ...getStickyStyles(0, true, "bg-slate-50").style }}
            >
              <input
                type="checkbox"
                className="w-3.5 h-3.5 cursor-pointer accent-[#0f6bbf]"
                checked={
                  dataBinding.length > 0 &&
                  dataBinding.every((item) =>
                    selected?.some(
                      (sel) => (sel.id as string) === (item.id as string),
                    ),
                  )
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectionChange([
                      ...(selected || []),
                      ...dataBinding.filter(
                        (item) =>
                          !selected?.some(
                            (sel) => (sel.id as string) === (item.id as string),
                          ),
                      ),
                    ]);
                  } else {
                    onSelectionChange(
                      (selected || []).filter(
                        (sel) =>
                          !dataBinding.some(
                            (item) =>
                              (item.id as string) === (sel.id as string),
                          ),
                      ),
                    );
                  }
                }}
              />
            </th>
          )}

        {rowExpansion && <th className="px-3 py-2 w-10 bg-slate-50" />}

        {columns.map((col, colIdx) => (
          <th
            key={col.name}
            className={`sticky top-0 z-20 px-2 py-3 uppercase font-semibold text-slate-500 bg-slate-50 text-xs tracking-wider ${hasVerticalGridlines ? "border-r border-slate-100" : ""} ${
              getStickyStyles(colIdx + (crudButtons.delete.active && crudButtons.delete.type === DELETE_TYPE_MULTI && (!crudButtons.delete.permission || (crudButtons.delete.permission as string) in granted) ? 1 : 0), true, "bg-slate-50").className
            } ${
              col.alignHeader === "center"
                ? "text-center"
                : col.alignHeader === "right"
                  ? "text-right"
                  : "text-left"
            }`}
            style={{
              fontSize: "12px",
              width: col.width,
              ...getStickyStyles(
                colIdx +
                  (crudButtons.delete.active &&
                  crudButtons.delete.type === DELETE_TYPE_MULTI &&
                  (!crudButtons.delete.permission ||
                    (crudButtons.delete.permission as string) in granted)
                    ? 1
                    : 0),
                true,
                "bg-slate-50",
              ).style,
              ...col.style,
            }}
          >
            {col.name}
          </th>
        ))}

        {crudButtons.update.active &&
          hasEditableColumn(columns) &&
          isAuthReady && (
            <th
              style={{ fontSize: "12px", minWidth: "85px" }}
              className="sticky top-0 z-20 px-2 py-2 text-right uppercase font-semibold text-slate-500 bg-slate-50 tracking-wider"
            >
              Thao tác
            </th>
          )}
        {crudButtons.delete.active &&
          crudButtons.delete.type === DELETE_TYPE_SINGLE &&
          isAuthReady && (
            <th
              style={{ fontSize: "12px", minWidth: "85px" }}
              className="sticky top-0 z-20 px-2 py-2 text-right uppercase font-semibold text-slate-500 bg-slate-50 tracking-wider"
            >
              Thao tác
            </th>
          )}
      </tr>
    );

    // ─── PAGINATION ──────────────────────────────────────────────────────────────

    const totalRows = isPageMultipleTable
      ? totalRecord
      : (datatableReducer.totalRows ?? 0);
    const totalPages =
      pagination && pageRows > 0 ? Math.ceil(totalRows / pageRows) : 0;
    const currentPage = lazyState.page + 1;

    const renderPagination = () => {
      if (!pagination || totalPages <= 0) return null;

      const pageNumbers = Array.from(
        { length: totalPages },
        (_, i) => i + 1,
      ).filter((page) => {
        if (totalPages <= 7) return true;
        if (page === 1 || page === totalPages) return true;
        if (Math.abs(page - currentPage) <= 1) return true;
        return false;
      });

      return (
        <div className="flex w-full items-center justify-between py-3 px-4 bg-gradient-to-r from-slate-50 to-blue-50/20 border-t-2 border-slate-200/70 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>
              Từ {(currentPage - 1) * pageRows + 1} đến{" "}
              {Math.min(currentPage * pageRows, totalRows)} trên tổng số{" "}
              {formatNumberWithDots(totalRows)}
            </span>
            <select
              className="border-2 border-slate-300 rounded-lg px-3 py-1 text-xs font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              value={pageRows}
              onChange={(e) => onPage(0, 0, Number(e.target.value))}
            >
              {rowsPerPageOptionsList.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPage(0, 0, pageRows)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all duration-200"
            >
              «
            </button>
            <button
              onClick={() =>
                onPage((currentPage - 2) * pageRows, currentPage - 2, pageRows)
              }
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all duration-200"
            >
              ‹
            </button>
            {pageNumbers.map((page, index, array) => {
              const prevPage = array[index - 1];
              const showEllipsis =
                prevPage !== undefined && page - prevPage > 1;
              return (
                <Fragment key={page}>
                  {showEllipsis && (
                    <span className="px-2 text-slate-400 font-bold">...</span>
                  )}
                  <button
                    onClick={() =>
                      onPage((page - 1) * pageRows, page - 1, pageRows)
                    }
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all duration-200 ${
                      currentPage === page
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/30"
                        : "border-slate-300 hover:bg-slate-50 hover:border-blue-400 text-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                </Fragment>
              );
            })}
            <button
              onClick={() =>
                onPage(currentPage * pageRows, currentPage, pageRows)
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all duration-200"
            >
              ›
            </button>
            <button
              onClick={() =>
                onPage((totalPages - 1) * pageRows, totalPages - 1, pageRows)
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all duration-200"
            >
              »
            </button>
          </div>
        </div>
      );
    };

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────────

    return (
      <Fragment>
        <div className="datatable-wrapper">
          {!unifiedToolbar && (
            <div className="datatable-toolbar">
              <CrudButtons
                className=""
                metadata={metadata}
                data={dataBinding}
                setHasChangeData={setHasChangeData}
                setBack={setDataBinding}
                selected={selected}
                setSelected={setSelected}
                granted={granted}
              />
            </div>
          )}
          <div className="">
            {topTableCustom && <>{topTableCustom()}</>}

            {unifiedToolbar && (
              <div className="mb-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                {tableConfig.additionalHeader &&
                  tableConfig.additionalHeader(
                    isPageMultipleTable
                      ? totalRecord
                      : (datatableReducer.totalRows ?? 0),
                  )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <CrudButtons
                      className="border-0 shadow-none bg-transparent p-0"
                      metadata={metadata}
                      data={dataBinding}
                      setHasChangeData={setHasChangeData}
                      setBack={setDataBinding}
                      selected={selected}
                      setSelected={setSelected}
                      granted={granted}
                    />
                    {renderTableInfo()}
                  </div>

                  {filterToolsCfg && filterToolsCfg.component == null && (
                    <div
                      className="min-w-0"
                      onClick={() => dispatch(setId(id))}
                    >
                      <FilterTools
                        metadata={metadata}
                        id={id}
                        params={params}
                        onInteract={() => dispatch(setId(id))}
                        compact
                      />
                    </div>
                  )}

                  {filterToolsCfg?.component && (
                    <div
                      className={colFilterTools || "col-md-9"}
                      onClick={() => dispatch(setId(id))}
                    >
                      {filterToolsCfg.component()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!unifiedToolbar && renderHeader()}

            <div
              className={`relative overflow-x-auto rounded-xl border border-slate-200 bg-white admin-elevated stagger-fade-in-2 font-admin-table ${
                tableStyles?.className || ""
              }`}
            >
              <table
                className={`w-full text-sm text-left ${
                  tableStyles?.showGridlines ? "border-collapse" : ""
                }`}
              >
                {headerColumnGroup ? (
                  <thead>{headerColumnGroup as React.ReactNode}</thead>
                ) : (
                  <thead>{renderHeaderColumns()}</thead>
                )}
                <tbody>
                  {sortedDataBinding.length === 0 ? (
                    <tr>
                      <td
                        colSpan={getTotalColCount()}
                        className="px-4 py-12 text-center text-xs text-slate-500 bg-slate-50/30"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
                            <i className="fas fa-inbox text-3xl text-slate-300" />
                          </div>
                       
                          <p className="text-xs text-slate-400">
                            Không tìm thấy dữ liệu nào
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    renderTableRows()
                  )}
                </tbody>
              </table>

              {renderPagination()}
            </div>
          </div>
        </div>

        {/* ── UpdateModal ── */}
        {modal &&
          dataEdit &&
          (() => {
            if (!crudButtons.update) return null;
            const updateBtn = crudButtons.update;
            return (
              <UpdateModal
                toggle={toggle}
                isOpen={modal}
                className={(updateBtn.className as string) || ""}
                style={updateBtn.style as React.CSSProperties}
                uiConfigs={
                  (updateBtn.uiConfigs as { headerText?: string }) || {}
                }
                data={dataEdit}
                dataSource={
                  (updateBtn.dataSource as Record<string, unknown>) || {}
                }
                transform2BE={
                  updateBtn.transform2BE as
                    | ((data: unknown) => Promise<unknown> | unknown)
                    | undefined
                }
                isSubmitFile={(updateBtn.isSubmitFile as boolean) || false}
                component={updateBtn.component as React.ComponentType<unknown>}
                api={(updateBtn.api as string) || ""}
                headers={(updateBtn.headers as Record<string, string>) || {}}
                handleResponseData={
                  updateBtn.handleResponseData as
                    | ((data: unknown) => unknown)
                    | undefined
                }
                metadata={metadata}
                customFooter={
                  (metadata as { customFooter?: React.ReactNode }).customFooter
                }
                whenClose={(currentRow: Record<string, unknown>) => {
                  const index = dataBinding.findIndex(
                    (x) =>
                      (x.id as string) === (currentRow.id as string) ||
                      (x.children as Array<{ id: string }>)?.some(
                        (y) => y.id === (currentRow.id as string),
                      ),
                  );
                  const temp = [...dataBinding];

                  if (methods !== null) {
                    try {
                      methods.setValue(
                        currentRow?.id as string,
                        currentRow?.order as string,
                      );
                    } catch {}
                  }

                  if (index !== -1) {
                    if (
                      (temp[index]?.id as string) === (currentRow.id as string)
                    ) {
                      if (rowExpansion && rowExpansion.field) {
                        temp[index] = { ...currentRow };
                      } else {
                        temp[index] = currentRow;
                      }
                    } else {
                      const childIndex = (
                        temp[index]?.children as Array<{ id: string }>
                      )?.findIndex((x) => x.id === (currentRow.id as string));
                      if (childIndex !== undefined && childIndex !== -1) {
                        (temp[index].children as Record<string, unknown>[])[
                          childIndex
                        ] = currentRow;
                      }
                    }

                    let displayStrategy: Record<string, unknown>[] =
                      typeof (
                        metadata as {
                          displayStratetry?: (
                            data: Record<string, unknown>[],
                          ) => Record<string, unknown>[];
                        }
                      ).displayStratetry === "function"
                        ? (
                            metadata as {
                              displayStratetry: (
                                data: Record<string, unknown>[],
                              ) => Record<string, unknown>[];
                            }
                          ).displayStratetry(temp)
                        : temp;

                    if (groupRowsBy) {
                      displayStrategy = [...displayStrategy].sort((a, b) => {
                        if (
                          (a[groupRowsBy] as string) <
                          (b[groupRowsBy] as string)
                        )
                          return -1;
                        if (
                          (a[groupRowsBy] as string) >
                          (b[groupRowsBy] as string)
                        )
                          return 1;
                        return 0;
                      });
                    }

                    setDataBinding(displayStrategy);
                    setHasChangeData(true);
                    if (typeof crudButtons.update.callback === "function") {
                      (
                        crudButtons.update.callback as (
                          row: Record<string, unknown>,
                        ) => void
                      )(currentRow);
                    }
                  }
                }}
              />
            );
          })()}

        {/* ── Delete Dialog ── */}
        <Modal
          isOpen={deleteDialog}
          onOpenChange={(open) => !open && setDeleteDialog(false)}
        >
          <Modal.Backdrop className="bg-black/80 modal-backdrop">
            <Modal.Container className="items-center justify-center modal-container" placement="top">
              <Modal.Dialog className="bg-white rounded-xl max-w-sm w-full shadow-2xl modal-dialog">
                <Modal.CloseTrigger />
                <Modal.Header className="">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50">
                      <i className="fas fa-exclamation-triangle text-xl text-orange-500" />
                    </div>
                    <Modal.Heading className="text-lg font-semibold text-gray-900">
                      Xác nhận xóa
                    </Modal.Heading>
                  </div>
                </Modal.Header>
                <Modal.Body className="px-6 py-5">
                  <p className="text-gray-700">
                    Bạn có chắc chắn muốn xóa dữ liệu này?
                  </p>
                </Modal.Body>
                <Modal.Footer className="flex gap-2 justify-end px-6 py-3.5 bg-gray-50 border-t border-gray-200">
                 
                  <Button
                    className="font-medium bg-red-600 hover:bg-red-700 text-white border-none"
                    onPress={() => {
                      void deleteSingle();
                    }}
                  >
                    <i className="fas fa-trash-alt mr-1" /> Xóa
                  </Button>
                   <Button
                    onPress={() => setDeleteDialog(false)}
                    className="font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-none"
                  >
                    <i className="fas fa-times mr-1" /> Đóng
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </Fragment>
    );
  },
);

DataTableComponent.displayName = "DataTableComponent";
export default DataTableComponent;
