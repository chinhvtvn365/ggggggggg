import { configureStore } from "@reduxjs/toolkit";
import datatableReducer from "./features/datatable/datatableSlice";
import loadingReducer from "./features/loading/loadingSlice";
import snackBarReducer from "./features/snackbar/snackBarSlice";
import socketReducer from "./features/socket/socketSlice";
export const makeStore = () => {
  return configureStore({
    reducer: {
      datatableReducer,
      loadingReducer,
      snackBarReducer,
      socketReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
