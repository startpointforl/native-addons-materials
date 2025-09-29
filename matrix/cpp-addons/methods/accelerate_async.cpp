#include <napi.h>
#include <vector>

#ifdef __APPLE__
	#include <Accelerate/Accelerate.h>
	#define ACCELERATE_AVAILABLE
#endif

class AccelerateMultiplyWorker : public Napi::AsyncWorker {
public:
  AccelerateMultiplyWorker(
		Napi::Function& cb,
		std::vector<double>&& A_colMajor,
		std::vector<double>&& B_colMajor,
		size_t m, size_t k, size_t n)
    : Napi::AsyncWorker(cb),
	A_(std::move(A_colMajor)),
	B_(std::move(B_colMajor)),
	C_(m * n),
	m_(m), k_(k), n_(n) {}

	void Execute() override {
	#ifndef ACCELERATE_AVAILABLE
		SetError("Accelerate framework недоступен на этой платформе.");
		return;
	#else
		// Оптимизация: умножение матриц с помощью BLAS
		cblas_dgemm(CblasColMajor, CblasNoTrans, CblasNoTrans,
					(int)m_, (int)n_, (int)k_,
					1.0,
					A_.data(), (int)m_,
					B_.data(), (int)k_,
					0.0,
					C_.data(), (int)m_);
	#endif
	}

	void OnOK() override {
		Napi::Env env = Env();
		Napi::HandleScope scope(env);
		Callback().Call({ env.Null(), ColMajorToJs(env, C_, m_, n_) });
	}

	void OnError(const Napi::Error& e) override {
		Napi::Env env = Env();
		Callback().Call({ e.Value(), env.Undefined() });
	}

private:
	std::vector<double> A_, B_, C_;
	size_t m_, k_, n_;
};

Napi::Value MultiplyAccelerateAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

#ifndef __APPLE__
    Napi::Error::New(env, "Accelerate framework доступен только на macOS.").ThrowAsJavaScriptException();
    return env.Null();
#endif

    if (info.Length() < 3 || !info[0].IsArray() || !info[1].IsArray() || !info[2].IsFunction()) {
        Napi::TypeError::New(env, "Ожидается 2 матрицы: matrixA, matrixB и callback").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array Ajs = info[0].As<Napi::Array>();
    Napi::Array Bjs = info[1].As<Napi::Array>();
    Napi::Function cb = info[2].As<Napi::Function>();

    size_t m, k, k2, n;
    if (!ReadShape(Ajs, m, k) || !ReadShape(Bjs, k2, n) || k == 0 || n == 0 || k2 != k) {
        Napi::TypeError::New(env, "Неверные размеры матриц").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Оптимизации
	// 1. Сплющиваем A и B в column-major
	// 2. Передаем воркеру плоские буферы по move

    std::vector<double> Aflat, Bflat;
    Aflat.reserve(m * k);
    Bflat.reserve(k * n);
    FlattenToColMajor(Ajs, m, k, Aflat);
    FlattenToColMajor(Bjs, k, n, Bflat);

    auto* worker = new AccelerateMultiplyWorker(cb, std::move(Aflat), std::move(Bflat), m, k, n);
    worker->Queue();

    return env.Undefined();
}