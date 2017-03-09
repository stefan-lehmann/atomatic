const
  extend = require('extend'),
  sgUtil = require('../util');

class PatternRenderHook {

  constructor(html, locals, regex = /\{\{ ?([^\}\s]+) ?\}\}/g) {

    this.html = html;
    this.locals = locals;
    this.regex = regex;
    this.replaceObjects = [];
    this.combinations = [];
    this.count = 0;
  }

  get() {
    return this.match().replace().removeDuplicates().group().getData();
  }

  match() {
    const {html, regex} = this;
    let matches;

    while ((matches = regex.exec(html)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (matches.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      this.extendReplaceObject(matches);
    }

    if (this.replaceObjects.length > 0) {
      return this;
    }

    //http://stackoverflow.com/questions/15220494/js-stop-chain-of-objects-methods-without-error
    class nullPatternRenderHook extends PatternRenderHook {
      replace() { return this; }
      removeDuplicates() { return this; }
      group() { return this; }
      getData() { return html; }
    };

    return new nullPatternRenderHook(html);
  }

  replace() {
    const {replaceObjects, html, replaceReplaceObject} = this;

    this.combinations = replaceObjects.reduce(replaceReplaceObject, [{html}]);
    sgUtil.writeJsonFile(`.tmp/combinations-${this.count++}.json`, this.combinations);
    return this;
  }

  removeDuplicates() {
    this.combinations = this.combinations
      .reduce((newCombinations, combination, index, combinations) => {
        const pos = combinations.findIndex((item) => JSON.stringify(item.replaced) === JSON.stringify(combination.replaced))
        if (pos !== index) {
          const {modifierClass, path} = combination;
          newCombinations.push(extend(true, {}, combinations[pos], {modifierClass, path}));
        }
        else {
          newCombinations.push(combination);
        }
        return newCombinations;
      }, []);

    return this
  }

  group() {

    const data = {};

    this.combinations
      .map((combination, index) => {

        if (!combination.path) {
          return;
        }

        if (data[combination.path[0]] === undefined) {
          data[combination.path[0]] = [combination];
        }
        else {
          data[combination.path[0]].push(combination);
        }
      });

    sgUtil.writeJsonFile(`.tmp/group.json`, data);
    this.data = data;
    return this;
  }

  getData() {
    return this.data;
  }

  extendReplaceObject(matches) {
    const
      [search, versionKey] = matches,
      [blockElement] = versionKey.split('.'),
      versions = this.locals.versions[blockElement];

    this.replaceObjects.push({blockElement, search, versionKey, versions});
  }

  replaceReplaceObject(data, replaceObject) {
    const
      {search, versions, versionKey, blockElement} = replaceObject,
      newData = [];

    data.map((generated) => {

      versions.map((version) => {
        const
          {modifierClass} = version,
          html = generated.html.replace(search, modifierClass),
          path = generated.path === undefined ? [modifierClass] : generated.path.concat([modifierClass]),
          replaced = generated.replaced === undefined ? {} : extend(true, {}, generated.replaced);

        if (replaced[versionKey] === undefined) {
          replaced[versionKey] = [];
        }
        else if (modifierClass !== '' && replaced[versionKey].indexOf(modifierClass) !== -1) {
          return false;
        }

        replaced[versionKey].push(modifierClass);
        replaced[versionKey].sort();

        newData.push(extend({}, version, {html, path, replaced}));
      });
    });

    return newData;
  }

}

module.exports = PatternRenderHook;