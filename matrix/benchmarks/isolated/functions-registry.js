// Импорты JavaScript функций
const jsMatrix = require('../../js-native');

// Импорт C++ аддона
let cppMatrix;
try {
    cppMatrix = require('bindings')('matrix');
} catch (error) {
    console.warn('⚠️ C++ matrix addon не найден. Проверьте что npm run build:cpp выполнен.');
}

// Импорт WASM модулей
let wasm;
try {
    wasm = require('../../wasm');
} catch (error) {
    console.warn('⚠️ WASM модули не найдены. Проверьте что npm run build:wasm выполнен.');
}

// Импорт Rust аддона
let rustMatrix;
try {
    rustMatrix = require('../../rust-addons');
} catch (error) {
    console.warn('⚠️ Rust addon не найден. Проверьте что npm run build:rust выполнен.');
}

// Утилиты для промисификации callback функций
function promisifyCallback(func) {
    return (A, B) => {
        return new Promise((resolve, reject) => {
            func(A, B, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
}

// Реестр всех функций
const functionsRegistry = {
    js: {
        base: {
            name: 'JS Base',
            func: jsMatrix.multiplyBase,
            type: 'sync',
            available: true
        },
        optimized: {
            name: 'JS Optimized',
            func: jsMatrix.multiplyOptimized,
            type: 'sync',
            available: true
        },
        'non-blocking': {
            name: 'JS Non-Blocking',
            func: jsMatrix.multiplyNonBlocking,
            type: 'async',
            available: true
        },
        worker: {
            name: 'JS Worker',
            func: jsMatrix.multiplyWorker,
            type: 'async',
            available: true
        },
        'optimized-worker': {
            name: 'JS Optimized Worker',
            func: jsMatrix.multiplyOptimizedWorker,
            type: 'async',
            available: true
        }
    },

    cpp: {
        base: {
            name: 'C++ Base',
            func: cppMatrix?.multiplyBase,
            type: 'sync',
            available: !!cppMatrix?.multiplyBase
        },
        async: {
            name: 'C++ Async',
            func: cppMatrix ? promisifyCallback(cppMatrix.multiplyAsync) : null,
            type: 'async',
            available: !!cppMatrix?.multiplyAsync
        },
        simd: {
            name: 'C++ SIMD',
            func: cppMatrix?.multiplySimd,
            type: 'sync',
            available: !!cppMatrix?.multiplySimd
        },
        'simd-async': {
            name: 'C++ SIMD Async',
            func: cppMatrix ? promisifyCallback(cppMatrix.multiplySimdAsync) : null,
            type: 'async',
            available: !!cppMatrix?.multiplySimdAsync
        },
        accelerate: {
            name: 'C++ Accelerate',
            func: cppMatrix?.multiplyAccelerate,
            type: 'sync',
            available: !!cppMatrix?.multiplyAccelerate && process.platform === 'darwin'
        },
        'accelerate-async': {
            name: 'C++ Accelerate Async',
            func: cppMatrix ? promisifyCallback(cppMatrix.multiplyAccelerateAsync) : null,
            type: 'async',
            available: !!cppMatrix?.multiplyAccelerateAsync && process.platform === 'darwin'
        }
    },

    wasm: {
        base: {
            name: 'WASM Base',
            func: wasm?.multiplyBase,
            type: 'sync',
            available: !!wasm?.multiplyBase
        },
        simd: {
            name: 'WASM SIMD',
            func: wasm?.multiplySimd,
            type: 'sync',
            available: !!wasm?.multiplySimd
        },
        worker: {
            name: 'WASM Worker',
            func: wasm?.multiplyWorker,
            type: 'async',
            available: !!wasm?.multiplyWorker
        },
        'simd-worker': {
            name: 'WASM SIMD Worker',
            func: wasm?.multiplySimdWorker,
            type: 'async',
            available: !!wasm?.multiplySimdWorker
        }
    },

    rust: {
        base: {
            name: 'Rust Base',
            func: rustMatrix?.multiplyBase,
            type: 'sync',
            available: !!rustMatrix?.multiplyBase
        },
        async: {
            name: 'Rust Async',
            func: rustMatrix?.multiplyAsync,
            type: 'async',
            available: !!rustMatrix?.multiplyAsync
        },
        simd: {
            name: 'Rust SIMD',
            func: rustMatrix?.multiplySimd,
            type: 'sync',
            available: !!rustMatrix?.multiplySimd
        },
        'simd-async': {
            name: 'Rust SIMD Async',
            func: rustMatrix?.multiplySimdAsync,
            type: 'async',
            available: !!rustMatrix?.multiplySimdAsync
        },
        accelerate: {
            name: 'Rust Accelerate',
            func: rustMatrix?.multiplyAccelerate,
            type: 'sync',
            available: !!rustMatrix?.multiplyAccelerate && process.platform === 'darwin'
        },
        'accelerate-async': {
            name: 'Rust Accelerate Async',
            func: rustMatrix?.multiplyAccelerateAsync,
            type: 'async',
            available: !!rustMatrix?.multiplyAccelerateAsync && process.platform === 'darwin'
        }
    }
};

// Функции для работы с реестром
function getAllAvailableFunctions() {
    const available = {};

    for (const [tech, functions] of Object.entries(functionsRegistry)) {
        available[tech] = {};

        console.log(functions);
        for (const [name, config] of Object.entries(functions)) {
            if (config.available) {
                available[tech][name] = config;
            }
        }
    }

    return available;
}

function getFunctionByKey(key) {
    const [tech, name] = key.split('.');
    return functionsRegistry[tech]?.[name];
}

function listAvailableFunctions() {
    const available = getAllAvailableFunctions();

    console.log('📋 Доступные функции умножения матриц:\n');

    for (const [tech, functions] of Object.entries(available)) {
        const count = Object.keys(functions).length;
        if (count > 0) {
            console.log(`🔧 ${tech.toUpperCase()}: ${count} функций`);
            for (const [name, config] of Object.entries(functions)) {
                const typeIcon = config.type === 'sync' ? '⚡' : '🔄';
                console.log(`   ${typeIcon} ${tech}.${name} - ${config.name}`);
            }
            console.log();
        }
    }
}

module.exports = {
    functionsRegistry,
    getAllAvailableFunctions,
    getFunctionByKey,
    listAvailableFunctions
};