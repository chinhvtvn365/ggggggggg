// Định nghĩa kiểu dữ liệu cho SnackBar
export type SnackBarType = 'error' | 'success' | 'info' | 'warning';

interface SnackBarPayload {
  message: string;
  title?: string;
  delay?: number | null;
}

interface SnackBarState {
  key: number;
  isShow: boolean;
  message: string;
  title: string;
  snackBarType: SnackBarType;
  delay: number | null;
}

export const snackBarInitialState: SnackBarState = {
  key: 0,
  isShow: false,
  message: '',
  title: '',
  snackBarType: 'info',
  delay: null
};

const SHOW_ERROR = "snackBar/showError";
const SHOW_SUCCESS = "snackBar/showSuccess";
const SHOW_INFORMATION = "snackBar/showInformation";
const HIDE = "snackBar/hide";

export const showError = (payload: SnackBarPayload) => ({
  type: SHOW_ERROR,
  payload,
} as const);
export const showSuccess = (payload: SnackBarPayload) => ({
  type: SHOW_SUCCESS,
  payload,
} as const);
export const showInformation = (payload: SnackBarPayload) => ({
  type: SHOW_INFORMATION,
  payload,
} as const);
export const hide = () => ({ type: HIDE } as const);

export type SnackBarAction =
  | ReturnType<typeof showError>
  | ReturnType<typeof showSuccess>
  | ReturnType<typeof showInformation>
  | ReturnType<typeof hide>;

const snackBarReducer = (
  state: SnackBarState = snackBarInitialState,
  action: SnackBarAction | { type: string; payload?: SnackBarPayload },
): SnackBarState => {
  switch (action.type) {
    case SHOW_ERROR:
      return {
        ...state,
        key: state.key + 1,
        isShow: true,
        message: action.payload?.message || "",
        title: action.payload?.title || "Lỗi",
        snackBarType: "error",
        delay: action.payload?.delay || 5000,
      };
    case SHOW_SUCCESS:
      return {
        ...state,
        key: state.key + 1,
        isShow: true,
        message: action.payload?.message || "",
        title: action.payload?.title || "Thành công",
        snackBarType: "success",
        delay: action.payload?.delay || 3000,
      };
    case SHOW_INFORMATION:
      return {
        ...state,
        key: state.key + 1,
        isShow: true,
        message: action.payload?.message || "",
        title: action.payload?.title || "Thông báo",
        snackBarType: "info",
        delay: action.payload?.delay || 4000,
      };
    case HIDE:
      return {
        ...state,
        isShow: false,
      };
    default:
      return state;
  }
};

export default snackBarReducer;