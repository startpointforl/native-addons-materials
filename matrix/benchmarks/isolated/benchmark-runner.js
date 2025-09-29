const { generateMatrix } = require('../../utils/generate-matrix');
const { getFunctionByKey } = require('./functions-registry');
const config = require('./config');
const {
    analyzeTimings,
    ensureOutputDir,
    initCSV,
    appendToCSV,
    logBatchResult,
    logFunctionResult,
    logMatrixSizeHeader,
    logFunctionHeader,
    forceGarbageCollection,
    sleep,
} = require('./utils');

class BenchmarkRunner {
    constructor() {
        this.config = config;
        this.allResults = {};
    }

    // Подготовка к запуску бенчмарков
    async prepare(functionKey, outputFile) {
        console.log('🚀 Подготовка к запуску изолированных бенчмарков');
        console.log('═'.repeat(60));
        
        ensureOutputDir(this.config.outputDir);
        initCSV(outputFile, functionKey);
        
        console.log(`📊 Конфигурация:`);
        console.log(`   • Размеры матриц: ${this.config.matrixSizes.join(', ')}`);
        console.log(`   • Батчей на размер: ${this.config.batches}`);
        console.log(`   • Итераций в батче: ${this.config.iterationsPerBatch}`);
        console.log(`   • Целевой CV: < ${this.config.targetStabilityCV}%`);
        console.log(`   • Файл результатов: ${outputFile}\n`);
    }

    // Выполнение одной итерации функции
    async executeFunction(func, matrixA, matrixB, funcConfig) {
        const startTime = performance.now();
        
        try {
            if (funcConfig.type === 'async') {
                await func(matrixA, matrixB);
            } else {
                func(matrixA, matrixB);
            }
            
            const endTime = performance.now();
            return endTime - startTime;
        } catch (error) {
            console.error(`❌ Ошибка выполнения функции: ${error.message}`);
            throw error;
        }
    }

    // Выполнение одного батча
    async executeBatch(func, funcConfig, matrixA, matrixB, batchNum, totalBatches) {
        const batchTimes = [];
        
        for (let i = 0; i < this.config.iterationsPerBatch; i++) {
            const iterationTime = await this.executeFunction(func, matrixA, matrixB, funcConfig);
            batchTimes.push(iterationTime);
            
            // Небольшая пауза между итерациями
            if (i < this.config.iterationsPerBatch - 1) {
                await sleep(10);
            }
        }
        
        const batchTime = batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
        logBatchResult(batchNum, totalBatches, batchTime, batchNum === totalBatches);
        
        return batchTime;
    }

    // Разогрев функции
    async warmupFunction(func, funcConfig, matrixA, matrixB) {
        console.log(`  🔥 Разогрев: ${this.config.warmupIterations} итераций...`);
        
        for (let i = 0; i < this.config.warmupIterations; i++) {
            await this.executeFunction(func, matrixA, matrixB, funcConfig);
            await sleep(10);
        }
    }

    // Тестирование функции
    async benchmarkFunction(functionKey, matrixA, matrixB) {
        const funcConfig = getFunctionByKey(functionKey);
        
        if (!funcConfig || !funcConfig.available) {
            console.log(`⚠️ Функция ${functionKey} недоступна`);
            return null;
        }

        const { func, name } = funcConfig;
        
        await this.warmupFunction(func, funcConfig, matrixA, matrixB);
        
        const batchTimes = [];
        let currentBatches = this.config.batches;
        let currentIterations = this.config.iterationsPerBatch;
        let retryCount = 0;
    
        while (retryCount <= this.config.autoRetry.maxRetries) {
            batchTimes.length = 0;
            
            for (let batch = 1; batch <= currentBatches; batch++) {
                if (this.config.gcBetweenBatches && batch > 1) {
                    await forceGarbageCollection();
                    await sleep(this.config.batchCooldown);
                }
                
                const batchTime = await this.executeBatch(
                func, funcConfig, matrixA, matrixB, batch, currentBatches
                );
                batchTimes.push(batchTime);
            }
      
            // Анализируем стабильность
            const analysis = analyzeTimings(batchTimes);
            
            // Если стабильность достигнута или ретраи отключены
            if (analysis.cv <= this.config.targetStabilityCV || 
                !this.config.autoRetry.enabled || 
                retryCount >= this.config.autoRetry.maxRetries) {
                
                // Выводим результат
                logFunctionResult(name, analysis, this.config.stabilityThresholds);
                
                return analysis;
            }
      
            // Нужен ретрай - увеличиваем параметры
            retryCount++;
            currentBatches += this.config.autoRetry.increaseBatches;
            currentIterations += this.config.autoRetry.increaseIterations;
            
            console.log(`  🔄 Нестабильные результаты (CV: ${analysis.cv}%). Ретрай ${retryCount}/${this.config.autoRetry.maxRetries}`);
            console.log(`     Увеличиваем батчи до ${currentBatches}, итерации до ${currentIterations}`);
            
            const oldIterationsPerBatch = this.config.iterationsPerBatch;
            this.config.iterationsPerBatch = currentIterations;
            this.config.iterationsPerBatch = oldIterationsPerBatch;
        }
    }

    // Тестирование функции для одного размера матрицы
    async benchmarkMatrixSize(matrixSize, functionKey, sizeIndex, totalSizes) {
        logMatrixSizeHeader(matrixSize, sizeIndex + 1, totalSizes);
        
        console.log('🔢 Генерация матриц...');
        const matrixA = generateMatrix(matrixSize);
        const matrixB = generateMatrix(matrixSize);
        
        await forceGarbageCollection();
        
        logFunctionHeader(functionKey);
        const results = await this.benchmarkFunction(functionKey, matrixA, matrixB);
        
        return results;
    }

    // Основной метод запуска бенчмарков
    async runFunction(functionKey, outputFile) {
        const startTime = Date.now();
        
        try {
            await this.prepare(functionKey, outputFile);
        
            for (let i = 0; i < this.config.matrixSizes.length; i++) {
                const matrixSize = this.config.matrixSizes[i];
                
                const results = await this.benchmarkMatrixSize(matrixSize, functionKey, i, this.config.matrixSizes.length);
                
                if (Object.keys(results).length > 0) {
                    this.allResults[matrixSize] = results;

                    appendToCSV(outputFile, matrixSize, results);
                }
                
                await forceGarbageCollection();
                await sleep(1000);
            }
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            console.log(`\n✅ Бенчмарки завершены за ${duration} секунд`);
            console.log(`📊 Результаты сохранены в: ${outputFile}`);
            
            return this.allResults;
        } catch (error) {
            console.error(`❌ Ошибка выполнения бенчмарков: ${error.message}`);
            console.error(error.stack);
            throw error;
        }
    }
}

module.exports = { BenchmarkRunner }; 