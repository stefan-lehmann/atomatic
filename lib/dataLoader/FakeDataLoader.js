const
  glob = require('glob'),
  path = require('path'),
  fs = require('fs'),
  jsonSchemaFaker = require('json-schema-faker'),
  extend = require('extend'),
  sgUtil = require('../util');

class FakeDataLoader {

  constructor(conf) {

    this.source = conf.get('source');
    this.baseDir = conf.get('baseDir');
    this.dataExt = conf.get('dataExt');
    this.logLevel = conf.get('logLevel', 0);
    this.defaultDataFileName = conf.get('defaultDataFileName');
    this.globOptions = conf.get('globOptions');
    this.jsonSchemaFaker = this.extendJsonSchemaFaker(conf);
    this.cache = new Map();
    this.getData = this.getData.bind(this);
  }

  resetCache() {
    this.cache = new Map();
  }

  get(property) {
    return this[property];
  }

  set(property, value) {
    return this[property] = value;
  }

  mergeRefs(data) {

    if (data instanceof Object) {

      Object
        .keys(data)
        .map(key => {
          data[key] = this.mergeRefs(data[key]);
        });


      const {_$ref: $ref} = extend(true, {}, data);

      if ($ref) {
        data = this.jsonSchemaFaker.utils.merge(this.getDataFragment($ref._$fragment, $ref), data);
        delete data._$ref;
      }
    }
    else if (Array.isArray(data)) {
      data = data.map((item) => this.mergeRefs(item));
    }

    return data;
  }

  resolveRefs(schema, source, refs = {}) {

    if (schema instanceof Object) {
      if (typeof schema.$ref === 'string') {

        const
          [name, fragment = null] = schema.$ref.split('#/');

        if (refs[name] === undefined) {
          const {schema: subSchema = {}} = this.load(name, source);
          refs[name] = subSchema;
        }
        delete schema.$ref;
        schema._$ref = extend(true, {}, refs[name], {_$fragment: fragment});
      }

      Object
        .keys(schema)
        .sort((keyA, keyB) => keyA > keyB)
        .map(key => {
          schema[key] = this.resolveRefs(schema[key], source, refs);
        });

    }
    return schema;
  }

  getDataFragment(fragment, data) {

    if (!fragment) {
      return data;
    }

    let temp = null;
    fragment
      .split('/')
      .filter((item) => item)
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
    const refs = {};
    try {
      let data;
      data = this.resolveRefs(extend(true, {}, schema), source, refs);
      data = this.jsonSchemaFaker(data, refs);
      data = this.mergeRefs(data);
      return data;
    }
    catch (err) {
      sgUtil.log(`Error: unable to resolve external reference in: '${source}' `, 'error');
      sgUtil.log(err, 'error');
    }
    return {};
  }

  load(filename, source) {
    const
      {resolveByPath, resolveByExpression} = this,
      resolvedPath = resolveByPath.call(this, filename, source) || resolveByExpression.call(this, filename) || filename;

    return sgUtil.readRelatedData(resolvedPath, false);
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
      {filename, cssFiles, warnOnMissingDataFile} = file,
      dataFilename = sgUtil.getRelatedDataPath(filename, warnOnMissingDataFile);

    if (!dataFilename) {
      return {};
    }

    const
      {mtime} = fs.statSync(dataFilename),
      dataFileTime = mtime.getTime(),
      hash = dataFilename+dataFileTime;

    if (!this.cache.has(hash)) {
      const
        data = sgUtil.readJson5File(dataFilename),
        schema = data.schema ? this.transformSchema(data.schema, dataFilename) : {};

      data.app = {cssFiles};
      data.locals = extend(true, {}, schema, data.locals || {});

      this.cache.set(hash, data);

      if (this.logLevel > 2) {
        sgUtil.log(`Fake Data: \u001b[1m.../${dataFilename.split(path.sep).slice(-3).join(path.sep)}\u001b[22m load. (${dataFileTime})`, 'info');
      }
    }
    else if (this.logLevel > 2) {
      sgUtil.log(`Fake Data: \u001b[1m.../${dataFilename.split(path.sep).slice(-3).join(path.sep)}\u001b[22m cached. (${dataFileTime})`, 'info');
    }

    return this.cache.get(hash);
  }

  extendJsonSchemaFaker(conf) {

    const {faker: fakerExtensions = {}, chance: chanceMixins = {}} = conf.get('jsonSchemaFaker', {});

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

module.exports = FakeDataLoader;
