# Error Handling Examples

Примеры разных подходов к обработке ошибок в native addons. Все примеры реализуют функцию деления с проверкой деления на ноль.

## Подходы к обработке ошибок

### Throw-подход
Использование исключений (`throw` и `try/catch`) внутри C++ методов:

#### [napi-throw/](./napi-throw/)  
**N-API + C++ exceptions**
- `try/catch` для логики внутри функции
- `napi_throw_error()` на верхнем уровне для выброса в Node.js

#### [node-addon-api-throw/](./node-addon-api-throw/)
**node-addon-api + exceptions**
- C++ исключения внутри функций
- `throw Napi::Error::New()` на верхнем уровне для выброса в Node.js
- `Napi::Error::New(env, e.what()).ThrowAsJavaScriptException()` также доступен

### Return-подход
Немедленная обработка каждой ошибки без исключений:

#### [napi-return/](./napi-return/)
**N-API + direct error handling**
- `napi_throw_error()` + `return nullptr`
- Проверка после каждой операции

#### [node-addon-api-return/](./node-addon-api-return/)
**node-addon-api + direct handling**
- `ThrowAsJavaScriptException()` + `return env.Null()`
- Немедленная обработка ошибок

## Как запустить

В каждой папке:
```bash
nvm use
npm run build && npm test
```

Все примеры тестируют функцию `divide(10, 0)` для демонстрации обработки ошибки деления на ноль.
