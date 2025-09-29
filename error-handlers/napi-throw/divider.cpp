#include <node_api.h>
#include <string>
#include <stdexcept>

napi_value NapiDivide(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value result;
    
    try {
        status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
        if (status != napi_ok) throw std::runtime_error("Ошибка получения аргументов");
        
        if (argc < 2) {
            // выбрасываем ошибку через throw
            throw std::runtime_error("Требуется два аргумента");
        }
        
        double a, b;
        status = napi_get_value_double(env, args[0], &a);
        if (status != napi_ok) throw std::runtime_error("Неверный первый аргумент");
        
        status = napi_get_value_double(env, args[1], &b);
        if (status != napi_ok) throw std::runtime_error("Неверный второй аргумент");
        
        if (b == 0) {
            // выбрасываем ошибку через throw
            throw std::runtime_error("Деление на ноль");
        }
        
        status = napi_create_double(env, a / b, &result);
        if (status != napi_ok) throw std::runtime_error("Ошибка создания результата");
        
        return result;
        
    } catch (const std::exception& e) {
        // на самом верхнем уровне в Node.js всегда выбрасываем ошибку через napi_throw_error
        napi_throw_error(env, nullptr, e.what());
        return nullptr;
    }
}

napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    
    napi_create_function(env, nullptr, 0, NapiDivide, nullptr, &fn);
    napi_set_named_property(env, exports, "divide", fn);
    
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)