#!/bin/bash

echo "🎯 Генерация графиков для презентации..."
echo "=================================="

# Активируем виртуальное окружение
source venv/bin/activate

echo "📊 1. JavaScript"
python cli.py --benchmark-type isolated --methods js_base js_optimized --title "JavaScript"

echo ""
echo "📊 2. JavaScript (with worker threads)"
python cli.py --benchmark-type server --methods js_optimized js_optimized-worker --title "JavaScript"

echo ""
echo "📊 3. C++ macOS"
python cli.py --benchmark-type isolated --methods cpp_base cpp_simd cpp_accelerate --title "C++ macOS" --data-dir macos_results

echo ""
echo "📊 4. C++ macOS (with AsyncWorker)"
python cli.py --benchmark-type server --methods cpp_simd cpp_simd-async cpp_accelerate --title "C++ macOS" --data-dir macos_results

echo ""
echo "📊 5. C++ Linux"
python cli.py --benchmark-type isolated --methods cpp_base cpp_simd --title "C++ Linux" --data-dir linux_results

echo ""
echo "📊 6. C++ Linux (with AsyncWorker)"
python cli.py --benchmark-type server --methods cpp_simd cpp_simd-async --title "C++ Linux" --data-dir linux_results

echo ""
echo "📊 7. JS vs C++ macOS"
python cli.py --benchmark-type isolated --methods js_optimized cpp_accelerate --title "JavaScript vs C++ macOS" --data-dir macos_results

echo ""
echo "📊 8. JS vs C++ Linux"
python cli.py --benchmark-type isolated --methods js_optimized cpp_simd --title "JavaScript vs C++ Linux" --data-dir linux_results

echo ""
echo "📊 9. JS vs C++ macOS (async)"
python cli.py --benchmark-type server --methods js_optimized js_optimized-worker cpp_accelerate --title "JavaScript vs C++ macOS" --data-dir macos_results

echo ""
echo "📊 10. JS vs C++ Linux (async)"
python cli.py --benchmark-type server --methods js_optimized js_optimized-worker cpp_simd-async --title "JavaScript vs C++ Linux" --data-dir linux_results

echo ""
echo "📊 11. JS vs C++ vs Rust vs WASM macOS"
python cli.py --benchmark-type isolated --methods js_optimized cpp_accelerate rust_accelerate wasm_simd --title "JavaScript vs C++ vs Rust vs WASM macOS" --data-dir macos_results

echo ""
echo "📊 12. JS vs C++ vs Rust vs WASM Linux"
python cli.py --benchmark-type isolated --methods js_optimized cpp_simd rust_simd wasm_simd --title "JavaScript vs C++ vs Rust vs WASM Linux" --data-dir linux_results

echo ""
echo "📊 13. JS vs C++ vs Rust vs WASM macOS (async)"
python cli.py --benchmark-type server --methods js_optimized-worker cpp_accelerate rust_accelerate wasm_simd-worker --title "JavaScript vs C++ vs Rust vs WASM macOS" --data-dir macos_results

echo ""
echo "📊 14. JS vs C++ vs Rust vs WASM Linux (async)"
python cli.py --benchmark-type server --methods js_optimized-worker cpp_simd-async rust_simd-async wasm_simd-worker --title "JavaScript vs C++ vs Rust vs WASM Linux" --data-dir linux_results

echo ""
echo "✅ Генерация завершена!"
echo "📁 Результаты в папке output/"