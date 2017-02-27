const
  path = require('path'),
  Vue = require('vue/dist/vue');
  Vue.use(require('vue-resource'));


const data = {
  hash: false,
  canvasFullscreen: localStorage.getItem('canvasFullscreen') || 'yes',
  sections: []
};

const methods = {
  isActiveNav,
  isFullscreenCanvas,
  toggleFullscreenCanvas,
  toggleSection
};

const
  app = new Vue({
    el: '#viewer',
    data: data,
    methods: methods
  });

window.onhashchange = getHash;
document.addEventListener('DOMContentLoaded', getHash);

function getHash() {
  data.hash = window.location.hash.substr(1);
}

function isActiveNav(url) {
  const
    a = path.dirname(data.hash) + '/',
    b = path.dirname(url) + '/';

  return a.indexOf(b) !== -1;
}

function isFullscreenCanvas() {
  return data.canvasFullscreen === 'false' ? false : !!data.canvasFullscreen;
}

function toggleFullscreenCanvas(event) {
  data.canvasFullscreen = !isFullscreenCanvas();
  localStorage.setItem('canvasFullscreen', data.canvasFullscreen);
}

function toggleSection(index) {
  data.sections[index].active = !data.sections[index].active;

  console.log(data.sections[index].active)
}

function getSectionData() {
  app.$http.get('./structure.json').then((response) => {
    data.sections = response.data;
  });
}
getSectionData();

