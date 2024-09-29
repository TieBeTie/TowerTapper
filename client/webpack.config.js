const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development', // Измените на 'production' для продакшен-сборки
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true, // Очищает /dist перед каждой сборкой
    },
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        port: 3000, // Порт, на котором будет запущен сервер
        open: true, // Открывает браузер при запуске сервера
        hot: true, // Включает горячую перезагрузку
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/, // Обработка .js и .jsx файлов
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/, // Обработка .css файлов
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i, // Обработка изображений
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'], // Позволяет импортировать без указания расширений
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html', // Обновлено на ./public/index.html
        }),
    ],
};