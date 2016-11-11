import isString from 'lodash/isString';
import isRegExp from 'lodash/isRegExp';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';


export default class Listener {
    constructor(eventName, handler, execLimit = 0) {
        if (isString(eventName)) {
            this.eventName = eventName;
        } else if (isRegExp(eventName)) {
            this.eventNameRegex = eventName;
        } else {
            throw new Error('Event name to be listened should be string or regex');
        }

        if (!isFunction(handler))
            throw new Error('Handler should be a function');

        if (!isNumber(execLimit) || parseInt(execLimit, 10) != execLimit)
            throw new Error('Execute limit should be integer');

        this.handler = handler;
        this.execCount = 0;
        this.execLimit = execLimit;
    }


    execute(that, args) {
        const rv = this.handler.apply(that, args);
        this.execCount++;

        if (this.execLimit && this.execCount >= this.execLimit) {
            this.onExpire(this);
        }

        return rv;
    }


    testRegexWith(eventName) {
        if (!isString(eventName))
            throw new Error('Event name should be string');

        const regex = this.eventNameRegex;

        if (!regex)
            throw new Error('This listener is not regex');

        return regex.test(eventName);
    }


    onExpire() {

    }
}
