export interface SocketData {
  type?: string;
  data?: string; // Thường là chuỗi JSON từ server
  [key: string]: any;
}

export interface SocketState {
  data: SocketData;
}

export const socketInitialState: SocketState = {
  data: {}
};

const SET_DATA = "socketio/setData";
const RESET_DATA = "socketio/resetData";

export const setData = (payload: SocketData) => ({
  type: SET_DATA,
  payload,
} as const);
export const resetData = () => ({ type: RESET_DATA } as const);

export type SocketAction = ReturnType<typeof setData> | ReturnType<typeof resetData>;

const socketReducer = (
  state: SocketState = socketInitialState,
  action: SocketAction | { type: string; payload?: SocketData },
): SocketState => {
  switch (action.type) {
    case SET_DATA:
      return { ...state, data: action.payload || {} };
    case RESET_DATA:
      return { ...state, data: {} };
    default:
      return state;
  }
};

export default socketReducer;