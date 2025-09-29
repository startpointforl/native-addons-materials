const fs = require('fs');

// Статистические функции
function calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStandardDeviation(values) {
    const mean = calculateMean(values);
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function calculateCoefficientOfVariation(values) {
    const mean = calculateMean(values);
    const stdDev = calculateStandardDeviation(values);
    return (stdDev / mean) * 100; // в процентах
}

function analyzeTimings(batchTimes) {
    const mean = calculateMean(batchTimes);
    const stdDev = calculateStandardDeviation(batchTimes);
    const cv = calculateCoefficientOfVariation(batchTimes);
  
    return {
        mean: parseFloat(mean.toFixed(3)),
        stdDev: parseFloat(stdDev.toFixed(3)),
        cv: parseFloat(cv.toFixed(2)),
        min: Math.min(...batchTimes),
        max: Math.max(...batchTimes),
        batchTimes: batchTimes.map(t => parseFloat(t.toFixed(3)))
    };
}

// Форматирование чисел для CSV
function formatNumberForCSV(number) {
    // нужен для корректного импорта в Google Sheets
    return number.toString().replace('.', ',');
}

// Определение стабильности по коэффициенту вариации
function getStabilityInfo(cv, thresholds) {
    if (cv < thresholds.excellent) {
        return { level: 'excellent', icon: '🟢', color: '\x1b[32m', label: 'ОТЛИЧНО' };
    } else if (cv < thresholds.good) {
        return { level: 'good', icon: '🟡', color: '\x1b[33m', label: 'ХОРОШО' };
    } else {
        return { level: 'poor', icon: '🔴', color: '\x1b[31m', label: 'ПЛОХО' };
    }
}

// Создание директории для результатов
function ensureOutputDir(outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Создана папка для результатов: ${outputDir}`);
    }
}

// Инициализация CSV файла
function initCSV(outputFile, functionKey) {
    const headers = ['matrix_size'];

    // Добавляем заголовки: среднее, min, max
    const cleanKey = functionKey.replace(/\./g, '_').replace(/-/g, '_');
    headers.push(`avg_${cleanKey}`);    // Среднее время
    headers.push(`min_${cleanKey}`);    // Минимальное время
    headers.push(`max_${cleanKey}`);    // Максимальное время

    const headerLine = headers.join(';') + '\n';
    fs.writeFileSync(outputFile, headerLine);

    console.log(`📊 Инициализирован CSV файл: ${outputFile}`);
}

// Добавление результатов в CSV
function appendToCSV(outputFile, matrixSize, results) {
    const row = [matrixSize.toString()];

    row.push(formatNumberForCSV(results.mean));    // Среднее
    row.push(formatNumberForCSV(results.min));     // Min
    row.push(formatNumberForCSV(results.max));     // Max

    const rowLine = row.join(';') + '\n';
    fs.appendFileSync(outputFile, rowLine);
}

// Красивый вывод статистики в консоль
function logBatchResult(batchNum, totalBatches, batchTime, isLast = false) {
    const icon = isLast ? '🏁' : '📊';
    console.log(`  ${icon} Батч ${batchNum}/${totalBatches}: ${batchTime.toFixed(2)}ms`);
}

function logFunctionResult(funcName, analysis, thresholds) {
    const stability = getStabilityInfo(analysis.cv, thresholds);
    const reset = '\x1b[0m';

    console.log(`📊 ${funcName}: ${analysis.mean}ms ± ${analysis.stdDev}ms ` +
                `${stability.color}(CV: ${analysis.cv}%, min: ${analysis.min}ms, max: ${analysis.max}ms) ${stability.icon} ${stability.label}${reset}`);
}

function logMatrixSizeHeader(matrixSize, current, total) {
    console.log(`\n🔢 Матрица ${matrixSize}x${matrixSize} (${current}/${total})`);
    console.log('═'.repeat(50));
}

function logFunctionHeader(funcName) {
    console.log(`\n🔄 Тестирование ${funcName}`);
}

// Форсированная сборка мусора
async function forceGarbageCollection() {
    if (global.gc) {
        global.gc();
        // Даем время на завершение GC
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Пауза между операциями
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    // Статистические функции
    calculateMean,
    calculateStandardDeviation,
    calculateCoefficientOfVariation,
    analyzeTimings,

    // Работа с CSV
    formatNumberForCSV,
    ensureOutputDir,
    initCSV,
    appendToCSV,

    // Вывод в консоль
    getStabilityInfo,
    logBatchResult,
    logFunctionResult,
    logMatrixSizeHeader,
    logFunctionHeader,

    // Утилиты
    forceGarbageCollection,
    sleep
}; 