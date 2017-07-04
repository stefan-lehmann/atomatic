const
  glob = require('glob'),
  path = require('path'),
  fs = require('fs'),
  jsonSchemaFaker = require('json-schema-faker'),
  extend = require('extend'),
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
    this.jsonSchemaFaker = this.extendJsonSchemaFaker();

    this.getData = this.getData.bind(this);
  }

  get(property) {
    return this[property];
  }

  set(property, value) {
    return this[property] = value;
  }

  resolveSchema(schema, source, refs = {}) {

    if (schema instanceof Object) {

      Object
        .keys(schema)
        .sort((a, b) => a === '$ref' ? 1 : a < b ? 1 : -1 )
        .map(key => {
          if (key === '$ref') {
            const
              [name, fragmentPath = null] = schema[key].split('#/');

            if (refs[name] === undefined) {
              const {schema: subSchema = {}} = this.load(name, source);
              refs[name] = subSchema;
            }
            const subSchema = refs[name];
            let resolvedSubSchema = this.resolveSchema(subSchema, source, refs);

            delete schema.$ref;

            if (fragmentPath !== null) {
              resolvedSubSchema = this.getSubSchemaFragment(fragmentPath, resolvedSubSchema);

            }

            if (Array.isArray(resolvedSubSchema) === Array.isArray(schema) &&
                typeof resolvedSubSchema === typeof schema ) {
              schema = this.jsonSchemaFaker.utils.merge(resolvedSubSchema, schema);
            }
            else {
              schema = resolvedSubSchema;
            }
          }
          else if (schema.hasOwnProperty(key) && schema[key] instanceof Object) {
            schema[key] = this.resolveSchema(schema[key], source, refs);
          }
        });
    }

    return schema;
  }

  getSubSchemaFragment(fragmentPath, resolvedSubSchema) {

    const data = this.jsonSchemaFaker(extend(true, {}, resolvedSubSchema));

    let temp = null;

    fragmentPath
      .split('/')
      .filter((fragment) => fragment)
      .some((key, index) => {
        if (index === 0) {
          if (data[key] === undefined) {
            return true;
          }
          temp = data[key]
          return false;
        }

        if (temp[key] === undefined) {
          return true;
        }

        temp = temp[key];
    });

    return temp;
  }

  transformSchema(schema, source) {

    try {
      return this.jsonSchemaFaker(this.resolveSchema(extend(true, {}, schema), source));
    }
    catch (err) {
      sgUtil.log(`Error: unable to resolve external reference in: '${source}' `, 'error');
      sgUtil.log(err, 'error');
    }
    return {};
  }

  load(filename, source) {
    const
      {resolveByPath, resolveByExpression, warnOnMissingDataFile} = this,
      resolvedPath = resolveByPath.call(this, filename, source) || resolveByExpression.call(this, filename) || filename;

    return sgUtil.readRelatedData(resolvedPath, warnOnMissingDataFile);
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
      [section, ...name] = filename.split('-'),
      globPattern = `${baseDir}/**/${section}/**/{${name.join('-')},/${name.join('-')}/${defaultDataFileName}}.${dataExt}`;

    if (undefined === name) return;

    return glob.sync(globPattern, globOptions)
      .sort((match) => path.basename(match, `.${dataExt}`) === name)
      .pop();
  }

  getData(file) {
    const
      {filename, cssFiles} = file,
      dataFileName = this.getDataFileName(filename),
      data = dataFileName ? sgUtil.readJson5File(dataFileName) : {},
      schema = data.schema ? this.transformSchema(data.schema, dataFileName) : {};

    data.app = {cssFiles};
    data.locals = extend(true, {}, schema, data.locals || {});

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

  extendJsonSchemaFaker() {

    const {faker: fakerExtensions = {}, chance : chanceMixins = {}} = this.conf.get('jsonSchemaFaker', {});

    jsonSchemaFaker.extend('faker', () => {
      const faker = require('faker');
      return Object.assign(faker, fakerExtensions);
    });

    jsonSchemaFaker.extend('chance', () => {
      const Chance = require('chance');
      const chance = new Chance();

      chance.mixin(chanceMixins);

      return chance;
    });

    return jsonSchemaFaker;
  }
}

module.exports = RecursiveDataLoader;