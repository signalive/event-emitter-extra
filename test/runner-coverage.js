// Set before src is required: it decides the polyfill branch at load time.
global.__MODERN__ = true;

require('./setup')();

global.EventEmitterExtra = require('../src/event-emitter-extra');
require('./test');
