#!/usr/bin/env node

const path = require('path');
const { BenchmarkRunner } = require('./benchmark-runner');
const { listAvailableFunctions, getFunctionByKey } = require('./functions-registry');
const config = require('./config');
const { initWasm } = require('../../wasm');

// Парсинг аргументов командной строки
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        functionKey: null,
        help: false,
        listFunctions: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
                options.help = true;
                break;
            
            case '--functions':
                options.listFunctions = true;
                break;
            
            default:
                // Если аргумент не начинается с --, считаем его пресетом или функцией
                if (!arg.startsWith('--')) {
                    options.functionKey = arg;
                }
                break;
        }
    }
  
    return options;
}

// Показать справку
function showHelp() {
    console.log(`
🚀 Изолированные бенчмарки умножения матриц

ИСПОЛЬЗОВАНИЕ:
    npm run isolated-benchmark [функция] [опции]

ПРИМЕРЫ:
    npm run isolated-benchmark cpp.simd
    npm run isolated-benchmark --functions

ОПЦИИ:
    --help              Показать эту справку
    --functions         Показать доступные функции

ФОРМАТЫ ФУНКЦИЙ:
    tech.name               Например: js.base, cpp.simd, rust.accelerate
    `);
}

// Генерация имени выходного файла
function generateOutputFileName(options) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    let basename;

    if (options.functionKey) {
        basename = `${options.functionKey.replace('.', '_')}`;
    }

    return path.resolve(config.outputDir, `${basename}_${timestamp}.csv`);
}

// Основная функция
async function main() {
    const options = parseArgs();

    // Показать справку
    if (options.help) {
        showHelp();
        return;
    }

    // Показать функции
    if (options.listFunctions) {
        listAvailableFunctions();
        return;
    }
  
    await initWasm();
    try {
        // Создаем раннер с кастомной конфигурацией
        const runner = new BenchmarkRunner();
    
        let functions = [];
        let outputFile;
        
        // Определяем какие функции тестировать
        if (options.functionKey) {
            const funcConfig = getFunctionByKey(options.functionKey);
            if (!funcConfig || !funcConfig.available) {
                console.error(`❌ Функция ${options.functionKey} недоступна`);
                console.log('\n💡 Используйте --functions для просмотра доступных функций');
                return;
            }
            
            functions = [options.functionKey];
            outputFile = generateOutputFileName(options);
                    
            console.log(`🎯 Запуск бенчмарков:`);
            console.log(`   • Функция: ${options.functionKey}`);
            console.log(`   • Размеры: ${runner.config.matrixSizes.join(', ')}`);
            console.log(`   • Файл: ${path.basename(outputFile)}\n`);
            
            await runner.runFunction(options.functionKey, outputFile);
            return;
        } 
    
        if (!options.functionKey) {
            console.error('❌ Нет функции для тестирования');
            console.log('💡 Используйте --functions для просмотра доступных функций');
            return;
        }      
    } catch (error) {
        console.error(`❌ Критическая ошибка: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Запуск
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Неожиданная ошибка:', error);
        process.exit(1);
    });
}

module.exports = { main, parseArgs, showHelp }; 