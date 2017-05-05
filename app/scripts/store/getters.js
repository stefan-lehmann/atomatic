const getters = {
  sections: (state) => state.sections,

  currentSections: (state) => {

    if (state.url !== undefined){
      return state.urls[state.url] || {};
    } else {
      return {};
    }
  },

  fullscreen: (state) => state.fullscreen,

  url: (state) => state.url,

  menuItemActiveStates: (state) => state.menuItemActiveStates,

  componentSourceType: (state) => state.componentSourceType,

  componentSourceCodes: (state) => state.componentSourceCodes,

  iframeStates: (state) => state.iframeStates
};

export default getters;