const
  path = require('path'),
  glob = require('glob'),
  fs = require('fs'),
  pug = require('pug'),

  globOptions = {
    statCache: {},
    symlinks: {},
    nodir: true,
    nocase: true
  },

  resolvePathByPattern = function (filename, basedir) {
    const
      separator = '-',
      absoluteBasedir = path.resolve(basedir),
      ext = path.extname(filename),
      [section, ...remainingSegments] = path.basename(filename, ext).split(separator),
      name = remainingSegments.join(separator);

    if (undefined === name) {
      return filename;
    }

    switch (section) {
      case 'svg':
        minimatchString = `${absoluteBasedir}/**/${name}.svg`;
        break;
      default:
        minimatchString = `${absoluteBasedir}/**/${section}/**/${name}${ext || '.pug'}`;

    }
    const [matchedFilename, ...other] = glob.sync(minimatchString, globOptions);

    if (other.length > 0) {
      throw new Error(`More than one matches for include '${filename}' found: \n\t\t\t\t\t ` +
        `${[matchedFilename, ...other].join('\n\t\t\t\t\t ')}`);
    }

    return matchedFilename;
  },

  includeFunction = function (filename, basedir, locals={}) {
    return pug.renderFile(resolvePathByPattern(filename, basedir), locals);
  },

  postLex = function (tokens, options) {

    return tokens.map((tok, index) => {

      if (tok === null) {
        return tok;
      }

      const
        {type} = tok,
        nextTok = tokens[index + 1];

      if (type !== 'include' || nextTok === undefined || nextTok.type !== 'path') {
        return tok;
      }

      if (/`[^`]+`|\+?\s*"[^"]+"\s*\+?|\+?\s*'[^']+'\s*\+?|#|\{[^\}]+}/.test(nextTok.val)) {

        Object.assign(tok, {
          type: 'code',
          val: `process.pug.includeFunction(${nextTok.val}, '${options.basedir}', locals)`,
          mustEscape: false,
          buffer: true
        });
        Object.assign(tokens[index + 1], {
          type: 'comment',
          buffer: false
        });
      }
      return tok;
    }).filter(tok => tok !== null);
  },

  preLoad = function (value, options) {
    if (options.resolve) {
      const _resolve = options.resolve;
      options.resolve = resolve(_resolve);
    }
    return value;
  },

  resolve = function (_resolve) {
    return function (filename, source, options) {
      const resolvedFilename = _resolve.apply(this, arguments);

      return fs.existsSync(resolvedFilename) ? resolvedFilename : resolvePathByPattern(filename, options.basedir);
    }
  };

process.pug = {
  includeFunction
};

module.exports = {
  postLex,
  preLoad,
  includeFunction
};