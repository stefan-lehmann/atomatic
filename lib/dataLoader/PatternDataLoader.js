const
  extend = require('extend'),
  sgUtil = require('../util'),
  CssAnalyzer = require('../analyser/CssAnalyzer'),
  scalpel = require('scalpel').createParser();

class PatternDataLoader {

  constructor(conf) {

    const
      regex = /\[block\]([^\[]+)\[element\]([^\[]+)\[modifier\]/g,
      bemPattern = conf.get('bemPattern', '[block]__[element]--[modifier]'),
      [, blockSeparator, modifierSeperator] = regex.exec(bemPattern);

    this.cssSource = conf.get('cssSource');
    this.viewerDest = `${conf.get('viewerDest')}/css`;
    this.viewerRootPath = conf.get('app.viewerRootPath');
    this.dest = conf.get('dest');
    this.globOptions = conf.get('globOptions');
    this.blockSeparator = blockSeparator;
    this.modifierSeperator = modifierSeperator;

    this.CssAnalyzer = new CssAnalyzer(this.cssSource, this.globOptions);
  }

  aggregateData() {

    this.css = this.CssAnalyzer.getAnalysis();

    let update = false;

    if (this.CssAnalyzer.getVersion() !== this.cssAnalyzerVersion) {
      this.cssAnalyzerVersion = this.CssAnalyzer.getVersion();
      update = true;
    }

    if (update === true) {
      this.collectVersions();
    }
  }

  getVersions() {
    this.aggregateData();
    return this.versions;
  }

  getAssignedVersions(modifiers) {
    const versions = this.getVersions();
    return modifiers.reduce((assignedVersions, modifier) => {
      const
        [blockName] = modifier['blockIdentifier'].split('.'),
        {[blockName]: version = []} = versions;

      assignedVersions[modifier['blockIdentifier']] = version;
      return assignedVersions;
    }, {});
  }

  getData(file) {

    const
      {filename, cssFiles, modifiers, warnOnMissingDataFile} = file,
      data = sgUtil.readRelatedData(filename, warnOnMissingDataFile),
      description = sgUtil.readRelatedMarkdown(filename);

    extend(true, data, {
      app: {cssFiles},
      locals: {versions: this.getAssignedVersions(modifiers)},
      description
    });

    return data;
  }

  parseSelector(selector) {
    try {
      return scalpel.parse(selector).map((parsed) => {
        const {body = []} = parsed;
        parsed.body = body.map((item) => {
          item.selectorString = selector;
          return item;
        });
        return parsed;
      });
    }
    catch (error) {
      sgUtil.log(`${error} in ${selector}`, 'warn');
    }
    return false;
  }

  flatten(array, value = []) {
    return array.concat(value);
  }

  collectVersions() {

    const versions = {};

    this.css.selectors.values
      .map(this.parseSelector)
      .reduce((selectors, selector = []) => selectors.concat(selector), [])
      .filter((selector) => selector !== false && selector.type === 'selector')
      .reduce((selectors, selector) => selectors.concat(selector.body), [])
      .filter((selector) => selector !== false && selector.type === 'classSelector')
      .filter((selector, index, selectors) => selectors.findIndex((item) => item.name === selector.name) === index)
      .map((selector, index) => {
        const
          {name, selectorString} = selector,
          [blockElement, modifier = '', errorModifier = false] = name.split(this.modifierSeperator),
          [block, element = '', errorBlock = false] = blockElement.split(this.blockSeparator),
          modifierClass = modifier !== '' ? name : '',
          commentData = this.css.getCommentData(selectorString);

        if (errorModifier || errorBlock) {
          sgUtil.log(`${this.constructor.name}: '.${name}' is not following BEM naming conventions.`, 'error');
        }
        return {index, block, element, modifier, blockElement, modifierClass, selectorString, commentData};
      })
      .sort((a, b) => a.element === b.element ? a.index - b.index : (a.element < b.element ? -1 : 1))
      .map((version) => {
        const {blockElement} = version;
        if (versions[blockElement] === undefined) {
          versions[blockElement] = [];
        }
        versions[blockElement].push(version);
      });

    this.versions = versions;
  }
}

module.exports = PatternDataLoader;