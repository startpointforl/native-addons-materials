const { generateMatrix } = require('../utils/generate-matrix');
const { isMatrixEqual } = require('./helper');

const matrix = require('../wasm');

async function testWasmAddons() {
    console.log('🌐 Тест WASM реализаций...\n');
    
    try {
        const matrixA = generateMatrix(10);
        const matrixB = generateMatrix(10);

        await matrix.initWasm();

        const reference = matrix.multiplyBase(matrixA, matrixB);
        console.log('✅ WASM base - OK');

        const asyncResult = await matrix.multiplyWorker(matrixA, matrixB);
        if (!isMatrixEqual(reference, asyncResult)) {
            throw new Error('Async result mismatch');
        }
        console.log('✅ WASM async - OK');

        const simdResult = matrix.multiplySimd(matrixA, matrixB);
        if (!isMatrixEqual(reference, simdResult)) {
            throw new Error('SIMD result mismatch');
        }
        console.log('✅ WASM SIMD - OK');

        const simdAsyncResult = await matrix.multiplySimdWorker(matrixA, matrixB);
        if (!isMatrixEqual(reference, simdAsyncResult)) {
            throw new Error('SIMD async result mismatch');
        }
        console.log('✅ WASM SIMD async - OK');

        console.log('🎉 WASM тесты пройдены!\n');
        return true;
    } catch (error) {
        console.error('❌ WASM тесты провалены:', error.message);
        return false;
    }
}

module.exports = {
    testWasmAddons
}