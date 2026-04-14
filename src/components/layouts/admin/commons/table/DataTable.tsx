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
import { Button, Modal, Chip, Table, Pagination } from "@heroui/react";
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
    const tableConfig = (metadata as any).table as TableConfig;
    const {
      pagination,
      columns,
      stickyLeftColumns = 0,
      tableStyles,
      topTableCustom,
      customList,
      rowExpansion,
      headerColumnGroup,
    } = tableConfig;

    const crudButtons = (metadata as any).crudButtons as any;

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

    const isMultiDeleteType =
      !crudButtons.delete?.type ||
      crudButtons.delete.type === DELETE_TYPE_MULTI;

    const getDeletePermission = (): boolean =>
      Boolean(crudButtons.delete.active) &&
      isMultiDeleteType &&
      (!crudButtons.delete.permission ||
        (crudButtons.delete.permission as string) in granted);

    const isMultiDeleteEnabled = getDeletePermission();

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

    const getDataColumnPhysicalIndex = (colIdx: number): number =>
      colIdx + (isMultiDeleteEnabled ? 1 : 0) + (rowExpansion ? 1 : 0);

    const toPixelValue = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value.replace("px", ""));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const getDataColumnWidth = (columnIndex: number): number => {
      const col = columns[columnIndex];
      if (!col) return 120;

      const widthFromStyle = toPixelValue(col.style?.width);
      if (widthFromStyle) return widthFromStyle;

      const widthFromConfig = toPixelValue(col.width);
      if (widthFromConfig) return widthFromConfig;

      const minWidthFromStyle = toPixelValue(col.style?.minWidth);
      if (minWidthFromStyle) return minWidthFromStyle;

      return 120;
    };

    const getStickyLeftOffset = (physicalIndex: number): number => {
      let left = 0;

      for (let idx = 0; idx < physicalIndex; idx++) {
        if (isMultiDeleteEnabled && idx === 0) {
          left += 44;
          continue;
        }

        const rowExpansionIndex = isMultiDeleteEnabled ? 1 : 0;
        if (rowExpansion && idx === rowExpansionIndex) {
          left += 40;
          continue;
        }

        const dataColumnIndex =
          idx - (isMultiDeleteEnabled ? 1 : 0) - (rowExpansion ? 1 : 0);
        if (dataColumnIndex >= 0 && dataColumnIndex < columns.length) {
          left += getDataColumnWidth(dataColumnIndex);
        }
      }

      return left;
    };

    const getStickyStyles = (
      physicalIndex: number,
      isHeader: boolean,
      backgroundClass: string,
    ): { className: string; style: React.CSSProperties } => {
      if (stickyLeftColumns <= 0 || physicalIndex >= stickyLeftColumns) {
        return { className: "", style: {} };
      }

      const isLastSticky = physicalIndex === stickyLeftColumns - 1;

      return {
        className: `sticky ${isHeader ? "z-30" : "z-20"} ${backgroundClass}`,
        style: {
          left: getStickyLeftOffset(physicalIndex),
          ...(isMultiDeleteEnabled && physicalIndex === 0
            ? {
                minWidth: 44,
                width: 44,
              }
            : {}),
          ...(isLastSticky
            ? { boxShadow: "8px 0 10px -10px rgba(15, 23, 42, 0.35)" }
            : {}),
        },
      };
    };

    const resolveTotalRows = (
      source: Record<string, unknown>,
      fallbackLength: number,
    ): number => {
      const keys = [
        "totalCount",
        "totalRows",
        "total",
        "count",
        "TotalCount",
        "TotalRows",
      ] as const;

      for (const key of keys) {
        const raw = source[key];
        if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
          return raw;
        }
      }

      return fallbackLength;
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
              const total = resolveTotalRows(
                resData,
                (resData.items ?? []).length,
              );
              dispatch(updateTotalRows(total));
              const transformed = serverSide.transformStrategy
                ? serverSide.transformStrategy(resData.items ?? [])
                : (resData.items ?? []);
              setDataBinding(transformed);
              setTotalRecord(total);

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
        dispatch(updateTotalRows((transformed || []).length));
        setTotalRecord((transformed || []).length);
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
                const total = resolveTotalRows(
                  resData,
                  (resData.items ?? []).length,
                );
                dispatch(updateTotalRows(total));
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
                setTotalRecord(total);
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
      if (!getDeletePermission()) return;

      const filtered = (value || []).filter(
        (item) => item.disabled === undefined || !item.disabled,
      );

      // De-duplicate by id to avoid duplicated selection from nested/group rows.
      const uniqueById = Array.from(
        new Map(filtered.map((item) => [item.id as string, item])).values(),
      );

      setSelected(uniqueById);
      dispatch(onSelectMultipleRows(uniqueById));
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
        <div className="flex flex-row flex-wrap gap-2">
          {!hideTotal && (
            <>
              <Chip variant="soft" color="accent" size="sm">
                Tổng: {formatNumberWithDots(isPageMultipleTable ? totalRecord : totalRows)}
              </Chip>
              {customTopTag.map((item, index) => (
                <Chip
                  key={index}
                  variant="soft"
                  color={
                    item.severity === "success"
                      ? "success"
                      : item.severity === "warning"
                        ? "warning"
                        : item.severity === "danger"
                          ? "danger"
                          : "default"
                  }
                  size="sm"
                  style={item?.style}
                >
                  {item.icon ? <i className={item.icon} /> : null}
                  {item.title}: {item.value}
                </Chip>
              ))}
              {selected && selected.length > 0 && (
                <Chip variant="primary" color="warning" size="sm">
                  Đã chọn: {selected.length}
                </Chip>
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
          <div
            className={`flex flex-wrap items-center justify-between gap-3 mb-3 ${
              filterToolsCfg?.smallMode ? "p-2" : ""
            }`}
          >
            <div className="min-w-0">{renderTableInfo()}</div>
            <div className="min-w-0 ml-auto" onClick={() => dispatch(setId(id))}>
              {filterToolsCfg && filterToolsCfg.component == null ? (
                <FilterTools metadata={metadata} id={id} params={params} />
              ) : (
                <div className={colFilterTools || "col-md-9"}>
                  {filterToolsCfg?.component?.()}
                </div>
              )}
            </div>
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
      const variant = item.outlined
        ? "outline"
        : item.text
          ? "ghost"
          : item.color === "danger"
            ? "danger"
            : "primary";

      return (
        <Button
          key={index}
          aria-label={item.title}
          size="sm"
          variant={variant as
            | "outline"
            | "ghost"
            | "danger"
            | "primary"}
          className={item.className || ""}
          onPress={() => item.onClick(rowData)}
        >
          {item.icon && <i className={item.icon} />}
          {item.label && <span>{item.label}</span>}
        </Button>
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
            } nested-table ${rowExpansion.customClassName || ""}`}
          >
            <thead className="text-xs  bg-gray-50">
              <tr>
                {crudButtons.delete.active &&
                  isMultiDeleteType &&
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
                            onSelectionChange([..._sel, ...nestedRows]);
                          } else {
                            onSelectionChange(
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
                    className="px-4 py-2 text-left text-[14px] font-bold text-slate-700"
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
                    isMultiDeleteType &&
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
        <div className="flex items-center gap-2 p-1">
          {showGroupCount && (
            <Chip
              variant="soft"
              color="default"
              size="sm"
              className="font-bold ml-4"
            >
              {groupIndex[groupValue[groupRowsBy] as string]}
            </Chip>
          )}
          <span className="font-bold text-slate-700">
            {groupValue[groupRowsBy] as string}
          </span>
          {showGroupCount && (
            <Chip
              size="sm"
              color="success"
              variant="primary"
              className="font-semibold"
            >
              <span className="inline-flex items-center gap-1">
                <i className="fas fa-circle text-[6px]" />
                Tổng: {formatNumberWithDots(calculateGroupNumber(groupRowsBy, groupValue[groupRowsBy]))}
              </span>
            </Chip>
          )}
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
        isMultiDeleteType &&
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
            <Table.Row
              key={`group-${String(lastGroupValue)}-${rowIndex}`}
              className="bg-gray-100"
            >
              <Table.Cell colSpan={getTotalColCount()} className="px-4 py-2">
                {renderGroupHeader(item)}
              </Table.Cell>
            </Table.Row>,
          );
        }

        const stripedClass = rowIndex % 2 === 0 ? "bg-slate-50/35" : "bg-white";
        const rowCls = `group ${getRowClassName(item)}`;
        const cellBgClass = `${stripedClass} group-hover:!bg-sky-50/55`;

        rows.push(
          <Table.Row key={(item.id as string) || rowIndex} className={rowCls}>
            {/* Multi-delete checkbox */}
            {isMultiDeleteEnabled && (
                <Table.Cell
                  className={`${cellBgClass} px-3 ${rowCellPaddingY} ${hasVerticalGridlines ? "border-r border-slate-100" : ""} ${
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
                  </Table.Cell>
              )}

            {/* Row expansion toggle */}
            {rowExpansion && (
                <Table.Cell
                  className={`${cellBgClass} px-3 py-1 w-10 ${
                    getStickyStyles(
                      isMultiDeleteEnabled ? 1 : 0,
                      false,
                      stripedClass,
                    ).className
                  }`}
                  style={{
                    ...getStickyStyles(
                      isMultiDeleteEnabled ? 1 : 0,
                      false,
                      stripedClass,
                    ).style,
                  }}
                >
                {allowExpansion(item) && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => {
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
                  </Button>
                )}
              </Table.Cell>
            )}

            {/* Data columns */}
            {columns.map((col, colIdx) => (
              <Table.Cell
                key={col.name}
                className={`${cellBgClass} px-2 ${rowCellPaddingY} ${hasVerticalGridlines ? "border-r border-slate-100" : ""} ${
                  getStickyStyles(
                    getDataColumnPhysicalIndex(colIdx),
                    false,
                    stripedClass,
                  ).className
                }`}
                style={{
                  textAlign: (col.align ||
                    "left") as React.CSSProperties["textAlign"],
                  fontSize: "13px",
                  ...getStickyStyles(
                    getDataColumnPhysicalIndex(colIdx),
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
                      className="inline-flex items-center h-7 px-2 rounded-md text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors font-medium"
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
              </Table.Cell>
            ))}

            {/* Update action column */}
            {crudButtons.update.active &&
              hasEditableColumn(columns) &&
              isAuthReady && (
                <Table.Cell className={`${cellBgClass} px-3 py-1`}>
                  <div className="flex gap-1.5 justify-end">
                    {customList?.map((btn, btnIdx) =>
                      renderCustomButton(btn, item, btnIdx),
                    )}
                    {crudButtons.update.active &&
                      hasEditableColumn(columns) &&
                      (!crudButtons.update.permission ||
                        (crudButtons.update.permission as string) in
                          granted) && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          aria-label="Chỉnh sửa"
                          onPress={() => {
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
                        </Button>
                      )}
                  </div>
                </Table.Cell>
              )}

            {/* Delete single action column */}
            {crudButtons.delete.active &&
              crudButtons.delete.type === DELETE_TYPE_SINGLE &&
              isAuthReady && (
                <Table.Cell className={`${cellBgClass} px-3 py-1`}>
                  <div className="flex gap-1.5 justify-end">
                    {customList?.map((btn, btnIdx) =>
                      renderCustomButton(btn, item, btnIdx),
                    )}
                    {crudButtons.delete.active &&
                      crudButtons.delete.type === DELETE_TYPE_SINGLE &&
                      (!crudButtons.delete.permission ||
                        (crudButtons.delete.permission as string) in
                          granted) && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="danger-soft"
                          aria-label="Xóa"
                          onPress={() => {
                            setDeleteDialog(true);
                            setDeleteId(item.id as string);
                          }}
                        >
                          <i className="fas fa-trash-alt text-sm" />
                        </Button>
                      )}
                  </div>
                </Table.Cell>
              )}
          </Table.Row>,
        );

        // Expansion row
        if (rowExpansion && expandedRows[item.id as string]) {
          rows.push(
            <Table.Row
              key={`expand-${(item.id as string) || rowIndex}`}
              className="bg-gray-50"
            >
              <Table.Cell colSpan={getTotalColCount()} className="px-4 py-2">
                {renderRowExpansion(item)}
              </Table.Cell>
            </Table.Row>,
          );
        }
      });

      return rows;
    };

    // ─── HEADER COLUMNS ──────────────────────────────────────────────────────────

    const renderHeaderColumns = () => (
      <>
        {isMultiDeleteEnabled && (
            <Table.Column
              className={`sticky top-0 z-20 px-3 py-3 ${hasVerticalGridlines ? "border-r" : ""} ${getStickyStyles(0, true, "bg-white").className}`}
              style={{ ...getStickyStyles(0, true, "bg-white").style }}
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
            </Table.Column>
          )}

        {rowExpansion && (
          <Table.Column
            className={`px-3 py-2 w-10 ${
              getStickyStyles(isMultiDeleteEnabled ? 1 : 0, true, "bg-white")
                .className
            }`}
            style={{
              ...getStickyStyles(
                isMultiDeleteEnabled ? 1 : 0,
                true,
                "bg-white",
              ).style,
            }}
          />
        )}

        {columns.map((col, colIdx) => (
          <Table.Column
            key={col.name}
            className={`sticky top-0 z-20 px-2 py-3 text-[14px] font-bold text-slate-800 whitespace-nowrap ${hasVerticalGridlines ? "border-r" : ""} ${
              getStickyStyles(getDataColumnPhysicalIndex(colIdx), true, "bg-slate-50")
                .className
            } ${
              col.alignHeader === "center"
                ? "text-center"
                : col.alignHeader === "right"
                  ? "text-right"
                  : "text-left"
            }`}
            style={{
              width: col.width,
              ...getStickyStyles(
                getDataColumnPhysicalIndex(colIdx),
                true,
                "bg-slate-50",
              ).style,
              ...col.style,
            }}
          >
            {col.name}
          </Table.Column>
        ))}

        {crudButtons.update.active &&
          hasEditableColumn(columns) &&
          isAuthReady && (
            <Table.Column
              style={{ fontSize: "12px", minWidth: "85px" }}
              className="sticky top-0 z-20 px-2 py-2 text-right"
            >
              Thao tác
            </Table.Column>
          )}
        {crudButtons.delete.active &&
          crudButtons.delete.type === DELETE_TYPE_SINGLE &&
          isAuthReady && (
            <Table.Column
              style={{ fontSize: "12px", minWidth: "85px" }}
              className="sticky top-0 z-20 px-2 py-2 text-right"
            >
              Thao tác
            </Table.Column>
          )}
      </>
    );

    // ─── PAGINATION ──────────────────────────────────────────────────────────────

    const totalRows = isPageMultipleTable
      ? totalRecord
      : (datatableReducer.totalRows ?? 0);
    const effectiveTotalRows = totalRows > 0 ? totalRows : dataBinding.length;
    const totalPages =
      pagination && pageRows > 0 ? Math.ceil(effectiveTotalRows / pageRows) : 0;
    const currentPage = lazyState.page + 1;

    const renderPagination = () => {
      if (!pagination) return null;

      const safeTotalPages = Math.max(totalPages, 1);
      const safeCurrentPage = Math.min(
        Math.max(currentPage, 1),
        safeTotalPages,
      );

      const pageNumbers = Array.from(
        { length: safeTotalPages },
        (_, i) => i + 1,
      ).filter((page) => {
        if (safeTotalPages <= 7) return true;
        if (page === 1 || page === safeTotalPages) return true;
        if (Math.abs(page - safeCurrentPage) <= 1) return true;
        return false;
      });

      return (
        <div className="flex w-full items-center justify-between py-3 px-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span>
              Từ {(currentPage - 1) * pageRows + 1} đến{" "}
              {Math.min(currentPage * pageRows, effectiveTotalRows)} trên tổng số{" "}
              {formatNumberWithDots(effectiveTotalRows)}
            </span>
            <select
              className="px-2 py-1"
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
          <Pagination size="sm" className="ml-auto">
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={safeCurrentPage === 1}
                  onPress={() =>
                    onPage(
                      (safeCurrentPage - 2) * pageRows,
                      safeCurrentPage - 2,
                      pageRows,
                    )
                  }
                >
                  <Pagination.PreviousIcon />
                </Pagination.Previous>
              </Pagination.Item>

              {pageNumbers.map((page, index, array) => {
                const prevPage = array[index - 1];
                const showEllipsis =
                  prevPage !== undefined && page - prevPage > 1;

                return (
                  <Fragment key={page}>
                    {showEllipsis && (
                      <Pagination.Item>
                        <Pagination.Ellipsis />
                      </Pagination.Item>
                    )}
                    <Pagination.Item>
                      <Pagination.Link
                        isActive={safeCurrentPage === page}
                        onPress={() =>
                          onPage((page - 1) * pageRows, page - 1, pageRows)
                        }
                      >
                        {page}
                      </Pagination.Link>
                    </Pagination.Item>
                  </Fragment>
                );
              })}

              <Pagination.Item>
                <Pagination.Next
                  isDisabled={safeCurrentPage === safeTotalPages}
                  onPress={() =>
                    onPage(
                      safeCurrentPage * pageRows,
                      safeCurrentPage,
                      pageRows,
                    )
                  }
                >
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      );
    };

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────────

    return (
      <Fragment>
        <div className="datatable-wrapper">
          <div className="datatable-toolbar">
            <CrudButtons
              className=""
              metadata={metadata}
              data={dataBinding}
              setHasChangeData={setHasChangeData}
              setBack={setDataBinding}
              selected={selected}
              setSelected={(val) => setSelected(val ?? [])}
              granted={granted}
            />
          </div>
          <div className="">
            {topTableCustom && <>{topTableCustom()}</>}

            {renderHeader()}

            <div
              className={`overflow-x-auto bg-white font-admin-table ${
                tableStyles?.className || ""
              }`}
            >
              <Table
                className={`w-full text-sm text-left ${
                  tableStyles?.showGridlines ? "border-collapse" : ""
                }`}
              >
                <Table.Content aria-label="DataTable">
                  {headerColumnGroup ? (
                    <Table.Header>{headerColumnGroup as React.ReactNode}</Table.Header>
                  ) : (
                    <Table.Header>{renderHeaderColumns()}</Table.Header>
                  )}
                  <Table.Body>
                  {sortedDataBinding.length === 0 ? (
                    <Table.Row>
                      <Table.Cell
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
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    renderTableRows()
                  )}
                  </Table.Body>
                </Table.Content>
              </Table>

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
          <Modal.Backdrop>
            <Modal.Container placement="top">
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full">
                      <i className="fas fa-exclamation-triangle text-xl text-orange-500" />
                    </div>
                    <Modal.Heading>
                      Xác nhận xóa
                    </Modal.Heading>
                  </div>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    Bạn có chắc chắn muốn xóa dữ liệu này?
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="danger"
                    onPress={() => {
                      void deleteSingle();
                    }}
                  >
                    <i className="fas fa-trash-alt" /> Xóa
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => setDeleteDialog(false)}
                  >
                    <i className="fas fa-times" /> Đóng
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
