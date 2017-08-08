import Vue from 'vue';

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

  setComponentSourceType: (state, payload) => {
    const
      {url, sourceType = null} = payload,
      currentSourceType = state.componentSourceType[url],
      newSourceType = currentSourceType !== sourceType ? sourceType : null;

    Vue.set(state.componentSourceType, [url], newSourceType);
  },

  scrollPos: (state, payload) => {
    const
      {id, scrollTop} = payload;

    Vue.set(state.scrollPos, id, scrollTop);
  },

  setComponentSourceCodes: (state, payload) => {
    const
      {url, sourceType = null, data=''} = payload;

    if (!state.componentSourceCodes[url]) {
      Vue.set(state.componentSourceCodes, [url], {});
    }

    Vue.set(state.componentSourceCodes[url], sourceType, data);
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