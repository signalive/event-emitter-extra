global.assert = require('assert');
global.sinon = require('sinon');
global.Promise = require('promise-polyfill');

global.EventEmitterExtra = require('../');
require('./test');
