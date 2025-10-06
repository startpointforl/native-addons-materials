# Native Addons Materials

Материалы и примеры для изучения и разработки нативных модулей Node.js.

## Полезные ссылки

- **Про самые популярные ошибки при npm install, связанные с node-gyp**
    - [Запись моего доклада на MinskJS](https://youtu.be/fYRw6QFXkqw?si=9IbJzB6XS4SuM81_)
- **Полезная документация**
    - [Документация node-addon-api](https://github.com/nodejs/node-addon-api/blob/main/doc/README.md)  
    - [Документация N-API](https://nodejs.org/api/n-api.html)
    - [Readme node-gyp](https://github.com/nodejs/node-gyp)
- **Дополнительные материалы**
    - Серия дополнительных постов про нюансы работы с нативными модулями: 🛠️ *Work in progress*, будет в моём тг-канале [@startpoint_dev](https://t.me/startpoint_dev)


## Таблица сравнения подходов к расширению возможностей Node.js

| Подход                 | Простота разработки и поддержки | Производительность CPU-bound | Производительность Input/Output | Безопасность | Кроссплатформенность |
|------------------------|:-------------------------------:|:----------------------------:|:-------------------------------:|:------------:|:--------------------:|
| **Node.js**            | XXXXX                           | X----                        | XXXXX                           | XXXX-        | XXXXX                |
| **C++ native addons**  | X----                           | XXXXX                        | XX---                           | X----        | XX---                |
| **Rust native addons** | XX---                           | XXXXX                        | XX---                           | XXX--        | XX---                |
| **WebAssembly**        | XXX--                           | XXX--                        | XX---                           | XXXXX        | XXXXX                |


## Структура репозитория

### [simple-examples/](./simple-examples/)
**Базовые примеры создания native addons**

Сравнение 4 основных подходов на примере хеширования строк:
- **node-addon-api** - современный рекомендуемый подход для C++
- **N-API** - стабильный ABI, но много boilerplate кода
- **NAN** - устаревший, зависит от версии Node.js  
- **native-libs** - устаревший, прямой доступ к V8

### [error-handlers/](./error-handlers/)
**Обработка ошибок в native addons**

Два подхода к error handling на примере деления на ноль:
- **Throw-подход** - C++ исключения (`try/catch`)
- **Return-подход** - немедленная проверка каждой операции

Каждый подход показан для N-API и node-addon-api.

### [matrix/](./matrix/)
**Умножение матриц**

Демонстрация производительности различных технологий:
- **JavaScript** - базовые и оптимизированные реализации (в том числе с worker threads)
- **C++ addons** - базовая, а также с SIMD, Accelerate (macOS) и AsyncWorker оптимизациями
- **Rust addons** - через napi-rs базовая, а также с SIMD, Accelerate (macOS) и  многопоточными оптимизациями
- **WebAssembly** - компиляция C++ в WASM (в том числе и с SIMD)

**Особенности:**
- Две системы бенчмарков: isolated (микробенчмарки) и server (HTTP нагрузка)
- Система визуализации результатов с графиками на Python
- Кроссплатформенное тестирование (Ubuntu и macOS)
- Готовые результаты измерений в папках `macos_results/` и `linux_results/`
- Графики из доклада в `chart_results/`
- Возможность провести собственные тесты и сравнить с моими результатами или построить графики на базе готовых данных

## Требования

- **Node.js** 22+ (используйте `.nvmrc` в каждом проекте)
- **C++ компилятор** (Xcode/GCC/MSVC)
- **Rust** (для `matrix/rust-addons`)
- **Python 3.x** (для систем визуализации)

## 🤝 Автор

**Настя Котова** — [@startpoint_dev](https://t.me/startpoint_dev)
Фронтендер с лапками
