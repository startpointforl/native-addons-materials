const http = require('http');

const { generateMatrix } = require('./utils/generate-matrix');
const { ENDPOINTS } = require('./utils/endpoints');

const jsMatrix = require('./js-native');
const cppMatrix = require('bindings')('matrix');   
const wasmMatrix = require('./wasm');
const rustMatrix = require('./rust-addons');

let N = 10;
let A = generateMatrix(N);
let B = generateMatrix(N);

wasmMatrix.initWasm().then(() => {
    console.log('WASM module initialized');

    http.createServer((req, res) => {
        const path = req.url;
        const start = performance.now();

        if (path === ENDPOINTS.UPDATE_MATRIX && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { size } = JSON.parse(body);
                    N = size;
                    A = generateMatrix(N);
                    B = generateMatrix(N);
                    
                    // GC после обновления
                    if (global.gc) {
                        global.gc();
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    res.end(`Matrix updated to ${N}x${N}\n`);
                } catch (err) {
                    res.end(`Error: ${err.message}\n`);
                }
            });
            return;
        }

        if (path === ENDPOINTS.SIMPLE) {
            const C = A.length * B.length;
            const ms = performance.now() - start;
            res.end(`Simple GET request: ${C} (${ms}ms)\n`);
            return;
        }

        // ========================== JS ==========================

        if (path === ENDPOINTS.JS.BASE) {
            try {
                const C = jsMatrix.multiplyBase(A, B);
                const ms = performance.now() - start;
                res.end(`JS Base: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.JS.NON_BLOCKING) {
            jsMatrix.multiplyNonBlocking(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`JS Non-Blocking: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        if (path === ENDPOINTS.JS.WORKER) {
            jsMatrix.multiplyWorker(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`JS Worker: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        if (path === ENDPOINTS.JS.OPTIMIZED) {
            try {
                const C = jsMatrix.multiplyOptimized(A, B);
                const ms = performance.now() - start;
                res.end(`JS Optimized: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.JS.OPTIMIZED_WORKER) {
            jsMatrix.multiplyOptimizedWorker(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`JS Optimized Worker: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        // ========================== C++ ==========================

        if (path === ENDPOINTS.CPP.BASE) {
            try {
                const C = cppMatrix.multiplyBase(A, B);
                const ms = performance.now() - start;
                res.end(`Cpp Base: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.CPP.ASYNC) {
            cppMatrix.multiplyAsync(A, B, (err, C) => {
                if (err) {
                    res.end(`Error: ${err.message}\n`);
                    return;
                }
                const ms = performance.now() - start;
                res.end(`Cpp Async: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            });
            return;
        }

        if (path === ENDPOINTS.CPP.SIMD) {
            try {
                const C = cppMatrix.multiplySimd(A, B);
                const ms = performance.now() - start;
                res.end(`Cpp SIMD: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.CPP.SIMD_ASYNC) {
            cppMatrix.multiplySimdAsync(A, B, (err, C) => {
                if (err) {
                    res.end(`Error: ${err.message}\n`);
                    return;
                }
                const ms = performance.now() - start;
                res.end(`Cpp SIMD Async: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            });
            return;
        }

        if (path === ENDPOINTS.CPP.ACCELERATE) {
            try {
                const C = cppMatrix.multiplyAccelerate(A, B);
                const ms = performance.now() - start;
                res.end(`Cpp Accelerate: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.CPP.ACCELERATE_ASYNC) {
            try {
                cppMatrix.multiplyAccelerateAsync(A, B, (err, C) => {
                    if (err) {
                        res.end(`Error: ${err.message}\n`);
                        return;
                    }
                    const ms = performance.now() - start;
                    res.end(`Cpp Accelerate Async: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
                });
            } catch (err) {
                res.end(`Error: ${err.message}\n`)
            }
            return;
        }

        // ========================== WASM ==========================

        if (path === ENDPOINTS.WASM.BASE) {
            try {
              const C = wasmMatrix.multiplyBase(A, B);
              const ms = performance.now() - start;
              res.end(`WASM Base: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
              res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.WASM.WORKER) {
            wasmMatrix.multiplyWorker(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`WASM Worker: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        if (path === ENDPOINTS.WASM.SIMD) {
            try {
                const C = wasmMatrix.multiplySimd(A, B);
                const ms = performance.now() - start;
                res.end(`WASM SIMD: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.WASM.SIMD_WORKER) {
            wasmMatrix.multiplySimdWorker(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`WASM SIMD Worker: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        // ========================== Rust ==========================

        if (path === ENDPOINTS.RUST.BASE) {
            try {
                const C = rustMatrix.multiplyBase(A, B);
                const ms = performance.now() - start;
                res.end(`Rust Base: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.RUST.ASYNC) {
            rustMatrix.multiplyAsync(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`Rust Async: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        if (path === ENDPOINTS.RUST.SIMD) {
            try {
                const C = rustMatrix.multiplySimd(A, B);
                const ms = performance.now() - start;
                res.end(`Rust SIMD: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }

        if (path === ENDPOINTS.RUST.SIMD_ASYNC) {
            rustMatrix.multiplySimdAsync(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`Rust SIMD Async: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        if (path === ENDPOINTS.RUST.ACCELERATE) {
            try {
                const C = rustMatrix.multiplyAccelerate(A, B);
                const ms = performance.now() - start;
                res.end(`Rust Accelerate: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            } catch (err) {
                res.end(`Error: ${err.message}\n`);
            }
            return;
        }   

        if (path === ENDPOINTS.RUST.ACCELERATE_ASYNC) {

            rustMatrix.multiplyAccelerateAsync(A, B).then((C) => {
                const ms = performance.now() - start;
                res.end(`Rust Accelerate Async: C[0][0] = ${C[0][0]} (${ms}ms)\n`);
            }).catch((err) => {
                res.end(`Error: ${err.message}\n`);
            });
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('No such path\n');
    }).listen(3000, () => {
        console.log('🚀 Server running on http://localhost:3000');
    });

});