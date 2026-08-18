const path = require('path');
const webpack = require('webpack');

// Every bundle is emitted as ES5 so that the non-modern builds stay parseable by
// the same old browsers their polyfills target. `modern` only strips polyfills.
function bundle(name, filename, library, modern) {
    return {
        name: name,
        entry: './src/event-emitter-extra.js',
        target: ['web', 'es5'],
        output: {
            filename: filename,
            path: path.resolve(__dirname, 'dist'),
            library: library
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    use: ['babel-loader']
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                __MODERN__: JSON.stringify(modern)
            })
        ],
        devtool: 'source-map'
    };
}

// A fresh library object per entry: webpack normalizes these in place, so the
// four configs must not share one.
module.exports = [
    bundle('commonjs', 'commonjs.js', {type: 'commonjs2'}, false),
    bundle('commonjs:modern', 'commonjs.modern.js', {type: 'commonjs2'}, true),
    bundle('globals', 'globals.js', {name: 'EventEmitterExtra', type: 'var'}, false),
    bundle('globals:modern', 'globals.modern.js', {name: 'EventEmitterExtra', type: 'var'}, true)
];
