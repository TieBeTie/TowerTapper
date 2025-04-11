const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

// Получаем информацию о режиме сборки и уровне обфускации
const isProduction = process.env.NODE_ENV === 'production';
const obfuscationLevel = process.env.OBFUSCATION_LEVEL || 'none'; // none, basic, advanced

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
        host: 'localhost',
        open: true,
        hot: true,
        allowedHosts: 'all'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/, // Added TypeScript handling
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            compilerOptions: {
                                declaration: true,
                                declarationDir: './dist/types'
                            }
                        }
                    }
                ],
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
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.d.ts'], // Added .ts and .tsx
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
                OBFUSCATION_LEVEL: JSON.stringify(process.env.OBFUSCATION_LEVEL || 'none'),
            }
        }),
    ],
    mode: isProduction ? 'production' : 'development',
};

// Добавляем настройки оптимизации для продакшн режима
if (isProduction) {
    config.optimization = {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true, // Удаляет console.log
                    },
                    mangle: true, // Запутывание имен переменных
                    format: {
                        comments: false, // Удаляет комментарии
                    },
                },
            }),
        ],
    };
    
    // Добавляем обфускацию в зависимости от выбранного уровня
    if (obfuscationLevel === 'basic') {
        config.plugins.push(
            new JavaScriptObfuscator({
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                renameGlobals: false,
                rotateStringArray: true,
                selfDefending: true,
                shuffleStringArray: true,
                splitStrings: false,
                stringArray: true,
                stringArrayEncoding: false,
                stringArrayThreshold: 0.75,
                unicodeEscapeSequence: false
            })
        );
    } else if (obfuscationLevel === 'advanced') {
        config.plugins.push(
            new JavaScriptObfuscator({
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: true,
                debugProtectionInterval: 2000,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                renameGlobals: true,
                rotateStringArray: true,
                selfDefending: true,
                shuffleStringArray: true,
                splitStrings: true,
                splitStringsChunkLength: 10,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: true
            })
        );
    }
}

module.exports = config;
