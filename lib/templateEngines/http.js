const
  path = require('path'),
  extend = require('extend'),
  spawn = require('child_process').spawn,
  syncRequest = require('sync-request'),
  pretty = require('pretty'),
  sgUtil = require('../util');

class httpRenderEngine {

  constructor(options, root, ext) {
    this.options = options;
    this.root = root;
    this.ext = ext;

    this.startServer();
  }

  startServer() {

    const {script: {command, port = 99999, pathToScript, debug} = {}} = this.options;

    if (command && pathToScript) {
      const args = ['-S', `0.0.0.0:${port}`, '-t', pathToScript];

      this.childProcess = spawn(this.options.script.command, args, {stdio: 'pipe', detached: false});

      sgUtil.log(`[✓] ${this.constructor.name}: server started (pid: ${this.childProcess.pid})`, 'info');
      sgUtil.log(`    command: '${this.childProcess.spawnargs.join(' ')}'`, 'info');

      if (debug === true || debug === 'stdout' || debug === 'stderr') {
        this.childProcess.stderr.on('data', (data) => {
          if (String(data).match(/HTTP\/1\.1\"/) !== null) {
            return;
          }
          sgUtil.log(pathToScript, 'error');
          sgUtil.log(data, 'error')
        });
      }

      if (debug === true || debug === 'stdout') {
        this.childProcess.on('data', (data) => {
          sgUtil.log(pathToScript, 'info');
          sgUtil.log(data, 'info');
        });
      }

      this.childProcess.on('close', () => sgUtil.log(`[✓] ${this.constructor.name}: server stopped (pid: ${this.childProcess.pid})`, 'info'));
    }
  }

  kill() {
    this.childProcess.kill();
  }

  render(filename, locals, globals) {

    const
      {root, options: {request: {method = 'POST', url = 'http://localhost:3000/', options = {}}, debug, cache}} = this,
      data = extend({}, locals, globals),
      curlCmd = `curl -H "Content-Type: application/json" -X ${method} -d '${JSON.stringify(options)}' ${url}`;

    options.json = {filename: path.relative(root, filename), root, data, cache};

    if (debug === true || debug === 'http') {
      sgUtil.log('curl http:', 'info');
      sgUtil.log(curlCmd);
    }

    if (debug === true || debug === 'json') {
      sgUtil.log('curl JSON:', 'info');
      sgUtil.log(JSON.stringify(options, null, 2));
    }

    try {
      const {body} = syncRequest(method, url, options);
      return pretty(String(body), {ocd: true});
    }
    catch (error) {
      sgUtil.log(`Could not render template: ${filename}`, 'error');
      sgUtil.log(error, 'error');
      sgUtil.log('Please, try to run this command in order to get further information:');
      sgUtil.log(curlCmd);

      return {error: `${error}<br>${filename}<br>${curlCmd}`};
    }
  }
}

module.exports = httpRenderEngine;