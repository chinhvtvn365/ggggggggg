import { useStore } from "zustand";
import { appStore, zustandStore } from "./store";
import type { RootState, AppDispatch, AppStore } from "./store";

export const useAppDispatch = (): AppDispatch =>
	useStore(zustandStore, (state) => state.dispatch);

export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected): TSelected =>
	useStore(zustandStore, (state) => selector(state));

export const useAppStore = (): AppStore => appStore;