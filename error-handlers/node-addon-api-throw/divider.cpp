#include <napi.h>

Napi::Value NapiDivide(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        if (info.Length() < 2) {
            // выбрасываем ошибку через throw
            throw std::runtime_error("Требуется два аргумента");
        }
        
        if (!info[0].IsNumber() || !info[1].IsNumber()) {
            // выбрасываем ошибку через throw
            throw std::runtime_error("Аргументы должны быть числами");
        }
        
        double a = info[0].As<Napi::Number>().DoubleValue();
        double b = info[1].As<Napi::Number>().DoubleValue();
        
        if (b == 0) {
            // выбрасываем ошибку через throw
            throw std::runtime_error("Деление на ноль");
        }
        
        return Napi::Number::New(env, a / b);
        
    } catch (const std::exception& e) {
        // Оба варианта работают
        // Вариант 1: выбрасываем ошибку через ThrowAsJavaScriptException
        //   Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        //   return env.Null();
        // Вариант 2: выбрасываем ошибку через throw
        throw Napi::Error::New(env, e.what());
    }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "divide"), Napi::Function::New(env, NapiDivide));
    return exports;
}

NODE_API_MODULE(divider, Init)