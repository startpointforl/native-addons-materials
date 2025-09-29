#include <napi.h>
#include <vector>

#ifdef __APPLE__
	#include <Accelerate/Accelerate.h>
	#define ACCELERATE_AVAILABLE
#endif

#ifdef ACCELERATE_AVAILABLE
static bool AccelerateMultiplyColMajor(
	const std::vector<double>& A,
	const std::vector<double>& B,
	std::vector<double>& C,
	size_t m, size_t k, size_t n) {

	if (m == 0 || k == 0 || n == 0) {
		return false;
	}
	if (A.size() != m * k || B.size() != k * n) {
		return false;
	}

	// Оптимизация: умножение матриц с помощью BLAS
	cblas_dgemm(CblasColMajor, CblasNoTrans, CblasNoTrans,
				(int)m, (int)n, (int)k,
				1.0,
				A.data(), (int)m,
				B.data(), (int)k,
				0.0,
				C.data(), (int)m);

	return true;
}
#endif

Napi::Value MultiplyAccelerate(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

#ifndef __APPLE__
	Napi::Error::New(env, "Accelerate framework доступен только на macOS.").ThrowAsJavaScriptException();
	return env.Null();
#endif

	if (info.Length() < 2 || !info[0].IsArray() || !info[1].IsArray()) {
		Napi::TypeError::New(env, "Ожидается 2 матрицы: matrixA, matrixB").ThrowAsJavaScriptException();
		return env.Null();
	}

	Napi::Array Ajs = info[0].As<Napi::Array>();
	Napi::Array Bjs = info[1].As<Napi::Array>();

	size_t m, k, k2, n;
	if (!ReadShape(Ajs, m, k) || !ReadShape(Bjs, k2, n) || k == 0 || n == 0 || k2 != k) {
		Napi::Error::New(env, "Неверные размеры матриц").ThrowAsJavaScriptException();
		return env.Null();
	}

	std::vector<double> A, B, C;
	A.reserve(m * k);
	B.reserve(k * n);
	C.resize(m * n, 0.0);
	FlattenToColMajor(Ajs, m, k, A);
	FlattenToColMajor(Bjs, k, n, B);

#ifdef ACCELERATE_AVAILABLE
	if (!AccelerateMultiplyColMajor(A, B, C, m, k, n)) {
		Napi::Error::New(env, "Не удалось умножить матрицы").ThrowAsJavaScriptException();
		return env.Null();
	}
	return ColMajorToJs(env, C, m, n);
#else
	Napi::Error::New(env, "Accelerate framework недоступен на этой платформе.").ThrowAsJavaScriptException();
	return env.Null();
#endif
}