const
  extend = require('extend'),
  glob = require('glob'),
  path = require('path'),
  sgUtil = require('../util'),
  Collector = require('./Collector'),
  PatternRenderHook = require('../hooks/PatternRenderHook');

class PatternCollector extends Collector {

  constructor(...args) {
    super(...args);

    this.generator = 'patterns';
  }

  setFile(filename, sourcedDir, destDir, dataLoader) {
    const
      {TemplateEngine, constructor} = this,
      file = this.createFileObj(filename, sourcedDir, destDir, dataLoader),
      group = this.CollectorStore.setGroupedFile(file);

    if (group.hasOwnProperty('render') === false) {
      Object.defineProperty(group, 'render', {
        get: () => {
          const
            files = [...group.values()],
            indexFile = files.pop();

          Object.defineProperty(indexFile, 'render', {
            get: () => {
              return TemplateEngine.render(indexFile, constructor.renderGroup(files));
            }
          });
          return indexFile.render;
        }
      });
    }

    return group;
  }

  unsetFile(filename) {
    this.CollectorStore.unsetGroupedFile(filename);
  }

  readRelatedData(filename) {
    return sgUtil.readRelatedData(filename, false);
  }

  static renderGroup(files) {
    return (body, data) => {

      return [PatternCollector.aggregatePatternData(body, data)]
              .concat(files.map(file => PatternCollector.aggregatePatternData(file.render.body, file.data)));
    };
  }

  static aggregatePatternData(body, data) {
    const {title, description = ''} = data;

    return {title, description, body: PatternCollector.renderHook(body, data.locals)};
  }

  static renderHook(body, locals) {
    return new PatternRenderHook(body, locals).get();
  }
}

module
  .exports = PatternCollector;