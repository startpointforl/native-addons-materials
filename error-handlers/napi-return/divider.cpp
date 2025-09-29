#include <node_api.h>

napi_value NapiDivide(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value result;
    
    status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    if (status != napi_ok) return nullptr;
    
    if (argc < 2) {
        napi_throw_error(env, nullptr, "Требуется два аргумента");
        return nullptr;
    }
    
    double a, b;
    status = napi_get_value_double(env, args[0], &a);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Первый аргумент должен быть числом");
        return nullptr;
    }
    
    status = napi_get_value_double(env, args[1], &b);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Второй аргумент должен быть числом");
        return nullptr;
    }
    
    if (b == 0) {
        napi_throw_error(env, nullptr, "Деление на ноль");
        return nullptr;
    }
    
    status = napi_create_double(env, a / b, &result);
    if (status != napi_ok) return nullptr;
    
    return result;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    
    napi_create_function(env, nullptr, 0, NapiDivide, nullptr, &fn);
    napi_set_named_property(env, exports, "divide", fn);
    
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)