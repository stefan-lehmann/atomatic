import Vue from 'vue/dist/vue';

const mutations = {

  setSections: (state, sections) => state.sections = sections,
  setUrls: (state, urls) => state.urls = urls,

  toggleFullscreen: (state) => {
    state.fullscreen = !state.fullscreen;
  },

  toggleMenuItemActiveState: (state, payload) => {
    const
      {url} = payload,
      currentState = state.menuItemActiveState[url],
      newState = currentState !== undefined ? !currentState : true;

    Vue.set(state.menuItemActiveState, [url], newState);
  },

  setIframeUrl: (state, iframeUrl) => {
    window.location.hash = iframeUrl;
    state.iframeUrl = iframeUrl;
  }
};

export default mutations;