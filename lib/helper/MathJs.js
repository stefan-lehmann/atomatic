const
  maths = require('mathjs');

class MathJs {

  static resolve(argString) {

    let unit = '';
    const
      expr = /(-?(0\.|[1-9\.])+[0-9\.]*(px|em|ex|ch|rem|pt|vh|vw|vmin|vmax)?( |\+|-|\*|\/)*)+/g,
      matches = argString.match(expr);

    if (matches !== null) {
      matches.map((match) => {

        const
          number = match.replace(/([a-zA-Z]+)/g, ''),
          [unit] = match.match(/([a-zA-Z])+/) || [''];

        try {
          const resolved = maths.eval(number);
          argString = argString.replace(match, resolved+unit);
        }
        catch(err) {
          console.log(err);
        }
      });
    }

    return argString;
  }
}

module.exports = MathJs;