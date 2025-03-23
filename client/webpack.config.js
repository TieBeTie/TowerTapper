const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

/** @type {import('webpack').Configuration} */
const config = {
    entry: './src/index.ts', // Updated entry point to TypeScript
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true, // Cleans /dist before each build
    },
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        port: 80,
        host: '0.0.0.0',
        open: true,
        hot: true,
        allowedHosts: 'all'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/, // Added TypeScript handling
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.(js|jsx)$/, // Handling JS and JSX files
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/, // Handling CSS files
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i, // Handling images
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[path][name][ext]',
                },
            },
            {
                test: /\.(ttf|woff|woff2|xml)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/fonts/[name][ext]',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'], // Added .ts and .tsx
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'), // Correct path to index.html
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'assets',
                    to: 'assets',
                },
            ],
        }),
        new webpack.DefinePlugin({
            'process.env': {
                SERVER_PORT: JSON.stringify(process.env.SERVER_PORT || '8080'),
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
            }
        }),
    ],
    mode: 'development', // Development mode
};

module.exports = config;
