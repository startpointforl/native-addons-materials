#include <node.h>
#include <v8.h>
#include <string>

namespace hasher {
    using v8::Context;
    using v8::Exception;
    using v8::FunctionCallbackInfo;
    using v8::Isolate;
    using v8::Local;
    using v8::Number;
    using v8::Object;
    using v8::String;
    using v8::Value;

    unsigned long djb2_hash(const char* str) {
        unsigned long hash = 5381;
        int c;
        while ((c = *str++)) {
            hash = ((hash << 5) + hash) + c;
        }
        return hash;
    }

    void Hash(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        
        if (args.Length() < 1) {
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Нужен 1 аргумент")));
            return;
        }
        
        if (!args[0]->IsString()) {
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Аргумент должен быть строкой")));
            return;
        }
        
        String::Utf8Value input(isolate, args[0]);
        unsigned long hash_result = djb2_hash(*input);
        
        args.GetReturnValue().Set(Number::New(isolate, hash_result));
    }

    void Init(Local<Object> exports) {
        NODE_SET_METHOD(exports, "hash", Hash);
    }

    NODE_MODULE(NODE_GYP_MODULE_NAME, Init)
}