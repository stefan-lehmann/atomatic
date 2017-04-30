import VueComponent from '../../services/VueComponent';

const props = {
  template: require('./template.pug')({})
};

class LayoutCanvas extends VueComponent {


  mounted() {
    this.useLocationHashAsUrl();
  }

  useLocationHashAsUrl() {
    let {hash = ''} = window.location;
    hash = hash.replace(/#/,'');
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
    const {generator = ''} = this.$store.getters.currentSections;
    return generator;
  }
}

VueComponent.register(LayoutCanvas, props);


