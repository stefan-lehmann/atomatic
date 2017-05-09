const
  extend = require('extend'),
  glob = require('glob'),
  path = require('path'),
  sgUtil = require('../util'),
  Collector = require('./Collector');

class PatternCollector extends Collector {

  constructor(...args) {
    super(...args);
    this.modifierDelimiter = {};
  }

  collectSection(sectionConfig) {
    const {modifierDelimiter = ['{{', '}}'], generator} = sectionConfig;
    this.modifierDelimiter[generator] = modifierDelimiter;
    super.collectSection(sectionConfig);
  }

  createFileObj(fileOptions) {
    const
      file = super.createFileObj(fileOptions),
      {filename, generator} = file;

    file.modifiers = this.getAssignedModifiers(filename, generator);

    return file;
  }

  getRenderHookFunction() {
    return (file, source) => {

      if (file.modifiers.length === 0) {
        return ({source, data: file.data});
      }

      const
        {data: {locals}, modifiers, generator} = file,
        {versions} = locals,
        patternWrapTemplate = path.join(__dirname, `../../app/sections/${generator}/patterns.pug`);

      const newVersions = modifiers
        .reduce((sources, modifier) => {
          const
            {blockIdentifier, replaceKey} = modifier,
            regex = new RegExp(replaceKey),
            {[blockIdentifier]: modifierVersions} = versions;

          return sources.reduce((newSources, generated) => {

            return modifierVersions.reduce((newSources, version) => {
              const
                {block, modifierClass} = version,
                source = generated.source.replace(regex, modifierClass),
                path = generated.path === undefined ? [modifierClass] : generated.path.concat([modifierClass]),
                replaced = generated.replaced === undefined ? {} : extend(true, {}, generated.replaced);

              if (replaced[blockIdentifier] === undefined) {
                replaced[blockIdentifier] = [];
              }
              else if (modifierClass !== '' && replaced[blockIdentifier].indexOf(modifierClass) !== -1) {
                return newSources;
              }

              replaced[blockIdentifier].push(modifierClass);
              replaced[blockIdentifier].sort();

              newSources.push({block, modifierClass, source, path, replaced});
              return newSources;
            }, newSources);
          }, []);
        }, [{source}])
        .reduce((combinations, combination, index, sources) => {
          const pos = sources.findIndex((item) => JSON.stringify(item.replaced) === JSON.stringify(combination.replaced));
          if (pos !== index) {
            const {modifierClass, path} = combination;
            combinations.push(extend(true, {}, sources[pos], {modifierClass, path}));
          }
          else {
            combinations.push(combination);
          }
          return combinations;
        }, [])
        .reduce((data, combination) => {
          const
            {path: [pathEntry]} = combination,
            pos = data.findIndex((item) => item.pathEntry === pathEntry);

          if (!pathEntry) {
            return data;
          }
          if (pos === -1) {
            data.push({
              pathEntry,
              combinations: [combination]
            });
          }
          else {
            data[pos].combinations.push(combination);
          }
          return data;
        }, []);

      extend(true, locals, {versions: newVersions});
      source = this.TemplateEngine.wrap('', locals, '', patternWrapTemplate);

      return {source, locals};
    }
  }

  getAssignedModifiers(filename, generator) {

    const
      {modifierDelimiter: {[generator]: [leftDelimiter, rightDelimiter]}} = this,
      escapedLeftDelimiter = leftDelimiter.replace(/[^A-Za-z0-9_]/g, '\\$&'),
      escapedRightDelimiter = rightDelimiter.replace(/[^A-Za-z0-9_]/g, '\\$&'),
      regex = new RegExp(`${escapedLeftDelimiter}([^${escapedRightDelimiter}]+)${escapedRightDelimiter}`, "g"),
      template = sgUtil.readFileContents(filename),
      assignedModifiers = [];

    let m;

    while ((m = regex.exec(template)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const modifier = {};
      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {

        if (groupIndex === 0) {
          modifier['replaceKey'] = match.trim()
        }
        if (groupIndex === 1) {
          modifier['blockIdentifier'] = match.trim()
        }
      });


      assignedModifiers.push(modifier)
    }

    return assignedModifiers.filter((modifier, index) => assignedModifiers.indexOf(modifier) === index);
  }
}
module.exports = PatternCollector;