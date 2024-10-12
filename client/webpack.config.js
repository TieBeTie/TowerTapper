const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        port: 3000, // Port for the development server
        open: true, // Opens browser on server start
        hot: true, // Enables hot module replacement
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
    ],
    mode: 'development', // Development mode
};

module.exports = config;