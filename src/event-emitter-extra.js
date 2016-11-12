import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import isRegExp from 'lodash/isRegExp';
import isString from 'lodash/isString';
import Listener from './listener';


class EventEmitterExtra {
    constructor() {
        this.maxListeners_ = EventEmitterExtra.defaultMaxListeners;
        this.maxRegexListeners_ = EventEmitterExtra.defaultMaxRegexListeners;
        this.listeners_ = [];
        this.regexListeners_ = [];
        this.eventListeners_ = {};
    }


    addListener(eventName, handler, opt_execLimit) {
        if (isArray(eventName) || isArray(handler)) {
            const events = isArray(eventName) ? eventName : [eventName];
            const handlers = isArray(handler) ? handler : [handler];
            events.forEach(event => {
                handlers.forEach(handler => {
                    this.addListener(event, handler, opt_execLimit);
                });
            });
            return;
        }

        const listener = new Listener(eventName, handler, opt_execLimit);

        if (listener.eventName) {
            if (!this.eventListeners_[listener.eventName])
                this.eventListeners_[listener.eventName] = [];

            if (this.eventListeners_[listener.eventName].length >= this.maxListeners_)
                throw new Error(`Max listener count reached for event: ${eventName}`);

            this.emit('newListener', eventName, handler);
            this.eventListeners_[listener.eventName].push(listener);
        } else if (listener.eventNameRegex) {
            if (this.regexListeners_.length >= this.maxRegexListeners_)
                throw new Error(`Max regex listener count reached`);

            this.emit('newListener', eventName, handler);
            this.regexListeners_.push(listener);
        }

        listener.onExpire = this.removeListener_.bind(this);
        this.listeners_.push(listener);
    }


    removeListener_(listener) {
        remove(this.listeners_, listener);

        if (listener.eventName && isArray(this.eventListeners_[listener.eventName])) {
            remove(this.eventListeners_[listener.eventName], listener);

            if (this.eventListeners_[listener.eventName].length == 0)
                delete this.eventListeners_[listener.eventName];
        } else if (listener.eventNameRegex) {
            remove(this.regexListeners_, listener);
        }

        this.emit('removeListener', listener.eventName || listener.eventNameRegex, listener.handler);
    }


    removeAllListeners(eventName) {
        if (isArray(eventName)) {
            eventName.forEach(event => this.removeAllListeners(event));
        } else if (isString(eventName) && isArray(this.eventListeners_[eventName])) {
            const listeners = this.eventListeners_[eventName].slice();
            listeners.forEach(listener => {
                this.removeListener_(listener);
            });
        } else if (isRegExp(eventName)) {
            const regex = eventName;
            const listeners = this.regexListeners_.filter(listener => regexEquals(listener.eventNameRegex, regex));
            listeners.forEach(listener => this.removeListener_(listener));
        } else {
            throw new Error('Event name should be string or regex.');
        }
    }


    removeListener(eventName, handler) {
        if (isArray(eventName) || isArray(handler)) {
            const events = isArray(eventName) ? eventName : [eventName];
            const handlers = isArray(handler) ? handler : [handler];
            events.forEach(event => {
                handlers.forEach(handler => {
                    this.removeListener(event, handler);
                });
            });
        } else if (isString(eventName) && isArray(this.eventListeners_[eventName])) {
            const listeners = this.eventListeners_[eventName].filter(listener => listener.handler == handler);
            listeners.forEach(listener => this.removeListener_(listener));
        } else if (isRegExp(eventName)) {
            const regex = eventName;
            const listeners = this.regexListeners_.filter(
                listener =>
                    regexEquals(listener.eventNameRegex, regex) &&
                    listener.handler == handler
            );
            listeners.forEach(listener => this.removeListener_(listener));
        } else {
            throw new Error('Event name should be string or regex.');
        }
    }


    eventNames() {
        return Object.keys(this.eventListeners_);
    }


    regexes() {
        return this.regexListeners_.map(listener => listener.eventNameRegex);
    }


    getMaxListeners() {
        return this.maxListeners_;
    }


    setMaxListeners(n) {
        if (!isNumber(n) || parseInt(n, 10) != n)
            throw new Error('n must be integer');

        this.maxListeners_ = n;
    }


    getMaxRegexListeners() {
        return this.maxRegexListeners_;
    }


    setMaxRegexListeners(n) {
        if (!isNumber(n) || parseInt(n, 10) != n)
            throw new Error('n must be integer');

        this.maxRegexListeners_ = n;
    }


    listenerCount(eventName) {
        // TODO: Support arrays
        if (isString(eventName)) {
            if (!this.eventListeners_[eventName])
                return 0;

            return this.eventListeners_[eventName].length;
        } else if (isRegExp(eventName)) {
            return this.regexListeners_
                .filter(listener => regexEquals(eventName, listener.eventNameRegex))
                .length;
        } else {
            throw new Error('Event name should be string or regex.');
        }
    }


    listeners(eventName) {
        // TODO: Support arrays
        if (isString(eventName)) {
            if (!this.eventListeners_[eventName])
                return [];

            return this.eventListeners_[eventName].map(listener => listener.handler);
        } else if (isRegExp(eventName)) {
            return this.regexListeners_
                .filter(listener => regexEquals(eventName, listener.eventNameRegex))
                .map(listener => listener.handler);
        } else {
            throw new Error('Event name should be string or regex.');
        }
    }


    on(eventName, handler) {
        this.addListener(eventName, handler);
    }


    once(eventName, handler) {
        this.addListener(eventName, handler, 1);
    }


    many(eventName, count, handler) {
        this.addListener(eventName, handler, count);
    }


    emit(eventName, ...args) {
        if (isArray(eventName)) {
            let rv = [];
            eventName.forEach(event => {
                const results = this.emit(event, ...args);
                rv = rv.concat(results);
            });
            return rv;
        } else if (!isString(eventName)) {
            throw new Error('Event name should be string');
        }

        let results = [];

        if (this.eventListeners_[eventName]) {
            const nameMatchedResults = this.eventListeners_[eventName]
                .map(listener => listener.execute(null, args));
            results = results.concat(nameMatchedResults);
        }

        const regexMatchedResults = this.regexListeners_
            .filter(listener => listener.testRegexWith(eventName))
            .map(listener => listener.execute(null, args));

        results = results.concat(regexMatchedResults);

        return results;
    }


    emitAsync(...args) {
        return Promise.all(this.emit(...args));
    }
}


EventEmitterExtra.defaultMaxListeners = 10;
EventEmitterExtra.defaultMaxRegexListeners = 10;
EventEmitterExtra.Listener = Listener;


function regexEquals(a, b) {
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    return a.toString() === b.toString();
}


function remove(arr, predicate) {
    let removedItems = [];

    if (isFunction(predicate)) {
        removedItems = arr.filter(predicate);
    } else if (arr.indexOf(predicate) > -1) {
        removedItems.push(predicate);
    }

    removedItems.forEach(item => {
        const index = arr.indexOf(item);
        arr.splice(index, 1);
    });

    return removedItems;
}


module.exports = EventEmitterExtra;
