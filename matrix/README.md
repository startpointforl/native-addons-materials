# Matrix Multiplication Demo

Демонстрация различных подходов к умножению матриц: JS, C++, WASM и Rust с оптимизациями SIMD и Accelerate.

## Структура проекта

```
matrix/
├── benchmarks/         # Система бенчмарков
│   ├── isolated/       # Изолированные микробенчмарки  
│   ├── server/         # HTTP server бенчмарки
│   ├── results/        # Результаты тестирования
│   └── charts/         # Генерация графиков
├── cpp-addons/         # C++ Native addons
├── js-native/          # JS реализации
├── rust-addons/        # Rust addons
├── tests/              # Тесты всех реализаций
├── wasm/               # WebAssembly реализации 
└── server.js           # HTTP сервер для тестирования
```

## ⚡ Реализованные методы

| Технология | Базовый | Async | SIMD | Accelerate* |
|------------|---------|-------|------|-------------|
| **JavaScript** | ✅ | ✅ | ❌ | ❌ |
| **C++ (N-API)** | ✅ | ✅ | ✅ | ✅ |
| **WebAssembly** | ✅ | ✅ | ✅ | ❌ |
| **Rust (NAPI)** | ✅ | ✅ | ✅ | ✅ |

<sub>*Accelerate доступен только на macOS</sub>

## Быстрый старт

```bash
# 1. Установка зависимостей
nvm use
npm install

# 2. Сборка всех аддонов
npm run build:cpp    # C++ аддоны
npm run build:rust   # Rust аддоны  
npm run build:wasm   # WASM модули (требует Emscripten)

# 3. Запуск тестов
npm test            # Все тесты

# 4. Запуск сервера (для server бенчмарков)
npm run server      # HTTP сервер на :3000
```

## Системы бенчмарков

### Isolated бенчмарки
Прямые вызовы функций для точных микробенчмарков:

```bash
# Список доступных функций
npm run bm:isolated:ls

# Тестирование одной функции  
npm run bm:isolated cpp.simd

# Подробнее: benchmarks/isolated/README.md
```

**Особенности:**
- Прямые вызовы без HTTP накладных расходов
- Статистический анализ стабильности (CV)
- Система батчей с авто-ретраем
- Результаты в миллисекундах

### Server бенчмарки  
HTTP нагрузочное тестирование с autocannon:

```bash
# Запуск сервера (отдельный терминал)
npm run server

# Список доступных эндпоинтов
npm run bm:server:ls  

# Тестирование одного эндпоинта
npm run bm:server cpp.simd

# Подробнее: benchmarks/server/README.md
```

**Особенности:**
- Реалистичное HTTP тестирование
- Метрики RPS (requests per second)
- Автоматическая проверка доступности
- Production-like условия

### Визуализация результатов
```bash  
cd benchmarks/charts
python cli.py --benchmark-type isolated --methods js_base cpp_accelerate

# или одним скриптом все графики для презентации
./generate_charts.sh

# Подробнее: benchmarks/charts/README.md
```

## Готовые результаты измерений

В репозитории уже есть готовые данные и графики из доклада

### Структура результатов
```
benchmarks/
├── macos_results/     # Замеры на macOS (Apple M2)
│   ├── isolated/      # 21 CSV файл с микробенчмарками
│   └── server/        # 21 CSV файл с HTTP тестами  
├── linux_results/     # Замеры на Ubuntu (Intel)
│   ├── isolated/      # 17 CSV файлов (без Accelerate)
│   └── server/        # 17 CSV файлов (без Accelerate)
└── chart_results/     # Готовые графики из доклада (14 PNG файлов)
```

### Как использовать готовые данные

#### Посмотреть готовые графики
```bash
# Графики из доклада лежат тут:
ls benchmarks/chart_results/
# isolated_comparison_*.png - сравнение микробенчмарков
# server_comparison_*.png - сравнение HTTP нагрузки
```

#### Построить собственные графики на готовых данных  
```bash
cd benchmarks/charts

# Используя мои замеры на macOS
python cli.py --benchmark-type isolated --methods js_base cpp_accelerate rust_accelerate

# Сравнить платформы (macOS vs Linux)  
python cli.py --benchmark-type server --methods cpp_simd wasm_simd --title "Cross-platform SIMD"
```

#### Провести собственные тесты
```bash
# Запустить свои измерения (сохранятся в benchmarks/raw_results/)
npm run bm:isolated js.base cpp.simd rust.accelerate

# Построить графики на своих данных
cd benchmarks/charts  
python cli.py --benchmark-type isolated --methods js_base cpp_simd rust_accelerate --title "Мои тесты"
```

#### Сравнить свои результаты с готовыми
Система автоматически выбирает последние замеры по timestamp:
- Если есть свежие данные в `raw_results/` - используются они
- Если нет - берутся готовые из `macos_results/` или `linux_results/`

### О данных из доклада

- **Железо macOS**: Apple MacBook Air M3 (8 cores), 8GB RAM
- **Версия macOS**: 15.6.1
- **Железо Linux**: Intel Core i7-11850H (8 cores), 32GB RAM
- **Версия Ubuntu**: 22.04.5
- **Метрики**: isolated - миллисекунды, server - RPS

Все данные можно воспроизвести самостоятельно или использовать для своих экспериментов.

## Установка зависимостей

### Rust (требуется для запуска примеров)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Emscripten (нужно только для самостоятельной компиляции WASM)
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest
source ./emsdk_env.sh
```

## Ограничения платформ

- **Windows**: Не тестировалось
- **Linux**: Accelerate недоступен  
- **macOS**: Полная поддержка всех оптимизаций
