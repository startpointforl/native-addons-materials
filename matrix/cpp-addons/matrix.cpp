#include <napi.h>
#include "utils.cpp"
#include "methods/base.cpp"
#include "methods/async.cpp"
#include "methods/simd_base.cpp"
#include "methods/simd.cpp"
#include "methods/simd_async.cpp"
#include "methods/accelerate.cpp"
#include "methods/accelerate_async.cpp"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("multiplyBase", Napi::Function::New(env, MultiplyBase));
  exports.Set("multiplyAsync", Napi::Function::New(env, MultiplyAsync));
  exports.Set("multiplySimd", Napi::Function::New(env, MultiplySimd));
  exports.Set("multiplySimdAsync", Napi::Function::New(env, MultiplySimdAsync));
  exports.Set("multiplyAccelerate", Napi::Function::New(env, MultiplyAccelerate));
  exports.Set("multiplyAccelerateAsync", Napi::Function::New(env, MultiplyAccelerateAsync));
  return exports;
}

NODE_API_MODULE(matrix_napi, Init)