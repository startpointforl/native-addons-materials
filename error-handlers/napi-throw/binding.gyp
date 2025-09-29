{
  "targets": [
    { 
      "target_name": "divider",
      "sources": [ "divider.cpp" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      },
      "msvs_settings": {
        "VCCLCompilerTool": { 
          "ExceptionHandling": 1 
        }
      }
    }
  ]
}
