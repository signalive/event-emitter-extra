import {assert} from 'chai';
import sinon from 'sinon';

globalThis.assert = assert;
globalThis.sinon = sinon;

await import('./test.js');
