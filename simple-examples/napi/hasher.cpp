#include <node_api.h>
#include <string>

unsigned long djb2_hash(const char* str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

napi_value Hash(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];
    napi_value result;
    
    status = napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Ошибка получения аргументов");
        return nullptr;
    }
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Нужен 1 аргумент");
        return nullptr;
    }
    
    napi_valuetype valuetype;
    status = napi_typeof(env, argv[0], &valuetype);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Ошибка проверки типа");
        return nullptr;
    }
    
    if (valuetype != napi_string) {
        napi_throw_type_error(env, nullptr, "Аргумент должен быть строкой");
        return nullptr;
    }
    
    size_t str_size;
    status = napi_get_value_string_utf8(env, argv[0], nullptr, 0, &str_size);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Ошибка получения размера строки");
        return nullptr;
    }
    
    char* input = new char[str_size + 1];
    size_t copied;
    status = napi_get_value_string_utf8(env, argv[0], input, str_size + 1, &copied);
    if (status != napi_ok) {
        delete[] input;
        napi_throw_error(env, nullptr, "Ошибка получения строки");
        return nullptr;
    }
    
    unsigned long hash_result = djb2_hash(input);
    delete[] input;
    
    status = napi_create_double(env, static_cast<double>(hash_result), &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Ошибка создания результата");
        return nullptr;
    }
    
    return result;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;
    
    status = napi_create_function(env, nullptr, 0, Hash, nullptr, &fn);
    if (status != napi_ok) return nullptr;
    
    status = napi_set_named_property(env, exports, "hash", fn);
    if (status != napi_ok) return nullptr;
    
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)