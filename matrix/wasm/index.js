const { multiplyWorker, multiplySimdWorker } = require('./worker-matrix');

let MatrixMultiplier;

async function initWasm() {
	const { default: init } = await import('./matrix.mjs');

	const module = await init();
	MatrixMultiplier = module;
}

function multiplyBase(A, B) {
	const N = A.length;
	const C = new Array(N).fill().map(() => Array(B[0].length).fill(0));

	MatrixMultiplier.multiplyBase(A, B, C, N);

	return C;
}

function multiplySimd(A, B) {
	const N = A.length;
	const C = new Array(N).fill().map(() => Array(B[0].length).fill(0));

	MatrixMultiplier.multiplySimd(A, B, C, N);

	return C;
}

module.exports = { initWasm, multiplyBase, multiplySimd, multiplyWorker, multiplySimdWorker };