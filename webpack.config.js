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
    }
];
