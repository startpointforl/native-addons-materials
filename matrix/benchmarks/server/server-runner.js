const autocannon = require('autocannon');
const { getEndpointByKey, checkEndpointAvailability } = require('./endpoints-registry');
const { 
    updateMatrixSize, 
    ensureOutputDir,
    initServerCSV,
    appendServerCSV,
    logMatrixSizeHeader,
    logEndpointResult
} = require('./utils');
const config = require('./config');

class ServerRunner {
    constructor() {
        this.config = config;
        this.allResults = {};
    }

    // Подготовка к запуску server бенчмарков
    async prepare(endpointKey, outputFile) {
        console.log('🚀 Подготовка к запуску server бенчмарков');
        console.log('═'.repeat(60));
        
        ensureOutputDir(this.config.outputDir);
        initServerCSV(outputFile, endpointKey);
        
        console.log(`📊 Конфигурация:`);
        console.log(`   • Размеры матриц: ${this.config.matrixSizes.join(', ')}`);
        console.log(`   • Длительность теста: ${this.config.duration}s`);
        console.log(`   • Server URL: ${this.config.serverUrl}`);
        console.log(`   • Файл результатов: ${outputFile}\n`);
    }

    // Разогрев сервера
    async warmupServer() {
        console.log('🔥 Разогрев сервера...');
        
        try {
            await autocannon({
                url: `${this.config.serverUrl}/simple`,
                duration: this.config.warmupDuration || 3
            });
            console.log('✅ Разогрев завершён\n');
        } catch (error) {
            console.warn('⚠️ Ошибка разогрева:', error.message);
        }
    }

    // Выполнение одного теста для эндпоинта
    async runEndpointTest(endpointConfig) {
        const { endpoint, name } = endpointConfig;
        const url = `${this.config.serverUrl}${endpoint}`;
        
        console.log(`  🌐 Тестируем ${name} (${endpoint})...`);
        
        try {
            const result = await autocannon({
                url: url,
                duration: this.config.duration,
                timeout: this.config.timeout
            });

            // Берём готовые статистики из autocannon
            const stats = {
                avg: parseFloat(result.requests.average.toFixed(2)),
                min: result.requests.min,
                max: result.requests.max
            };

            logEndpointResult(name, stats);
            return stats;
            
        } catch (error) {
            console.log(`    ❌ Ошибка: ${error.message}`);
            return {
                avg: 0,
                min: 0,
                max: 0
            };
        }
    }

    // Тестирование эндпоинта для одного размера матрицы  
    async benchmarkMatrixSize(matrixSize, endpointKey, sizeIndex, totalSizes) {
        logMatrixSizeHeader(matrixSize, sizeIndex + 1, totalSizes);
        
        console.log('🔄 Обновляем размер матрицы на сервере...');
        await updateMatrixSize(matrixSize);
        
        const endpointConfig = getEndpointByKey(endpointKey);
        const results = await this.runEndpointTest(endpointConfig);
        
        // Небольшая пауза между размерами
        await new Promise(resolve => setTimeout(resolve, this.config.cooldown * 1000 || 2000));
        
        return results;
    }

    // Основной метод запуска server бенчмарков
    async runEndpoint(endpointKey, outputFile) {
        const startTime = Date.now();
        
        try {
            // Проверяем доступность эндпоинта
            const endpointConfig = getEndpointByKey(endpointKey);
            if (!endpointConfig) {
                throw new Error(`❌ Неизвестный эндпоинт: ${endpointKey}`);
            }

            const isAvailable = await checkEndpointAvailability(endpointConfig.endpoint);
            if (!isAvailable) {
                throw new Error(`❌ Эндпоинт ${endpointConfig.endpoint} недоступен`);
            }

            await this.prepare(endpointKey, outputFile);
            await this.warmupServer();
        
            for (let i = 0; i < this.config.matrixSizes.length; i++) {
                const matrixSize = this.config.matrixSizes[i];
                
                const results = await this.benchmarkMatrixSize(matrixSize, endpointKey, i, this.config.matrixSizes.length);
                
                this.allResults[matrixSize] = results;
                appendServerCSV(outputFile, matrixSize, results);
            }
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            console.log(`\n✅ Server бенчмарки завершены за ${duration} секунд`);
            console.log(`📊 Результаты сохранены в: ${outputFile}`);
            
            return this.allResults;
            
        } catch (error) {
            console.error(`❌ Ошибка выполнения server бенчмарков: ${error.message}`);
            throw error;
        }
    }
}

module.exports = { ServerRunner }; 