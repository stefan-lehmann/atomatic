import VueComponent from '../../services/VueComponent';

const props = {
  template: require('./template.pug')({})
};

class LayoutCanvas extends VueComponent {

  created() {
    this.useLocationHashAsIframeUrl();
  }

  useLocationHashAsIframeUrl() {
    let {hash = ''} = window.location;
    hash = hash.replace(/#/,'');
    if (hash !== this.$store.getters.iframeUrl) {
      this.$store.commit('setIframeUrl', hash);
    }
  }

  get iframeUrl() {
    return this.$store.getters.iframeUrl;
  }

  get current() {
    return this.$store.getters.currentSections;
  }
}

VueComponent.register(LayoutCanvas, props);


