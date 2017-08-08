import Vue from 'vue';
import Vuex from 'vuex';
import createPersist from 'vuex-localstorage';
import CircularJSON from 'circular-json';

Vue.use(Vuex);

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const store = new Vuex.Store({
  plugins: [createPersist({
    namespace: "atomatic-3",
    serialize: CircularJSON.stringify,
    deserialize: CircularJSON.parse,
    initialState: {
      url: '',
      collectorClass: '',
      fullscreen: false,
      sections: [],
      menuItemActiveStates: {},
      iframeStates: {},
      urls: {},
      scrollPos : {},
      componentSourceType: {},
      componentSourceCodes: {}
    },
    expires: 7 * 24 * 60 * 60 * 1e3
  })],
  getters,
  mutations,
  actions
});

export default store;