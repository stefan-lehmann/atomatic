import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class ComponentCardComponent extends VueComponent {

  props() {
    return {
      props: {
        file: {
          type: Object,
          required: true,
        },
        modifierClass: {
          type: String,
          required: true,
          default: ''
        },
      },
      watch: {
        '$store.state.url': {
          handler: 'onUrlChange'
        }
      },
      template: templateFn({})
    };
  }

  onUrlChange() {
    this.setSourceType();
  }

  mounted() {
    this.setSourceType();
  }

  setSourceType(sourceType = null) {
    this.$store.commit('setComponentSourceType', {url: this.file.fileUrl, sourceType});

    if (sourceType !== null) {
      this.$store.dispatch('fetchComponentSourceCodes', {file: this.file, sourceType});
    }
  }

  get sourceType() {
    return this.$store.getters.componentSourceType[this.file.fileUrl];
  }

  get language() {
    switch (this.sourceType) {
      case 'source':
        return 'html';
      case 'schema':
      case 'locals':
        return 'json';
      default:
        return '';
    }
  }

  get sourceCode() {
    const sourceCodes = this.$store.getters.componentSourceCodes[this.file.fileUrl];

    if (this.sourceType && sourceCodes) {
      return this.language === 'json' ? JSON.stringify(sourceCodes[this.sourceType], null, 2) : sourceCodes[this.sourceType];
    }
  }
}

ComponentCardComponent.register('component-card', ComponentCardComponent);

export default ComponentCardComponent;
