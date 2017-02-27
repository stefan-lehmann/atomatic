'use strict';

var
  path = require("path"),
  sgUtil = require('../util'),
  syncRequest = require('sync-request'),

  options,

  render = function (template, locals, globals) {

    var
      res, curlCmd,
      reqMethod = options.request && options.request.method ? options.request.method : 'POST',
      reqUrl = options.request && options.request.url ? options.request.url : 'http://localhost:3000/',
      reqOptions = options.request && options.request.options ? options.request.options : {};

      options.json = { template: template, locals: locals, globals: globals };

    if (options.debug === true || options.debug === 'http') {
      curlCmd = 'curl -H "Content-Type: application/json" -X '+reqMethod+' -d ';
      curlCmd += "'" + JSON.stringify(reqOptions) + "' " + reqUrl;
      sgUtil.log('curl http:', 'info');
      sgUtil.log(curlCmd, 'info');
    }

    if (options.debug === true || options.debug === 'json') {
      sgUtil.log('curl JSON:', 'info');
      sgUtil.log(JSON.stringify(reqOptions, null, 2), 'info');
    }

    return template;

    res = syncRequest(reqMethod, reqUrl, reqOptions);

    return String(res.body);
  },

  done = function () {

    if ('function' === typeof options.done) {
      options.done();
    }
    else {
      sgUtil.log('done() method of http render engine called, but actually there is nothing to do ', 'info');
    }
  },

  init = function (_options) {

    options = _options;

    return {
      render: render,
      done: done
    }
  };

module.exports.init = init;