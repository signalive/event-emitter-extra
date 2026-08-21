# EventEmitterExtra

EventEmitterExtra is an implementation of node.js's EventEmitter
where can be found in `events` module. The interface is exactly same
with node.js's EventEmitter. So you can directly replace
`require('events')` to `require('event-emitter-extra')` without any
hassle.

Extra features to boost your flow:
- Regex support for listening
- `emit()` method returns all results of listener functions
- Times to listen (TTL) with `many()` (Idea borrowed from [EventEmitter2](https://github.com/asyncly/EventEmitter2))
- Works in Node.js > v0.10
- Works in browsers
- Built-in typescript support

## Getting Started

Install EventEmitterExtra as a dependency:

```bash
npm i event-emitter-extra
# or
yarn add event-emitter-extra
```

Require EventEmitterExtra:

```js
// As commonjs module (nodejs, webpack)
const EventEmitterExtra = require('event-emitter-extra');
```

```html
<!-- In browsers -->
<script src="./node_modules/event-emitter-extra/dist/globals.js"></script>

<!--  In modern browsers (No polyfills, smaller size) -->
<script src="./node_modules/event-emitter-extra/dist/globals.modern.js"></script>
```

Directly usage:

```js
const ee = new EventEmitterExtra();

ee.on('greeting', function(name) {
    console.log(`Hello ${name}`);
});

ee.on(/gre/, function(name) {
    console.log('Regex is awesome');
});

ee.emit('greeting', 'world');
// => Hello world
// => Regex is awesome
```

Inheritence in ES6:

```js
class myEventEmitter extends EventEmitterExtra {
    sayHello(name) {
        this.emit('hello', name)
    }
}

const ee = new myEventEmitter();

ee.on('hello', name => {
    console.log(`${name} is saying hello`);
});

ee.sayHello('world');
// => world is saying hello
```

Emit results:

```js
const ee = new EventEmitterExtra();

// Emit result is false, because there is no listener yet
const result1 = ee.emit('greeting');
// result1 == false

// Add some listeners
ee.on('greeting', () => {
    return 'Hello from listener 1';
});

ee.on('greeting', () => {
    return 'Hello from listener 2';
});

// Emit again
const result2 = ee.emit('greeting');
// result2 == ['Hello from listener 1', 'Hello from listener 2']
```

Advanced promise flows with `emitAsync`:

```js
const ee = new EventEmitterExtra();

ee
    .emitAsync('some-task')
    .then(() => {
        // This will be never called
    })
    .catch(err => {
        // err => 'No listener'
    });

// Add some listeners
ee.on('some-task', () => {
    return Promise.resolve('result 1');
});

ee.on('some-task', () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('result 2');
        }, 1000);
    });
});

// Emit again
ee
    .emitAsync('some-task')
    .then((results) => {
        // reults == ['result 1', 'result 2']
    });
```

## API

### `EventEmitterExtra.defaultMaxListeners`

By default, a maximum of 10 listeners can be registered for any single event.

### `EventEmitterExtra.defaultMaxRegexListeners`

Maximum number for regex listeners. Defaults to 10.

### `new EventEmitterExtra()`

Creates new event emitter.

### `EventEmitterExtra.prototype.addListener(eventName, listener[, ttl])`

Adds a new listener.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`
- ttl: `Number` Optional times to listen. Defaults to 0 (no limit).

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.emit(eventName[, ...args])`

Synchronously calls each of the listeners registered for the event named eventName,
in the order they were registered, passing the supplied arguments to each.

- eventName: `String|Array.<String>`

Returns `false` if there is no listener for event.
If there are listeners, it returns array of listener returns.

```js
const ee = new EventEmitterExtra();
ee.on('test', _ => 'hello');
ee.on('test', _ => 'world');

const results = ee.emit('test');
console.log(results);
// => ['hello', 'world']
```

### `EventEmitterExtra.prototype.emitAsync(eventName[, ...args])`

If listener functions return Promise, wait for them resolving.

```js
const ee = new EventEmitterExtra();
ee.on('test', _ => 'hello');
ee.on('test', _ => Promise.resolve('world'));

ee
    .emit('test')
    .then((results) => {
        console.log(results);
        // => ['hello', 'world']
    });
```

### `EventEmitterExtra.prototype.eventNames()`

Returns an array listing the events for which the emitter has registered listeners.

### `EventEmitterExtra.prototype.getMaxListeners()`

Returns the current max listener value for the EventEmitter
which is either set by ee.setMaxListeners(n) or defaults to
EventEmitterExtra.defaultMaxListeners.

### `EventEmitterExtra.prototype.getMaxRegexListeners()`

Returns the current max regex listener value for the EventEmitter
which is either set by ee.setMaxRegexListeners(n) or defaults to
EventEmitterExtra.defaultMaxRegexListeners.

### `EventEmitterExtra.prototype.listenerCount(eventName)`

Returns number of listeners.

- eventName: `String|RegExp`

### `EventEmitterExtra.prototype.listeners(eventName)`

Returns array of listener functions.

- eventName: `String|RegExp`

### `EventEmitterExtra.prototype.on(eventName, listener)`

Alias for `ee.addEventListener(eventName, listener)`.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.once(eventName, listener)`

Alias for `ee.addEventListener(eventName, listener, 1)`.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.many(eventName, ttl, listener)`

Alias for `ee.addEventListener(eventName, listener, ttl)`.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`
- ttl: Times to listen

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.prependListener(eventName, listener[, ttl])`

Adds the listener function to the beginning of the listeners array for the event named eventName.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`
- ttl: Times to listen

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.prependOnceListener(eventName, listener)`

Alias for `ee.prependListener(eventName, listener, 1)`.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.prependManyListener(eventName, ttl, listener)`

Alias for `ee.prependListener(eventName, listener, ttl)`.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`
- ttl: Times to listen

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.removeAllListeners(eventName)`

Removes all listeners, or those of the specified eventName.
If eventName is not provided, all the event & regex listeners will be removed.

- eventName: `String|RegExp|Array.<String|RegExp>`

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.removeListener(eventName, listener)`

Removes all listeners, or those of the specified eventName.

- eventName: `String|RegExp|Array.<String|RegExp>`
- listener: `Function|Array.<Function>`

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.setMaxListeners(n)`

By default EventEmitterExtra does not allow you add listener if more than 10
listeners are added for a particular event. This is a useful
default that helps finding memory leaks. Obviously, not all
events should be limited to just 10 listeners. The
emitter.setMaxListeners() method allows the limit to be
modified for this specific EventEmitter instance.
The value can be set to 0 to indicate an unlimited number
of listeners.

- n: `Number`

Returns EventEmitterExtra instance for chaining.

### `EventEmitterExtra.prototype.setMaxRegexListeners(n)`

By default EventEmitterExtra does not allow you add regex
listener if more than 10 regex listeners are added before.

- n: `Number`

Returns EventEmitterExtra instance for chaining.

## Development

The build and test toolchain needs Node.js `^20.19 || ^22.12 || >=23` — the
floor is c8's, and it does exclude 21.x and 22.0–22.11. The published bundles
are ES5, so consumers are not bound by any of that. Tests run on Node's
built-in test runner, so there is no third-party test framework to install.

```bash
npm ci
npm run build
npm test
npm run coverage
npm run check:es5
```

`test/test.js` also runs in a real browser, against the built bundles rather
than against `src`:

```bash
npx playwright install chromium
npm run test:browser
```

That rebuilds and runs the same 38 tests headlessly in Chromium via
@web/test-runner — once against `dist/globals.js` and once against
`dist/globals.modern.js` — and exits non-zero on failure, so CI runs it on
every push. The runner needs Node 22+; the Node-only paths above keep working
on the documented floor. Two wiring details worth knowing: the bundles are
classic `var` scripts, so the runner page loads them with a plain `<script>`
tag rather than as modules, and `assert` comes from chai, whose ESM build
stands in for the `node:assert` methods the tests use.

Two things worth knowing about coverage and the browser run:

- Chromium is a modern engine, so this cannot verify old-browser behaviour.
  `npm run check:es5` verifies in CI that all four bundles still parse as ES5;
  runtime behaviour in anything older than evergreen browsers stays unchecked.
- `npm run coverage` measures `src` with `__MODERN__` set, so the polyfill
  branch at the top of `src/event-emitter-extra.js` — the code that only the
  non-modern bundle takes — is excluded rather than tested. It is marked with a
  `c8 ignore` to say so out loud instead of showing up as an unexplained gap.

