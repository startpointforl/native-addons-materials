const axios = require('axios');
const config = require('./config');
const { ENDPOINTS } = require('../../utils/endpoints');

// Реестр всех server эндпоинтов
const endpointsRegistry = {
    js: {
        base: {
            name: 'JS Base',
            endpoint: ENDPOINTS.JS.BASE,
            available: null
        },
        'non-blocking': {
            name: 'JS Non-Blocking',
            endpoint: ENDPOINTS.JS.NON_BLOCKING,
            available: null
        },
        worker: {
            name: 'JS Worker',
            endpoint: ENDPOINTS.JS.WORKER,
            available: null
        },
        optimized: {
            name: 'JS Optimized',
            endpoint: ENDPOINTS.JS.OPTIMIZED,
            available: null
        },
        'optimized-worker': {
            name: 'JS Optimized Worker',
            endpoint: ENDPOINTS.JS.OPTIMIZED_WORKER,
            available: null
        }
    },

    cpp: {
        base: {
            name: 'C++ Base',
            endpoint: ENDPOINTS.CPP.BASE,
            available: null
        },
        async: {
            name: 'C++ Async',
            endpoint: ENDPOINTS.CPP.ASYNC,
            available: null
        },
        simd: {
            name: 'C++ SIMD',
            endpoint: ENDPOINTS.CPP.SIMD,
            available: null
        },
        'simd-async': {
            name: 'C++ SIMD Async',
            endpoint: ENDPOINTS.CPP.SIMD_ASYNC,
            available: null
        },
        accelerate: {
            name: 'C++ Accelerate',
            endpoint: ENDPOINTS.CPP.ACCELERATE,
            available: null
        },
        'accelerate-async': {
            name: 'C++ Accelerate Async',
            endpoint: ENDPOINTS.CPP.ACCELERATE_ASYNC,
            available: null
        }
    },

    wasm: {
        base: {
            name: 'WASM Base',
            endpoint: ENDPOINTS.WASM.BASE,
            available: null
        },
        worker: {
            name: 'WASM Worker',
            endpoint: ENDPOINTS.WASM.WORKER,
            available: null
        },
        simd: {
            name: 'WASM SIMD',
            endpoint: ENDPOINTS.WASM.SIMD,
            available: null
        },
        'simd-worker': {
            name: 'WASM SIMD Worker',
            endpoint: ENDPOINTS.WASM.SIMD_WORKER,
            available: null
        }
    },

    rust: {
        base: {
            name: 'Rust Base',
            endpoint: ENDPOINTS.RUST.BASE,
            available: null
        },
        async: {
            name: 'Rust Async',
            endpoint: ENDPOINTS.RUST.ASYNC,
            available: null
        },
        simd: {
            name: 'Rust SIMD',
            endpoint: ENDPOINTS.RUST.SIMD,
            available: null
        },
        'simd-async': {
            name: 'Rust SIMD Async',
            endpoint: ENDPOINTS.RUST.SIMD_ASYNC,
            available: null
        },
        accelerate: {
            name: 'Rust Accelerate',
            endpoint: ENDPOINTS.RUST.ACCELERATE,
            available: null
        },
        'accelerate-async': {
            name: 'Rust Accelerate Async',
            endpoint: ENDPOINTS.RUST.ACCELERATE_ASYNC,
            available: null
        }
    }
};

// Проверка доступности эндпоинта
async function checkEndpointAvailability(endpoint) {
    try {
        const response = await axios.get(`${config.serverUrl}${endpoint}`, { 
            timeout: 5000,
            validateStatus: (status) => status < 500 
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Проверка доступности всех эндпоинтов
async function checkAllEndpoints() {
    console.log('🔍 Проверяем доступность эндпоинтов...');
    
    for (const [_tech, endpoints] of Object.entries(endpointsRegistry)) {
        for (const [_name, config] of Object.entries(endpoints)) {
            if (config.available === null) {
                config.available = await checkEndpointAvailability(config.endpoint);
                if (!config.available) {
                    console.warn(`⚠️ Эндпоинт ${config.endpoint} недоступен`);
                }
            }
        }
    }
}

// Получить все доступные эндпоинты
async function getAllAvailableEndpoints() {
    await checkAllEndpoints();
    
    const available = {};
    for (const [tech, endpoints] of Object.entries(endpointsRegistry)) {
        available[tech] = {};
        for (const [name, config] of Object.entries(endpoints)) {
            if (config.available) {
                available[tech][name] = config;
            }
        }
        // Удаляем пустые секции
        if (Object.keys(available[tech]).length === 0) {
            delete available[tech];
        }
    }
    return available;
}

// Получить эндпоинт по ключу
function getEndpointByKey(key) {
    const [tech, name] = key.split('.');
    return endpointsRegistry[tech]?.[name];
}

// Показать список доступных эндпоинтов
async function listAvailableEndpoints() {
    await checkAllEndpoints();

    console.log('📋 Доступные server эндпоинты:\n');

    let totalAvailable = 0;
    let totalEndpoints = 0;

    for (const [tech, endpoints] of Object.entries(endpointsRegistry)) {
        const availableEndpoints = {};
        const unavailableEndpoints = {};

        for (const [name, config] of Object.entries(endpoints)) {
            totalEndpoints++;
            if (config.available) {
                availableEndpoints[name] = config;
                totalAvailable++;
            } else {
                unavailableEndpoints[name] = config;
            }
        }

        // Показываем доступные эндпоинты
        if (Object.keys(availableEndpoints).length > 0) {
            console.log(`🔧 ${tech.toUpperCase()}: ${Object.keys(availableEndpoints).length} доступных эндпоинтов`);
            for (const [name, config] of Object.entries(availableEndpoints)) {
                console.log(`   ✅ ${tech}.${name} - ${config.name} (${config.endpoint})`);
            }
            console.log();
        }

        // Показываем недоступные эндпоинты (если есть)
        if (Object.keys(unavailableEndpoints).length > 0) {
            console.log(`🔧 ${tech.toUpperCase()}: ${Object.keys(unavailableEndpoints).length} недоступных эндпоинтов`);
            for (const [name, config] of Object.entries(unavailableEndpoints)) {
                console.log(`   ❌ ${tech}.${name} - ${config.name} (${config.endpoint})`);
            }
            console.log();
        }
    }

    // Сводка
    console.log(`📊 Итого: ${totalAvailable}/${totalEndpoints} эндпоинтов доступно\n`);
    
    if (totalAvailable === 0) {
        console.log('⚠️ Все эндпоинты недоступны. Убедитесь что сервер запущен на http://localhost:3000');
    }
}

module.exports = {
    endpointsRegistry,
    checkEndpointAvailability,
    checkAllEndpoints,
    getAllAvailableEndpoints,
    getEndpointByKey,
    listAvailableEndpoints
}; 