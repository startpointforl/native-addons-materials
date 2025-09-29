const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

function convertToCSVNumber(number) {
    return number.toString().replace('.', ',');
}

// Функция для анализа стабильности
function getStabilityInfo(cv) {
    const thresholds = {
        excellent: 5,   // CV < 5% - отлично
        good: 15        // CV < 15% - хорошо, иначе плохо
    };
    
    if (cv < thresholds.excellent) {
        return { level: 'excellent', icon: '🟢', color: '\x1b[32m', label: 'ОТЛИЧНО' };
    } else if (cv < thresholds.good) {
        return { level: 'good', icon: '🟡', color: '\x1b[33m', label: 'ХОРОШО' };
    } else {
        return { level: 'poor', icon: '🔴', color: '\x1b[31m', label: 'ПЛОХО' };
    }
}

async function updateMatrixSize(size) {
    try {
        await axios.post(`${config.serverUrl}/update-matrix`, { size });
        console.log(`  ✅ Размер матрицы обновлён на ${size}x${size}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('  ❌ Ошибка обновления матрицы:', error.message);
    }
}

// Создание директории для результатов
function ensureOutputDir(outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Создана директория: ${outputDir}`);
    }
}

// Инициализация CSV файла для server бенчмарков
function initServerCSV(outputFile, endpointKey) {
    if (!fs.existsSync(outputFile)) {
        const cleanEndpoint = endpointKey.replace('.', '_');
        const headers = ['matrix_size', `avg_${cleanEndpoint}`, `min_${cleanEndpoint}`, `max_${cleanEndpoint}`];
        
        const headerLine = headers.join(';') + '\n';
        fs.writeFileSync(outputFile, headerLine);
        console.log(`📊 Создан CSV файл: ${path.basename(outputFile)}`);
    }
}

// Добавление строки в CSV файл
function appendServerCSV(outputFile, matrixSize, results) {
    const row = [
        matrixSize,
        convertToCSVNumber(results.avg),
        convertToCSVNumber(results.min),
        convertToCSVNumber(results.max)
    ];
    
    const csvLine = row.join(';') + '\n';
    fs.appendFileSync(outputFile, csvLine);
    console.log(`  📝 Результаты записаны в CSV`);
}

// Заголовок размера матрицы
function logMatrixSizeHeader(matrixSize, current, total) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📐 РАЗМЕР МАТРИЦЫ: ${matrixSize}x${matrixSize} (${current}/${total})`);
    console.log(`${'═'.repeat(60)}`);
}

// Результат тестирования эндпоинта
function logEndpointResult(endpointName, stats) {
    console.log(`  ✅ ${endpointName}:`);
    console.log(`     📊 RPS: avg=${stats.avg}, min=${stats.min}, max=${stats.max}`);
}

module.exports = {
    ensureOutputDir,
    initServerCSV,
    appendServerCSV,
    logMatrixSizeHeader,
    logEndpointResult,
    
    // Утилиты
    convertToCSVNumber,
    updateMatrixSize,
    getStabilityInfo
};