const
  path = require('path'),
  extend = require('extend'),
  sgUtil = require('../util'),
  syncRequest = require('sync-request'),
  ConfigManager = require('../ConfigManager');

class httpRenderEngine {

  constructor(options, root, ext) {
    this.options = options;
    this.root = root;
    this.ext = ext;
  }

  render(filename, locals, globals) {

    const
      {root} = this,
      {request, debug} = this.options,
      {method = 'POST', url = 'http://localhost:3000/', options={}} = request,
      data = extend({}, this.options, locals, globals);

    options.json = { filename: path.relative(root, filename), root, data};

    if (debug === true || debug === 'http') {
      let curlCmd;
      curlCmd = 'curl -H "Content-Type: application/json" -X ' + method + ' -d ';
      curlCmd += "'" + JSON.stringify(options) + "' " + url;
      sgUtil.log('curl http:', 'info');
      sgUtil.log(curlCmd);
    }


    if (debug === true || debug === 'json') {
      sgUtil.log('curl JSON:', 'info');
      sgUtil.log(JSON.stringify(options, null, 2));
    }

    const {body} = syncRequest(method, url, options);
    console.log(options, String(body))
    return String(body);
  }
}

module.exports = httpRenderEngine;