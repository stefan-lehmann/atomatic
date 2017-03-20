import Vue from 'vue/dist/vue';
import StructureService from '../services/StructureService';

const actions = {

  fetchSections: ({commit}) => {
    Vue.http.get('./structure.json').then(
      (response) => {
        const structure = new StructureService(response.data);
        commit('setSections', structure.data);
        commit('setUrls', structure.urls);
      },
      (response) => {
        console.log(response);
      });
  },

  setIframeUrl: ({commit, state}, iframeUrl) => {
    console.log('setIframeUrl', state.sections)
    commit('setIframeUrl', iframeUrl);
  }
};

export default actions;