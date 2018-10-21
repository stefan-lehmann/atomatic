const getters = {
  sections: (state) => state.sections,
  filteredStructure: (state) => state.filteredStructure,

  currentSections: (state) => {

    if (state.url !== undefined) {
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
  scrollPos: (state) => state.scrollPos,
  iframeStates: (state) => state.iframeStates,
  search: (state) => state.search
};

export default getters;
