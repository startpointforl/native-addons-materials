#!/bin/bash

em++ matrix.cpp -O3 \
-s WASM=1 \
-s MODULARIZE=1 \
-s EXPORT_ES6=1 \
-s ENVIRONMENT=node \
-msimd128 \
-mrelaxed-simd \
-lembind \
-o matrix.mjs