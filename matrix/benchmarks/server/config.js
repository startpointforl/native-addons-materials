const config = {
    serverUrl: 'http://localhost:3000',
    
    // Размеры матриц для тестирования
    matrixSizes: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    
    // Настройки тестирования
    duration: 15,           // длительность каждого теста в секундах
    timeout: 200000,        // таймаут запросов
    cooldown: 2,            // пауза между тестами (секунды)
    warmupDuration: 5,      // длительность разогрева
    
    // Вывод результатов 
    outputDir: './benchmarks/raw_results/server/'       // директория для результатов
};

module.exports = config;