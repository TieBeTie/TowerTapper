#!/usr/bin/env node

/**
 * Скрипт для управления обфускацией кода
 */

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Описание уровней обфускации
const obfuscationLevels = {
  none: 'Без обфускации - код будет минифицирован, но сохранит читаемую структуру',
  basic: 'Базовая обфускация - запутывание имен, строковые массивы, самозащита',
  advanced: 'Продвинутая обфускация - максимальная защита с запутыванием потока, защитой от отладки и шифрованием строк'
};

// Функция для запуска сборки с выбранным уровнем обфускации
function buildWithObfuscation(level) {
  console.log(`\nЗапуск сборки с уровнем обфускации: ${level}`);
  
  const command = `npm run build:prod:obfuscate:${level}`;
  
  console.log(`> ${command}\n`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    
    console.log(stdout);
    console.log(`\nСборка с уровнем обфускации '${level}' успешно завершена!`);
    console.log(`Скомпилированные файлы находятся в директории dist/`);
    
    if (level !== 'none') {
      console.log(`\nКод был успешно обфусцирован с уровнем: ${level}`);
      console.log('Это значительно усложнит анализ и обратную разработку вашего приложения.');
    }
    
    process.exit(0);
  });
}

// Главное меню
function showMainMenu() {
  console.clear();
  console.log('=== Помощник по обфускации кода ===\n');
  console.log('Выберите уровень обфускации для сборки:');
  
  console.log('\n1. Без обфускации');
  console.log('   - Только минификация кода');
  console.log('   - Удаление комментариев и пробелов');
  console.log('   - Код остаётся относительно читаемым\n');
  
  console.log('2. Базовая обфускация');
  console.log('   - Переименование переменных и функций');
  console.log('   - Преобразование строк в массивы');
  console.log('   - Базовая защита кода\n');
  
  console.log('3. Продвинутая обфускация');
  console.log('   - Максимальное запутывание кода');
  console.log('   - Защита от отладки');
  console.log('   - Шифрование строк и преобразование объектов');
  console.log('   - Внедрение мёртвого кода\n');
  
  console.log('0. Выход\n');
  
  rl.question('Выберите опцию (0-3): ', (answer) => {
    switch(answer) {
      case '1':
        buildWithObfuscation('none');
        break;
      case '2':
        buildWithObfuscation('basic');
        break;
      case '3':
        buildWithObfuscation('advanced');
        break;
      case '0':
        console.log('Выход из программы.');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Неверный ввод. Пожалуйста, выберите опцию от 0 до 3.');
        setTimeout(showMainMenu, 1500);
    }
  });
}

// Запуск главного меню
showMainMenu(); 