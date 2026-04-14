// --- INTERFACES ---
export interface Pagination {
  current: number;
  size: number;
}

export interface DatatableState {
  filtering: boolean;
  pagination: Pagination;
  sizePerPageList: number[];
  textSearch: string;
  optionsSearch: Record<string, any> | null;
  query: string;
  totalRows: number;
  additionalTotalRows: Record<string, number> | null;
  isCache: boolean;
  optionQuery: Record<string, any> | null;
  id: string;
  selectedRows: any[] | null;
  defaultCreateModalValues: any;
  defaultCreateValues: {
    data: any;
    isToggle: boolean;
  } | null;
  autoOpenUpdateModal: boolean;
  autoOpenUpdateModalRowId: string | null;
}

// --- INITIAL STATE ---
export const datatableInitialState: DatatableState = {
  filtering: false,
  pagination: { current: 1, size: 25 },
  sizePerPageList: [10, 25, 50, 100],
  textSearch: "",
  optionsSearch: null,
  query: "",
  totalRows: 0,
  additionalTotalRows: null,
  isCache: false,
  optionQuery: null,
  id: "",
  selectedRows: null,
  defaultCreateModalValues: null,
  defaultCreateValues: null,
  autoOpenUpdateModal: false,
  autoOpenUpdateModalRowId: null,
};

// --- HELPER FUNCTION ---
/**
 * Kết hợp các tham số để tạo chuỗi Query API chuẩn ABP Framework
 */
function requestURLCombination(
  text: string, 
  pagination: Pagination, 
  options: Record<string, any> | null
): string {
  let query = "?";
  
  if (text) {
    query += "Filter=" + encodeURIComponent(text);
  }

  if (pagination) {
    if (query !== "?") query += "&";
    query += `SkipCount=${(pagination.current - 1) * pagination.size}&MaxResultCount=${pagination.size}`;
  }

  if (options) {
    for (const [key, value] of Object.entries(options)) {
      if (value !== null && value !== undefined && value !== "") {
        if (query !== "?") query += "&";
        query += `${keySync(key)}=${encodeURIComponent(String(value))}`;
      }
    }
  }
  
  return query === "?" ? "" : query;
}

// Hỗ trợ xử lý key nếu cần (ví dụ đổi CamelCase)
const keySync = (key: string) => key;

const UPDATE_TOTAL_ROWS = "datatable/updateTotalRows";
const UPDATE_ADDITIONAL_TOTAL_ROWS = "datatable/updateAdditionalTotalRows";
const ALL = "datatable/all";
const RESET = "datatable/reset";
const FILTERING = "datatable/filtering";
const PAGE_CHANGE = "datatable/pageChange";
const TEXT_SEARCH_CHANGE = "datatable/textSearchChange";
const OPTIONS_SEARCH_CHANGE = "datatable/optionsSearchChange";
const OPTION_QUERY = "datatable/optionQuery";
const ON_SELECT_MULTIPLE_ROWS = "datatable/onSelectMultipleRows";
const SET_ID = "datatable/setId";
const ON_TRIGGER_OPEN_CREATE_MODAL = "datatable/onTriggerOpenCreateModal";
const ON_SET_DEFAULT_CREATE_VALUES = "datatable/onSetDefaultCreateValues";
const ON_AUTO_OPEN_UPDATE_MODAL = "datatable/onAutoOpenUpdateModal";

export const updateTotalRows = (payload: number) => ({
  type: UPDATE_TOTAL_ROWS,
  payload,
} as const);
export const updateAdditionalTotalRows = (payload: Record<string, number>) => ({
  type: UPDATE_ADDITIONAL_TOTAL_ROWS,
  payload,
} as const);
export const all = () => ({ type: ALL } as const);
export const reset = () => ({ type: RESET } as const);
export const filtering = () => ({ type: FILTERING } as const);
export const pageChange = (payload: Pagination) => ({
  type: PAGE_CHANGE,
  payload,
} as const);
export const textSearchChange = (payload: string) => ({
  type: TEXT_SEARCH_CHANGE,
  payload,
} as const);
export const optionsSearchChange = (payload: Record<string, any>) => ({
  type: OPTIONS_SEARCH_CHANGE,
  payload,
} as const);
export const optionQuery = (payload: Record<string, any>) => ({
  type: OPTION_QUERY,
  payload,
} as const);
export const onSelectMultipleRows = (payload: any[] | null) => ({
  type: ON_SELECT_MULTIPLE_ROWS,
  payload,
} as const);
export const setId = (payload: string) => ({
  type: SET_ID,
  payload,
} as const);
export const onTriggerOpenCreateModal = (payload: any) => ({
  type: ON_TRIGGER_OPEN_CREATE_MODAL,
  payload,
} as const);
export const onSetDefaultCreateValues = (payload: { data: any; isToggle: boolean }) => ({
  type: ON_SET_DEFAULT_CREATE_VALUES,
  payload,
} as const);
export const onAutoOpenUpdateModal = (payload: string | null) => ({
  type: ON_AUTO_OPEN_UPDATE_MODAL,
  payload,
} as const);

