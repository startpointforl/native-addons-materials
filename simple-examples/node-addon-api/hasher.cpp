#include <napi.h>
#include <string>

unsigned long djb2_hash(const char* str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

Napi::Number Hash(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Нужен 1 аргумент").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    if (!info[0].IsString()) {
        Napi::TypeError::New(env, "Аргумент должен быть строкой").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }
    
    std::string input = info[0].As<Napi::String>().Utf8Value();
    unsigned long hash_result = djb2_hash(input.c_str());
    
    return Napi::Number::New(env, hash_result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "hash"), Napi::Function::New(env, Hash));
    return exports;
}

NODE_API_MODULE(hasher, Init)