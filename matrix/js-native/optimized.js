function transposeMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed = new Array(cols);
    
    for (let j = 0; j < cols; j++) {
        transposed[j] = new Array(rows);
        for (let i = 0; i < rows; i++) {
            transposed[j][i] = matrix[i][j];
        }
    }
    
    return transposed;
}

function multiplyBlock(A, B_transposed, startRow, endRow, matrixSize) {
    const result = [];
    
    for (let i = startRow; i < endRow; i++) {
        const row = new Array(matrixSize);
        const A_row = A[i];
        
        for (let j = 0; j < matrixSize; j++) {
            let sum = 0;
            const B_col = B_transposed[j];
            
            // Оптимизация: развертывание цикла
            let k = 0;
            const len = A_row.length;
            const remainder = len % 8;
            
            for (; k < len - remainder; k += 8) {
                sum += A_row[k] * B_col[k] +
                       A_row[k + 1] * B_col[k + 1] +
                       A_row[k + 2] * B_col[k + 2] +
                       A_row[k + 3] * B_col[k + 3] +
                       A_row[k + 4] * B_col[k + 4] +
                       A_row[k + 5] * B_col[k + 5] +
                       A_row[k + 6] * B_col[k + 6] +
                       A_row[k + 7] * B_col[k + 7];
            }
            
            for (; k < len; k++) {
                sum += A_row[k] * B_col[k];
            }
            
            row[j] = sum;
        }
        result.push(row);
    }
    
    return result;
}

function multiplySimple(A, B_transposed, matrixSize) {
    const rowsA = A.length;
    const colsA = A[0].length;
    
    const result = new Array(rowsA);

    for (let i = 0; i < rowsA; i++) {
        result[i] = new Array(matrixSize);
        const A_row = A[i];
        
        for (let j = 0; j < matrixSize; j++) {
            let sum = 0;
            const B_col = B_transposed[j];
            
            // Оптимизация: развертывание цикла
            let k = 0;
            const remainder = colsA % 4;
            
            for (; k < colsA - remainder; k += 4) {
                sum += A_row[k] * B_col[k] +
                       A_row[k + 1] * B_col[k + 1] +
                       A_row[k + 2] * B_col[k + 2] +
                       A_row[k + 3] * B_col[k + 3];
            }
            
            for (; k < colsA; k++) {
                sum += A_row[k] * B_col[k];
            }
            
            result[i][j] = sum;
        }
    }

    return result;
}

function multiplyOptimized(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const rowsB = B.length;
    const colsB = B[0].length;

    if (colsA !== rowsB) {
        throw new Error('Неподходящие размеры матриц для умножения');
    }

    // Оптимизация: транспонируем B
    const B_transposed = transposeMatrix(B);

    if (rowsA < 32 || colsB < 32) {
        return multiplySimple(A, B_transposed, colsB);
    }

    // Оптимизация: блочный алгоритм для больших матриц
    const blockSize = Math.min(128, Math.max(64, Math.ceil(rowsA / 4)));
    const result = [];

    for (let i = 0; i < rowsA; i += blockSize) {
        const startRow = i;
        const endRow = Math.min(i + blockSize, rowsA);
        
        const blockResult = multiplyBlock(A, B_transposed, startRow, endRow, colsB);
        result.push(...blockResult);
    }

    return result;
}

module.exports = {
    multiplyOptimized
};