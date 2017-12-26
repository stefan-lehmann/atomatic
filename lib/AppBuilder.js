const
  path = require('path'),
  fs = require('fs'),
  glob = require('glob'),
  pug = require('pug'),
  stylus = require('stylus'),
  nib = require('nib'),
  autoprefixer = require('autoprefixer-stylus'),
  browserify = require('browserify'),
  pugify = require('pugify'),
  sgUtil = require('./util');

class AppBuilder {

  constructor(conf, CollectorStore) {

    this.conf = conf;
    this.CollectorStore = CollectorStore;
    this.name = this.conf.get('package.name');
    this.viewerDest = this.conf.get('viewerDest');
    this.source = path.resolve(__dirname, '..', 'app');
    this.sections = [];
    this.promises = [];

    this.generateViewerPages = this.generateViewerPages.bind(this);
    this.generateViewerStyles = this.generateViewerStyles.bind(this);
    this.browserifyViewerScripts = this.browserifyViewerScripts.bind(this);
    this.getViewerPagesLocals = this.getViewerPagesLocals.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.onEndAll = this.onEndAll.bind(this);
  }

  renderCollected() {

    if (!this.watcher) {
      this.CollectorStore.getFiles().forEach((file) => {
        return file.render;
      });
    }
    return this;
  }

  saveCollectedData() {

    if (!this.watcher) {
      const {viewerDest, CollectorStore: {getCollectedData}} = this;
      sgUtil.writeJsonFile(path.join(viewerDest, 'structure.json'), getCollectedData());
    }

    return this;
  }

  getViewerPagesLocals() {
    return {
      description: this.conf.get('package.description', 'No description'),
      version: this.conf.get('version', this.conf.get('package.version') || 'dev')
    };
  }

  onEnd(message) {
    let resolve;
    this.promises.push(new Promise((_resolve, reject) => resolve = _resolve));

    return (error) => {
      if (error) {
        throw error;
      }
      sgUtil.log(`[✓] ${this.name} ${message}`, 'info');
      resolve();
    };
  }

  onEndAll(cb) {
    return Promise.all(this.promises).then(() => cb(), (error) => sgUtil.log(error, 'error'));
  }

  generateViewerPages() {
    const
      {source, viewerDest, getViewerPagesLocals} = this,
      onEnd = this.onEnd('viewer html generated.'),
      templateFile = path.join(source, 'templates', 'viewer', 'index.pug'),
      renderOptions = Object.assign({
          pretty: true,
          cache: false
        },
        getViewerPagesLocals());

    sgUtil.writeFile(path.join(viewerDest, 'index.html'), pug.renderFile(templateFile, renderOptions), onEnd);

    return this;
  }

  generateViewerStyles() {

    const
      {source, viewerDest} = this,
      onEnd = this.onEnd('viewer css generated.'),
      stylusStr = glob.sync(`${source}/style/**/!(_)*.styl`)
        .map((file) => fs.readFileSync(file, 'utf8'))
        .join('\n');

    stylus(stylusStr)
      .set('include css', true)
      .set('prefix', 'dsc-')
      .use(nib())
      .use(autoprefixer({browsers: ['> 5%', 'last 1 versions'], cascade: false}))
      .include(path.join(source, 'style'))
      .import('_reset')
      .import('_mixins')
      .import('_variables')
      .render((err, css) => {
        if (err) {
          onEnd(err);
        }
        else {
          sgUtil.writeFile(path.join(viewerDest, 'css', 'app.css'), css, onEnd);
        }
      });

    return this;
  }

  browserifyViewerScripts() {
    const
      {source, viewerDest} = this,
      destFile = path.join(viewerDest, 'scripts', 'app.js');

    sgUtil.createPath(destFile);

    const bundleFs = fs.createWriteStream(destFile);

    bundleFs.on('finish', this.onEnd('viewer js bundle generated.'));

    browserify({
        entries: [path.join(source, 'scripts', 'index.js')],
        debug: true,
        cache: {},
        packageCache: {},
        fullPaths: true
      })
      .require(path.resolve('.', 'node_modules', 'vue', 'dist', 'vue.min'), {expose: 'vue'})
      .transform(pugify.pug({'pretty': false}))
      .bundle()
      .pipe(bundleFs);

    return this;
  }
}

module.exports = AppBuilder;