const { Worker } = require('worker_threads');
const path = require('path');

// number[][] -> Float64Array
function flatten2D(arr) {
    const n = arr.length;
    const m = arr[0].length;
    const out = new Float64Array(n * m);
    let p = 0;
    for (let i = 0; i < n; i++) {
        const row = arr[i];
        for (let j = 0; j < m; j++) {
            out[p++] = row[j];
        }
    }
    return { flat: out, n, m };
}

// Float64Array(buffer) -> number[][]
function unflatten2D(buf, n, m) {
    const arr = new Float64Array(buf);
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
        const row = new Array(m);
        const base = i * m;
        for (let j = 0; j < m; j++) {
            row[j] = arr[base + j];
        }
        out[i] = row;
    }
    return out;
}

function runWorker(payload, transferList, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    let settled = false;

    const timer = setTimeout(() => {
        if (!settled) {
            settled = true;
            worker.terminate();
            reject(new Error(`Worker timeout after ${timeoutMs} ms`));
        }
    }, timeoutMs);

    const cleanup = () => clearTimeout(timer);

    worker.once('message', (msg) => {
        if (settled) {
            return;
        }

        settled = true;
        cleanup();

        if (msg && msg.error) {
            reject(new Error(msg.error));
        } else {
            resolve(msg);
        }

        worker.terminate();
    });

    worker.once('error', (err) => {
        if (settled) {
            return;
        }

        settled = true;
        cleanup();
        reject(err);
    });

    worker.once('exit', (code) => {
        if (settled) {
            return;
        }
        cleanup();
        if (code !== 0) {
            reject(new Error(`Worker exited with code ${code} before sending a message`));
        }
    });

    worker.postMessage(payload, transferList);
  });
}

async function multiplyWorker(A2d, B2d) {
    const { flat: A, n: N, m: K } = flatten2D(A2d);
    const { flat: B, n: K2, m: M } = flatten2D(B2d);
    if (K2 !== K) {
        throw new Error('Неподходящие размеры матриц для умножения');
    }

    const { CBuffer, n, m } = await runWorker(
        { N, K, M, A: A.buffer, B: B.buffer },
        // Оптимизация:передаем буферы, используя transfer ownership, чтобы они не копировались в worker
        [A.buffer, B.buffer]
    );

    return unflatten2D(CBuffer, n, m);
}

module.exports = { multiplyWorker };