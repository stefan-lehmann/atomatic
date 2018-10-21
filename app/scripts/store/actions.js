import Vue from 'vue';
import StructureService from '../services/StructureService';

const actions = {

  fetchSections: ({commit}) => {
    Vue.http.get('./structure.json')
      .then((response) => {
          const {sections, urls} = new StructureService(response.data);
          commit('setSections', sections);
          commit('setUrls', urls);
        },
        console.log);
  },

  fetchComponentSourceCodes: ({commit}, payload) => {
    const {file: {asyncContentUrls, fileUrl: url}, sourceType} = payload;

    if (asyncContentUrls[sourceType]) {
      Vue.http.get(asyncContentUrls[sourceType])
        .then((response) => {
            const {data} = response;
            commit('setComponentSourceCodes', {
              url,
              sourceType,
              data
            });
          },
          console.log);
    }
  },

  setUrl: ({commit}, url) => {
    commit('setUrl', url);
  },

  setSearch: ({commit, dispatch}, search) => {
    commit('setSearch', search);
    dispatch('filterItems');
  },

  filterItems: ({commit, getters}) => {
    commit('setFilteredStructure', StructureService.filteredStructure(getters.sections, getters.search));
  }
};

export default actions;
