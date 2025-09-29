#include <napi.h>
#include <vector>

bool BasicMultiply(
    const std::vector<std::vector<double>>& a,
    const std::vector<std::vector<double>>& b,
    std::vector<std::vector<double>>& result) {

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

class MultiplyWorker : public Napi::AsyncWorker {
public:
    MultiplyWorker(
        Napi::Function& callback,
        const std::vector<std::vector<double>>& a,
        const std::vector<std::vector<double>>& b)
    : Napi::AsyncWorker(callback), a(a), b(b) {}

    void Execute() override {
        if (!BasicMultiply(a, b, result)) {
            SetError("Неверные размеры матриц");
        }
    }

    void OnOK() override {
        Napi::Env env = Env();
        Napi::HandleScope scope(env);

        Napi::Array jsResult = MatrixToJsArray(env, result);

        Callback().Call({env.Null(), jsResult});
    }

private:
    std::vector<std::vector<double>> a, b, result;
};

Napi::Value MultiplyAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
  
    if (info.Length() < 3 || !info[0].IsArray() || !info[1].IsArray() || !info[2].IsFunction()) {
      Napi::TypeError::New(env, "Ожидается 2 матрицы: matrixA, matrixB и callback").ThrowAsJavaScriptException();
      return env.Null();
    }
  
    Napi::Function callback = info[2].As<Napi::Function>();
    std::vector<std::vector<double>> a = JsArrayToMatrix(info[0].As<Napi::Array>());
    std::vector<std::vector<double>> b = JsArrayToMatrix(info[1].As<Napi::Array>());
  
    MultiplyWorker* worker = new MultiplyWorker(callback, a, b);
    worker->Queue();
  
    return env.Undefined();
}