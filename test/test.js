describe('EventEmitterExtra', function() {
    var ee;

    beforeEach(function() {
        ee = new EventEmitterExtra();
    });

    afterEach(function() {
        ee = null;
    });

    it('should emit event without any listener', function() {
        var result = ee.emit('test');
        result.should.be.deep.equal(false);
    });

    it('should not call listener for past emits', function() {
        var result = ee.emit('test');
        var spy = sinon.spy();
        ee.addListener('test', spy);

        result.should.be.deep.equal(false);
        spy.should.have.been.not.called;
    });

    it('should call listener once', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy);

        var result = ee.emit('test');

        result.should.be.deep.equal([undefined]);
        spy.should.have.been.calledOnce;
    });

    it('should call listener thrice', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        spy.should.have.been.calledThrice;
    });

    it('should call listener once even that event emitted multiple times #1', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy, 1);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        spy.should.have.been.calledOnce;
    });

    it('should call listener once even that event emitted multiple times #2', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy, 2);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        spy.should.have.been.calledTwice;
    });

    it('should call listener with emit arguments', function() {
        var spy = sinon.spy();
        ee.addListener('test', spy);

        var arg1 = {some: 'payload'};
        var arg2 = function() {};

        ee.emit('test', arg1, arg2);

        spy.should.have.been.calledOnce;
        spy.should.have.been.calledWith(arg1, arg2);
    });

    it('should not add more listeners if limit exceed', function() {
        ee.setMaxListeners(2);

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);
        (function() {
            return ee.addListener('test', spy3);
        }).should.throw(Error);
        (function() {
            return ee.addListener('test', spy4);
        }).should.throw(Error);
    });

    it('should not add more regex listeners if regex limit exceed', function() {
        ee.setMaxRegexListeners(2);

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener(/test/, spy1);
        ee.addListener(/test/, spy2);
        (function() {
            ee.addListener(/test/, spy3);
        }).should.throw(Error);
        (function() {
            ee.addListener(/test/, spy4);
        }).should.throw(Error);
    });

    it('should not handler for another event name', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        ee.addListener('test', spy1);
        ee.addListener('testtest', spy2);

        ee.emit('test');

        spy1.should.have.been.calledOnce;
        spy2.should.have.been.not.called;
    });

    it('should call regex handlers', function() {
        var spy = sinon.spy();
        ee.addListener(/test/, spy);

        ee.emit('test');
        ee.emit('some-test');
        ee.emit('sometestmore');

        spy.should.have.been.calledThrice;
    });

    it('should return array of handler returnings', function() {
        ee.addListener('test', function() { return 'test1'; });
        ee.addListener('test', function() { return 'test2'; });
        ee.addListener('test', function() { return 'test3'; });
        ee.addListener('another', function() { return 'test4'; });

        var result = ee.emit('test');
        result.should.be.deep.equal(['test1', 'test2', 'test3']);
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
                result.should.be.deep.equal(['test1', 'test2', 'test3']);
                done();
            })
            .catch(done);
    });

    it('should remove listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);

        ee.removeListener('test', spy1);
        ee.emit('test');

        spy1.should.have.been.not.called;
        spy2.should.have.been.calledOnce;
    });

    it('should remove regex listener', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener(/test/, spy1);
        ee.addListener(/test/, spy2);

        ee.removeListener(/test/, spy1);
        ee.emit('test');

        spy1.should.have.been.not.called;
        spy2.should.have.been.calledOnce;
    });

    it('should remove multiple listener #1', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test1', [spy1, spy2]);
        ee.addListener(/test2/, spy1);

        ee.removeListener(['test1', /test2/], spy1);
        ee.emit('test1');
        ee.emit('test2');

        spy1.should.have.been.not.called;
        spy2.should.have.been.calledOnce;
    });

    it('should remove multiple listener #2', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();

        ee.addListener('test1', [spy1, spy2]);
        ee.addListener(/test2/, spy1);

        ee.removeListener(['test1', /test2/], [spy1, spy2]);
        ee.emit('test1');
        ee.emit('test2');

        spy1.should.have.been.not.called;
        spy2.should.have.been.not.called;
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

        spy1.should.have.been.not.called;
        spy2.should.have.been.not.called;
        spy3.should.have.been.calledOnce;
        spy4.should.have.been.calledOnce;
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

        spy1.should.have.been.not.called;
        spy2.should.have.been.not.called;
        spy3.should.have.been.calledOnce;
        spy4.should.have.been.calledOnce;
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

        spy1.should.have.been.not.called;
        spy2.should.have.been.not.called;
        spy3.should.have.been.not.called;
        spy4.should.have.been.not.called;
        spy5.should.have.been.calledOnce;
    });

    it('should get event names', function() {
        ee.addListener('test1', function() {});
        ee.addListener('test2', function() {});
        ee.addListener(/test3/, function() {});

        ee.eventNames().should.be.deep.equal(['test1', 'test2'])
    });

    it('should get regexes', function() {
        ee.addListener(/test1/, function() {});
        ee.addListener(/test2/, function() {});
        ee.addListener('test3', function() {});

        ee.regexes().should.be.deep.equal([/test1/, /test2/])
    });

    it('should get listener counts', function() {
        ee.addListener('test', function() {});
        ee.addListener('test', function() {});
        ee.addListener(/test/, function() {});
        ee.addListener('test2', function() {});

        ee.listenerCount('test').should.be.equal(2);
        ee.listenerCount(/test/).should.be.equal(1);
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

        ee.listeners('test').should.be.deep.equal([spy1, spy2]);
        ee.listeners(/test/).should.be.deep.equal([spy3]);
    });

    it('should add multiple listernes, handlers and emit multiple', function() {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        var spy4 = sinon.spy();

        ee.addListener(['test', 'test2'], [spy1, spy2, spy3, spy4]);
        ee.addListener(['test3'], [spy3, spy4]);

        ee.emit(['test', 'test2', 'test3', 'test4']);

        spy1.callCount.should.have.been.equal(2);
        spy2.callCount.should.have.been.equal(2);
        spy3.callCount.should.have.been.equal(3);
        spy4.callCount.should.have.been.equal(3);
    });
});
