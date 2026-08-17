/**
 * The rules both runners use to decide whether a test or hook body is usable.
 *
 * Required by test/setup.js and loaded as a script by test/runner.html, so the
 * Node and browser paths cannot drift apart. They already had: the browser copy
 * let `beforeEach()` through and hung the page on it, while the Node copy let
 * `beforeEach('oops')` through and silently ran nothing.
 *
 * ES5, because the browser copy has to parse wherever dist/globals.js does.
 */
(function(root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.TestShape = factory();
})(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    var AMBIGUOUS_ARITY =
        'A test or hook taking exactly one parameter is ambiguous: node:test ' +
        'passes a TestContext there, mocha passes `done`. Take no parameters ' +
        'and return a promise, or take (t, done) and call done().';

    var MALFORMED_BODY =
        'This test or hook was given a body that is not a function. node:test ' +
        'reports that as a pass, so it is failed here instead.';


    function isOptions(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }


    /**
     * node:test takes ([name][, options][, fn]) for tests and (fn[, options])
     * for hooks, so the body is whichever argument comes last as a function.
     * Reading it positionally dropped the body of `it(name, options, fn)`.
     */
    function bodyOf(args) {
        for (var i = args.length - 1; i >= 0; i--)
            if (typeof args[i] === 'function') return args[i];

        return null;
    }


    /**
     * True when an argument sits where a name, options or a function belongs and
     * is none of them. node:test reports `it('x', 'oops')` as a pass, so the
     * shape has to be judged here rather than left to it.
     *
     * `named` is false for hooks, which have no name slot: a leading string is a
     * mistake there, not a title.
     */
    function hasMalformedBody(args, named) {
        for (var i = 0; i < args.length; i++) {
            if (typeof args[i] === 'function') return false;
            if (named && i === 0 && typeof args[i] === 'string') continue;
            if (isOptions(args[i])) continue;

            return true;
        }

        return false;
    }


    return {
        AMBIGUOUS_ARITY: AMBIGUOUS_ARITY,
        MALFORMED_BODY: MALFORMED_BODY,
        bodyOf: bodyOf,
        hasMalformedBody: hasMalformedBody
    };
});
