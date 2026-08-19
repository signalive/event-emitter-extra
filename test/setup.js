/**
 * Installs the globals test/test.js expects. Shared by test/runner.js and
 * test/runner-coverage.js, which otherwise differ only in what they put under
 * test: the built bundle or src.
 *
 * The browser run needs none of this: web-test-runner's mocha supplies the BDD
 * globals and rejects a mocha-style `done` body natively, and chai supplies
 * `assert` -- see web-test-runner.config.mjs and test/browser.test.js.
 */
const nodeTest = require('node:test');

const AMBIGUOUS_ARITY =
    'A test or hook taking exactly one parameter is ambiguous: node:test ' +
    'passes a TestContext there, mocha passes `done`. Take no parameters ' +
    'and return a promise, or take (t, done) and call done().';

const MALFORMED_BODY =
    'This test or hook was given a body that is not a function. node:test ' +
    'reports that as a pass, so it is failed here instead.';

function ambiguous() {
    throw new Error(AMBIGUOUS_ARITY);
}

function malformed() {
    throw new Error(MALFORMED_BODY);
}

function isOptions(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * node:test takes ([name][, options][, fn]) for tests and (fn[, options])
 * for hooks, so the body is whichever argument comes last as a function.
 * Reading it positionally dropped the body of `it(name, options, fn)`.
 */
function bodyIndexOf(args) {
    for (let i = args.length - 1; i >= 0; i--)
        if (typeof args[i] === 'function') return i;

    return -1;
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
    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === 'function') return false;
        if (named && i === 0 && typeof args[i] === 'string') continue;
        if (isOptions(args[i])) continue;

        return true;
    }

    return false;
}

/**
 * What each registrar allows in place of a body.
 *
 *   named        a name may lead the arguments. Hooks take (fn[, options]) with
 *                no name slot, so a leading string there is a mistake.
 *   arity        the one-parameter rule applies. It does not to describe:
 *                node:test always hands that callback a SuiteContext, and there
 *                is no mocha `describe(done)` convention to confuse it with, so
 *                applying the rule replaced legitimate `describe(name, fn(ctx))`
 *                bodies with an error and dropped every nested test.
 *   bodyRequired there is no such thing as a deliberately empty one. `it('x')`
 *                is a valid empty test; `beforeEach()` is not.
 */
const SHAPES = {
    suite: {named: true, arity: false, bodyRequired: false},
    test: {named: true, arity: true, bodyRequired: false},
    hook: {named: false, arity: true, bodyRequired: true}
};

/**
 * Hands back the arguments to pass on, with an unusable body replaced by a
 * function that fails and says why. Two shapes get caught:
 *
 *   - A body taking exactly one parameter, where the rule applies. node:test
 *     passes a TestContext there, so a leftover mocha-style `function(done)`
 *     calls a non-function inside a timer and the test reports green without
 *     asserting anything -- which is how two emitAsync tests here passed for
 *     nothing.
 *   - A body that is not a function at all. node:test reports `it('x', 'oops')`
 *     as a pass and silently ignores `beforeEach('oops')`.
 */
function guardBody(args, shape) {
    const out = Array.prototype.slice.call(args);
    const body = bodyIndexOf(out);

    if (body !== -1) {
        if (shape.arity && out[body].length === 1) out[body] = ambiguous;

        return out;
    }

    // No function anywhere.
    if (shape.bodyRequired) return [malformed];
    if (!hasMalformedBody(out, shape.named)) return out;

    // Keep the name so the failure is identifiable in the report.
    return [typeof out[0] === 'string' ? out[0] : 'unnamed', malformed];
}

/**
 * Carries .skip/.only/.todo across the wrapper. Dropping them made every
 * it.skip a TypeError while describe.skip kept working.
 */
function guard(register, shape) {
    const guarded = function() {
        return register.apply(null, guardBody(arguments, shape));
    };

    ['skip', 'only', 'todo'].forEach(variant => {
        if (typeof register[variant] !== 'function') return;

        guarded[variant] = function() {
            return register[variant].apply(null, guardBody(arguments, shape));
        };
    });

    return guarded;
}

module.exports = function setup() {
    global.assert = require('assert');
    global.sinon = require('sinon');
    global.Promise = require('promise-polyfill');

    global.describe = guard(nodeTest.describe, SHAPES.suite);
    global.it = guard(nodeTest.it, SHAPES.test);
    global.beforeEach = guard(nodeTest.beforeEach, SHAPES.hook);
    global.afterEach = guard(nodeTest.afterEach, SHAPES.hook);
};
