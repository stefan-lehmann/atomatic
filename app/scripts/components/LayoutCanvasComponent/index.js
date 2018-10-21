import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class LayoutCanvasComponent extends VueComponent {
  props() {
    return {
      template: templateFn({})
    };
  }

  beforeCreate() {
    if (window.___browserSync___) {
      ___browserSync___.socket.on('atomatic:reload', (affectedUrls) => {
        this.$store.commit('reloadUrls', affectedUrls);
      });
    }
  }

  mounted() {
    this.useLocationHashAsUrl();
  }

  useLocationHashAsUrl() {
    let {hash = ''} = window.location;
    hash = hash.replace(/#/, '');
    if (hash !== this.$store.getters.url) {
      this.$store.commit('setUrl', hash);
    }
  }

  get pageTitle() {
    const {pageTitle} = this.$store.getters.currentSections;
    return pageTitle;
  }

  get files() {
    const
      file = this.$store.getters.currentSections,
      {grouped: files} = file;

    return files || [file];
  }

  get modifierClass() {
    const {collector = ''} = this.$store.getters.currentSections;
    return collector;
  }
}

LayoutCanvasComponent.register('layout-canvas', LayoutCanvasComponent);

export default LayoutCanvasComponent;


