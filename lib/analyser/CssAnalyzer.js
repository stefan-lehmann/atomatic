const
  cssstats = require('cssstats'),
  extend = require('extend'),
  css = require('css'),
  cssShorthandExpand = require('css-shorthand-expand'),
  tinycolor = require('tinycolor2'),
  ntc = require('ntc'),
  JSON5 = require('json5'),
  sgUtil = require('../util'),
  Analyzer = require('./Analyzer');

const storedAnalyzes = new Map();

class CssAnalyzer extends Analyzer {

  analyze() {

    const
      {getFileContents, extend, convertShorthands, unifyHexValues, getFontFaces} = this,
      cssString = getFileContents.call(this).replace(/\s{2,}/g, ' ');

    let stats = cssstats(cssString);
    stats = extend.call(this, stats, cssString);
    stats = convertShorthands.call(this, stats);
    stats = unifyHexValues.call(this, stats);
    stats = getFontFaces.call(this, stats, cssString);

    return stats;
  }

  extend(stats, cssString) {
    const {
      flatten, uniqueCount, excludeValues, getUniqueValues,
      getUniqueMediaQueries, appendColorNames, getSortByKey, getCommentData
    } = this;

    stats.declarations.getUniqueValues = getUniqueValues.bind({
      stats,
      flatten,
      uniqueCount,
      excludeValues,
      appendColorNames,
      getSortByKey
    });

    stats.mediaQueries.getUniqueMediaQueries = getUniqueMediaQueries.bind({
      stats,
      uniqueCount,
      getSortByKey
    });

    stats.getCommentData = getCommentData.bind({
      cssString
    });


    return stats;
  }

  getFontFaces(stats, cssString) {
    const matches = cssString.match(/@font-face\s?\{[^\}]+}/gi);

    stats.fontFaces = {
      total: 0,
      values: []
    };

    if (matches === null) {
      return stats;
    }

    matches.map((match) => {
      const
        {stylesheet} = css.parse(match),
        fontFace = {};
      if (Array.isArray(stylesheet.rules)) {
        const [rule] = stylesheet.rules;

        rule.declarations.map((declaration) => {
          const {property, value} = declaration;
          if (property !== 'src') {
            fontFace[property] = value;
          }
        });
        stats.fontFaces.total++;
        stats.fontFaces.values.push(fontFace);
      }
    });

    stats.fontFaces.values.sort(this.getSortByKey('font-family', 'font-weight'));
    return stats;
  }

  unifyHexValues(stats) {
    const {properties} = stats.declarations;

    this.getColorProperties()
      .filter(this.removeEmpty.bind(properties))
      .map((propertyName) => {
        properties[propertyName].map((value, key) => {
          value = value.trim().toLowerCase();
          if (value.match(/^#[a-z0-9]{3}$/) !== null) {
            value = [...value].map((char) => char === '#' ? char : char + char).join('');
          }
          properties[propertyName][key] = value;
        });
      });
    return stats;
  }

  convertShorthands(stats) {
    const {properties} = stats.declarations;

    this.getShorthandProperties()
      .filter(this.removeEmpty.bind(properties))
      .map((propertyName) => {

        properties[propertyName].map((value) => {
          const expanded = cssShorthandExpand(propertyName, value);

          if (expanded !== undefined) {
            Object.keys(expanded).map((key) => {
              if (properties[key] === undefined) properties[key] = [];
              properties[key].push(expanded[key]);
            });
          }
        });
      });
    return stats;
  }

  getUniqueValues(propertyNames) {
    const {properties} = this.stats.declarations;

    if (typeof propertyNames === 'string') {
      propertyNames = [propertyNames];
    }

    return propertyNames
      .map((propertyName) => properties[propertyName])
      .reduce(this.flatten, [])
      .filter(this.excludeValues)
      .reduce(this.uniqueCount, [])
      .map(this.appendColorNames)
      .sort(this.getSortByKey('total'));
  }

  getUniqueMediaQueries() {
    const {values} = this.stats.mediaQueries;

    return values
      .reduce(this.uniqueCount, [])
      .sort(this.getSortByKey('total'));
  }

  unique(value, index, array) {
    return array.indexOf(value) === index;
  }

  appendColorNames(value) {
    const color = tinycolor(value.value);
    if (color.isValid()) {
      const [hex, name] = ntc.name(color.toHexString());
      value.name = name;

      if (hex.toLowerCase() !== color.toHexString()) {
        value.suffix = 'approx.';
      }

      if (color.getAlpha() < 1) {
        value.alpha = `(${color.getAlpha() * 100}%)`;
      }

      value.textColor = color.getAlpha() > 0.4 && color.setAlpha(1).getLuminance() < 0.4 ? '#fff' : 'inherit';

    }
    return value;
  }

  uniqueCount(array, value, index, filterArray) {
    if (filterArray.indexOf(value) === index) {
      const total = filterArray.filter(_value => _value.toLowerCase() === value.toLowerCase()).length;
      array.push({value, total});
    }
    return array;
  }

  flatten(array, value = []) {
    return array.concat(value);
  }

  excludeValues(value) {
    return ['inherit', 'none'].indexOf(value) === -1;
  }

  removeEmpty(key) {
    return undefined !== this[key]
  }

  getSortByKey(key1, key2 = 'value') {
    return (a, b) => a[key1] === b[key1] ? a[key2] < b[key2] ? -1 : 1 : b[key1] - a[key1];
  }

  getColorProperties() {
    return [
      'color', 'background-color',
      'border-top-color', 'border-right-color',
      'border-bottom-color', 'border-left-color',
      'fill', 'stroke']
  }

  getShorthandProperties() {
    return [
      'background', 'font', 'padding', 'margin', 'border', 'border-width',
      'border-style', 'border-color', 'border-top', 'border-right', 'border-bottom',
      'border-left', 'outline'
    ]
  }

  getCommentData(selector) {

    const regex = new RegExp(`(${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([^\{\:\.\s]+(,?)[^\\{]*| +)\{[^\\}]*\/\\*JSON5(.+)(?=\\*\\/)`, 'gm');
    let output = {}, matches, parsed;

    while ((matches = regex.exec(this.cssString)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (matches.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      const [, , valdiation, , comment] = matches;

      if (valdiation.trim() === '') {
        parsed = {};
        try {
          parsed = JSON5.parse(comment.trim());
        } catch (err) {
          sgUtil.log(`Unable to parse comment '${comment.trim()}'`, 'notice');
          sgUtil.log(err, 'notice');
        }
        output = extend(true, output, parsed);
      }
    }
    return output;
  }
}

module.exports = CssAnalyzer;
