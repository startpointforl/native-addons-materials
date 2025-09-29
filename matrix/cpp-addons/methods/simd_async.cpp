#include <napi.h>
#include <vector>

class SimdMultiplyWorker : public Napi::AsyncWorker {
public:
	SimdMultiplyWorker(
		Napi::Function& cb,
		std::vector<double>&& A_rowMajor,
		std::vector<double>&& BT_rowMajor,
		size_t m, size_t k, size_t n)
	: Napi::AsyncWorker(cb),
	A_(std::move(A_rowMajor)),
	BT_(std::move(BT_rowMajor)),
	C_(m * n),
	m_(m), k_(k), n_(n) {}

	void Execute() override {
		SimdMatmulRowRow(A_, BT_, m_, k_, n_, C_);
	}

	void OnOK() override {
		Napi::Env env = Env();
		Napi::HandleScope scope(env);
		Callback().Call({ env.Null(), RowMajorToJs(env, C_, m_, n_) });
	}

	void OnError(const Napi::Error& e) override {
		Napi::Env env = Env();
		Callback().Call({ e.Value(), env.Undefined() });
	}

private:
	std::vector<double> A_, BT_, C_;
	size_t m_, k_, n_;
};

Napi::Value MultiplySimdAsync(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

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

	std::vector<double> A_rm, B_rm, BT_rm;
	A_rm.reserve(m * k);
	B_rm.reserve(k * n);

	// Оптимизации
	// 1. Сплющиваем A и B в row-major
	// 2. Транспонируем B в BT
	// 3. Передаем воркеру плоские буферы по move

	FlattenRowMajor(Ajs, m, k, A_rm);
	FlattenRowMajor(Bjs, k, n, B_rm);
	TransposeRowMajor(B_rm, k, n, BT_rm);

	auto* worker = new SimdMultiplyWorker(cb, std::move(A_rm), std::move(BT_rm), m, k, n);
	worker->Queue();

	return env.Undefined();
}