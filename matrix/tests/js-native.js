const { multiplyBase, multiplyNonBlocking, multiplyWorker, multiplyOptimized, multiplyOptimizedWorker } = require('../js-native');
const { generateMatrix } = require('../utils/generate-matrix');
const { isMatrixEqual } = require('./helper');

async function testJsAddons() {
    console.log('🌐 Тест JS аддонов...\n');
    
    try {

        const matrixA = generateMatrix(10);
        const matrixB = generateMatrix(10);

        const reference = multiplyBase(matrixA, matrixB);
        console.log('✅ JS base - OK');

        const nonBlockingResult = await multiplyNonBlocking(matrixA, matrixB);
        if (!isMatrixEqual(reference, nonBlockingResult)) {
            throw new Error('Non-blocking result mismatch');
        }
        console.log('✅ JS non-blocking - OK');

        const workerResult = await multiplyWorker(matrixA, matrixB);
        if (!isMatrixEqual(reference, workerResult)) {
            throw new Error('Worker result mismatch');
        }
        console.log('✅ JS worker - OK');

        const optimizedResult = await multiplyOptimized(matrixA, matrixB);
        if (!isMatrixEqual(reference, optimizedResult)) {
            throw new Error('Optimized result mismatch');
        }
        console.log('✅ JS optimized - OK');

        const optimizedWorkerResult = await multiplyOptimizedWorker(matrixA, matrixB);
        if (!isMatrixEqual(reference, optimizedWorkerResult)) {
            throw new Error('Optimized worker result mismatch');
        }
        console.log('✅ JS optimized worker - OK');

        console.log('🎉 Все JS тесты пройдены!\n');
        return true;
    } catch (error) {
        console.error('❌ JS тесты провалены:', error.message);
        return false;
    }
}

module.exports = {
    testJsAddons
}