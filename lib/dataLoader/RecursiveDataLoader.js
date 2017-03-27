const
  glob = require('glob'),
  path = require('path'),
  fs = require('fs'),
  extend = require('extend'),
  jsf = require('../helper/jsfWrapper'),
  sgUtil = require('../util');

class RecursiveDataLoader {

  constructor(conf, includePattern = 'include *([0-9a-z\-_]+)\.?([^ ]*)') {

    this.conf = conf;

    this.source = this.conf.get('source');
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

      const [, filename = false, dataPath = false] = this.regEx.exec(data.trim(), 'ig') || [];

      if (filename) {
        data = this.load(filename, source);

        this.transformSchema(data);

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
      for (const attr in data) {
        if (data.hasOwnProperty(attr)) data[attr] = this.parse(data[attr], source);
      }
    }

    this.transformSchema(data);

    return data;
  }

  transformSchema(data) {
    if (data['schema'] !== undefined) {
      const schema = jsf(data['schema']);
      data['locals'] = extend(true, {}, schema, data['locals'] || {});
    }
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
      [componentType, group, name] = filename.split('-'),
      globPattern = `${baseDir}/**/${componentType}/[0-9][0-9]-${group}/**/[0-9][0-9]-${name}/@(${name}|${defaultDataFileName}).${dataExt}`;

    if (undefined === name) return;

    return glob.sync(globPattern, globOptions)
      .sort((match) => path.basename(match, `.${dataExt}`) === name)
      .pop();
  }

  getData(file) {
    const
      {filename, cssFiles} = file,
      dataFileName = this.getDataFileName(filename);

    let data = {};

    if (dataFileName !== null) {
      data = this.parse(sgUtil.readJson5File(dataFileName), dataFileName);
    }

    data.app = {cssFiles};
    return data;
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