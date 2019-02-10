const
  path = require('path'),
  extend = require('extend'),
  util = require('util'),
  pretty = require('pretty'),
  sgUtil = require('../util');

const exec = util.promisify(require('child_process').exec);

class CliRenderEngine {
  constructor(options, root, ext) {
    this.options = options;
    this.root = root;
    this.ext = ext;
  }

  async render(filename, locals, globals) {
    const {root, options: {script: {command, args}, cache}} = this;
    const json = JSON.stringify({filename: path.relative(root, filename), root, data: extend({}, locals, globals), cache});
    const cmd = `${command} ${args.join(' ')} -- '${json}'`;

    try {
      const {stdout} = await exec(cmd, {maxBuffer: 1024 * 2000});
      return pretty(String(stdout), {ocd: true});
    }
    catch (error) {

      sgUtil.log(`Could not render template: ${filename}`, 'error');
      sgUtil.log(error.toString('utf8').trim(), 'error');
      return {error: error.toString('utf8')};
    }
  }
}

module.exports = CliRenderEngine;
