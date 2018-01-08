import VueDirective from '../../vue/VueDirective';

class BrowsersyncReloadDirective extends VueDirective {

  bind(el) {

    this.$store.watch((state) => state.reloadUrls, (newValue) => {
      if (el.contentWindow && el.contentWindow.location &&
          el.contentWindow.location.pathname && newValue.indexOf(el.contentWindow.location.pathname) !== -1) {
        console.warn('%cAtomatic reloading:', 'font-weight:bold', el.contentDocument.title, '\n' + el.contentWindow.location.pathname);
        el.contentWindow.location.reload();
      }
    });
  }

}

BrowsersyncReloadDirective.register('browsersync-reload', BrowsersyncReloadDirective);

export default BrowsersyncReloadDirective;
