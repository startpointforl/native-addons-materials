# Изолированные бенчмарки умножения матриц

Система для точного измерения производительности функций умножения матриц вне HTTP-сервера с использованием батчей и статистического анализа стабильности.

## Особенности

- **Система батчей**: Несколько батчей с усреднением для точности
- **Коэффициент вариации**: Автоматическое измерение стабильности (CV < 5%)
- **Автоматический GC**: Принудительная сборка мусора между батчами
- **Цветовая индикация**: 🟢 отлично, 🟡 хорошо, 🔴 плохо
- **Авто-ретрай**: Автоматическое увеличение батчей для нестабильных функций

## Быстрый старт

```bash
# Установка зависимостей и сборка
nvm use
npm install
npm run build:cpp    # C++ аддоны
npm run build:rust   # Rust аддоны
npm run build:wasm   # WASM модули

# Список всех функций, доступных для тестирования
npm run bm:isolated:ls

# Запуск функции
npm run bm:isolated js.base

# Справка
npm run bm:isolated:help
```

## Конфигурация

### По умолчанию (config.js)

```javascript
{
  matrixSizes: [50, 100, 250, 500, 750, 1000],  // Размеры матриц
  batches: 5,                                   // Батчей на размер
  iterationsPerBatch: 20,                       // Итераций в батче
  warmupIterations: 10,                         // Разогрев
  batchCooldown: 2000,                          // Пауза между батчами (мс)
  targetStabilityCV: 5.0,                       // Целевой CV (%)
  gcBetweenBatches: true,                       // Принудительный GC
  autoRetry: { enabled: true, maxRetries: 2 }   // Авто-ретрай
}
```

### Критерии стабильности

- 🟢 **Отлично**: CV < 3%
- 🟡 **Хорошо**: CV < 5%
- 🔴 **Плохо**: CV ≥ 5%

## Доступные функции

Используйте `npm run bm:isolated:ls` для просмотра всех функций:

### JavaScript
- `js.base` - JS base
- `js.optimized` - JS Optimized  
- `js.optimized-worker` - JS Optimized Worker
- `js.non-blocking` - JS Non-blocking
- `js.worker` - JS Worker

### C++ (node-gyp)
- `cpp.base` - C++ base
- `cpp.async` - C++ Async
- `cpp.simd` - C++ SIMD
- `cpp.simd-async` - C++ SIMD Async
- `cpp.accelerate` - C++ Accelerate (macOS)
- `cpp.accelerate-async` - C++ Accelerate Async (macOS)

### Rust (napi-rs)
- `rust.base` - Rust base
- `rust.async` - Rust Async
- `rust.simd` - Rust SIMD
- `rust.simd-async` - Rust SIMD Async
- `rust.accelerate` - Rust Accelerate (macOS)
- `rust.accelerate-async` - Rust Accelerate Async (macOS)

### WebAssembly
- `wasm.base` - WASM base
- `wasm.simd` - WASM SIMD
- `wasm.worker` - WASM Worker
- `wasm.simd-worker` - WASM SIMD Worker

## Результаты

### CSV формат
```csv
matrix_size;avg_cpp_accelerate;min_cpp_accelerate;max_cpp_accelerate
50;1,745;1,1009208999998463;1,8968688000000384
100;3,221;2,6010000500000388;4,038918499999909
```

Файлы сохраняются в `benchmarks/raw_results/isolated/` с именами: `cpp_simd_2025-01-15T14-30-45.csv`

## Требования

- Node.js с флагом `--expose-gc` (для принудительного GC)
- Скомпилированные аддоны (C++/Rust/WASM) для соответствующих функций
- Достаточно RAM для работы с большими матрицами

## Интерпретация результатов

- **Время выполнения**: Среднее по батчам (меньше = лучше)
- **Коэффициент вариации**: Стабильность (меньше = стабильнее)
- **Зеленые результаты**: CV < 3% - отличная стабильность
- **Красные результаты**: CV ≥ 5% - требуется больше батчей/итераций 