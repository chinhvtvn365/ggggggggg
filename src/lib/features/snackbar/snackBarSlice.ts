import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const initialState: SnackBarState = {
  key: 0,
  isShow: false,
  message: '',
  title: '',
  snackBarType: 'info',
  delay: null
};

const snackBarSlice = createSlice({
  name: 'snackBar',
  initialState,
  reducers: {
    showError: (state, action: PayloadAction<SnackBarPayload>) => {
      state.key++;
      state.isShow = true;
      state.message = action.payload.message;
      state.title = action.payload.title || 'Lỗi';
      state.snackBarType = 'error';
      state.delay = action.payload.delay || 5000;
    },
    showSuccess: (state, action: PayloadAction<SnackBarPayload>) => {
      state.key++;
      state.isShow = true;
      state.message = action.payload.message;
      state.title = action.payload.title || 'Thành công';
      state.snackBarType = 'success';
      state.delay = action.payload.delay || 3000;
    },
    showInformation: (state, action: PayloadAction<SnackBarPayload>) => {
      state.key++;
      state.isShow = true;
      state.message = action.payload.message;
      state.title = action.payload.title || 'Thông báo';
      state.snackBarType = 'info';
      state.delay = action.payload.delay || 4000;
    },
    hide: (state) => {
      state.isShow = false;
    }
  }
});

// Export các action với tên rõ ràng hơn
export const { 
  showError, 
  showSuccess, 
  showInformation, 
  hide 
} = snackBarSlice.actions;

export default snackBarSlice.reducer;