{
  "targets": [
    { 
      "conditions": [
        ["OS=='mac'", {
          "defines": [
            "ACCELERATE_NEW_LAPACK",
            "ACCELERATE_LAPACK_ILP64"
          ],
          "libraries": [
            "-framework Accelerate"
          ]
        }],
        ["OS=='linux' and target_arch=='x64'", {
          "cflags_cc": [
            "-O3",
            "-mavx2",
            "-mfma",
            "-funroll-loops"
          ]
        }],
        ["target_arch=='arm64'", {
          "cflags_cc": [
            "-O3",
            "-march=armv8.4-a+simd",
            "-mtune=apple-m1"
          ],
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS": [
              "-O3",
              "-march=armv8.4-a+simd",
              "-mtune=apple-m1"
            ],
            "GCC_OPTIMIZATION_LEVEL": "3"
          }
        }],
        ["target_arch=='x64'", {
          "cflags_cc": [ "-O3", "-mavx2", "-mfma" ],
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS": [ "-O3", "-mavx2", "-mfma" ]
          }
        }]
      ],
      "include_dirs" : [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "target_name": "matrix",
      "sources": [ "cpp-addons/matrix.cpp" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}