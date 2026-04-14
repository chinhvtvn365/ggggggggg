interface LoadingState {
  isLoading: boolean;
}

export const loadingInitialState: LoadingState = {
  isLoading: false
};

const OPEN = "loading/open";
const CLOSE = "loading/close";

export const open = () => ({ type: OPEN } as const);
export const close = () => ({ type: CLOSE } as const);

export type LoadingAction = ReturnType<typeof open> | ReturnType<typeof close>;

const loadingReducer = (
  state: LoadingState = loadingInitialState,
  action: LoadingAction | { type: string },
): LoadingState => {
  switch (action.type) {
    case OPEN:
      return { ...state, isLoading: true };
    case CLOSE:
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

export default loadingReducer;