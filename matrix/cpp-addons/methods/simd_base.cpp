#include <vector>
#include <cstddef>

// SIMD детект
#if defined(__x86_64__) || defined(_M_X64) || defined(__i386) || defined(_M_IX86)
	#include <immintrin.h> // AVX
	#define USE_AVX
	// Умеем ли FMA на таргете
	#if defined(__FMA__) || (defined(__AVX2__) && defined(__FMA__))
		#define USE_AVX_FMA
	#endif
#elif defined(__aarch64__) || defined(_M_ARM64)
	#include <arm_neon.h>  // NEON
	#define USE_NEON
#endif

// Ядро умножения: A(m x k) row-major, BT(n x k) row-major -> C(m x n) row-major
void SimdMatmulRowRow(
	const std::vector<double>& A, const std::vector<double>& BT,
    size_t m, size_t k, size_t n,
	std::vector<double>& C)
{
#ifdef USE_AVX
	const size_t w = 4;
	for (size_t i = 0; i < m; ++i) {
		const double* aRow = &A[i * k];
		for (size_t j = 0; j < n; ++j) {
			const double* btRow = &BT[j * k];
			__m256d acc = _mm256_setzero_pd();

			size_t t = 0;
			for (; t + w <= k; t += w) {
			// Оптимизация: Загружаем по 4 double сразу из aRow и btRow
			__m256d va = _mm256_loadu_pd(aRow + t);
			__m256d vb = _mm256_loadu_pd(btRow + t);
			#ifdef USE_AVX_FMA
				// Оптимизация: acc = acc + va * vb одной инструкцией FMA
				acc = _mm256_fmadd_pd(va, vb, acc);
			#else
				acc = _mm256_add_pd(acc, _mm256_mul_pd(va, vb));
			#endif
			}

			alignas(32) double tmp[4];
			_mm256_store_pd(tmp, acc);
			double sum = tmp[0] + tmp[1] + tmp[2] + tmp[3];

			// Хвост
			for (; t < k; ++t) {
			sum += aRow[t] * btRow[t];
			}
			C[i * n + j] = sum;
		}
	}

#elif defined(USE_NEON)
	const size_t w = 2;
	for (size_t i = 0; i < m; ++i) {
		const double* aRow = &A[i * k];
		for (size_t j = 0; j < n; ++j) {
			const double* btRow = &BT[j * k];
			float64x2_t acc = vdupq_n_f64(0.0);
			
			size_t t = 0;
			for (; t + w <= k; t += w) {
				// Оптимизация: Загружаем по 2 double сразу из aRow и btRow
				float64x2_t va = vld1q_f64(aRow + t);
				float64x2_t vb = vld1q_f64(btRow + t);
				acc = vaddq_f64(acc, vmulq_f64(va, vb));
			}
			double sum = vgetq_lane_f64(acc, 0) + vgetq_lane_f64(acc, 1);

			for (; t < k; ++t) {
				sum += aRow[t] * btRow[t];
			}
			C[i * n + j] = sum;
		}
	}

#else
	// Фоллбек без SIMD
	for (size_t i = 0; i < m; ++i) {
		const double* aRow = &A[i * k];
		for (size_t j = 0; j < n; ++j) {
			const double* btRow = &BT[j * k];
			double sum = 0.0;
			for (size_t t = 0; t < k; ++t) {
				sum += aRow[t] * btRow[t];
			}
			C[i * n + j] = sum;
		}
	}
#endif
}