const initialState = {
  playlist: [{ name: "test", uri: "hjervijerv", duration: "00:02" }],
};

export const playlistReducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};
