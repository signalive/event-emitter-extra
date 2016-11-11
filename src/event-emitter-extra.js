import isString from 'lodash/isString';
import isRegExp from 'lodash/isRegExp';
import isNumber from 'lodash/isNumber';
import remove from 'lodash/remove';
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
        const listener = new Listener(eventName, handler, opt_execLimit);

        if (listener.eventName) {
            if (!this.eventListeners_[listener.eventName])
                this.eventListeners_[listener.eventName] = [];

            if (this.eventListeners_[listener.eventName].length >= this.maxListeners_)
                throw new Error(`Max listener count reached for event: ${eventName}`);

            this.eventListeners_[listener.eventName].push(listener);
        } else if (listener.eventNameRegex) {
            if (this.regexListeners_.length >= this.maxRegexListeners_)
                throw new Error(`Max regex listener count reached`);

            this.regexListeners_.push(listener);
        }

        listener.onExpire = this.removeListener_.bind(this);
        this.listeners_.push(listener);
    }


    removeListener_(listener) {
        remove(this.listeners_, listener);

        if (listener.eventName && this.eventListeners_[listener.eventName]) {
            remove(this.eventListeners_[listener.eventName], listener);

            if (this.eventListeners_[listener.eventName].length == 0)
                delete this.eventListeners_[listener.eventName];
        } else if (listener.eventNameRegex) {
            remove(this.regexListeners_, listener);
        }
    }


    removeAllListeners(eventName) {
        if (isString(eventName)) {
            remove(this.listeners_, listener => listener.eventName == eventName);
            delete this.eventListeners_[eventName];
        } else if (isRegExp(eventName)) {
            const regex = eventName;
            remove(this.regexListeners_, listener => regexEquals(listener.eventNameRegex, regex));
            remove(this.listeners_, listener => regexEquals(listener.eventNameRegex, regex));
        } else {
            throw new Error('Event name should be string or regex.');
        }
    }


    removeListener(eventName, handler) {
        if (isString(eventName)) {
            const [listener] = remove(this.eventListeners_[eventName], listener => listener.handler == handler);
            remove(this.listeners_, listener);
        } else if (isRegExp(eventName)) {
            const regex = eventName;
            const [listener] = remove(
                this.regexListeners_,
                listener =>
                    regexEquals(listener.eventNameRegex, regex) &&
                    listener.handler == handler
            );
            remove(this.listeners_, listener);
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
        if (!isString(eventName))
            throw new Error('Event name should be string');

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
}


EventEmitterExtra.defaultMaxListeners = 10;
EventEmitterExtra.defaultMaxRegexListeners = 10;
EventEmitterExtra.Listener = Listener;


function regexEquals(a, b) {
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    return a.toString() === b.toString();
}


module.exports = EventEmitterExtra;
