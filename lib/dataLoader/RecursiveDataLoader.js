const
  glob = require('glob'),
  path = require('path'),
  fs = require('fs'),
  extend = require('extend'),
  jsf = require('../helper/jsfWrapper'),
  sgUtil = require('../util');

class RecursiveDataLoader {

  constructor(conf) {

    this.conf = conf;
    this.source = this.conf.get('source');
    this.baseDir = this.conf.get('baseDir');
    this.dataExt = this.conf.get('dataExt');
    this.defaultDataFileName = this.conf.get('defaultDataFileName');
    this.globOptions = this.conf.get('globOptions');
    this.warnOnMissingDataFile = this.conf.get('warnOnMissingDataFile', true);

    this.getData = this.getData.bind(this);
  }

  get(property) {
    return this[property];
  }

  set(property, value) {
    return this[property] = value;
  }

  parse(data, source, refs) {

    if (data instanceof Object) {
      Object.keys(data)
        .map(key => {
          if (key === '$ref') {
            const
              [name] = data[key].split('/'),
              {schema = {}} = this.load(name, source);

            refs[data[key]] = schema;

          }
          else if (data.hasOwnProperty(key) && data[key] instanceof Object) {
            this.parse(data[key], source, refs);
          }
        });
    }
  }

  transformSchema(data, source) {
    if (data['schema'] !== undefined) {
      const
        refs = this.getRefs(data, source),
        schema = jsf(data['schema'], refs);

      data['locals'] = extend(true, {}, schema, data['locals'] || {});
    }
    return data;
  }

  getRefs(data, source) {
    const refs = {};
    this.parse(data, source, refs);
    return refs;
  }

  load(filename, source) {
    const {resolve, warnOnMissingDataFile} = this;
    return sgUtil.readRelatedData(resolve.call(this, filename, source), warnOnMissingDataFile);
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
      [componentType, group, ...name] = filename.split('-'),
      globPattern = `${baseDir}/**/${componentType}/*([0-9][0-9]-)${group}/**/*([0-9][0-9]-)${name.join('-')}/@(${name.join('-')}|${defaultDataFileName}).${dataExt}`;

    if (undefined === name) return;

    return glob.sync(globPattern, globOptions)
      .sort((match) => path.basename(match, `.${dataExt}`) === name)
      .pop();
  }

  getData(file) {
    const
      {filename, cssFiles} = file,
      dataFileName = this.getDataFileName(filename),
      rawData = dataFileName ? sgUtil.readJson5File(dataFileName) : null,
      data = rawData ? this.transformSchema(rawData, dataFileName) : {};

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