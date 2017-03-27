const
  glob = require('glob'),
  fs = require('fs');

module.exports = {
  preLoad: function (value, options) {
    if (options.resolve) {
      const _resolve = options.resolve;
      options.resolve = resolve(_resolve);
    }
    return value;
  }
};

const globOptions = {
  statCache: {},
  cache: {},
  symlinks: {},
  nodir: true,
  nocase: true
};

const

  resolve = function (_resolve) {

    return function (filename, source, options) {

      let
        resolvedFilename = _resolve.apply(this, arguments);

      if (fs.existsSync(resolvedFilename)) {
        return resolvedFilename;
      }

      const
        separator = '-',
        filenameSegments = filename.split(separator),
        section = filenameSegments.shift(),
        group = filenameSegments.shift(),
        name = filenameSegments.join(separator);

      if (undefined === name) {
        return filename;
      }
      const
        minimatchString = `${options.basedir}/**/${section}/?([0-9][0-9]-)${group}/**/${name}`,
        matches = glob.sync(minimatchString, globOptions);

      return matches.length > 0 ? matches.pop() : resolvedFilename;
    }
  };