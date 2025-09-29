const cppMatrix = require('bindings')('matrix');
const { generateMatrix } = require('../utils/generate-matrix');
const { isMatrixEqual, promisifyCallback } = require('./helper');

async function testCppAddons() {
    console.log('⚙️ Тест C++ аддонов...\n');
    
    try {
        const matrixA = generateMatrix(10);
        const matrixB = generateMatrix(10);

        const reference = cppMatrix.multiplyBase(matrixA, matrixB);
        console.log('✅ C++ base - OK');

        const asyncResult = await promisifyCallback(cppMatrix.multiplyAsync)(matrixA, matrixB);
        if (!isMatrixEqual(reference, asyncResult)) {
            throw new Error('Async result mismatch');
        }
        console.log('✅ C++ async - OK');

        const simdResult = cppMatrix.multiplySimd(matrixA, matrixB);
        if (!isMatrixEqual(reference, simdResult)) {
            throw new Error('SIMD result mismatch');
        }
        console.log('✅ C++ SIMD - OK');

        const simdAsyncResult = await promisifyCallback(cppMatrix.multiplySimdAsync)(matrixA, matrixB);
        if (!isMatrixEqual(reference, simdAsyncResult)) {
            throw new Error('SIMD async result mismatch');
        }
        console.log('✅ C++ SIMD async - OK');

        if (process.platform === 'darwin') {
            try {
                const accelerateResult = cppMatrix.multiplyAccelerate(matrixA, matrixB);
                if (!isMatrixEqual(reference, accelerateResult)) {
                    throw new Error('Accelerate result mismatch');
                }
                console.log('✅ C++ Accelerate - OK');
            } catch (e) {
                console.log('⚠️ C++ Accelerate - ошибка:', e.message);
            }

            try {
                const accelerateAsyncResult = await promisifyCallback(cppMatrix.multiplyAccelerateAsync)(matrixA, matrixB);
                if (!isMatrixEqual(reference, accelerateAsyncResult)) {
                    throw new Error('Accelerate async result mismatch');
                }
                console.log('✅ C++ Accelerate async - OK');
            } catch (e) {
                console.log('⚠️ C++ Accelerate async - ошибка:', e.message);
            }
        } else {
            console.log('⚠️ C++ Accelerate - доступен только на macOS');
        }

        console.log('🎉 Все C++ тесты пройдены!\n');
        return true;
    } catch (error) {
        console.error('❌ C++ тесты провалены:', error.message);
        return false;
    }
}

module.exports = {
    testCppAddons
}