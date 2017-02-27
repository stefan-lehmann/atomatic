const
  extend = require('extend'),
  sgUtil = require('../util'),
  Collector = require('./Collector');

class PatternCollector extends Collector {

  constructor(...args) {
    super(...args);
    this.generator = 'patterns';
  }

  static renderHook(body, locals) {

    const
      replaceObjects = [],
      regex = /(\{\{ ?([^\} ]+) ?\}\})/g;

    let matches, data = [{html: body}];

    while ((matches = regex.exec(body)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (matches.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      let
        [, search, versionKey] = matches,
        [blockElement] = versionKey.split('.'),
        versions = locals.versions[blockElement];

      replaceObjects.push({blockElement, search, versions});
    }

    replaceObjects.map((replaceObject) => {
      const
        {search, versions} = replaceObject,
        newData = [];

      data.map((generated) => {

        versions.map((version) => {
          const
            {modifier, modifierClass} = version,
            html = generated.html.replace(search, modifierClass),
            path = generated.path === undefined ? [modifierClass] : generated.path.concat([modifierClass]);
          newData.push(extend({}, version, {html, path}));
        });
      });

      data = newData;
    });
    sgUtil.writeJsonFile(`.tmp/data.json`, data);

    const xxx = {};

    data.map((item, index) => {
      let current = xxx;
      item.path.map((level) => {
        if (current[level] === undefined) {
          current[level] = {};
        }
        current = current[level];
      });

      if (current.items === undefined) {
        current.items = [];
      }
      current.items.push(item);
    });

    sgUtil.writeJsonFile(`.tmp/xxx.json`, xxx);


    return xxx;
  }
}

module
  .exports = PatternCollector;