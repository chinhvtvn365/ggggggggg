import { createSlice } from '@reduxjs/toolkit';

interface LoadingState {
  isLoading: boolean;
}

const initialState: LoadingState = {
  isLoading: false
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    open: (state) => {
      state.isLoading = true;
    },
    close: (state) => {
      state.isLoading = false;
    }
  }
});

export const { open, close } = loadingSlice.actions;
export default loadingSlice.reducer;