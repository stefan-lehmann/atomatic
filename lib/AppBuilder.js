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

  constructor(ConfigManager, CollectorStore, browserSync) {
    this.conf = ConfigManager;
    this.CollectorStore = CollectorStore;
    this.name = this.conf.get('package.name');
    this.viewerDest = this.conf.get('viewerDest');
    this.source = path.resolve(__dirname, '..', 'app');
    this.browserSync = browserSync;
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

    if (!this.browserSync) {
      this.CollectorStore.getFiles().forEach((file) => {
        return file.render;
      });
    }

    return this;
  }

  saveCollectedData() {

    if (!this.browserSync) {
      const {viewerDest, CollectorStore:{getCollectedData}} = this;
      sgUtil.writeJsonFile(`${viewerDest}/structure.json`, getCollectedData());
    }

    return this;
  }

  getViewerPagesLocals() {
    return this.conf.get('package');
  }

  onEnd(done, message, expr) {
    let resolve;
    this.promises.push(new Promise((_resolve, reject) => resolve = _resolve));

    return () => {
      if (this.browserSync) this.browserSync.reload(expr);
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
      browserSync, watches, getViewerPagesLocals, generateViewerPages
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

    if (browserSync && !watches.views) {
      this.watches.views = gulp.watch(`${source}/**/*.pug`, generateViewerPages);
    }
    return this;
  }

  generateViewerStyles(cb) {
    const {
      source, viewerDest, onEnd, errorHandler,
      browserSync, watches, generateViewerStyles
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

    if (browserSync && !watches.styles) {
      this.watches.styles = gulp.watch(`${source}/style/**/*.styl`, generateViewerStyles);
    }
    return this;
  }

  copyViewerAssets(cb) {
    const {source, viewerDest, onEnd, errorHandler, browserSync, watches, copyViewerAssets} = this;

    gulp.src([`${source}/assets/**/*`, `!${source}/assets/**/_*`])
      .pipe(plumber({errorHandler}))
      .pipe(flatten())
      .pipe(gulp.dest(`${viewerDest}/assets`))
      .on('end', onEnd(cb, 'viewer assets copied.'));

    if (browserSync && !watches.assets) {
      this.watches.assets = gulp.watch(`${source}/assets/**/*`, copyViewerAssets);
    }
    return this;
  }

  browserifyViewerScripts(cb) {
    const {
      source, viewerDest, onEnd, errorHandler,
      browserSync, watches, browserifyViewerScripts
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
      bundler = browserSync && !watches.assets ? watchify(browserify(opts)) : browserify(opts);

    bundler
      .transform(pugify.pug({'pretty': false}))
      .bundle()
      .on('error', errorHandler)
      .pipe(plumber({errorHandler}))
      .pipe(sourceStream('app.js'))
      .pipe(gulp.dest(`${viewerDest}/scripts`))
      .on('end', onEnd(cb, 'viewer script bundle generated.', '*.js'));

    if (browserSync && !watches.scripts) {
      this.watches.scripts = gulp.watch(`${source}/scripts/**/*.{js,vue,pug}`, browserifyViewerScripts);
    }

    return this;
  }
}

module.exports = AppBuilder;