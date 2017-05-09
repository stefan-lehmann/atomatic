const
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  util = require('gulp-util'),
  marked = require('marked'),
  ConfigManager = require('./ConfigManager'),

  capitalizeString = (str) => {
    return str.toLowerCase().replace(/\b\w/g, (matches) => matches.toUpperCase());
  },

  getTitleFromName = (str) => {
    return capitalizeString(str).replace(/\d{2,}-|\-|_/g, ' ').trim();
  },

  getTitleFromFilename = (filePath) => {
    return getTitleFromName(path.basename(filePath, path.extname(filePath)));
  },

  getTitleFromFoldername = (filePath) => {
    return getTitleFromName(path.basename(path.dirname(filePath)));
  },

  getFileExtension = (filePath) => {
    return path.extname(filePath).substr(1);
  },

  removeFileExtension = (filePath) => {
    const i = filePath.lastIndexOf('.');
    return (i < 0) ? filePath : filePath.substr(0, i);
  },

  replaceFileExtension = (filePath, extension) => {
    const basePath = removeFileExtension(filePath);
    return basePath === filePath ? filePath : `${basePath}.${extension}`;
  },

  readRelatedData = (_filePath, warn = true) => {

    filePath = replaceFileExtension(_filePath, ConfigManager.get('dataExt'));

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(ConfigManager.get('rootPath'), filePath);
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(path.dirname(removeFileExtension(filePath)), `${ConfigManager.get('defaultDataFileName')}.${ConfigManager.get('dataExt')}`);
    }

    if (!fs.existsSync(filePath)) {
      if (warn) {
        log(`Notice: unable to load resolved data file '${path.relative(path.resolve('./'),filePath)}' `, 'warn');
        log(`(origin '${path.relative(path.resolve('./'),_filePath)}')`, 'warn');
        log(``);
      }
      return {};
    }

    return readJson5File(filePath);
  },

  readRelatedMarkdown = (_filePath, isRequired = false) => {

    filePath = replaceFileExtension(_filePath, ConfigManager.get('markdownExt'));

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(ConfigManager.get('rootPath'), filePath);
    }

    if (!fs.existsSync(filePath)) {
      if (isRequired) {
        log(`sgUtil.readRelatedMarkdown: resolved '${_filePath}' to '${filePath}' but unable to load`, 'warn');
      }
      return '';
    }

    return readMarkdownFile(filePath);
  },

  readFileContents = (absPath, encoding = 'utf8') => {

    if (!fs.existsSync(absPath)) {
      log(`sgUtil.readFileContents: ${absPath} not found`, 'warn');
      log(new Error().stack, 'warn');
      return '';
    }

    if (!fs.lstatSync(absPath).isFile()) {
      log(`sgUtil.readFileContents: ${absPath} is no file`, 'warn');
      return '';
    }

    return fs.readFileSync(absPath, encoding);
  },

  flatten = (data) => {
    if (typeof data !== 'object') return data;
    return Array.from(data.values()).map((item) => flatten(item)).join('\n');
  },

  writeFile = (absPath, content) => {
    let contentString;

    if (!content.hasOwnProperty('values') && typeof content.values === 'function') {
      contentString = flatten(content);
    }
    else {
      contentString = content.toString();
    }
    mkdirp(path.dirname(absPath), (err) => {
      if (err) throw err;
      fs.writeFileSync(absPath, contentString);
    });
  },

  writeJsonFile = (absPath, content = {}) => {
    writeFile(absPath, JSON.stringify(content, null, 2));
  },

  readJson5File = (filePath) => {

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(ConfigManager.get('rootPath'), filePath);
    }

    return ConfigManager.util.parseFile(filePath);
  },

  readMarkdownFile = (filePath) => {
    return marked(readFileContents(filePath));
  },

  filterFilenameSibling = (filename, otherFilenames) => {
    const dirname = path.dirname(filename);

    return otherFilenames.filter((filename) => path.dirname(filename) === dirname);
  },

  hashCode = (str) => {
    let
      hash = 0, i, chr, len;

    if (typeof str !== 'string') {
      str = JSON.stringify(str);
    }

    if (str.length === 0) return hash;

    for (i = 0, len = str.length; i < len; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },

  log = (message, type) => {
    switch (type) {
      case 'info':
        util.log(util.colors.green(message));
        break;

      case 'warn':
        util.log(util.colors.yellow(message));
        break;

      case 'error':
        util.log(util.colors.red(message));
        break;

      default:
        util.log(util.colors.white(message));
    }
  },

  dumpData = (filename, data) => {
    if (ConfigManager.get('dumpData', false) === true) {
      writeJsonFile(`.tmp/${this.constructor.name}-${this.hash}.json`, data);
    }
  }
  ;

module.exports.capitalizeString = capitalizeString;
module.exports.getTitleFromName = getTitleFromName;
module.exports.getTitleFromFilename = getTitleFromFilename;
module.exports.getTitleFromFoldername = getTitleFromFoldername;
module.exports.getFileExtension = getFileExtension;
module.exports.removeFileExtension = removeFileExtension;
module.exports.replaceFileExtension = replaceFileExtension;
module.exports.readFileContents = readFileContents;
module.exports.readRelatedData = readRelatedData;
module.exports.readMarkdownFile = readMarkdownFile;
module.exports.readRelatedMarkdown = readRelatedMarkdown;
module.exports.writeFile = writeFile;
module.exports.writeJsonFile = writeJsonFile;
module.exports.readJson5File = readJson5File;
module.exports.filterFilenameSibling = filterFilenameSibling;
module.exports.hashCode = hashCode;
module.exports.log = log;
module.exports.dumpData = dumpData;
