import { createStore } from "zustand/vanilla";
import datatableReducer from "./features/datatable/datatableSlice";
import loadingReducer from "./features/loading/loadingSlice";
import snackBarReducer from "./features/snackbar/snackBarSlice";
import socketReducer from "./features/socket/socketSlice";
import type { DatatableAction, DatatableState } from "./features/datatable/datatableSlice";
import type { LoadingAction } from "./features/loading/loadingSlice";
import type { SnackBarAction } from "./features/snackbar/snackBarSlice";
import type { SocketAction, SocketState } from "./features/socket/socketSlice";

export interface LoadingState {
  isLoading: boolean;
}

export interface SnackBarState {
  key: number;
  isShow: boolean;
  message: string;
  title: string;
  snackBarType: "error" | "success" | "info" | "warning";
  delay: number;
}

export interface RootState {
  datatableReducer: DatatableState;
  loadingReducer: LoadingState;
  snackBarReducer: SnackBarState;
  socketReducer: SocketState;
}

export type AppAction = DatatableAction | LoadingAction | SnackBarAction | SocketAction;
type StoreState = RootState & { dispatch: AppDispatch };

export interface AppStore {
  getState: () => StoreState;
  dispatch: AppDispatch;
  subscribe: (listener: () => void) => () => void;
}

export type AppDispatch = (action: AppAction | { type: string; payload?: any }) => void;

const createRootState = (): RootState => ({
  datatableReducer: datatableReducer(undefined, { type: "@@INIT" }),
  loadingReducer: loadingReducer(undefined, { type: "@@INIT" }),
  snackBarReducer: snackBarReducer(undefined, { type: "@@INIT" }),
  socketReducer: socketReducer(undefined, { type: "@@INIT" }),
});

export const zustandStore = createStore<StoreState>((set, get) => {
  const dispatch: AppDispatch = (action) => {
    const prev = get();
    set({
      datatableReducer: datatableReducer(prev.datatableReducer, action),
      loadingReducer: loadingReducer(prev.loadingReducer, action),
      snackBarReducer: snackBarReducer(prev.snackBarReducer, action),
      socketReducer: socketReducer(prev.socketReducer, action),
      dispatch: prev.dispatch,
    });
  };

  return {
    ...createRootState(),
    dispatch,
  };
});

export const appStore: AppStore = {
  getState: zustandStore.getState,
  dispatch: (action) => zustandStore.getState().dispatch(action),
  subscribe: zustandStore.subscribe,
};

export const makeStore = () => appStore;
