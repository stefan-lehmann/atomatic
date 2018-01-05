const
  sgUtil = require('../util'),
  Collector = require('./Collector');

class PatternCollector extends Collector {

  constructor(...args) {
    super(...args);
    this.modifierDelimiter = {};
    this.warnOnMissingDataFile = false;
  }

  collectSection(sectionConfig) {
    const {modifierDelimiter = ['{{', '}}'], collector} = sectionConfig;
    this.modifierDelimiter[collector] = modifierDelimiter;
    super.collectSection(sectionConfig);
  }

  createFileObj(fileOptions) {
    const
      file = super.createFileObj(fileOptions),
      {filename, collector} = file;

    file.modifiers = this.getAssignedModifiers(filename, collector);

    return file;
  }

  getCopySourceFunction() {
    return () => {};
  }

  getAssignedModifiers(filename, collector) {

    const
      {modifierDelimiter: {[collector]: [leftDelimiter, rightDelimiter]}} = this,
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