import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// --- INTERFACES ---
interface Pagination {
  current: number;
  size: number;
}

interface DatatableState {
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
const initialState: DatatableState = {
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

const datatableSlice = createSlice({
  name: 'datatable',
  initialState,
  reducers: {
    updateTotalRows(state, action: PayloadAction<number>) {
      state.totalRows = action.payload;
    },
    updateAdditionalTotalRows(state, action: PayloadAction<Record<string, number>>) {
      state.additionalTotalRows = action.payload;
    },
    all(state) {
      state.filtering = false;
      state.textSearch = "";
      state.pagination = { current: 1, size: state.pagination.size };
      state.optionsSearch = null;
      state.query = requestURLCombination("", state.pagination, null);
    },
    reset(state) {
      state.filtering = false;
      state.textSearch = "";
      state.pagination = { current: 1, size: state.pagination.size };
      state.optionsSearch = null;
      state.optionQuery = null;
      state.query = requestURLCombination("", state.pagination, null);
    },
    filtering(state) {
      state.filtering = true;
    },
    pageChange(state, action: PayloadAction<Pagination>) {
      state.filtering = true;
      state.pagination = action.payload;
      state.query = requestURLCombination(state.textSearch, action.payload, state.optionsSearch);
    },
    textSearchChange(state, action: PayloadAction<string>) {
      state.filtering = true;
      state.pagination = { current: 1, size: state.pagination.size };
      state.textSearch = action.payload;
      state.query = requestURLCombination(action.payload, state.pagination, state.optionsSearch);
    },
    optionsSearchChange(state, action: PayloadAction<Record<string, any>>) {
      state.filtering = true;
      const combinedOptions = { ...state.optionQuery, ...action.payload };
      state.optionsSearch = combinedOptions;
      state.query = requestURLCombination(state.textSearch, state.pagination, combinedOptions);
    },
    optionQuery(state, action: PayloadAction<Record<string, any>>) {
      state.filtering = true;
      state.optionQuery = action.payload;
      const combinedOptions = { ...state.optionsSearch, ...action.payload };
      state.optionsSearch = combinedOptions;
      state.query = requestURLCombination(state.textSearch, state.pagination, combinedOptions);
    },
    onSelectMultipleRows(state, action: PayloadAction<any[] | null>) {
      state.selectedRows = action.payload;
    },
    setId(state, action: PayloadAction<string>) {
      state.id = action.payload;
    },
    onTriggerOpenCreateModal(state, action: PayloadAction<any>) {
      state.defaultCreateModalValues = action.payload;
    },
    onSetDefaultCreateValues(state, action: PayloadAction<{ data: any; isToggle: boolean }>) {
      state.defaultCreateValues = action.payload;
    },
    onAutoOpenUpdateModal(state, action: PayloadAction<string | null>) {
      state.autoOpenUpdateModal = !state.autoOpenUpdateModal;
      state.autoOpenUpdateModalRowId = action.payload;
    },
  }
});

// Export Actions
export const { 
  optionQuery, 
  updateTotalRows, 
  updateAdditionalTotalRows, 
  onAutoOpenUpdateModal, 
  all, 
  reset, 
  filtering, 
  pageChange, 
  textSearchChange, 
  optionsSearchChange, 
  setId, 
  onTriggerOpenCreateModal, 
  onSelectMultipleRows, 
  onSetDefaultCreateValues 
} = datatableSlice.actions;

// Export Reducer
export default datatableSlice.reducer;