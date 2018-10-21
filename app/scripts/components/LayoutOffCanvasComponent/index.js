import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class LayoutOffCanvasComponent extends VueComponent {
  props() {
    return {
      props: {
        version: {
          type: String,
          default: 'dev'
        },
        description: {
          type: String,
          required: true
        }
      },
      template: templateFn({})
    };
  }

  toggle() {
    this.$store.commit('toggleFullscreen');
  }

  updateSearch(event) {
    this.$store.dispatch('setSearch', event.target.value)
  }

  clearSearch(event) {
    this.$store.dispatch('setSearch', '')
  }

  get fullscreen() {
    return this.$store.getters.fullscreen;
  }

  get search() {
    return this.$store.getters.search;
  }
}

LayoutOffCanvasComponent.register('layout-off-canvas', LayoutOffCanvasComponent);

export default LayoutOffCanvasComponent;


