const
  extend = require('extend'),
  sgUtil = require('../util'),
  CssAnalyzer = require('../analyser/CssAnalyzer'),
  scalpel = require('scalpel').createParser();

class PatternDataLoader {

  constructor(conf) {

    this.conf = conf;

    const
      regex = /\[block\]([^\[]+)\[element\]([^\[]+)\[modifier\]/g,
      bemPattern = this.conf.get('bemPattern', '[block]__[element]--[modifier]'),
      [, blockSeparator, modifierSeperator] = regex.exec(bemPattern);

    this.cssSource = this.conf.get('cssSource');
    this.viewerDest = `${this.conf.get('viewerDest')}/css`;
    this.viewerRootPath = this.conf.get('app.viewerRootPath');
    this.dest = this.conf.get('dest');
    this.globOptions = this.conf.get('globOptions');
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

  getData(filename) {
    const data = sgUtil.readRelatedData(filename);

    this.aggregateData();

    extend(true, data, {
      app: {
        cssFiles: [`/${this.viewerRootPath}/css/app.css`]
      },
      locals: {
        title: data.title,
        versions: this.versions || [],
      }
    });

    return data;
  }

  parseSelector(selector) {
    try {
      return scalpel.parse(selector).map((parsed) => {
        parsed.body = parsed.body.map((item) => {
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

    // console.log(JSON.stringify(versions['button'], null, 2))
    this.versions = versions;
  }
}

module.exports = PatternDataLoader;