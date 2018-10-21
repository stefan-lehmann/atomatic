const
  path = require('path'),
  fs = require('fs'),
  glob = require('glob'),
  pug = require('pug'),
  stylus = require('stylus'),
  nib = require('nib'),
  autoprefixer = require('autoprefixer-stylus'),
  {rollup} = require('rollup'),
  rollupPluginPug = require('rollup-plugin-pug'),
  rollupPluginResolve = require('rollup-plugin-node-resolve'),
  rollupPluginReplace = require('rollup-plugin-replace'),
  rollupPluginCommonjs = require('rollup-plugin-commonjs'),
  rollupPluginGlobImport = require('rollup-plugin-glob-import'),
  rollupPluginAlias = require('rollup-plugin-alias'),
  rollupPluginBabel = require('rollup-plugin-babel'),
  sgUtil = require('./util');

class AppBuilder {

  constructor(conf, CollectorStore) {

    this.conf = conf;
    this.CollectorStore = CollectorStore;
    this.name = this.conf.get('package.name');
    this.viewerDest = this.conf.get('viewerDest');
    this.source = path.resolve(__dirname, '..', 'app');
    this.sections = [];

    this.generateViewerPages = this.generateViewerPages.bind(this);
    this.generateViewerStyles = this.generateViewerStyles.bind(this);
    this.rollupViewerScripts = this.rollupViewerScripts.bind(this);
    this.getViewerPagesLocals = this.getViewerPagesLocals.bind(this);
    this.onEnd = this.onEnd.bind(this);
  }

  renderCollected() {
    if (!this.watcher) {
      this.CollectorStore.getFiles()
        .forEach(async (file) => {
          if (!file.exclude) {
            await file.render;
          }
        });
    }

    return this;
  }

  saveCollectedData() {
    if (!this.watcher) {
      const {viewerDest, CollectorStore: {getCollectedData}} = this;
      sgUtil.writeJsonFile(path.join(viewerDest, 'structure.json'), getCollectedData());
    }
  }

  getViewerPagesLocals() {
    return {
      description: this.conf.get('package.description', 'No description'),
      version: this.conf.get('version', this.conf.get('package.version') || 'dev')
    };
  }

  onEnd(message) {
    return (error) => {
      if (error) {
        throw error;
      }
      sgUtil.log(`[✓] ${this.name} ${message}`, 'info');
    };
  }

  async generateViewerPages() {
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
  }

  async generateViewerStyles() {

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
      .use(autoprefixer({
        browsers: ['> 5%', 'last 1 versions'],
        cascade: false
      }))
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
  }

  async rollupViewerScripts() {
    const
      {source, viewerDest} = this,
      destFile = path.join(viewerDest, 'scripts', 'app.js');

    sgUtil.createPath(destFile);

    try {
      const bundle = await rollup({
        input: path.join(source, 'scripts', 'index.js'),
        plugins: [
          rollupPluginGlobImport({
            rename(name, id) {
              if (path.basename(id) !== 'index.js') {
                return null;
              }
              return path.basename(path.dirname(id));
            }
          }),
          rollupPluginAlias({
            vue: 'node_modules/vue/dist/vue.esm.js'
          }),
          rollupPluginResolve({
            jsnext: true,
            main: true,
            module: true
          }),
          rollupPluginPug(),
          rollupPluginReplace({
            'process.env.NODE_ENV': JSON.stringify('development')
          }),
          rollupPluginCommonjs(),
          rollupPluginBabel()
        ]
      });

      await bundle.write({
        file: destFile,
        format: 'iife',
        sourcemap: false
      });
    }
    catch (error) {
      throw error;
    }

    this.onEnd('viewer js bundle generated.');
  }
}

module.exports = AppBuilder;
