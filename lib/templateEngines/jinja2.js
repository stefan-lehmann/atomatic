'use strict';


var
  path = require("path"),
  sgUtil = require('../util'),
  spawn = require('child_process').spawn,
  syncRequest = require('sync-request'),
  fs = require('fs'),

  engine,
  getTemplateData,
  getLocals,

  initJinja2 = function () {

    engine.finish = engine.finish === undefined ? true : engine.finish;

    engine.py = spawn(engine.pythonVersion, engine.args, {stdio: 'pipe', detached: false});

    if (engine.debug === true || engine.debug === 'stdout' || engine.debug === 'stderr') {
      engine.py.stderr.on('data', function (data) {

        if (String(data).match(/HTTP\/1\.1\"/) !== null) {
          return;
        }

        sgUtil.log(engine.pathToPyScript, 'error');
        sgUtil.log(data, 'error');
      });
    }

    if (engine.debug === true || engine.debug === 'stdout') {
      engine.py.on('data', function (data) {
        sgUtil.log(engine.pathToPyScript, 'info');
        sgUtil.log(data, 'info');
      });
    }

    engine.render = function (template, renderData) {

      var res, sendData, curlCmd;

      sendData = {
        template: template,
        json: renderData || {}
      };

      if (engine.debug === true || engine.debug === 'http') {
        curlCmd = 'curl -H "Content-Type: application/json" -X POST -d ';
        curlCmd += "'" + JSON.stringify(sendData) + "' " + engine.baseUrl;
        sgUtil.log('curl Jinja2:', 'info');
        sgUtil.log(curlCmd, 'info');
      }

      if (engine.debug === true || engine.debug === 'json') {
        sgUtil.log('curl JSON:', 'info');
        sgUtil.log(JSON.stringify(sendData), 'info');
      }

      res = syncRequest('POST', engine.baseUrl, { json: sendData });

      if (engine.finish) {
        engine.done()
      }

      return {
        html: String(res.body),
        json: JSON.stringify(renderData, null, 2)
      }
    };

    engine.done = function () {
      engine.py.kill();
    };

    return engine;
  },

  renderTemplate = function (templatePath) {

    if (sgUtil.readFileContents(templatePath).trim() === '') {
      sgUtil.log('Template file empty [' + templatePath + ']', 'warn');
      return {
        html: '',
        json: ''
      }
    }
    return engine.render(templatePath, getTemplateData(templatePath));
  },

  init = function (_config, _getTemplateData, _getLocals, debug) {

    engine = _config.engine;
    getTemplateData = _getTemplateData;
    getLocals = _getLocals;

    engine.finish = false;
    engine.args = [ engine.pathToPyScript ];

    if (typeof engine.pythonVersion !== 'string') {
      engine.pythonVersion = './anenv/bin/python';
    }

    if (engine.pythonVersion !== 'python') {
      if (!fs.existsSync(engine.pythonVersion)) {
        sgUtil.log('Given python path "' + engine.pythonVersion + '" does not exist, using "python" default', 'warn');
        engine.pythonVersion = 'python';
      } else {
        sgUtil.log('Make use of python version "' + engine.pythonVersion + '"', 'info');
      }
    }

    if (typeof engine.port !== 'number') {
      engine.port = 5067;
    }
    engine.args.push('--port=' + engine.port);

    if (typeof engine.path !== 'string') {
      engine.path = '/render_template';
    }
    engine.baseUrl = 'http://localhost:' + engine.port + engine.path;

    if (debug) {
      engine.args.push('--debug');
    }

    initJinja2();

    return {
      renderTemplate: renderTemplate,
      done: done
    }
  },

  done = function () {
    engine.done();
  };

module.exports.init = init;