const { parentPort } = require('worker_threads');
function transposeFlat(flatB, K, M) {
    const transposed = new Float64Array(K * M);
    for (let k = 0; k < K; k++) {
        for (let m = 0; m < M; m++) {
            transposed[m * K + k] = flatB[k * M + m];
        }
    }
    return transposed;
}

function multiplyOptimizedFlat(Aflat, BTransposed, N, K, M) {
    const Cflat = new Float64Array(N * M);

    for (let i = 0; i < N; i++) {
        const globalI = i;
        const iK = globalI * K;
        const iM = i * M;

        for (let j = 0; j < M; j++) {
            let sum = 0;
            const jK = j * K;

            // Оптимизация: развертывание цикла для лучшей производительности
            let k = 0;
            const remainder = K % 8;

            // Обрабатываем по 8 элементов за раз
            for (; k < K - remainder; k += 8) {
                sum += Aflat[iK + k] * BTransposed[jK + k] +
                       Aflat[iK + k + 1] * BTransposed[jK + k + 1] +
                       Aflat[iK + k + 2] * BTransposed[jK + k + 2] +
                       Aflat[iK + k + 3] * BTransposed[jK + k + 3] +
                       Aflat[iK + k + 4] * BTransposed[jK + k + 4] +
                       Aflat[iK + k + 5] * BTransposed[jK + k + 5] +
                       Aflat[iK + k + 6] * BTransposed[jK + k + 6] +
                       Aflat[iK + k + 7] * BTransposed[jK + k + 7];
            }

            // Обрабатываем оставшиеся элементы
            for (; k < K; k++) {
                sum += Aflat[iK + k] * BTransposed[jK + k];
            }

            Cflat[iM + j] = sum;
        }
    }

    return Cflat;
}

function multiplySimpleFlat(Aflat, Bflat, N, K, M) {
    const Cflat = new Float64Array(N * M);

    for (let i = 0; i < N; i++) {
        const globalI = i;
        const iK = globalI * K;
        const iM = i * M;

        for (let k = 0; k < K; k++) {
            const aik = Aflat[iK + k];
            const kM = k * M;
            
            for (let j = 0; j < M; j++) {
                Cflat[iM + j] += aik * Bflat[kM + j];
            }
        }
    }

    return Cflat;
}

parentPort.on('message', ({ N, K, M, A, B }) => {
	try {
		const Aflat = new Float64Array(A);
        const Bflat = new Float64Array(B);
        
        let Cflat;

        if (K >= 16 && M >= 16) {
            // Используем оптимизированный алгоритм с транспонированием
            const BTransposed = transposeFlat(Bflat, K, M);
            Cflat = multiplyOptimizedFlat(Aflat, BTransposed, N, K, M);
        } else {
            // Используем простой алгоритм для маленьких матриц
            Cflat = multiplySimpleFlat(Aflat, Bflat, N, K, M);
        }

		parentPort.postMessage({ CBuffer: Cflat.buffer, n: N, m: M  }, [Cflat.buffer]);
	} catch (err) {
		parentPort.postMessage({ error: err?.stack || String(err) });
	}
});