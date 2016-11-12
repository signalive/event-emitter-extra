describe('EventEmitterExtra', function() {
    let ee;

    beforeEach(function() {
        ee = new EventEmitterExtra();
    });

    afterEach(function() {
        ee = null;
    });

    it('should emit event without any listener', function() {
        const result = ee.emit('test');
        result.should.be.deep.equal([]);
    });

    it('should not call listener for past emits', function() {
        const result = ee.emit('test');
        const spy = sinon.spy();
        ee.addListener('test', spy);

        result.should.be.deep.equal([]);
        spy.should.have.been.not.called;
    });

    it('should call listener once', function() {
        const spy = sinon.spy();
        ee.addListener('test', spy);

        const result = ee.emit('test');

        result.should.be.deep.equal([undefined]);
        spy.should.have.been.calledOnce;
    });

    it('should call listener thrice', function() {
        const spy = sinon.spy();
        ee.addListener('test', spy);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        spy.should.have.been.calledThrice;
    });

    it('should call listener once even that event emitted multiple times #1', function() {
        const spy = sinon.spy();
        ee.addListener('test', spy, 1);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        spy.should.have.been.calledOnce;
    });

    it('should call listener once even that event emitted multiple times #2', function() {
        const spy = sinon.spy();
        ee.addListener('test', spy, 2);

        ee.emit('test');
        ee.emit('test');
        ee.emit('test');
        ee.emit('test');

        spy.should.have.been.calledTwice;
    });

    it('should call listener with emit arguments', function() {
        const spy = sinon.spy();
        ee.addListener('test', spy);

        const arg1 = {some: 'payload'};
        const arg2 = () => {};

        ee.emit('test', arg1, arg2);

        spy.should.have.been.calledOnce;
        spy.should.have.been.calledWith(arg1, arg2);
    });

    it('should not add more listeners if limit exceed', function() {
        ee.setMaxListeners(2);

        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        const spy4 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);
        (() => ee.addListener('test', spy3)).should.throw(Error);
        (() => ee.addListener('test', spy4)).should.throw(Error);
    });

    it('should not add more regex listeners if regex limit exceed', function() {
        ee.setMaxRegexListeners(2);

        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        const spy4 = sinon.spy();

        ee.addListener(/test/, spy1);
        ee.addListener(/test/, spy2);
        (() => ee.addListener(/test/, spy3)).should.throw(Error);
        (() => ee.addListener(/test/, spy4)).should.throw(Error);
    });

    it('should not handler for another event name', function() {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        ee.addListener('test', spy1);
        ee.addListener('testtest', spy2);

        ee.emit('test');

        spy1.should.have.been.calledOnce;
        spy2.should.have.been.not.called;
    });

    it('should call regex handlers', function() {
        const spy = sinon.spy();
        ee.addListener(/test/, spy);

        ee.emit('test');
        ee.emit('some-test');
        ee.emit('sometestmore');

        spy.should.have.been.calledThrice;
    });

    it('should return array of handler returnings', function() {
        ee.addListener('test', () => 'test1');
        ee.addListener('test', () => 'test2');
        ee.addListener('test', () => 'test3');
        ee.addListener('another', () => 'test4');

        const result = ee.emit('test');
        result.should.be.deep.equal(['test1', 'test2', 'test3']);
    });

    it('should emit async', function(done) {
        ee.addListener('test', () => 'test1');
        ee.addListener('test', () => Promise.resolve('test2'));
        ee.addListener('test', () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve('test3');
                }, 10);
            });
        });
        ee.addListener('another', () => 'test4');

        ee
            .emitAsync('test')
            .then(result => {
                result.should.be.deep.equal(['test1', 'test2', 'test3']);
                done();
            })
            .catch(done);
    });

    it('should remove listener', function() {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);

        ee.removeListener('test', spy1);
        ee.emit('test');

        spy1.should.have.been.not.called;
        spy2.should.have.been.calledOnce;
    });

    it('should remove regex listener', function() {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();

        ee.addListener(/test/, spy1);
        ee.addListener(/test/, spy2);

        ee.removeListener(/test/, spy1);
        ee.emit('test');

        spy1.should.have.been.not.called;
        spy2.should.have.been.calledOnce;
    });

    it('should remove all listeners for event name', function() {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        const spy4 = sinon.spy();

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
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        const spy4 = sinon.spy();

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

    it('should get event names', function() {
        ee.addListener('test1', () => {});
        ee.addListener('test2', () => {});
        ee.addListener(/test3/, () => {});

        ee.eventNames().should.be.deep.equal(['test1', 'test2'])
    });

    it('should get regexes', function() {
        ee.addListener(/test1/, () => {});
        ee.addListener(/test2/, () => {});
        ee.addListener('test3', () => {});

        ee.regexes().should.be.deep.equal([/test1/, /test2/])
    });

    it('should get listener counts', function() {
        ee.addListener('test', () => {});
        ee.addListener('test', () => {});
        ee.addListener(/test/, () => {});
        ee.addListener('test2', () => {});

        ee.listenerCount('test').should.be.equal(2);
        ee.listenerCount(/test/).should.be.equal(1);
    });

    it('should get listeners', function() {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        const spy4 = sinon.spy();

        ee.addListener('test', spy1);
        ee.addListener('test', spy2);
        ee.addListener(/test/, spy3);
        ee.addListener('test2', spy4);

        ee.listeners('test').should.be.deep.equal([spy1, spy2]);
        ee.listeners(/test/).should.be.deep.equal([spy3]);
    });
});
