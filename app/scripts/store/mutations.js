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
      currentState = state.menuItemActiveStates[url],
      newState = currentState !== undefined ? !currentState : true;

    Vue.set(state.menuItemActiveStates, [url], newState);

  },

  setIframeState: (state, payload) => {
    const {url = ''} = payload;
    if (url !== '') {
      Vue.set(state.iframeStates, [url], payload);
    }
  },

  setUrl: (state, url) => {
    window.location.hash = url;
    state.url = url;
  }
};

export default mutations;