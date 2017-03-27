const
  flatten = require('obj-flatten'),
  MathJs = require('../helper/MathJs'),
  Analyzer = require('./Analyzer');

const storedAnalyzes = new Map();

class VariableAnalyser extends Analyzer {

  constructor(...args) {
    super(...args);

    this.delimiter = args[2] || '-';
  }

  analyze() {

    const
      {delimiter, getFileContents, resolveVars, resolveMath} = this,
      varsString = getFileContents.call(this);

    if (varsString === '') {
      return {};
    }

    let vars = flatten(JSON.parse(varsString), delimiter);

    vars = resolveVars.call(this, vars);
    vars = resolveMath.call(this, vars);
    return vars;
  }

  resolveVars(vars) {
    const varNames = Object.keys(vars);

    let counter = 0;
    varNames.map((key1) => {
      let done = false;
      while (done === false) {
        done = true;
        varNames.some((key2) => {
          if (vars[key1].indexOf(key2) != -1) {
            vars[key1] = vars[key1].replace(key2, vars[key2]);
            done = false;
            return true;
          }
          counter++;
        });
      }
    });

    return vars;
  }

  resolveMath(vars) {
    const varNames = Object.keys(vars);

    varNames.map((key) => {
      const value = vars[key];

      if (value.indexOf('+') !== -1 ||
          value.indexOf('-') !== -1 ||
          value.indexOf('*') !== -1 ||
          value.indexOf('/') !== -1) {
        vars[key] = MathJs.resolve(value);
      }
    });

    return vars;
  }

  static getRelatedVars(vars, values) {
    const varNames = Object.keys(vars);

    values.map((item) => {
      varNames.map((varName) => {
        if (item.value.toLowerCase() === vars[varName].toLowerCase()) {
          if (item.vars === undefined) {
            item.vars = [];
          }
          item.vars.push(varName);
        }
      });
    });

    return values;
  }
}

module.exports = VariableAnalyser;