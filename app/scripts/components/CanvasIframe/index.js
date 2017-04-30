import VueComponent from '../../services/VueComponent';

const props = {
  props: {
    url: {
      type: String
    },
    modifierClass: {
      type: String,
      required: true,
      default: ''
    }
  },
  watch: {
    url: {
      handler: 'onUrlChange'
    }
  },
  template: require('./template.pug')({})
};

class CanvasIframe extends VueComponent {

  data() {
    return {height: 0};
  }

  onUrlChange() {
    this.setHeight(this.$store.getters.iframeStates[this.url].height);
  }

  mounted() {
    this.setHeight(this.$store.getters.iframeStates[this.url].height);
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.updateHeight);
  }

  updateHeight() {
    const {document} = this.$refs.iframe.contentWindow;

    if (document && document.body) {
      let height = document.body.offsetHeight;
      if (this.height === height) {
        this.$store.commit('setIframeState', {url: this.url, height});
        window.addEventListener('resize', this.updateHeight);
        return;
      }
      this.setHeight(height);
    }
    setTimeout(this.updateHeight, 100);
  }

  setHeight(height = 0) {
    this.height = height;
    this.$refs.iframe.style.height = `${height}px`;
  }

}

VueComponent.register(CanvasIframe, props);


