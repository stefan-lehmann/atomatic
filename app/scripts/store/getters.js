const getters = {
  sections: (state) => state.sections,

  currentSections: (state) => state.urls[state.iframeUrl],

  fullscreen: (state) => state.fullscreen,

  iframeUrl: (state) => state.iframeUrl,

  menuItemActiveState: (state) => state.menuItemActiveState
};

export default getters;