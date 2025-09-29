const { Worker } = require('worker_threads');
const path = require('path');

// number[][] -> Float64Array (по аналогии с js-native/worker)
function flatten2D(arr) {
	const n = arr.length;
	const k = arr[0].length;
	const out = new Float64Array(n * k);
	let p = 0;
	for (let i = 0; i < n; i++) {
		const row = arr[i];
		for (let j = 0; j < k; j++) {
			out[p++] = row[j];
		}
	}
	return { flat: out, n, k };
}

// Float64Array -> number[][] (по аналогии с js-native/worker)
function unflatten2D(buf, n, m) {
	const ta = new Float64Array(buf);
	const out = new Array(n);
	for (let i = 0; i < n; i++) {
		const row = new Array(m);
		const base = i * m;
		for (let j = 0; j < m; j++) {
			row[j] = ta[base + j];
		}
		out[i] = row;
	}
	return out;
}

async function multiplyWorker(A2d, B2d) {
	const { flat: A, n: N, k: K } = flatten2D(A2d);
	const { flat: B, n: K2, k: M } = flatten2D(B2d);
	if (K2 !== K) {
		throw new Error('Неподходящие размеры матриц для умножения');
	}

	return new Promise((resolve, reject) => {
		const worker = new Worker(path.join(__dirname, 'worker.js'));
		worker.once('message', ({ error, CBuffer, n, m }) => {
			if (error) {
				reject(new Error(error));
			} else {
				resolve(unflatten2D(CBuffer, n, m));
			}
			worker.terminate();
		});
		worker.once('error', reject);

		worker.postMessage(
			{ N, K, M, A: A.buffer, B: B.buffer },
			// Оптимизация: передаем буферы, используя transfer ownership, чтобы они не копировались в worker
			[A.buffer, B.buffer]
		);
	});
}

async function multiplySimdWorker(A2d, B2d) {
	const { flat: A, n: N, k: K } = flatten2D(A2d);
	const { flat: B, n: K2, k: M } = flatten2D(B2d);
	if (K2 !== K) {
		throw new Error('Неподходящие размеры матриц для умножения');
	}

	return new Promise((resolve, reject) => {
		const worker = new Worker(path.join(__dirname, 'worker-simd.js'));
		worker.once('message', ({ error, CBuffer, n, m }) => {
			if (error) {
				reject(new Error(error));
			} else {
				resolve(unflatten2D(CBuffer, n, m));
			}
			worker.terminate();
		});
		worker.once('error', reject);

		worker.postMessage(
			{ N, K, M, A: A.buffer, B: B.buffer },
			// Оптимизация:передаем буферы, используя transfer ownership, чтобы они не копировались в worker
			[A.buffer, B.buffer]
		);
	});
}

module.exports = { multiplyWorker, multiplySimdWorker };