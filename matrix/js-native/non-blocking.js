function multiplyNonBlocking(A, B) {
    return new Promise((resolve, reject) => {
        if (A[0].length !== B.length) {
            reject(new Error("Неподходящие размеры матриц для умножения"));
            return;
        }

        const result = Array(A.length).fill().map(() => Array(B[0].length).fill(0));
        let i = 0, j = 0;

        function nextElement() {
            if (i >= A.length) {
                resolve(result);
                return;
            }

            let operations = 0;
            while (i < A.length && operations < 1000) {
                let sum = 0;
                for (let k = 0; k < B.length; k++) {
                    sum += A[i][k] * B[k][j];
                }
                result[i][j] = sum;
                
                j++;
                if (j >= B[0].length) {
                    j = 0;
                    i++;
                }
                operations++;
            }

            setImmediate(nextElement);
        }

        nextElement();
    });
}

module.exports = { multiplyNonBlocking };