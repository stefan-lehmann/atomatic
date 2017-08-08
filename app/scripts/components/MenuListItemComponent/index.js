import VueComponent from '../../services/VueComponent';

const props = {
  props: {
    item: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      required: true,
      default: 0
    }
  },
  template: require('./template.pug')({})
};

class MenuListItemComponent extends VueComponent {

  data(){
    return {}
  }

  toggle() {
    this.$store.commit('toggleMenuItemActiveState', {url: this.item.url});
  }

  setUrl() {
    this.$store.dispatch('setUrl', this.getResolvedUrl());
  }

  isParentItem() {
    if (this.item.urls === undefined) {
      return false;
    }
    if (this.item.urls.length === 0) {
      return false;
    }
    if (this.item.urls.length < 2) {
      const [firstChild] = this.item.urls;
      if (!firstChild.urls || firstChild.urls.length === 0) {
        return false
      }
    }
    return true;
  }

  getResolvedUrl() {
    const
      {item: {urls = [], url: baseUrl}} = this,
      [url] = urls;

    return url && url.url ? url.url : url || baseUrl;
  }

  get activeState() {
    return this.$store.getters.menuItemActiveStates[this.item.url];
  }

  get current() {
    return this.$store.getters.url === this.item.url;
  }
}

VueComponent.register(MenuListItemComponent, props);