export type DatatableAction =
  | ReturnType<typeof updateTotalRows>
  | ReturnType<typeof updateAdditionalTotalRows>
  | ReturnType<typeof all>
  | ReturnType<typeof reset>
  | ReturnType<typeof filtering>
  | ReturnType<typeof pageChange>
  | ReturnType<typeof textSearchChange>
  | ReturnType<typeof optionsSearchChange>
  | ReturnType<typeof optionQuery>
  | ReturnType<typeof onSelectMultipleRows>
  | ReturnType<typeof setId>
  | ReturnType<typeof onTriggerOpenCreateModal>
  | ReturnType<typeof onSetDefaultCreateValues>
  | ReturnType<typeof onAutoOpenUpdateModal>;

const datatableReducer = (
  state: DatatableState = datatableInitialState,
  action: DatatableAction | { type: string; payload?: any },
): DatatableState => {
  switch (action.type) {
    case UPDATE_TOTAL_ROWS:
      return { ...state, totalRows: action.payload };
    case UPDATE_ADDITIONAL_TOTAL_ROWS:
      return { ...state, additionalTotalRows: action.payload };
    case ALL: {
      const nextPagination = { current: 1, size: state.pagination.size };
      return {
        ...state,
        filtering: false,
        textSearch: "",
        pagination: nextPagination,
        optionsSearch: null,
        query: requestURLCombination("", nextPagination, null),
      };
    }
    case RESET: {
      const nextPagination = { current: 1, size: state.pagination.size };
      return {
        ...state,
        filtering: false,
        textSearch: "",
        pagination: nextPagination,
        optionsSearch: null,
        optionQuery: null,
        query: requestURLCombination("", nextPagination, null),
      };
    }
    case FILTERING:
      return { ...state, filtering: true };
    case PAGE_CHANGE:
      return {
        ...state,
        filtering: true,
        pagination: action.payload,
        query: requestURLCombination(state.textSearch, action.payload, state.optionsSearch),
      };
    case TEXT_SEARCH_CHANGE: {
      const nextPagination = { current: 1, size: state.pagination.size };
      return {
        ...state,
        filtering: true,
        pagination: nextPagination,
        textSearch: action.payload,
        query: requestURLCombination(action.payload, nextPagination, state.optionsSearch),
      };
    }
    case OPTIONS_SEARCH_CHANGE: {
      const combinedOptions = { ...state.optionQuery, ...action.payload };
      return {
        ...state,
        filtering: true,
        optionsSearch: combinedOptions,
        query: requestURLCombination(state.textSearch, state.pagination, combinedOptions),
      };
    }
    case OPTION_QUERY: {
      const combinedOptions = { ...state.optionsSearch, ...action.payload };
      return {
        ...state,
        filtering: true,
        optionQuery: action.payload,
        optionsSearch: combinedOptions,
        query: requestURLCombination(state.textSearch, state.pagination, combinedOptions),
      };
    }
    case ON_SELECT_MULTIPLE_ROWS:
      return { ...state, selectedRows: action.payload };
    case SET_ID:
      return { ...state, id: action.payload };
    case ON_TRIGGER_OPEN_CREATE_MODAL:
      return { ...state, defaultCreateModalValues: action.payload };
    case ON_SET_DEFAULT_CREATE_VALUES:
      return { ...state, defaultCreateValues: action.payload };
    case ON_AUTO_OPEN_UPDATE_MODAL:
      return {
        ...state,
        autoOpenUpdateModal: !state.autoOpenUpdateModal,
        autoOpenUpdateModalRowId: action.payload,
      };
    default:
      return state;
  }
};

export default datatableReducer;