import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketData {
  type?: string;
  data?: string; // Thường là chuỗi JSON từ server
  [key: string]: any;
}

interface SocketState {
  data: SocketData;
}

const initialState: SocketState = {
  data: {}
}

const socketSlice = createSlice({
  name: 'socketio',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<SocketData>) => {
      state.data = action.payload;
    },
    resetData: (state) => {
      state.data = {};
    },
  }
});

export const { setData, resetData } = socketSlice.actions;
export default socketSlice.reducer;