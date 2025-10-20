const addon = require('../build/Release/addon');
const { formatMemory } = require('./utils');

const SIZE = 1000000;

console.log('=== JS Array (с копированием данных) ===');
const array = new Array(SIZE).fill(0).map((_, i) => i);
console.log('Before:', formatMemory(process.memoryUsage()));
for (let i = 0; i < 50; i++) {
    addon.processArray(array);
}
console.log('After 50 calls:', formatMemory(process.memoryUsage()));
if (global.gc) {
    global.gc();
}
console.log('After GC:', formatMemory(process.memoryUsage()));
