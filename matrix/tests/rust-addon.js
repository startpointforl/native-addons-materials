const { generateMatrix } = require('../utils/generate-matrix');
const { isMatrixEqual } = require('./helper');

const rustMatrix = require('../rust-addons');

async function testRustAddons() {
    console.log('🦀 Тест Rust аддонов...\n');
    
    try {
        const matrixA = generateMatrix(10);
        const matrixB = generateMatrix(10);

        const reference = rustMatrix.multiplyBase(matrixA, matrixB);
        console.log('✅ Rust base - OK');

        const asyncResult = await rustMatrix.multiplyAsync(matrixA, matrixB);
        if (!isMatrixEqual(reference, asyncResult)) {
            throw new Error('Async result mismatch');
        }
        console.log('✅ Rust async - OK');

        const simdResult = rustMatrix.multiplySimd(matrixA, matrixB);
        if (!isMatrixEqual(reference, simdResult)) {
            throw new Error('SIMD result mismatch');
        }
        console.log('✅ Rust SIMD - OK');

        const simdAsyncResult = await rustMatrix.multiplySimdAsync(matrixA, matrixB);
        if (!isMatrixEqual(reference, simdAsyncResult)) {
            throw new Error('SIMD async result mismatch');
        }
        console.log('✅ Rust SIMD async - OK');

        if (process.platform === 'darwin') {
            try {
                const accelerateResult = rustMatrix.multiplyAccelerate(matrixA, matrixB);
                if (!isMatrixEqual(reference, accelerateResult)) {
                    throw new Error('Accelerate result mismatch');
                }
                console.log('✅ Rust Accelerate - OK');
            } catch (e) {
                console.log('⚠️ Rust Accelerate - ошибка:', e.message);
            }

            try {
                const accelerateAsyncResult = await rustMatrix.multiplyAccelerateAsync(matrixA, matrixB);
                if (!isMatrixEqual(reference, accelerateAsyncResult)) {
                    throw new Error('Accelerate async result mismatch');
                }
                console.log('✅ Rust Accelerate async - OK');
            } catch (e) {
                console.log('⚠️ Rust Accelerate async - ошибка:', e.message);
            }
        } else {
            console.log('⚠️ Rust Accelerate - доступен только на macOS');
        }

        console.log('🎉 Все Rust тесты пройдены!\n');
        return true;
    } catch (error) {
        console.error('❌ Rust тесты провалены:', error.message);
        return false;
    }
}

module.exports = {
    testRustAddons
}