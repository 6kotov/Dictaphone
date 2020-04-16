import { combineReducers } from "redux";
import { playlistReducer } from "./playlistReducer";
import { appReducer } from "./appReducer";
import { playerReducer } from "./playerReducer";
import { recorderReducer } from "./recorderReducer";

export const rootReducer = combineReducers({
  // playlist: playlistReducer,
  app: appReducer,
  // player: playerReducer,
  // recorder: recorderReducer,
});
