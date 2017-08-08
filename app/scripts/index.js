import Vue from 'vue';
import VueResource from 'vue-resource';
import VueHighlightJS from 'vue-highlightjs';

Vue.use(VueResource);
Vue.use(VueHighlightJS);

import store from './store/store';
import 'glob:directives/*';
import 'glob:components/*';

new Vue({
  el: '#viewer',
  store
});

