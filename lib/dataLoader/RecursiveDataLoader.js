const
  glob = require('glob'),
  path = require('path'),
  fs = require('fs'),
  sgUtil = require('../util');

class RecursiveDataLoader {

  constructor(conf, includePattern = 'include *([0-9a-z\-_]+)\.?([^ ]*)') {

    this.conf = conf;

    this.baseDir = this.conf.get('baseDir');
    this.dataExt = this.conf.get('dataExt');
    this.defaultDataFileName = this.conf.get('defaultDataFileName');
    this.globOptions = this.conf.get('globOptions');
    this.regEx = new RegExp(includePattern);

    this.getData = this.getData.bind(this);
  }

  get(property) {
    return this[property];
  }

  set(property, value) {
    return this[property] = value;
  }

  parse(data, source) {

    if ('string' === typeof data) {

      const [match, filename = false, dataPath = false] = this.regEx.exec(data.trim(), 'i') || [];

      if (filename) {
        data = this.load(filename, source);

        if (undefined !== data.locals) {
          data = data.locals;

          if (dataPath) {

            try {
              eval(`data = data.${dataPath}`);

              if (undefined === data) {
                sgUtil.log(`Assign data path '${dataPath}' returned 'undefined' while include '${filename}' in ${source}`, 'warn')
              }
            } catch (err) {
              data = undefined;
              sgUtil.log(`${err} while assigning data path '${dataPath}' on include of '${filename}' in ${source}`, 'error');
            }
          }
        }
      }
    }

    if (data instanceof Array) {
      data = data.map((elm, i) => this.parse(data[i], source));
    }

    if (data instanceof Object) {
      for (var attr in data) {
        if (data.hasOwnProperty(attr)) data[attr] = this.parse(data[attr], source);
      }
    }

    return data;
  }

  load(filename, source) {
    return sgUtil.readRelatedData(this.resolve(filename, source));
  }

  resolve(filename, source) {
    filename = filename.trim();
    return this.resolveByPath(filename, source) || this.resolveByExpression(filename) || filename;
  }

  resolveByPath(filename, source) {

    if (filename[0] !== '/' && !source)
      throw new Error('the "filename" option is required to use includes and extends with "relative" paths');

    if (filename[0] === '/' && !this.baseDir)
      throw new Error('the "baseDir" option is required to use includes and extends with "absolute" paths');

    filename = path.join(filename[0] === '/' ? this.baseDir : path.dirname(source.trim()), filename);

    return fs.existsSync(filename) ? filename : undefined;
  }

  resolveByExpression(filename) {

    const
      {baseDir, globOptions, defaultDataFileName, dataExt} = this,
      [section, group, name] = filename.split('-');

    if (undefined === name) return;

    return glob
      .sync(`${baseDir}/${section}/[0-9][0-9]-${group}/**/${name}/@(${name}|${defaultDataFileName}).${dataExt}`,
        globOptions)
      .sort((match) => path.basename(match, `.${dataExt}`) === name)
      .pop();
  }

  getData(filename) {
    const dataFileName = this.getDataFileName(filename);
    return this.parse(sgUtil.readJson5File(dataFileName), dataFileName);
  }

  getDataFileName(filename) {
    const {defaultDataFileName, dataExt} = this;

    let dataFilename = sgUtil.replaceFileExtension(filename, dataExt);

    if (fs.existsSync(dataFilename)) {
      return dataFilename;
    }

    dataFilename = path.join(path.dirname(sgUtil.removeFileExtension(dataFilename)), `${defaultDataFileName}.${dataExt}`);

    if (fs.existsSync(dataFilename)) {
      return dataFilename;
    }
    return null;
  }
}

module.exports = RecursiveDataLoader;