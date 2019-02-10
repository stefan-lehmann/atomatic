const
  glob = require('glob'),
  path = require('path'),
  fs = require('fs'),
  jsonSchemaFaker = require('json-schema-faker'),
  extend = require('extend'),
  jsonpath = require('jsonpath'),
  sgUtil = require('../util');

const $refs = {};

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
    this.merge = this.merge.bind(this);
    this.$refs = $refs;
  }

  static getCache() {
    return $refs;
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

  get(property) {
    return this[property];
  }

  getData(file) {
    const {filename, cssFiles, warnOnMissingDataFile, timestamp} = file;
    const dataFilename = sgUtil.getRelatedDataPath(filename, warnOnMissingDataFile);

    if (!dataFilename) {
      return {};
    }

    const {mtime} = fs.statSync(dataFilename);
    const dataFileTime = timestamp;
    const hash = dataFilename + dataFileTime;

    if (!this.cache.has(hash)) {
      const data = sgUtil.readJson5File(dataFilename);
      const schema = data.schema ? this.transformSchema(data.schema, dataFilename) : {};

      data.app = {cssFiles};
      data.locals = extend(true, {}, schema, data.locals || {});

      this.cache.set(hash, data);

      if (this.logLevel > 2) {
        sgUtil.log(`Fake Data: \u001b[1m.../${dataFilename.split(path.sep)
          .slice(-3)
          .join(path.sep)}\u001b[22m load. (${dataFileTime})`, 'info');
      }
    }
    else if (this.logLevel > 1) {
      sgUtil.log(`Fake Data: \u001b[1m.../${dataFilename.split(path.sep)
        .slice(-3)
        .join(path.sep)}\u001b[22m cached. (${dataFileTime})`, 'info');
    }

    return this.cache.get(hash);
  }

  load(filename, source) {
    const {resolveByPath, resolveByExpression} = this;
    const resolvedPath = resolveByPath.call(this, filename, source) || resolveByExpression.call(this, filename) || filename;

    return sgUtil.readRelatedData(resolvedPath, false);
  }

  merge(a, b) {
    Object.keys(b)
      .filter(key => key !== '$_ref')
      .forEach((key) => {
        if (typeof b[key] !== 'object' || b[key] === null) {
          a[key] = b[key];
        }
        else if (Array.isArray(b[key])) {
          a[key] = a[key] || []; // fix #292 - skip duplicated values from merge object (b)

          b[key].forEach(function (value) {
            if (a[key].indexOf(value) === -1) {
              a[key].push(value);
            }
          });
        }
        else if (typeof a[key] !== 'object' || a[key] === null || Array.isArray(a[key])) {
          a[key] = this.merge({}, b[key]);
        }
        else {
          a[key] = this.merge(a[key], b[key]);
        }
      });
    return a;
  }

  mergeRefs(data) {
    if (sgUtil.isObject(data)) {
      Object
        .keys(data)
        .map(key => {
          data[key] = this.mergeRefs(data[key]);
        });

      let {$_ref: $ref} = data;

      if ($ref) {
        const fragments = ($ref._$fragment || '').split('/')
          .filter(fragment => fragment);

        if (fragments.length > 0) {
          $ref = jsonpath.query($ref, fragments.join('.'))
            .shift();
        }
        delete data.$_ref;
        data = this.merge($ref, data);
      }
    }
    else if (Array.isArray(data)) {
      data = data.map((item) => this.mergeRefs(item));
    }

    return data;
  }

  resetCache() {
    this.cache = new Map();
  }

  resolveByExpression(filename) {
    const {baseDir, globOptions, defaultDataFileName, dataExt} = this;
    const [section, ...name] = filename.split('-');
    const globPattern = `${baseDir}/**/${section}/**/{${name.join('-')},/${name.join('-')}/${defaultDataFileName}}.${dataExt}`;

    if (undefined === name) return;

    return glob.sync(globPattern, globOptions)
      .sort((match) => path.basename(match, `.${dataExt}`) === name)
      .pop();
  }

  resolveByPath(filename, source) {

    if (filename[0] !== '/' && !source) {
      throw new Error('the "filename" option is required to use includes and extends with "relative" paths');
    }

    if (filename[0] === '/' && !this.baseDir) {
      throw new Error('the "baseDir" option is required to use includes and extends with "absolute" paths');
    }

    filename = path.join(filename[0] === '/' ? this.baseDir : path.dirname(source.trim()), filename);

    return fs.existsSync(filename) ? filename : undefined;
  }

  resolveRefs(schema, source) {
    if (Array.isArray(schema)) {
      schema.forEach((value) => this.resolveRefs(value, source));
    }

    if (sgUtil.isObject(schema)) {
      if (typeof schema.$ref === 'string') {
        const [name, fragment = null] = schema.$ref.split('#/');

        if (this.$refs[name] === undefined) {
          const {schema: subSchema = {}} = this.load(name, source);
          this.$refs[name] = subSchema;
        }

        delete schema.$ref;
        schema.$_ref = extend(true, {}, this.$refs[name], fragment ? {_$fragment: fragment} : {});
      }

      Object
        .keys(schema)
        .sort((keyA, keyB) => keyA > keyB)
        .map(key => {
          schema[key] = this.resolveRefs(schema[key], source);
        });
    }
    return schema;
  }

  set(property, value) {
    return this[property] = value;
  }

  transformSchema(schema, source) {
    try {
      let data;
      data = this.resolveRefs(extend(true, {}, schema), source);
      data = this.jsonSchemaFaker(data, this.$refs);
      data = this.mergeRefs(data);
      return data;
    } catch (err) {
      sgUtil.log(`Error: unable to resolve external reference in: '${source}' `, 'error');
      sgUtil.log(err.stack, 'error');
    }
    return {};
  }
}

module.exports = FakeDataLoader;
