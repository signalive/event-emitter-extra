const webpack = require('webpack');

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
        devtool: 'source-map'
    }
];
