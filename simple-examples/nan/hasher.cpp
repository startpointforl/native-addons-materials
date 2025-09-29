#include <nan.h>
#include <string>

unsigned long djb2_hash(const char* str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

NAN_METHOD(hash) {
    if (info.Length() < 1) {
        Nan::ThrowTypeError("Нужен 1 аргумент");
        return;
    }
    
    if (!info[0]->IsString()) {
        Nan::ThrowTypeError("Аргумент должен быть строкой");
        return;
    }
    
    Nan::Utf8String input(info[0]);
    unsigned long hash_result = djb2_hash(*input);
    
    info.GetReturnValue().Set(Nan::New<v8::Number>(hash_result));
}

NAN_MODULE_INIT(Init) {
    NAN_EXPORT(target, hash);
}

NODE_MODULE(hasher, Init)