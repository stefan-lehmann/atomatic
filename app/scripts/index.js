import Vue from 'vue';
import VueResource from 'vue-resource';
import VueHighlightJS from 'vue-highlightjs';

Vue.use(VueResource);
Vue.use(VueHighlightJS);

import store from './store/store';
import * as directives from './directives/**/*.js';
import * as components from './components/**/*.js';

new Vue({
  el: '#viewer',
  store
});

