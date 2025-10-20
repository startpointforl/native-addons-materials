#include <napi.h>
#include <vector>
#include <cstring>
#include <cstdio>

Napi::Value SimpleAllocation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    int size = info[0].As<Napi::Number>().Int32Value();
    
    int* data = new int[size];
    
    for (int i = 0; i < size; i++) {
        data[i] = i * i;
    }
    
    Napi::Array result = Napi::Array::New(env, size);
    for (int i = 0; i < size; i++) {
        result[i] = Napi::Number::New(env, data[i]);
    }
    
    delete[] data;
    
    return result;
}

Napi::Value AllocationWithLeak(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    int size = info[0].As<Napi::Number>().Int32Value();
    
    int* data = new int[size];
    
    for (int i = 0; i < size; i++) {
        data[i] = i * i;
    }
    
    Napi::Array result = Napi::Array::New(env, size);
    for (int i = 0; i < size; i++) {
        result[i] = Napi::Number::New(env, data[i]);
    }
    
    return result;
}


Napi::Value ProcessArray(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Array expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array input = info[0].As<Napi::Array>();
    uint32_t length = input.Length();
    
    int* data = new int[length];
    
    for (uint32_t i = 0; i < length; i++) {
        Napi::Value val = input[i];
        data[i] = val.As<Napi::Number>().Int32Value();
    }
    
    for (uint32_t i = 0; i < length; i++) {
        data[i] = data[i] * 2;
    }
    
    Napi::Array result = Napi::Array::New(env, length);
    for (uint32_t i = 0; i < length; i++) {
        result[i] = Napi::Number::New(env, data[i]);
    }
    
    delete[] data;
    
    return result;
}

Napi::Value ProcessBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsBuffer()) {
        Napi::TypeError::New(env, "Buffer expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Buffer<int32_t> buffer = info[0].As<Napi::Buffer<int32_t>>();
    int32_t* data = buffer.Data();
    size_t length = buffer.Length() / sizeof(int32_t);
    
    for (size_t i = 0; i < length; i++) {
        data[i] = data[i] * 2;
    }
    
    return Napi::String::New(env, "Buffer processed in-place");
}

void FinalizeExternalBuffer(Napi::Env env, int32_t* data) {
    delete[] data;
    std::printf("🗑️  Finalizer called: buffer memory freed\n");
}

Napi::Value CreateExternalBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    int32_t size = info[0].As<Napi::Number>().Int32Value();
    
    int32_t* data = new int32_t[size];
    
    for (int32_t i = 0; i < size; i++) {
        data[i] = i * 3;
    }
    
    return Napi::Buffer<int32_t>::New(
        env,
        data,
        size,
        FinalizeExternalBuffer
    );
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(
        Napi::String::New(env, "simpleAllocation"),
        Napi::Function::New(env, SimpleAllocation)
    );
    exports.Set(
        Napi::String::New(env, "allocationWithLeak"),
        Napi::Function::New(env, AllocationWithLeak)
    );
    exports.Set(
        Napi::String::New(env, "processArray"),
        Napi::Function::New(env, ProcessArray)
    );
    exports.Set(
        Napi::String::New(env, "processBuffer"),
        Napi::Function::New(env, ProcessBuffer)
    );
    exports.Set(
        Napi::String::New(env, "createExternalBuffer"),
        Napi::Function::New(env, CreateExternalBuffer)
    );
    return exports;
}

NODE_API_MODULE(addon, Init)

