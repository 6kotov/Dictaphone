import { SET_IS_LOADING } from "./types";

const initialState = {
  loading: false,
  recordPremission: false,
  isPlaybackAllowed: false,
};

export const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_IS_LOADING:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};
