import Vue from 'vue';
import StructureService from '../services/StructureService';

const actions = {

  fetchSections: ({commit}) => {
    Vue.http.get('./structure.json').then((response) => {
        const structure = new StructureService(response.data);
        commit('setSections', structure.data);
        commit('setUrls', structure.urls);
      },
      (response) => {
        console.log(response);
      });
  },

  fetchComponentSourceCodes: ({commit}, payload) => {
    const {file: {asyncContentUrls, fileUrl: url}, sourceType} = payload;

    if (asyncContentUrls[sourceType]) {
      Vue.http.get(asyncContentUrls[sourceType]).then((response) => {
          const {data} = response;
          commit('setComponentSourceCodes', {url, sourceType, data});
        },
        (response) => {
          console.log(response);
        });
    }
  },

  setUrl: ({commit}, url) => {
    commit('setUrl', url);
  }
};

export default actions;