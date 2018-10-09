const
  path = require('path'),
  extend = require('extend'),
  {spawn} = require('child_process'),
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
      extendedArgs = args.concat(['--', JSON.stringify({filename: path.relative(root, filename), root, data, cache})]),
      childProcess = spawn(command, extendedArgs, {stdio: 'pipe', detached: false});

    return new Promise((resolve, reject) => {
      childProcess.stderr.on('data', error => {
        sgUtil.log(`Could not render template: ${filename}`, 'error');
        sgUtil.log(error, 'error');
        sgUtil.log('Please, try to run this command in order to get further information:');
        sgUtil.log(curlCmd);

        return {error: `${error}<br>${filename}<br>${curlCmd}`};


        reject({error: stderr.toString('utf8')});
      });
      childProcess.on('data', data => {
        resolve(pretty(String(data), {ocd: true}));
      });
    });
  }
}

module.exports = CliRenderEngine;
