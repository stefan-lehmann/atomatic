const
  gulp = require('gulp'),
  pug = require('gulp-pug'),
  stylus = require('gulp-stylus'),
  nib = require('nib'),
  autoPreFixer = require('gulp-autoprefixer'),
  flatten = require('gulp-flatten'),
  concat = require('gulp-concat'),
  order = require('gulp-order'),
  plumber = require('gulp-plumber'),
  sourceStream = require('vinyl-source-stream'),
  pugify = require('pugify'),
  browserify = require('browserify'),
  watchify = require('watchify'),
  extend = require('extend'),
  path = require('path'),
  sgUtil = require('./util');

class AppBuilder {

  constructor(conf, CollectorStore, watcher) {

    this.conf = conf;
    this.CollectorStore = CollectorStore;
    this.watcher = watcher;
    this.name = this.conf.get('package.name');
    this.viewerDest = this.conf.get('viewerDest');
    this.source = path.resolve(__dirname, '..', 'app');
    this.watches = {};
    this.sections = [];
    this.promises = [];

    this.generateViewerPages = this.generateViewerPages.bind(this);
    this.generateViewerStyles = this.generateViewerStyles.bind(this);
    this.copyViewerAssets = this.copyViewerAssets.bind(this);
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
      const {viewerDest, CollectorStore:{getCollectedData}} = this;
      sgUtil.writeJsonFile(`${viewerDest}/structure.json`, getCollectedData());
    }

    return this;
  }

  getViewerPagesLocals() {
    return {
      description: this.conf.get('package.description', 'No descriuption'),
      version: this.conf.get('version', this.conf.get('package.version'))
    };
  }

  onEnd(done, message, expr) {
    let resolve;
    this.promises.push(new Promise((_resolve, reject) => resolve = _resolve));

    return () => {
      sgUtil.log(`[✓] ${this.name} ${message}`, 'info');
      resolve();
      if (typeof done === 'function') done();
    };
  }

  onEndAll(cb) {
    return Promise.all(this.promises).then(() => cb(), (error) => console.log(error));
  }

  errorHandler(err) {
    sgUtil.log(err.message, 'error');
    this.emit('end');
  }

  generateViewerPages(cb) {
    const {
      source, viewerDest, onEnd, errorHandler,
      watcher, watches, getViewerPagesLocals, generateViewerPages
    } = this;

    gulp.src([`${source}/templates/viewer/index.pug`])
      .pipe(plumber({errorHandler}))
      .pipe(pug({
          pretty: true,
          locals: getViewerPagesLocals(),
          cache: false
        })
      )
      .pipe(flatten())
      .pipe(gulp.dest(`${viewerDest}`))
      .on('end', onEnd(cb, 'viewer pages generated.'));

    if (watcher && !watches.views) {
      this.watches.views = gulp.watch(`${source}/**/*.pug`, generateViewerPages);
    }
    return this;
  }

  generateViewerStyles(cb) {
    const {
      source, viewerDest, onEnd, errorHandler,
      watcher, watches, generateViewerStyles
    } = this;

    gulp.src([`${source}/style/**/*.styl`, `!${source}/style/**/_*.styl`])
      .pipe(plumber({errorHandler}))
      .pipe(order([
        '**/reset.styl',
        '**/*.styl'
      ]))
      .pipe(stylus({
        'include css': true,
        cache: false,
        use: [nib()],
        prefix: 'dsc-',
        import: [`${source}/style/_mixins`, `${source}/style/_variables`]
      }))
      .pipe(concat('app.css'))
      .pipe(autoPreFixer({browsers: ['> 5%', 'last 1 versions'], cascade: false}))
      .pipe(gulp.dest(`${viewerDest}/css`))
      .on('end', onEnd(cb, 'viewer styles generated.', '*.css'));

    if (watcher && !watches.styles) {
      this.watches.styles = gulp.watch(`${source}/style/**/*.styl`, generateViewerStyles);
    }
    return this;
  }

  copyViewerAssets(cb) {
    const {source, viewerDest, onEnd, errorHandler, watcher, watches, copyViewerAssets} = this;

    gulp.src([`${source}/assets/**/*`, `!${source}/assets/**/_*`])
      .pipe(plumber({errorHandler}))
      .pipe(flatten())
      .pipe(gulp.dest(`${viewerDest}/assets`))
      .on('end', onEnd(cb, 'viewer assets copied.'));

    if (watcher && !watches.assets) {
      this.watches.assets = gulp.watch(`${source}/assets/**/*`, copyViewerAssets);
    }
    return this;
  }

  browserifyViewerScripts(cb) {
    const {
      source, viewerDest, onEnd, errorHandler,
      watcher, watches, browserifyViewerScripts
    } = this;

    const
      customOpts = {
        entries: [`${source}/scripts/index.js`],
        debug: true,
        cache: {},
        packageCache: {},
        fullPaths: true
      },
      opts = extend({}, watchify.args, customOpts),
      bundler = watcher && !watches.assets ? watchify(browserify(opts)) : browserify(opts);

    bundler
      .require('./node_modules/vue/dist/vue.min', {expose: 'vue'})
      .transform(pugify.pug({'pretty': false}))
      .bundle()
      .on('error', errorHandler)
      .pipe(plumber({errorHandler}))
      .pipe(sourceStream('app.js'))
      .pipe(gulp.dest(`${viewerDest}/scripts`))
      .on('end', onEnd(cb, 'viewer script bundle generated.', '*.js'));

    if (watcher && !watches.scripts) {
      this.watches.scripts = gulp.watch(`${source}/scripts/**/*.{js,vue,pug}`, browserifyViewerScripts);
    }

    return this;
  }
}

module.exports = AppBuilder;