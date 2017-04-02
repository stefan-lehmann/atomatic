const
  glob = require('glob'),
  path  = require('path'),
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
  symlinks: {},
  nodir: true,
  nocase: true
};

const

  resolve = function (_resolve) {

    return function (filename, source, options) {

      let
        minimatchString,
        resolvedFilename = _resolve.apply(this, arguments);

      if (fs.existsSync(resolvedFilename)) {
        return resolvedFilename;
      }

      const
        separator = '-',
        ext = path.extname(filename),
        [section, group, ...remainingSegments] = path.basename(filename, ext).split(separator),
        name = remainingSegments.join(separator),
        longname = [group, ...remainingSegments].join(separator);

      if (undefined === name) {
        return filename;
      }

      switch(section) {
        case 'svg':
          minimatchString = `${options.basedir}/**/${longname}.svg`;
          break;
        default:
          minimatchString = `${options.basedir}/**/${section}/?([0-9][0-9]-)${group}/**/${name}${ext}`;

      }

      const [matchedFilename = resolvedFilename, ...other] = glob.sync(minimatchString, globOptions);

      if (other.length > 0) {
        throw new Error(`More than one matches for include '${filename}' found: \n\t\t\t\t\t `+
                        `${[matchedFilename, ...other].join('\n\t\t\t\t\t ')}`);
      }
      
      return matchedFilename;
    }
  };