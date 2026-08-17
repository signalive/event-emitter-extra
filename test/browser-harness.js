/**
 * Browser stand-in for what `node:test` and `node:assert` hand the Node runners
 * (test/runner.js, test/runner-coverage.js): the BDD globals test/test.js calls,
 * an `assert` implementation, a script loader and a reporter.
 *
 * test/test.js is shared verbatim between Node and the browser, so this file
 * exists only to fill in the globals a browser does not have. It has no
 * dependencies on purpose: the previous browser runner pulled mocha, chai and
 * sinon-chai out of node_modules and broke silently the moment those left
 * package.json.
 *
 * Written in ES5 so it parses in the same old browsers the non-modern
 * dist/globals.js bundle targets. It never touches `Promise` itself, since
 * dist/globals.js installs a polyfill over the global as it loads.
 */
(function(window, document) {
    'use strict';

    // How long an async test may take before it is failed rather than left
    // hanging. node:test has no default timeout; a browser page needs one.
    var TIMEOUT_MS = 5000;

    // The run currently collecting results, so the page-level error listeners
    // registered at the bottom of this file have somewhere to report to.
    var activeRun = null;


    /* ---------------------------------------------------------------- assert */

    function fail(message) {
        var error = new Error(message);
        error.name = 'AssertionError';
        throw error;
    }

    function inspect(value, depth) {
        depth = depth || 0;

        if (value === null) return 'null';

        var type = typeof value;
        if (type === 'undefined') return 'undefined';
        if (type === 'string') return "'" + value + "'";
        if (type === 'function') return '[Function' + (value.name ? ': ' + value.name : '') + ']';
        if (type !== 'object') return String(value);

        if (value instanceof RegExp) return String(value);
        if (value instanceof Date) return value.toISOString();
        if (value instanceof Error) return (value.name || 'Error') + ': ' + value.message;

        var i;
        if (Array.isArray(value)) {
            if (depth > 2) return '[Array]';
            var items = [];
            for (i = 0; i < value.length; i++) items.push(inspect(value[i], depth + 1));
            return items.length ? '[ ' + items.join(', ') + ' ]' : '[]';
        }

        if (depth > 2) return '[Object]';
        var keys = Object.keys(value);
        var pairs = [];
        for (i = 0; i < keys.length; i++)
            pairs.push(keys[i] + ': ' + inspect(value[keys[i]], depth + 1));
        return pairs.length ? '{ ' + pairs.join(', ') + ' }' : '{}';
    }

    function isNaNValue(value) {
        return typeof value === 'number' && value !== value;
    }

    /**
     * Loose deep equality, matching `assert.deepEqual`: leaves compare with `==`,
     * functions compare by reference, regexes by source and flags.
     */
    function isDeepEqual(actual, expected, seenActual, seenExpected) {
        if (actual === expected) return true;
        if (isNaNValue(actual) && isNaNValue(expected)) return true;

        // Functions are never structurally compared, only by identity.
        if (typeof actual === 'function' || typeof expected === 'function') return false;

        if (actual === null || expected === null ||
            typeof actual !== 'object' || typeof expected !== 'object')
            return actual == expected;

        if (Object.prototype.toString.call(actual) !== Object.prototype.toString.call(expected))
            return false;

        if (actual instanceof RegExp)
            return String(actual) === String(expected) && actual.lastIndex === expected.lastIndex;
        if (actual instanceof Date)
            return actual.getTime() === expected.getTime();

        // Guard against cycles, so a self-referencing value fails instead of
        // hanging the browser.
        for (var s = 0; s < seenActual.length; s++)
            if (seenActual[s] === actual && seenExpected[s] === expected) return true;
        seenActual.push(actual);
        seenExpected.push(expected);

        try {
            if (Array.isArray(actual) && actual.length !== expected.length) return false;

            var keys = Object.keys(actual);
            if (keys.length !== Object.keys(expected).length) return false;

            for (var i = 0; i < keys.length; i++) {
                if (!Object.prototype.hasOwnProperty.call(expected, keys[i])) return false;
                if (!isDeepEqual(actual[keys[i]], expected[keys[i]], seenActual, seenExpected))
                    return false;
            }
            return true;
        } finally {
            seenActual.pop();
            seenExpected.pop();
        }
    }

    /**
     * Covers exactly the `node:assert` surface test/test.js uses. Anything else
     * fails loudly as "assert.<name> is not a function" rather than passing by
     * accident.
     */
    function assert(value, message) {
        assert.ok(value, message);
    }

    assert.ok = function(value, message) {
        if (!value)
            fail(message || 'Expected value to be truthy, got ' + inspect(value));
    };

    assert.equal = function(actual, expected, message) {
        if (isNaNValue(actual) && isNaNValue(expected)) return;
        if (actual != expected)
            fail(message || 'Expected ' + inspect(actual) + ' == ' + inspect(expected));
    };

    assert.deepEqual = function(actual, expected, message) {
        if (!isDeepEqual(actual, expected, [], []))
            fail(message || 'Expected ' + inspect(actual) + ' to deep equal ' + inspect(expected));
    };

    /**
     * `expected`, when given, must be an error constructor -- that is all
     * test/test.js passes. Regex and validation-function forms are not supported.
     */
    assert.throws = function(fn, expected, message) {
        var threw = false;
        var error = null;

        try {
            fn();
        } catch (e) {
            threw = true;
            error = e;
        }

        if (!threw)
            fail(message || 'Missing expected exception');

        if (typeof expected === 'function' && !(error instanceof expected))
            fail(message || 'Expected exception to be an instance of ' +
                (expected.name || 'the given constructor') + ', got ' + inspect(error));
    };


    /* --------------------------------------------------------------- bdd api */

    function Suite(title, parent) {
        this.title = title;
        this.parent = parent;
        this.suites = [];
        this.tests = [];
        this.beforeEachHooks = [];
        this.afterEachHooks = [];
    }

    var rootSuite = new Suite('', null);
    var currentSuite = rootSuite;

    function malformedBody() {
        throw new Error(TestShape.MALFORMED_BODY);
    }

    function addTest(title, args, flags) {
        var fn = TestShape.bodyOf(args);

        // `it('x')` on its own is a deliberate empty test and reports as skipped;
        // `it('x', 'oops')` is a typo and has to fail. test/setup.js applies the
        // same rule to the Node path from the same module.
        if (!fn && TestShape.hasMalformedBody(args, true)) fn = malformedBody;

        currentSuite.tests.push({
            title: title,
            fn: fn,
            suite: currentSuite,
            skip: !!flags.skip,
            todo: !!flags.todo
        });
    }

    function addSuite(title, args, flags) {
        var suite = new Suite(title, currentSuite);
        suite.skip = !!flags.skip;
        suite.todo = !!flags.todo;
        currentSuite.suites.push(suite);

        var fn = TestShape.bodyOf(args);

        if (!fn) {
            // `describe('x')` registers nothing and that is fine;
            // `describe('x', 'oops')` would otherwise drop the whole block.
            if (TestShape.hasMalformedBody(args, true))
                suite.tests.push({
                    title: 'was given a body that is not a function',
                    fn: malformedBody,
                    suite: suite
                });

            return;
        }

        var parent = currentSuite;
        currentSuite = suite;

        try {
            fn.call(suite);
        } catch (error) {
            // A throw while registering used to escape describe and take the
            // rest of the file with it: everything declared after the failing
            // line silently vanished from the run and the page still reported
            // green. Register it as a failing test instead.
            suite.tests.push({
                title: 'failed while registering this suite',
                fn: function() { throw error; },
                suite: suite
            });
        } finally {
            currentSuite = parent;
        }
    }

    // .only registers an ordinary test or suite and isolates nothing, because
    // plain `node --test` does not isolate either -- it needs --test-only, and
    // that cannot be wired into `npm test`: node:test then wants the marker on
    // the enclosing suite too, which collapses this suite from 38 tests to 1.
    // Isolating here would leave the page disagreeing with npm test.
    function describe(title) { addSuite(title, arguments, {}); }
    describe.only = describe;
    describe.skip = function(title) { addSuite(title, arguments, {skip: true}); };
    describe.todo = function(title) { addSuite(title, arguments, {todo: true}); };

    function it(title) { addTest(title, arguments, {}); }
    it.only = it;
    it.skip = function(title) { addTest(title, arguments, {skip: true}); };
    it.todo = function(title) { addTest(title, arguments, {todo: true}); };

    /**
     * A hook always needs a real body -- there is no deliberately empty one --
     * so anything else becomes a hook that fails and says so. Pushing the value
     * unchecked meant `beforeEach()` reached invoke() as undefined, threw a
     * TypeError outside its try, escaped the run loop and left the page stuck on
     * "Running N tests...".
     */
    function addHook(hooks, args) {
        hooks.push(TestShape.bodyOf(args) || malformedBody);
    }

    function beforeEach() {
        addHook(currentSuite.beforeEachHooks, arguments);
    }

    function afterEach() {
        addHook(currentSuite.afterEachHooks, arguments);
    }

    function collect(suite, path, out, inherited) {
        var here = suite.title ? path.concat([suite.title]) : path;
        var skip = inherited.skip || !!suite.skip;
        var todo = inherited.todo || !!suite.todo;
        var i, test;

        for (i = 0; i < suite.tests.length; i++) {
            test = suite.tests[i];
            out.push({
                title: test.title,
                fn: test.fn,
                suite: suite,
                path: here,
                skip: skip || !!test.skip || !test.fn,
                todo: todo || !!test.todo
            });
        }

        for (i = 0; i < suite.suites.length; i++)
            collect(suite.suites[i], here, out, {skip: skip, todo: todo});

        return out;
    }

    /**
     * beforeEach runs outermost suite first; afterEach runs innermost suite
     * first but keeps declaration order *within* a suite. So the suite chain is
     * reversed, never the flattened hook list -- reversing the flat list also
     * reverses sibling hooks against each other.
     */
    function hooksFor(suite, kind, innermostFirst) {
        var chain = [];
        for (var s = suite; s; s = s.parent) chain.unshift(s);
        if (innermostFirst) chain.reverse();

        var hooks = [];
        for (var i = 0; i < chain.length; i++)
            hooks = hooks.concat(chain[i][kind]);

        return hooks;
    }


    /* ---------------------------------------------------------------- runner */

    /**
     * Stand-in for the TestContext node:test passes as the first argument.
     * Nothing here uses it; it exists so arity dispatch matches node:test.
     */
    function testContext() {
        return {
            diagnostic: function() {}
        };
    }


    /**
     * Runs one test or hook and reports through `done`.
     *
     * Arity decides how it is called, matching node:test so test/test.js
     * behaves identically under both: two or more parameters means callback
     * style and the function MUST call its `done`, otherwise it may return a
     * thenable to be waited on. Getting this wrong is how a test passes without
     * ever asserting anything -- previously any function that returned no
     * thenable was called with no arguments and counted as an immediate pass,
     * so every callback-style test passed vacuously.
     *
     * Two deliberate departures from node:test, both because node:test's own
     * behaviour is what this repository already got burned by:
     *
     *   - A one-parameter function is refused outright. node:test hands it a
     *     TestContext, so a mocha-style `function(done)` calls a non-function
     *     asynchronously and the test passes green while asserting nothing.
     *     That is the exact bug that hid in this suite's emitAsync tests.
     *   - Callback-style functions time out, because a page waiting forever for
     *     a `done` that never arrives looks identical to one still working.
     */
    function invoke(fn, done) {
        var settled = false;
        var timer = null;
        var result;

        function settle(error) {
            if (settled) return;
            settled = true;
            if (timer !== null) window.clearTimeout(timer);
            done(error || null);
        }

        // Checked before `fn.length` is read: a non-function here used to throw a
        // TypeError outside the try below, which escaped the run loop entirely.
        if (typeof fn !== 'function') return settle(new Error(TestShape.MALFORMED_BODY));
        if (fn.length === 1) return settle(new Error(TestShape.AMBIGUOUS_ARITY));

        try {
            if (fn.length >= 2) {
                timer = window.setTimeout(function() {
                    settle(new Error('Timed out after ' + TIMEOUT_MS +
                        'ms: a callback-style function must call done()'));
                }, TIMEOUT_MS);

                fn(testContext(), settle);
                return;
            }

            result = fn(testContext());
        } catch (error) {
            return settle(error || new Error('Thrown value was falsy'));
        }

        if (!result || typeof result.then !== 'function') return settle(null);

        // The returned promise needs the same timeout the callback path has;
        // without it one that never settles leaves the page waiting forever.
        timer = window.setTimeout(function() {
            settle(new Error('Timed out after ' + TIMEOUT_MS +
                'ms: the returned promise never settled'));
        }, TIMEOUT_MS);

        result.then(function() {
            settle(null);
        }, function(error) {
            settle(error || new Error('Rejection reason was falsy'));
        });
    }


    /**
     * Calls `fns` in order, stopping at the first failure. Deliberately
     * callback-based rather than promise-based so the harness works whichever
     * `Promise` the bundle installs over the global.
     */
    function runSeries(fns, done) {
        var index = 0;

        function next(error) {
            if (error) return done(error);
            if (index >= fns.length) return done(null);

            invoke(fns[index++], next);
        }

        next(null);
    }

    function runTest(test, done) {
        var before = hooksFor(test.suite, 'beforeEachHooks', false);
        var after = hooksFor(test.suite, 'afterEachHooks', true);

        runSeries(before.concat([test.fn]), function(testError) {
            // afterEach always runs, but the test's own failure is the one reported.
            runSeries(after, function(hookError) {
                done(testError || hookError);
            });
        });
    }

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.appendChild(document.createTextNode(text));
        return node;
    }

    function describeError(error) {
        if (!error) return 'Unknown error';
        return String(error.stack || (error.name ? error.name + ': ' + error.message : error));
    }

    function run(container, onDone) {
        var tests = collect(rootSuite, [], [], {skip: false, todo: false});

        var results = {
            total: tests.length,
            pass: 0,
            fail: 0,
            skip: 0,
            todo: 0,
            failures: [],
            duration: 0
        };
        var startedAt = new Date().getTime();

        var summaryEl = element('div', 'summary running', 'Running ' + tests.length + ' tests…');
        var listEl = element('ul', 'results');
        container.appendChild(summaryEl);
        container.appendChild(listEl);

        var index = 0;
        var sinceYield = 0;
        var lastYield = startedAt;
        var running = null;
        var finished = false;
        var titleBase = document.title.replace(/^[✔✖]\s*/, '');

        function paintSummary() {
            var text = results.pass + ' passing, ' + results.fail + ' failing';
            if (results.skip) text += ', ' + results.skip + ' skipped';
            if (results.todo) text += ', ' + results.todo + ' todo';

            summaryEl.className = 'summary ' + (results.fail ? 'fail' : 'pass');
            summaryEl.firstChild.nodeValue = text + ' (' + results.duration + 'ms)';

            // Rewritten from a stored base rather than prepended, so a late
            // failure can correct a tab that already says everything passed.
            document.title = (results.fail ? '✖ ' : '✔ ') + titleBase;
        }

        /**
         * An error that escapes a test asynchronously -- thrown inside a timer,
         * or a rejection nobody returned -- is on no stack this runner controls,
         * so it used to leave the page green. Record it as a failure of its own,
         * naming whatever was running when it arrived. Reported even when it
         * lands after the run finished, since arriving late is not a reason to
         * call a suite clean.
         */
        function recordAsyncError(error, kind) {
            var where = running ? 'during ' + running :
                finished ? 'after the run finished' : 'between tests';
            var title = kind + ' ' + where;

            results.fail++;
            results.failures.push({title: title, error: describeError(error)});

            var item = element('li', 'test fail');
            item.appendChild(element('span', 'title', title));
            item.appendChild(element('pre', 'error', describeError(error)));
            listEl.appendChild(item);

            if (finished) {
                paintSummary();
                window.__testResults__ = results;
            }
        }

        activeRun = {recordAsyncError: recordAsyncError};

        // promise-polyfill, which the non-modern bundle installs over the global,
        // never dispatches unhandledrejection -- it calls this hook instead. It
        // is installed here rather than at load time because the bundle replaces
        // the global after this file runs.
        if (window.Promise && typeof window.Promise._unhandledRejectionFn === 'function')
            window.Promise._unhandledRejectionFn = function(reason) {
                if (activeRun) activeRun.recordAsyncError(reason, 'Unhandled rejection');
            };

        function finish() {
            finished = true;
            results.duration = new Date().getTime() - startedAt;
            paintSummary();

            // Machine-readable, so the page can also be checked by automation.
            window.__testResults__ = results;
            if (onDone) onDone(results);
        }

        /**
         * Yields to the browser every so often so results paint as they come in
         * and the stack stays flat -- but not after every test, because a
         * backgrounded tab clamps setTimeout to about a second and would stretch
         * a run that takes milliseconds out over a minute.
         */
        function scheduleNext() {
            sinceYield++;
            if (sinceYield < 20 && new Date().getTime() - lastYield < 50) return next();

            window.setTimeout(function() {
                // Start the budget when execution resumes, not when it was
                // scheduled, or a throttled tab re-yields on every single test.
                sinceYield = 0;
                lastYield = new Date().getTime();
                next();
            }, 0);
        }

        function row(test, className, suffix) {
            var item = element('li', className);
            if (test.path.length)
                item.appendChild(element('span', 'suite', test.path.join(' › ') + ' '));
            item.appendChild(element('span', 'title', test.title + (suffix || '')));
            return item;
        }

        function next() {
            if (index >= tests.length) return finish();

            var test = tests[index++];

            if (test.skip) {
                results.skip++;
                listEl.appendChild(row(test, 'test skip', ' (skipped)'));
                return scheduleNext();
            }

            running = test.path.concat([test.title]).join(' › ');

            runTest(test, function(error) {
                running = null;

                // A todo body runs, and a failure in it is not fatal -- which is
                // what node:test does. Counting todo as skip meant the body never
                // ran in the browser while it did under npm test.
                if (test.todo) {
                    results.todo++;
                    listEl.appendChild(row(test, 'test skip',
                        error ? ' (todo, failing)' : ' (todo, passing)'));
                    return scheduleNext();
                }

                var item = row(test, error ? 'test fail' : 'test pass');

                if (error) {
                    results.fail++;
                    results.failures.push({
                        title: test.path.concat([test.title]).join(' › '),
                        error: describeError(error)
                    });
                    item.appendChild(element('pre', 'error', describeError(error)));
                } else {
                    results.pass++;
                }

                listEl.appendChild(item);
                scheduleNext();
            });
        }

        next();
    }


    /* ------------------------------------------------------ script loading */

    /**
     * Loads `urls` strictly one after another. Injected scripts report a failed
     * fetch through `onerror`, which is what turns a missing file into a visible
     * message instead of a mystery `undefined is not a function` later on.
     */
    function loadScripts(urls, onDone, onError) {
        var index = 0;

        function next() {
            if (index >= urls.length) return onDone();

            var url = urls[index++];
            var script = document.createElement('script');
            script.src = url;
            script.onload = next;
            script.onerror = function() {
                onError(url);
            };
            document.head.appendChild(script);
        }

        next();
    }

    function showError(container, title, details) {
        var box = element('div', 'error-box');
        box.appendChild(element('h2', null, title));
        for (var i = 0; i < details.length; i++)
            box.appendChild(element('p', null, details[i]));
        container.appendChild(box);
    }


    // Registered once, not per run, so calling run() again does not double-count
    // async errors. `activeRun` points at the most recent run, which is what
    // makes a late error still land somewhere visible.
    window.addEventListener('error', function(event) {
        if (activeRun) activeRun.recordAsyncError(event.error || event.message, 'Uncaught error');
    });

    window.addEventListener('unhandledrejection', function(event) {
        if (activeRun) activeRun.recordAsyncError(event.reason, 'Unhandled rejection');
    });


    window.assert = assert;
    window.describe = describe;
    window.it = it;
    window.beforeEach = beforeEach;
    window.afterEach = afterEach;

    window.BrowserHarness = {
        run: run,
        loadScripts: loadScripts,
        showError: showError
    };
})(window, document);
