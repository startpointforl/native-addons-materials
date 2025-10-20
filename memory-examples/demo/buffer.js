const addon = require('../build/Release/addon');
const { formatMemory } = require('./utils');

const SIZE = 1000000;

console.log('=== External Buffer (память управляется C++) ===');
const buffer = Buffer.alloc(SIZE * 4);
for (let i = 0; i < SIZE; i++) {
    buffer.writeInt32LE(i, i * 4);
}
console.log('Before:', formatMemory(process.memoryUsage()));
for (let i = 0; i < 50; i++) {
    addon.processBuffer(buffer);
}
console.log('After 50 calls:', formatMemory(process.memoryUsage()));
if (global.gc) {
    global.gc();
}
console.log('After GC:', formatMemory(process.memoryUsage()));