const config = {
    // Размеры матриц для тестирования
    matrixSizes: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    
    // Настройки батчей
    batches: 5,                    // количество батчей для каждого размера
    iterationsPerBatch: 20,        // итераций в каждом батче
    warmupIterations: 10,          // разогрев перед первым батчем
    
    // Паузы и стабильность
    batchCooldown: 2000,           // пауза между батчами (мс)
    gcBetweenBatches: false,       // принудительный GC между батчами
    targetStabilityCV: 5.0,        // целевой коэффициент вариации (%)
    
    // Вывод результатов
    outputDir: './benchmarks/raw_results/isolated/',
    
    // Цветовая индикация стабильности
    stabilityThresholds: {
        excellent: 3.0,              // CV < 3% - отлично (зеленый)
        good: 5.0,                   // CV < 5% - хорошо (желтый)
        poor: Infinity               // CV >= 5% - плохо (красный)
    },
    
    // Автоматическое улучшение для нестабильных функций
    autoRetry: {
        enabled: true,               // включить авто-ретрай
        maxRetries: 2,               // максимум попыток
        increaseBatches: 3,          // добавить батчей при ретрае
        increaseIterations: 5        // добавить итераций при ретрае
    }
};

module.exports = config; 