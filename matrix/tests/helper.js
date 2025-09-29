function isMatrixEqual(a, b, tolerance = 1e-5) {
    if (a.length !== b.length || a[0].length !== b[0].length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a[0].length; j++) {
            if (Math.abs(a[i][j] - b[i][j]) > tolerance) {
                return false;
            }
        }
    }
    return true;
}

function promisifyCallback(func) {
    return (A, B) => {
      return new Promise((resolve, reject) => {
        func(A, B, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };
  }

module.exports = {
    isMatrixEqual,
    promisifyCallback
}