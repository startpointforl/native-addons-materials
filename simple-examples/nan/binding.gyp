{
  "targets": [
    { 
      "include_dirs" : [
        "<!@(node -p \"require('nan').include\")"
      ],
      "target_name": "hasher",
      "sources": [ "hasher.cpp" ]
    }
  ]
}
