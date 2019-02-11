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

  data() {
    return {
      timeouts: []
    };
  }

  mounted() {
    this.onUrlChange();
    window.addEventListener('resize', this.updateHeight, {passive: false});
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.updateHeight);
    this.clearTimeouts();
  }

  getHeightFromChildNodes(document) {
    return [...document.body.childNodes]
      .filter((child) => child.offsetHeight)
      .map((child) => this.getHeightWithMargin(child))
      .sort((a, b) => a > b)
      .shift();
  }

  getHeightWithMargin(element) {
    const {marginBottom, marginTop} = getComputedStyle(element);
    return Number.parseInt(marginTop) + Number.parseInt(marginBottom) + Number.parseInt(element.offsetHeight);
  }

  onUrlChange() {
    const {[this.url]: {height = 0} = {height: 0}} = this.$store.getters.iframeStates;
    this.setHeight(height);
  }

  setHeight(height = 0) {
    this.height = height;
    this.$refs.iframe.style.height = `${height}px`;
  }

  updateHeight() {
    const {iframe: {contentWindow: {document, document: {body} = {}} = {}} = {}} = this.$refs;

    if (body) {
      let height = this.getHeightFromChildNodes(document) || 200;

      if (this.height === height) {
        this.$store.commit('setIframeState', {url: this.url, height});
        return;
      }
      this.setHeight(height);
    }

    this.timeouts = [
      setTimeout(this.updateHeight, 100),
      setTimeout(this.updateHeight, 500),
      setTimeout(this.updateHeight, 1000),
      setTimeout(this.updateHeight, 2000)
    ];
  }

  clearTimeouts() {
    this.timeouts.forEach(clearTimeout);
  }
}

SelfAdjustingIframeComponent.register('self-adjusting-iframe', SelfAdjustingIframeComponent);

export default SelfAdjustingIframeComponent;


