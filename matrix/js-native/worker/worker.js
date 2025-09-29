const { parentPort } = require('worker_threads');

parentPort.on('message', ({ N, K, M, A, B }) => {
	try {
		const Aflat = new Float64Array(A);
		const Bflat = new Float64Array(B);

		const Cflat = new Float64Array(N * M);

		for (let i = 0; i < N; i++) {
			const iK = i * K;
			const iM = i * M;
			for (let k = 0; k < K; k++) {
				const aik = Aflat[iK + k];
				const kM  = k * M;
				for (let j = 0; j < M; j++) {
					Cflat[iM + j] += aik * Bflat[kM + j];
				}
			}
		}

		parentPort.postMessage({ CBuffer: Cflat.buffer, n: N, m: M }, [Cflat.buffer]);
	} catch (err) {
		parentPort.postMessage({ error: err?.stack || String(err) });
	}
});