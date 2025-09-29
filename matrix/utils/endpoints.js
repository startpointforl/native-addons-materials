const ENDPOINTS = {
    SIMPLE: '/simple',
    UPDATE_MATRIX: '/update-matrix',

    JS: {
        BASE: '/js-base',
        NON_BLOCKING: '/js-non-blocking',
        WORKER: '/js-worker',
        OPTIMIZED: '/js-optimized',
        OPTIMIZED_WORKER: '/js-optimized-worker',
    },
    CPP: {
        BASE: '/cpp-base',
        ASYNC: '/cpp-async',
        SIMD: '/cpp-simd',
        SIMD_ASYNC: '/cpp-simd-async',
        ACCELERATE: '/cpp-accelerate',
        ACCELERATE_ASYNC: '/cpp-accelerate-async',
    },
    WASM: {
        BASE: '/wasm-base',
        WORKER: '/wasm-worker',
        SIMD: '/wasm-simd',
        SIMD_WORKER: '/wasm-simd-worker',
    },
    RUST: {
        BASE: '/rust-base',
        ASYNC: '/rust-async',
        SIMD: '/rust-simd',
        SIMD_ASYNC: '/rust-simd-async',
        ACCELERATE: '/rust-accelerate',
        ACCELERATE_ASYNC: '/rust-accelerate-async'
    }
}

const multiplyEndpoints = [
    ENDPOINTS.JS.BASE,
    ENDPOINTS.JS.NON_BLOCKING,
    ENDPOINTS.JS.WORKER,
    ENDPOINTS.JS.OPTIMIZED,
    ENDPOINTS.JS.OPTIMIZED_WORKER,

    ENDPOINTS.CPP.BASE,
    ENDPOINTS.CPP.ASYNC,
    ENDPOINTS.CPP.SIMD,
    ENDPOINTS.CPP.SIMD_ASYNC,
    ENDPOINTS.CPP.ACCELERATE,
    ENDPOINTS.CPP.ACCELERATE_ASYNC,

    ENDPOINTS.WASM.BASE,
    ENDPOINTS.WASM.WORKER,
    ENDPOINTS.WASM.SIMD,
    ENDPOINTS.WASM.SIMD_WORKER,

    ENDPOINTS.RUST.BASE,
    ENDPOINTS.RUST.ASYNC,
    ENDPOINTS.RUST.SIMD,
    ENDPOINTS.RUST.SIMD_ASYNC,
    ENDPOINTS.RUST.ACCELERATE,
    ENDPOINTS.RUST.ACCELERATE_ASYNC
];

module.exports = {
    ENDPOINTS,
    multiplyEndpoints
};