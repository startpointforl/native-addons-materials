# Server бенчмарки умножения матриц

Система для измерения производительности HTTP-эндпоинтов с помощью autocannon для реального тестирования под нагрузкой.

## Особенности

- **HTTP тестирование**: Реальные HTTP-запросы к серверу
- **Autocannon**: Профессиональный инструмент нагрузочного тестирования 
- **Один эндпоинт за раз**: Изолированное тестирование для точности
- **Автоматическая проверка**: Проверка доступности эндпоинтов
- **RPS метрики**: Requests per second с min/max/avg статистикой

## Быстрый старт

```bash
# Установка зависимостей и сборка
nvm use
npm install
npm run build:cpp    # C++ аддоны
npm run build:rust   # Rust аддоны
npm run build:wasm   # WASM модули

# Запуск сервера (в отдельном терминале)
npm run start

# Список всех эндпоинтов с проверкой доступности
npm run bm:server:ls

# Запуск бенчмарка одного эндпоинта
npm run bm:server cpp.simd

# Справка
npm run bm:server:help
```

При тестировании некоторых методов C++ на macOS лучше использовать специальные команды для запуска сервера:

```bash
# Для методов cpp.accelerate, rust.accelerate и rust.accelerate-async
npm run start:mac-cpp:veclib

# Для метода cpp.accelerate-async
npm run start:mac-cpp:threadpool
```

## Конфигурация

### По умолчанию (config.js)

```javascript
{
  serverUrl: 'http://localhost:3000',        // URL сервера
  matrixSizes: [50, 100, 250, 500, 750],    // Размеры матриц
  duration: 15,                             // Длительность теста (сек)
  timeout: 200000,                          // Таймаут запросов
  cooldown: 2,                              // Пауза между тестами (сек)  
  warmupDuration: 5,                        // Длительность разогрева
  outputDir: './benchmarks/results/'                   // Директория результатов
}
```

## Доступные эндпоинты

Используйте `npm run bm:server:ls` для просмотра всех эндпоинтов с их статусом:

### JavaScript
- `js.base` - JS Base (/js-base)
- `js.optimized` - JS Optimized (/js-optimized)
- `js.non-blocking` - JS Non-Blocking (/js-non-blocking)  
- `js.worker` - JS Worker (/js-worker)
- `js.optimized-worker` - JS Optimized (/js-optimized-worker)

### C++ (node-gyp)
- `cpp.base` - C++ Base (/cpp-base)
- `cpp.async` - C++ Async (/cpp-async)
- `cpp.simd` - C++ SIMD (/cpp-simd)
- `cpp.simd-async` - C++ SIMD Async (/cpp-simd-async)
- `cpp.accelerate` - C++ Accelerate (/cpp-accelerate) (macOS)
- `cpp.accelerate-async` - C++ Accelerate Async (/cpp-accelerate-async) (macOS)

### Rust (napi-rs)
- `rust.base` - Rust Base (/rust-base)
- `rust.async` - Rust Async (/rust-async)
- `rust.simd` - Rust SIMD (/rust-simd)
- `rust.simd-async` - Rust SIMD Async (/rust-simd-async)
- `rust.accelerate` - Rust Accelerate (/rust-accelerate) (macOS)
- `rust.accelerate-async` - Rust Accelerate Async (/rust-accelerate-async) (macOS)

### WebAssembly
- `wasm.base` - WASM Base (/wasm-base)
- `wasm.worker` - WASM Worker (/wasm-worker)
- `wasm.simd` - WASM SIMD (/wasm-simd)
- `wasm.simd-worker` - WASM SIMD Worker (/wasm-simd-worker)

## Результаты

### Пример вывода команды список
```
🔍 Проверяем доступность эндпоинтов...
📋 Доступные server эндпоинты:

🔧 JS: 2 доступных эндпоинта
   ✅ js.base - JS Base (/js-base)
   ✅ js.optimized - JS Optimized (/js-optimized)

🔧 CPP: 1 недоступный эндпоинт  
   ❌ cpp.simd - C++ SIMD (/cpp-simd)

📊 Итого: 2/3 эндпоинтов доступно
```

### CSV формат результатов
```csv
matrix_size;avg_cpp_simd;min_cpp_simd;max_cpp_simd
50;1245,67;1230,12;1260,33
100;987,45;965,21;1010,67
250;654,23;640,11;670,45
```

Файлы сохраняются в `benchmarks/raw_results/server/` с именами: `cpp_simd_2025-01-15T14-30-45.csv`

## Требования

- **Запущенный сервер**: `npm run server` на http://localhost:3000
- **Скомпилированные аддоны**: Для соответствующих эндпоинтов
- **autocannon**: Устанавливается автоматически с зависимостями

## Интерпретация результатов  

- **RPS (avg)**: Среднее количество запросов в секунду (больше = лучше)
- **RPS (min/max)**: Диапазон производительности
- **✅/❌ статус**: Доступность эндпоинта во время проверки
