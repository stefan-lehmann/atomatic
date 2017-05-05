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

class SelfAdjustingIframeComponent extends VueComponent {

  onUrlChange() {
    const {[this.url]: {height = 0} = {height: 0}} = this.$store.getters.iframeStates;
    this.setHeight(height);
  }

  mounted() {
    this.onUrlChange();
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

VueComponent.register(SelfAdjustingIframeComponent, props);


