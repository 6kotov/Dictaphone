const initialState = {
  volume: 1.0,
  isMuted: false,
  soundDuration: null,
  soundPosition: null,
  shouldPlay: false,
  shouldPlayAtEndOfSeek: false,
  isLooping: false,
  isPlaying: false,
  isSeeking: false,
};

export const playerReducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};
