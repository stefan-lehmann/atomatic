import Vue from 'vue/dist/vue';
import Vuex from 'vuex';
import createPersist from 'vuex-localstorage';

Vue.use(Vuex);

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const store = new Vuex.Store({
  plugins: [createPersist({
    namespace: 'namespace-for-state',
    initialState: {
      iframeUrl: '',
      generatorClass: '',
      fullscreen: false,
      sections: [],
      menuItemActiveState: {}
    },
    expires: 7 * 24 * 60 * 60 * 1e3
  })],
  getters,
  mutations,
  actions
});


export default store;