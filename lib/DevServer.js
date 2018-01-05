const
  path = require('path'),
  fs = require('fs'),
  express = require('express'),
  sgUtil = require('./util');

class DevServer {

  constructor({conf, CollectorStore: {getSections, getUrls, getCollectedData}}) {

    this.conf = conf;
    this.getSections = getSections;
    this.getUrls = getUrls;
    this.getCollectedData = getCollectedData;

    this.name = conf.get('package.name');
    this.htmlExt = conf.get('htmlExt');
    this.viewerRootPath = conf.get('app.viewerRootPath');
    this.baseDir = conf.get('dest');

    this.app = express();
    this.enableNoCache();
    this.allowCrossOriginAccess();
    this.handleTrailinglessRequests();
  }

  start(cb) {

    this.bsConfig = this.conf.util.extendDeep({}, {
      server: {baseDir: this.baseDir},
      port: 3000,
      reloadOnRestart: true,
      notify: false,
      https: false,
      open: true,
      startPath: null,
      reloadDelay: 0,
      reloadDebounce: 0,
      injectChanges: true,
      middleware: [this.app],
      logLevel: 'info',
      logPrefix: 'BS',
      logConnections: false,
      logFileChanges: true,
      logSnippet: true,
      snippetOptions: {
        rule: {
          match: /<\/head>/i,
          fn: function (snippet, match) {
            return snippet + match;
          }
        }
      }
    }, this.conf.get('server'));

    this.instanciate().init(this.bsConfig, cb);

    return this;
  }

  instanciate() {
    const browserSync = require(this.getBrowserSyncPath());
    this.browserSync =  browserSync[browserSync.has(this.name) ? 'get' : 'create'](this.name);
    return this.browserSync;
  }

  getBrowserSyncPath() {
    const parentBrowserSyncPath = path.join(process.cwd(), 'node_modules', 'browser-sync');
    return fs.existsSync(parentBrowserSyncPath) ? parentBrowserSyncPath : 'browser-sync';
  }

  addRoutes() {
    const {getSections, getUrls} = this;

    getSections().forEach((section) => {

      this.app.get(section.route, (req, res) => {
        const
          ext = sgUtil.getFileExtension(req.url),
          type = sgUtil.getFileExtension(sgUtil.removeFileExtension(req.url, true)) || ext,
          basePath = type === ext ? sgUtil.removeFileExtension(req.url, true) : sgUtil.removeFileExtension(sgUtil.removeFileExtension(req.url, true), true);

        if (getUrls().has(basePath)) {
          const renderOutput = getUrls().get(basePath).render;
          res.send(renderOutput[type]);
        }
      });
    });

    this.app.get(['/', `/${this.viewerRootPath}`], (req, res) => {
      res.writeHead(301, {
        Location: `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}/${this.viewerRootPath}/index.html`
      });
      res.end();
    });

    this.app.get(`/${this.viewerRootPath}/structure.json`, (req, res) => {
      res.json(this.getCollectedData());
      res.end();
    });
  }

  enableNoCache() {
    this.app.use((req, res, next) => {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Expires', '-1');
      res.setHeader('Pragma', 'no-cache');
      next();
    });
  }

  allowCrossOriginAccess() {
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      next();
    });
  }

  handleTrailinglessRequests() {
    this.app.use((req, res, next) => {
      const {pathname, path} = req._parsedUrl;

      if (pathname.substr(-1) !== '/' && pathname.length > 1 && pathname.match(/\/[^.\/]+$/)) {
        const newPath = path.replace(new RegExp(pathname), `${pathname}/`);
        res.writeHead(301, {
          Location: `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}${newPath}`
        });
        res.end();
      }
      else {
        next();
      }
    });
  }

  rewriteUrls(url) {
    const {urlRewriteRules = {}} = this.bsConfig;
    urlRewriteRules[`/([^/]+)/$`] = `/$1/$1.${this.htmlExt}`;

    Object.keys(urlRewriteRules).map((key) => {
      url = url.replace(new RegExp(key, 'i'), urlRewriteRules[key]);
    });
    return url;
  }
}

module.exports = DevServer;