const webpack = require('webpack');

const definePlugin = new webpack.DefinePlugin({
    __MODERN__: JSON.stringify(false)
});
const modernDefinePlugin = new webpack.DefinePlugin({
    __MODERN__: JSON.stringify(true)
});

module.exports = [
    {
        name: 'commonjs',
        entry: './src/event-emitter-extra.js',
        output: {
            filename: 'commonjs.js',
            path: __dirname + '/dist',
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    loaders: ['babel-loader']
                }
            ]
        },
        plugins: [
            definePlugin
        ],
        devtool: 'source-map'
    },
    {
        name: 'commonjs:modern',
        entry: './src/event-emitter-extra.js',
        output: {
            filename: 'commonjs.modern.js',
            path: __dirname + '/dist',
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    loaders: ['babel-loader']
                },
                { test: /promise-polyfill/, loader: 'ignore-loader' }
            ]
        },
        plugins: [
            modernDefinePlugin
        ],
        devtool: 'source-map'
    },
    {
        name: 'globals',
        entry: './src/event-emitter-extra.js',
        output: {
            filename: 'globals.js',
            path: __dirname + '/dist',
            library: 'EventEmitterExtra',
            libraryTarget: 'var'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    loaders: ['babel-loader']
                }
            ]
        },
        plugins: [
            definePlugin
        ],
        devtool: 'source-map'
    },
    {
        name: 'globals:modern',
        entry: './src/event-emitter-extra.js',
        output: {
            filename: 'globals.modern.js',
            path: __dirname + '/dist',
            library: 'EventEmitterExtra',
            libraryTarget: 'var'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    loaders: ['babel-loader']
                },
                { test: /promise-polyfill/, loader: 'ignore-loader' }
            ]
        },
        plugins: [
            modernDefinePlugin
        ],
        devtool: 'source-map'
    }
];
