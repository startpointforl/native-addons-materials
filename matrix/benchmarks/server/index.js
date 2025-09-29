#!/usr/bin/env node

const path = require('path');
const { ServerRunner } = require('./server-runner');
const { listAvailableEndpoints, getEndpointByKey } = require('./endpoints-registry');
const config = require('./config');

// Парсинг аргументов командной строки
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        endpointKey: null,
        help: false,
        listEndpoints: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
                options.help = true;
                break;
            
            case '--endpoints':
                options.listEndpoints = true;
                break;
            
            default:
                // Если аргумент не начинается с --, считаем его эндпоинтом
                if (!arg.startsWith('--')) {
                    options.endpointKey = arg;
                }
                break;
        }
    }
  
    return options;
}

// Показать справку
function showHelp() {
    console.log(`
🚀 Server бенчмарки умножения матриц

ИСПОЛЬЗОВАНИЕ:
    npm run server-benchmark [эндпоинт] [опции]

ПРИМЕРЫ:
    npm run server-benchmark cpp.simd
    npm run server-benchmark rust.accelerate
    npm run server-benchmark --endpoints

ОПЦИИ:
    --help, -h          Показать эту справку
    --endpoints         Показать доступные эндпоинты

ФОРМАТЫ ЭНДПОИНТОВ:
    tech.name               Например: js.base, cpp.simd, rust.accelerate
    `);
}

// Генерация имени выходного файла
function generateOutputFileName(options) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    let basename;

    if (options.endpointKey) {
        basename = `${options.endpointKey.replace('.', '_')}`;
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

    // Показать эндпоинты
    if (options.listEndpoints) {
        await listAvailableEndpoints();
        return;
    }
  
    try {
        // Создаем раннер
        const runner = new ServerRunner();
    
        let outputFile;
        
        // Определяем какой эндпоинт тестировать
        if (options.endpointKey) {
            const endpointConfig = getEndpointByKey(options.endpointKey);
            if (!endpointConfig) {
                console.error(`❌ Эндпоинт ${options.endpointKey} не найден`);
                console.log('\n💡 Используйте --endpoints для просмотра доступных эндпоинтов');
                return;
            }
            
            outputFile = generateOutputFileName(options);
                    
            console.log(`🎯 Запуск server бенчмарков:`);
            console.log(`   • Эндпоинт: ${options.endpointKey} (${endpointConfig.name})`);
            console.log(`   • URL: ${endpointConfig.endpoint}`);
            console.log(`   • Размеры: ${runner.config.matrixSizes.join(', ')}`);
            console.log(`   • Файл: ${path.basename(outputFile)}\n`);
            
            await runner.runEndpoint(options.endpointKey, outputFile);
            return;
        } 
    
        if (!options.endpointKey) {
            console.error('❌ Не указан эндпоинт для тестирования');
            console.log('💡 Используйте --endpoints для просмотра доступных эндпоинтов');
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