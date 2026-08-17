const {describe, it, beforeEach, afterEach} = require('node:test');

global.assert = require('assert');
global.sinon = require('sinon');
global.Promise = require('promise-polyfill');
global.describe = describe;
global.it = it;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.__MODERN__ = true;

global.EventEmitterExtra = require('../src/event-emitter-extra');
require('./test');
