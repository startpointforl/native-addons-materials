#include <napi.h>
#include <vector>

bool Multiply(
	const std::vector<std::vector<double>>& a,
	const std::vector<std::vector<double>>& b,
	std::vector<std::vector<double>>& result
) {

	if (!CanMultiply(a, b)) {
		return false;
	}

	size_t rowsA = a.size();
	size_t colsA = a[0].size();
	size_t colsB = b[0].size();
	result.resize(rowsA, std::vector<double>(colsB, 0));

	for (size_t i = 0; i < rowsA; i++) {
		for (size_t j = 0; j < colsB; j++) {
			for (size_t k = 0; k < colsA; k++) {
				result[i][j] += a[i][k] * b[k][j];
			}
		}
	}

	return true;
}

Napi::Value MultiplyBase(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2 || !info[0].IsArray() || !info[1].IsArray()) {
		Napi::TypeError::New(env, "Ожидается 2 матрицы: matrixA, matrixB").ThrowAsJavaScriptException();
		return env.Null();
	}

	std::vector<std::vector<double>> a = JsArrayToMatrix(info[0].As<Napi::Array>());
	std::vector<std::vector<double>> b = JsArrayToMatrix(info[1].As<Napi::Array>());
	std::vector<std::vector<double>> result;

	if (!Multiply(a, b, result)) {
		Napi::Error::New(env, "Неверные размеры матриц").ThrowAsJavaScriptException();
		return env.Null();
	}

	return MatrixToJsArray(env, result);
}