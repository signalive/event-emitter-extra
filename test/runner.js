global.chai = require('chai');
global.sinon = require('sinon');
global.sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

global.Promise = require('promise-polyfill');

global.EventEmitterExtra = require('../');
require('./test');
