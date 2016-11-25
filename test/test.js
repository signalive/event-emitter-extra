describe('EventEmitterExtra', function() {
    var ee;

    beforeEach(function() {
        ee = new EventEmitterExtra();
    });

    afterEach(function() {
        ee = null;
    });

    it('should not listen non-string-or-regex event name', function() {
        assert.throws(function() {
            ee.on(55, function() {});
        }, Error);

        assert.throws(function() {
            ee.on({test: 'moretest'}, function() {});
        }, Error);
    });

    it('should not listen with non-function listener', function() {
        assert.throws(function() {
            ee.once('test', 'test');
        }, Error);

        assert.throws(function() {
            ee.once('test', 15);
        }, Error);

        assert.throws(function() {
            ee.once('test', ['TEST']);
        }, Error);

        assert.throws(function() {
            ee.once('test', {test: 'test'});
        }, Error);
    });

    it('should not listen with non-interger ttl', function() {
        assert.throws(function() {
            ee.many('test', 'asd', function() {});
        }, Error);

        assert.throws(function() {
            ee.many('test', ['test'], function() {});
        }, Error);

        assert.throws(function() {
            ee.many('test', 10.5, function() {});
        }, Error);
    });

    it('should not emit non-string event', function() {
        assert.throws(function() {
            ee.emit(15);
        }, Error);

        assert.throws(function() {
            ee.emit({'test': 'hello'});
        }, Error);
    });

    it('should emit event without any listener', function() {
        var result = ee.emit('test');
        assert.equal(result, false);
    });

    it('should not call listener for past emits', function() {
        var result = ee.emit('test');
        var spy = sinon.spy();
        ee.addListener('test', spy);

        assert.equal(result, false);
        assert.equal(spy.callCount, 0)
    });

    it('should call listener once', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy);

        var result = ee.emit('test');

        assert.deepEqual(result, [undefined]);
        assert(spy.calledOnce);
    });

    it('should call listener thrice', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        assert(spy.calledThrice);
    });

    it('should call listener once even that event emitted multiple times #1', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy, 1);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        assert(spy.calledOnce);
    });

    it('should call listener once even that event emitted multiple times #2', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy, 2);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        assert(spy.calledTwice);
    });

    it('should call listener with emit arguments', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy);

        var arg1 = {some: 'payload'};
        var arg2 = function() {};

        ee.emit('test', arg1, arg2);

        assert(spy.calledOnce);
        assert(spy.calledWith(arg1, arg2));
    });

    it('should prepend listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test', spy2);
        ee.prependListener('test', spy1);

        ee.emit('test');

        assert(spy1.calledBefore(spy2));
        assert(spy2.calledAfter(spy1));
    });

    it('should prepend once listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test', spy2);
        ee.prependOnceListener('test', spy1);

        ee.emit('test');
        ee.emit('test');

        assert(spy1.calledBefore(spy2));
        assert(spy2.calledAfter(spy1));
        assert(spy1.calledOnce);
        assert(spy2.calledTwice);
    });

    it('should prepend many listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test', spy2);
        ee.prependManyListener(/test/, 2, spy1);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        assert(spy1.calledBefore(spy2));
        assert(spy2.calledAfter(spy1));
        assert(spy1.calledTwice);
        assert(spy2.calledThrice);
    });

    it('should not add more listeners if limit exceed', function() {
        ee.setMaxListeners(2);

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);

        assert.throws(function() {
            ee.addListener('test', spy3);
        }, Error);

        assert.throws(function() {
            ee.addListener('test', spy4);
        }, Error);
    });

    it('should not add more regex listeners if regex limit exceed', function() {
        ee.setMaxRegexListeners(2);

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener(/test/, spy1);
        ee.addListener(/test/, spy2);

        assert.throws(function() {
            ee.addListener(/test/, spy3);
        }, Error);

        assert.throws(function() {
            ee.addListener(/test/, spy4);
        }, Error);
    });

    it('should not handler for another event name', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        ee.addListener('test', spy1);
        ee.addListener('testtest', spy2);

        ee.emit('test');

        assert(spy1.calledOnce);
        assert.equal(spy2.callCount, 0);
    });

    it('should call regex handlers', function() {
        var spy = sinon.spy();
        ee.addListener(/test/, spy);

        ee.emit('test');
        ee.emit('some-test');
        ee.emit('sometestmore');

        assert(spy.calledThrice);
    });

    it('should return array of handler returnings', function() {
        ee.addListener('test', function() { return 'test1'; });
        ee.addListener('test', function() { return 'test2'; });
        ee.addListener('test', function() { return 'test3'; });
        ee.addListener('another', function() { return 'test4'; });

        var result = ee.emit('test');
        assert.deepEqual(result, ['test1', 'test2', 'test3']);
    });

    it('should emit async', function(done) {
        ee.addListener('test', function() { return 'test1'; });
        ee.addListener('test', function() { return Promise.resolve('test2'); });
        ee.addListener('test', function() {
            return new Promise(function(resolve) {
                setTimeout(function() {
                    resolve('test3');
                }, 10);
            });
        });
        ee.addListener('another', function() { return 'test4'; });

        ee
            .emitAsync('test')
            .then(function(result) {
                assert.deepEqual(result, ['test1', 'test2', 'test3']);
                done();
            })
            .catch(done);
    });

    it('should reject emit async with no listener', function(done) {
        ee
            .emitAsync('noMatch')
            .then(function() {
                done(new Error('Emit async resolved with no listeners'));
            })
            .catch(function(err) {
                assert.equal(err.message, 'No listener');
                done();
            });
    });

    it('should not remove listener with non-string-or-regex eventName', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener(/test/, spy2);

        assert.throws(function() {
            ee.removeListener(15, spy1);
        }, Error);

        assert.throws(function() {
            ee.removeListener({test: 'test'}, spy1);
        }, Error);

        ee.emit('test');

        assert(spy1.calledOnce);
        assert(spy2.calledOnce);
    });

    it('should remove listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);

        ee.removeListener('test', spy1);
        ee.emit('test');

        assert.equal(spy1.callCount, 0);
        assert(spy2.calledOnce);
    });

    it('should remove regex listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener(/test/, spy1);
        ee.addListener(/test/, spy2);

        ee.removeListener(/test/, spy1);
        ee.emit('test');

        assert.equal(spy1.callCount, 0);
        assert(spy2.calledOnce);
    });

    it('should remove multiple listener #1', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test1', [spy1, spy2]);
        ee.addListener(/test2/, spy1);

        ee.removeListener(['test1', /test2/], spy1);
        ee.emit('test1');
        ee.emit('test2');

        assert.equal(spy1.callCount, 0);
        assert(spy2.calledOnce);
    });

    it('should remove multiple listener #2', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test1', [spy1, spy2]);
        ee.addListener(/test2/, spy1);

        ee.removeListener(['test1', /test2/], [spy1, spy2]);
        ee.emit('test1');
        ee.emit('test2');

        assert.equal(spy1.callCount, 0);
        assert.equal(spy2.callCount, 0);
    });

    it('should remove all listeners for event name', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener('test1', spy1);
        ee.addListener('test1', spy2);
        ee.addListener('test2', spy3);
        ee.addListener('test2', spy4);

        ee.removeAllListeners('test1');

        ee.emit('test1');
        ee.emit('test2');

        assert.equal(spy1.callCount, 0);
        assert.equal(spy2.callCount, 0);
        assert(spy3.calledOnce);
        assert(spy4.calledOnce);
    });

    it('should remove all listeners for regex', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener(/test1/, spy1);
        ee.addListener(/test1/, spy2);
        ee.addListener(/test2/, spy3);
        ee.addListener(/test2/, spy4);

        ee.removeAllListeners(/test1/);

        ee.emit('test1');
        ee.emit('test2');

        assert.equal(spy1.callCount, 0);
        assert.equal(spy2.callCount, 0);
        assert(spy3.calledOnce);
        assert(spy4.calledOnce);
    });

    it('should remove all listeners for multiple events', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();
        var spy5 = sinon.spy();

        ee.addListener('test1', [spy1, spy2]);
        ee.addListener(/test2/, [spy3, spy4]);
        ee.addListener('test3', spy5);

        ee.removeAllListeners(['test1', /test2/]);

        ee.emit(['test1', 'test2', 'test3']);

        assert.equal(spy1.callCount, 0);
        assert.equal(spy2.callCount, 0);
        assert.equal(spy3.callCount, 0);
        assert.equal(spy4.callCount, 0);
        assert(spy5.calledOnce);
    });

    it('should remove all listeners', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener(/test1/, spy1);
        ee.addListener('test1', spy2);
        ee.addListener(/test2/, spy3);
        ee.addListener('test2', spy4);

        ee.removeAllListeners();

        ee.emit('test1');
        ee.emit('test2');

        assert.equal(spy1.callCount, 0);
        assert.equal(spy2.callCount, 0);
        assert.equal(spy3.callCount, 0);
        assert.equal(spy4.callCount, 0);
    });

    it('should get event names', function() {
        ee.addListener('test1', function() {});
        ee.addListener('test2', function() {});
        ee.addListener(/test3/, function() {});

        assert.deepEqual(ee.eventNames(), ['test1', 'test2']);
    });

    it('should get regexes', function() {
        ee.addListener(/test1/, function() {});
        ee.addListener(/test2/, function() {});
        ee.addListener('test3', function() {});

        assert.deepEqual(ee.regexes(), [/test1/, /test2/]);
    });

    it('should get listener counts', function() {
        ee.addListener('test', function() {});
        ee.addListener('test', function() {});
        ee.addListener(/test/, function() {});
        ee.addListener('test2', function() {});

        assert.throws(function() {
            ee.listenerCount(['test']);
        }, Error);

        assert.throws(function() {
            ee.listenerCount(true);
        }, Error);

        assert.equal(ee.listenerCount('test'), 2);
        assert.equal(ee.listenerCount(/test/), 1);
        assert.equal(ee.listenerCount('nomatch'), 0);
        assert.equal(ee.listenerCount(/nomatch/), 0);
    });

    it('should get listeners', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);
        ee.addListener(/test/, spy3);
        ee.addListener('test2', spy4);

        assert.throws(function() {
            ee.listeners(15);
        }, Error);

        assert.throws(function() {
            ee.listeners(['test']);
        }, Error);

        assert.deepEqual(ee.listeners('test'), [spy1, spy2]);
        assert.deepEqual(ee.listeners(/test/), [spy3]);
        assert.deepEqual(ee.listeners('nomatch'), []);
        assert.deepEqual(ee.listeners(/nomatch/), []);
    });

    it('should add multiple listernes, handlers and emit multiple', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener(['test', 'test2'], [spy1, spy2, spy3, spy4]);
        ee.addListener(['test3'], [spy3, spy4]);

        ee.emit(['test', 'test2', 'test3', 'test4']);

        assert.equal(spy1.callCount, 2);
        assert.equal(spy2.callCount, 2);
        assert.equal(spy3.callCount, 3);
        assert.equal(spy4.callCount, 3);
    });

    it('should set max listeners', function() {
        assert.throws(function() {
            ee.setMaxListeners('test');
        }, Error);

        assert.throws(function() {
            ee.setMaxListeners([15, 20]);
        }, Error);

        assert.throws(function() {
            ee.setMaxListeners(10.5);
        }, Error);

        ee.setMaxListeners(20);
        assert.equal(ee.getMaxListeners(), 20);
    });

    it('should set max regex listeners', function() {
        assert.throws(function() {
            ee.setMaxRegexListeners('test');
        }, Error);

        assert.throws(function() {
            ee.setMaxRegexListeners([15, 20]);
        }, Error);

        assert.throws(function() {
            ee.setMaxRegexListeners(10.5);
        }, Error);

        ee.setMaxRegexListeners(20);
        assert.equal(ee.getMaxRegexListeners(), 20);
    });
});
