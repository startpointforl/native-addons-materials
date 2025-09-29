Для подавления warning-ов про deprecated-методы nan можно модифицировать binding.gyp:

```gyp
{
  "targets": [
    { 
      "include_dirs" : [
        "<!@(node -p \"require('nan').include\")"
      ],
      "target_name": "hasher",
      "sources": [ "hasher.cpp" ],
      "cflags_cc": ["-Wno-deprecated-declarations"],
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": ["-Wno-deprecated-declarations"],
        "OTHER_CFLAGS": ["-Wno-deprecated-declarations"]
      }
    }
  ]
}
```