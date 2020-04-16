import {
  SET_RECORD_PREMISSION,
  SET_VOLUME,
  SET_IS_MUTED,
  SET_SOUND_DURATION,
  SET_SOUND_POSITION,
  SET_SHOULD_PLAY,
  SET_SHOULD_PLAY_AT_END_OF_SEEK,
  SET_IS_LOOPING,
  SET_IS_PLAYING,
  SET_IS_SEEKING,
  SET_RECORD_DURATION,
  SET_IS_RECORDING,
  SET_REC_COLOR,
  SET_IS_PALYBACK_ALLOWED,
  SET_IS_LOADING,
} from "./types";

export function set_record_premission(is_allowed) {
  return {
    type: SET_RECORD_PREMISSION,
    payload: is_allowed,
  };
}

export function volume(volume) {
  return {
    type: SET_VOLUME,
    payload: volume,
  };
}

export function set_is_muted(is_muted) {
  return {
    type: SET_IS_MUTED,
    payload: is_muted,
  };
}

export function set_loading(is_loading) {
  return {
    type: SET_IS_LOADING,
    payload: is_loading,
  };
}

// export function set_record_premission(is_allowed) {
//   return {
//     type:,
//     payload:,
//   };
// }

// export function set_record_premission(is_allowed) {
//   return {
//     type:,
//     payload:,
//   };
// }

// export function set_record_premission(is_allowed) {
//   return {
//     type:,
//     payload:,
//   };
// }

// export function set_record_premission(is_allowed) {
//   return {
//     type:,
//     payload:,
//   };
// }
