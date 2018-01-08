import VueComponent from '../../vue/VueComponent';

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
      template: require('./template.pug')({})
    };
  }

  toggle() {
    this.$store.commit('toggleFullscreen');
  }

  get fullscreen() {
    return this.$store.getters.fullscreen;
  }
}

LayoutOffCanvasComponent.register('layout-off-canvas', LayoutOffCanvasComponent);

export default LayoutOffCanvasComponent;


