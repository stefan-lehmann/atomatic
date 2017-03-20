import Vue from 'vue/dist/vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

import store from './store/store';
import 'glob:components/*';

new Vue({
  el: '#viewer',
  store
});

