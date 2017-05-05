import VueComponent from '../../services/VueComponent';

const props = {
  props: {
    version: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  template: require('./template.pug')({})
};

class LayoutOffCanvasComponent extends VueComponent {


  toggle() {
    this.$store.commit('toggleFullscreen');
  }

  get fullscreen() {
    return this.$store.getters.fullscreen;
  }
}

VueComponent.register(LayoutOffCanvasComponent, props);


