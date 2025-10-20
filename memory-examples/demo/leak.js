const addon = require('../build/Release/addon');
const { formatMemory } = require('./utils');

console.log('\n=== Allocation with Memory Leak (утечка памяти) ===');
console.log('Before:', formatMemory(process.memoryUsage()));
for (let i = 0; i < 50; i++) {
    addon.allocationWithLeak(1000000);
}
console.log('After 50 calls:', formatMemory(process.memoryUsage()));
if (global.gc) {
    global.gc();
}
console.log('After GC:', formatMemory(process.memoryUsage()));

