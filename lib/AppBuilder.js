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
  browserify = require('browserify'),
  transform = require('vinyl-transform'),
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

    this.generateViewerPages = this.generateViewerPages.bind(this);
    this.generateViewerStyles = this.generateViewerStyles.bind(this);
    this.copyViewerAssets = this.copyViewerAssets.bind(this);
    this.browserifyViewerScripts = this.browserifyViewerScripts.bind(this);
    this.getViewerPagesLocals = this.getViewerPagesLocals.bind(this);
    this.onEnd = this.onEnd.bind(this);
  }

  renderCollected() {

    this.CollectorStore.getFiles().forEach((file) => {
      return file.render;
    });
  }

  saveCollectedData() {
    const {viewerDest, CollectorStore} = this;
    sgUtil.writeJsonFile(`${viewerDest}/structure.json`, CollectorStore.getCollectedData());
  }

  getViewerPagesLocals() {
    const data = this.conf.get('package');
    return data;
  }

  onEnd(cb, message, expr) {
    return () => {
      if (this.browserSync) this.browserSync.reload(expr);
      if ('function' === typeof cb) cb();
      sgUtil.log(`[✓] ${this.name} ${message}`, 'info');
    };
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
        import: [`${source}/style/_mixins`,`${source}/style/_variables`]
      }))
      .pipe(concat('app.css'))
      .pipe(autoPreFixer({browsers: ['> 5%', 'last 1 versions'], cascade: false}))
      .pipe(gulp.dest(`${viewerDest}/css`))
      .on('end', onEnd(cb, 'viewer styles generated.', '*.css'))
      .on('error', () => cb());

    if (browserSync && !watches.styles) {
      this.watches.styles = gulp.watch(`${source}/style/**/*.styl`, generateViewerStyles);
    }
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
  }

  browserifyViewerScripts(cb) {
    const {
      source, viewerDest, onEnd, errorHandler,
      browserSync, watches, browserifyViewerScripts
    } = this;

    gulp.src([`${source}/scripts/**/*.js`, `!${source}/scripts/**/_*.js`])
      .pipe(plumber({errorHandler}))
      .pipe(transform((fileName) => {
        return browserify({
          entries: [fileName],
          debug: true,
          cache: {}, packageCache: {}, fullPaths: true
        }).bundle();
      }))
      .pipe(gulp.dest(`${viewerDest}/scripts`))
      .on('end', onEnd(cb, 'viewer script bundle generated.', '*.js'));

    if (browserSync && !watches.scripts) {
      this.watches.scripts = gulp.watch(`${source}/scripts/**/*.js`, browserifyViewerScripts);
    }
  }
}

module.exports = AppBuilder;