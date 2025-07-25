'use strict';

const cors = require('cors');
const fs = require('fs');
const runner = require('../test-runner');

module.exports = function (app) {
  app.use(cors());

  app.route('/_api/server.js')
    .get(function (req, res, next) {
      console.log('requested');
      fs.readFile(__dirname + '/../server.js', function (err, data) {
        if (err) return next(err);
        res.type('txt').send(data.toString());
      });
    });

  app.get('/_api/get-tests', cors(),
    function (req, res, next) {
      console.log('requested');
      if (process.env.NODE_ENV === 'test') return next();
      res.json({ status: 'unavailable' });
    },
    function (req, res, next) {
      if (!runner.report) return next();
      res.json(testFilter(runner.report, req.query.type, req.query.n));
    },
    function (req, res) {
      runner.on('done', function (report) {
        process.nextTick(() =>
          res.json(testFilter(runner.report, req.query.type, req.query.n))
        );
      });
    });

  // ✅ Required by FreeCodeCamp to verify CSP header
  app.get('/_api/app-info', function (req, res) {
    const hs = Object.keys(res._headers || {})
      .filter(h => !h.match(/^access-control-\w+/));
    const hObj = {};
    hs.forEach(h => { hObj[h] = res._headers[h]; });
    delete res._headers['strict-transport-security'];
    res.json({ headers: hObj });
  });
};

function testFilter(tests, type, n) {
  let out;
  switch (type) {
    case 'unit':
      out = tests.filter(t => t.context.match('Unit Tests'));
      break;
    case 'functional':
      out = tests.filter(t => t.context.match('Functional Tests') && !t.title.match('#example'));
      break;
    default:
      out = tests;
  }
  if (n !== undefined) {
    return out[n] || out;
  }
  return out;
}
