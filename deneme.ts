import EventEmitterExtra = require('event-emitter-extra');

class myEE extends EventEmitterExtra {}
const directEEE = new EventEmitterExtra();

directEEE.on('deneme', () => {
    console.log('falan');
});

directEEE.on(/deneme/, (arg1, arg2) => {
    console.log('falan');
});

directEEE.emit('deneme');
directEEE.emit('deneme', 'gogo', {dat: 'test'});


