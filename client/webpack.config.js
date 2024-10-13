const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/** @type {import('webpack').Configuration} */
const config = {
    context: path.resolve(__dirname, 'src'), // Установка контекста

    entry: './index.ts', // Основная точка входа
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        assetModuleFilename: '[path][name][ext]', // Сохранение структуры папок
        clean: true, // Очищает /dist перед сборкой
    },
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        port: 3000, // Порт для dev-сервера
        open: true, // Открывает браузер при запуске сервера
        hot: true, // Включает hot module replacement
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i, // Обработка изображений
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.png', '.svg', '.jpg', '.jpeg', '.gif'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'), // Правильный путь к index.html
        }),
    ],
    mode: 'development', // Режим разработки
};

module.exports = config;
