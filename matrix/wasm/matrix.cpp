#include <emscripten/bind.h>
#include <vector>
#include <algorithm>

#ifdef __wasm_simd128__
    #include <wasm_simd128.h>
    #define SIMD_AVAILABLE 1
#else
    #define SIMD_AVAILABLE 0
#endif

using namespace emscripten;

void multiply_base(val a, val b, val c, int n) {
    std::vector<std::vector<double>> matA(n, std::vector<double>(n));
    std::vector<std::vector<double>> matB(n, std::vector<double>(n));
    
    for (int i = 0; i < n; ++i) {
        val rowA = a[i];
        val rowB = b[i];
        for (int j = 0; j < n; ++j) {
            matA[i][j] = rowA[j].as<double>();
            matB[i][j] = rowB[j].as<double>();
        }
    }
    
    for (int i = 0; i < n; ++i) {
        val rowC = c[i];
        for (int j = 0; j < n; ++j) {
            double sum = 0;
            for (int k = 0; k < n; ++k) {
                sum += matA[i][k] * matB[k][j];
            }
            rowC.set(j, sum);
        }
    }
}

void multiply_simd(val a, val b, val c, int n) {
#if SIMD_AVAILABLE
    std::vector<float> matA(n * n);
    std::vector<float> matB(n * n);
    
    for (int i = 0; i < n; ++i) {
        val rowA = a[i];
        val rowB = b[i];
        for (int j = 0; j < n; ++j) {
            matA[i * n + j] = rowA[j].as<float>();
            matB[i * n + j] = rowB[j].as<float>();
        }
    }
    
    for (int i = 0; i < n; ++i) {
        val rowC = c[i];
        int j = 0;
        
        // Оптимизация: умножение матриц по 4 элемента сразу с помощью SIMD
        for (; j <= n - 4; j += 4) {
            v128_t sum = wasm_f32x4_splat(0.0f);
            
            for (int k = 0; k < n; ++k) {
                v128_t a_broadcast = wasm_f32x4_splat(matA[i * n + k]);
                v128_t b_vec = wasm_v128_load(&matB[k * n + j]);
                sum = wasm_f32x4_add(sum, wasm_f32x4_mul(a_broadcast, b_vec));
            }
            
            float results[4];
            wasm_v128_store(results, sum);
            rowC.set(j, static_cast<double>(results[0]));
            rowC.set(j + 1, static_cast<double>(results[1]));
            rowC.set(j + 2, static_cast<double>(results[2]));
            rowC.set(j + 3, static_cast<double>(results[3]));
        }
        
        for (; j < n; ++j) {
            float sum = 0.0f;
            for (int k = 0; k < n; ++k) {
                sum += matA[i * n + k] * matB[k * n + j];
            }
            rowC.set(j, static_cast<double>(sum));
        }
    }
#else
    // Фоллбэк на обычную версию, если SIMD не поддерживается
    multiply_base(a, b, c, n);
#endif
}

EMSCRIPTEN_BINDINGS(module) {
    function("multiplyBase", &multiply_base);
    function("multiplySimd", &multiply_simd);
}