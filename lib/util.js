const
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  util = require('gulp-util'),
  JSON5 = require('json5'),
  ConfigManager = require('./ConfigManager'),

  capitalizeString = function (str) {
    return str.toLowerCase().replace(/\b\w/g, function (matches) {
      return matches.toUpperCase();
    });
  },

  getFileExtension = function (filePath) {
    var i = filePath.lastIndexOf('.');
    return (i < 0) ? '' : filePath.substr(i + 1);
  },

  removeFileExtension = function (filePath) {
    var i = filePath.lastIndexOf('.');
    return (i < 0) ? '' : filePath.substr(0, i);
  },

  replaceFileExtension = function (filePath, extension) {
    return removeFileExtension(filePath) + '.' + extension;
  },

  readRelatedData = function (_filePath) {

    filePath = replaceFileExtension(_filePath, ConfigManager.get('dataExt'));

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(ConfigManager.get('rootPath'), filePath);
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(path.dirname(removeFileExtension(filePath)), `${ConfigManager.get('defaultDataFileName')}.${ConfigManager.get('dataExt')}`);
    }

    if (!fs.existsSync(filePath)) {
      log(`sgUtil.readRelatedData: '${_filePath}' unable to resolve`, 'warn');
      return {};
    }

    return readJson5File(filePath);
  },

  readFileContents = function (absPath, encoding='utf8') {

    if (!fs.existsSync(absPath)) {
      log(`sgUtil.readFileContents: ${absPath} not found`, 'warn');
      log(new Error().stack,'warn');
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

  writeFile = function (absPath, content) {
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

  writeJsonFile = function (absPath, content = {}) {
    writeFile(absPath, JSON.stringify(content, null, 2));
  },

  readJson5File = function (filePath, debug) {
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(ConfigManager.get('rootPath'), filePath);
    }

    return ConfigManager.util.parseFile(filePath);
    //
    //
    // let
    //   data,
    //   fileContent = readFileContents(filePath);
    //
    // if (!fileContent) {
    //   return {};
    // }
    //
    // try {
    //   data = JSON5.parse(fileContent);
    // }
    // catch (err) {
    //   log(`${filePath}\n${err}`, 'error');
    // }
    //
    // if (true === debug) {
    //   console.log(JSON.stringify(data, null, 2));
    // }
    //
    // if (!data) {
    //   return {};
    // }
    //
    // Object.setPrototypeOf(data, {
    //   get: function (property, defaultValue) {
    //     if (property === null || property === undefined) {
    //       throw new Error("Calling config.get with null or undefined argument");
    //     }
    //     var t = this,
    //       value = getImpl(t, property);
    //
    //     // Produce an exception if the property doesn't exist
    //     if (value === undefined) {
    //       if (defaultValue !== undefined) {
    //         return defaultValue;
    //       }
    //       else {
    //         throw new Error('Configuration property "' + property + '" is not defined');
    //       }
    //     }
    //     // Return the value
    //     return value;
    //   },
    //
    //   has: function (property) {
    //     // While get() throws an exception for undefined input, has() is designed to test validity, so false is appropriate
    //     if (property === null || property === undefined) {
    //       return false;
    //     }
    //     var t = this;
    //     return (getImpl(t, property) !== undefined);
    //   }
    // });
    //
    // return data;
  },
  //
  // getImpl = function getImpl(object, property) {
  //   var
  //     elems = Array.isArray(property) ? property : property.split('.'),
  //     name = elems[0],
  //     value = object[name];
  //   if (elems.length <= 1) {
  //     return value;
  //   }
  //   // Note that typeof null === 'object'
  //   if (value === null || typeof value !== 'object') {
  //     return undefined;
  //   }
  //   return getImpl(value, elems.slice(1));
  // },

  hashCode = function (str) {
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

  log = function (message, type) {
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
  }


  ;

module.exports.capitalizeString = capitalizeString;
module.exports.getFileExtension = getFileExtension;
module.exports.removeFileExtension = removeFileExtension;
module.exports.replaceFileExtension = replaceFileExtension;
module.exports.readFileContents = readFileContents;
module.exports.readRelatedData = readRelatedData;
module.exports.writeFile = writeFile;
module.exports.writeJsonFile = writeJsonFile;
module.exports.readJson5File = readJson5File;
module.exports.hashCode = hashCode;
module.exports.log = log;
