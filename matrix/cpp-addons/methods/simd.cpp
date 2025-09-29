#include <napi.h>
#include <vector>

Napi::Value MultiplySimd(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

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

	// A -> row-major, B -> row-major -> B Transpose
	std::vector<double> A_rm, B_rm, BT_rm, C_rm;
	A_rm.reserve(m * k);
	B_rm.reserve(k * n);
	C_rm.resize(m * n, 0.0);

	// Оптимизации
	// 1. Сплющиваем A и B в row-major
	// 2. Транспонируем B в BT
	// 3. Вызываем SimdMatmulRowRow
	// 4. Возвращаем результат, распаковывая в JS

	FlattenRowMajor(Ajs, m, k, A_rm);
	FlattenRowMajor(Bjs, k, n, B_rm);
	TransposeRowMajor(B_rm, k, n, BT_rm); // n x k

	SimdMatmulRowRow(A_rm, BT_rm, m, k, n, C_rm);

	return RowMajorToJs(env, C_rm, m, n);
}