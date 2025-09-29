#include <napi.h>

Napi::Value NapiDivide(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Требуется два аргумента").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Аргументы должны быть числами").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double a = info[0].As<Napi::Number>().DoubleValue();
    double b = info[1].As<Napi::Number>().DoubleValue();
    
    if (b == 0) {
        Napi::Error::New(env, "Деление на ноль").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    return Napi::Number::New(env, a / b);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "divide"), Napi::Function::New(env, NapiDivide));
    return exports;
}

NODE_API_MODULE(divider, Init)