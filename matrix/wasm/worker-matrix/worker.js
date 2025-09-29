const { parentPort } = require('worker_threads');
const path = require('path');
const { pathToFileURL } = require('url');

const matrixUrl = pathToFileURL(path.resolve(__dirname, '../matrix.mjs')).href;

const wasmReady = (async () => {
	const { default: init } = await import(matrixUrl);
	return await init();
})();

parentPort.on('message', async ({ N, K, M, A, B }) => {
	try {
		const Aflat = new Float64Array(A);
		const Bflat = new Float64Array(B);

		const Arows = new Array(N);
		for (let i = 0; i < N; i++) {
			Arows[i] = new Float64Array(Aflat.buffer, i * K * 8, K);
		}
		const Brows = new Array(K);
		for (let i = 0; i < K; i++) {
			Brows[i] = new Float64Array(Bflat.buffer, i * M * 8, M);
		}

		const Cflat = new Float64Array(N * M);
		const Crows = new Array(N);
		for (let i = 0; i < N; i++) {
			Crows[i] = new Float64Array(Cflat.buffer, i * M * 8, M);
		}

		const module = await wasmReady;
		module.multiplyBase(Arows, Brows, Crows, N);

		parentPort.postMessage({ CBuffer: Cflat.buffer, n: N, m: M }, [Cflat.buffer]);
	} catch (err) {
		parentPort.postMessage({ error: err?.message || String(err) });
	}
});