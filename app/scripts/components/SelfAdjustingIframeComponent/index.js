import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class SelfAdjustingIframeComponent extends VueComponent {

  props() {
    return {
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
      template: templateFn({})
    };
  }

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
      let height = document.body.offsetHeight || this.getHeightFromChildNodes(document) || 200;
      if (this.height === height) {
        this.$store.commit('setIframeState', {url: this.url, height});
        window.addEventListener('resize', this.updateHeight);
        return;
      }
      this.setHeight(height);
    }
    setTimeout(this.updateHeight, 100);
    setTimeout(this.updateHeight, 500);
    setTimeout(this.updateHeight, 1000);
    setTimeout(this.updateHeight, 2000);
  }

  setHeight(height = 0) {
    this.height = height;
    this.$refs.iframe.style.height = `${height}px`;
  }

  getHeightFromChildNodes(document) {
    return [...document.body.childNodes]
      .filter((child) => child.offsetHeight)
      .map((child) => child.offsetHeight)
      .sort((a, b) => a > b)
      .shift();
  }
}

SelfAdjustingIframeComponent.register('self-adjusting-iframe', SelfAdjustingIframeComponent);

export default SelfAdjustingIframeComponent;


