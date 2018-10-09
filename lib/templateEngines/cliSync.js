const
  path = require('path'),
  extend = require('extend'),
  {spawnSync} = require('child_process'),
  pretty = require('pretty'),
  sgUtil = require('../util');

class CliRenderEngine {

  constructor(options, root, ext) {
    this.options = options;
    this.root = root;
    this.ext = ext;
  }

  render(filename, locals, globals) {
    const
      {root, options: {script: {command, args}, cache}} = this,
      data = extend({}, locals, globals),
      extendedArgs = args.concat(['--', JSON.stringify({filename: path.relative(root, filename), root, data, cache})]);

    const childProcess = spawnSync(command, extendedArgs, {stdio: 'pipe', detached: false});

    if (!!childProcess.stderr.toString('utf8')) {
      sgUtil.log(`Could not render template: ${filename}`, 'error');
      sgUtil.log(error, 'error');
      sgUtil.log('Please, try to run this command in order to get further information:');
      sgUtil.log(`${command} ${extendedArgs.join(' ')}`);

      return {error: childProcess.stderr.toString('utf8')};
    }
    else {
      return pretty(String(childProcess.stdout), {ocd: true});
    }
  }
}

module.exports = CliRenderEngine;
