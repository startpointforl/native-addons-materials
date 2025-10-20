const v8 = require('v8');
const addon = require('../build/Release/addon');
const { formatMemory } = require('./utils');

console.log('=== GC ===');

console.log('\nTest 1: V8 Heap (обычные JS объекты)');

console.log('\nInitial:', formatMemory(process.memoryUsage()));

let tempArrays = [];
for (let i = 0; i < 50; i++) {
    tempArrays.push(new Array(100000).fill(i));
}

console.log('\nAfter creating arrays:', formatMemory(process.memoryUsage()));

tempArrays = null;
console.log('\nAfter clearing reference:', formatMemory(process.memoryUsage()));

if (global.gc) {
    console.log('\n⚡ Calling GC #1...');
    global.gc();
}
const afterGC1 = process.memoryUsage();
console.log('After GC #1:', formatMemory(afterGC1));

if (global.gc) {
    console.log('\n⚡ Calling GC #2...');
    global.gc();
}
const afterGC2 = process.memoryUsage();
console.log('After GC #2:', formatMemory(afterGC2));

console.log(`\nDifference between GC #1 and GC #2: ${((afterGC2.heapUsed - afterGC1.heapUsed) / 1024 / 1024).toFixed(2)} MB`);

console.log('\n============================================================')
console.log('\nTest 2: External Memory (C++ Buffer)');

console.log('\nInitial:', formatMemory(process.memoryUsage()));

let buffers = [];
for (let i = 0; i < 50; i++) {
    buffers.push(addon.createExternalBuffer(1000000));
}

console.log('\nAfter creating buffers:', formatMemory(process.memoryUsage()));

buffers = null;
console.log('\nAfter clearing reference:', formatMemory(process.memoryUsage()));

if (global.gc) {
    console.log('\n⚡ Calling GC #1...');
    global.gc();
}
const afterGC1ext = process.memoryUsage();
console.log('After GC #1:', formatMemory(afterGC1ext));

if (global.gc) {
    console.log('\n⚡ Calling GC #2...');
    global.gc();
}
const afterGC2ext = process.memoryUsage();
console.log('After GC #2:', formatMemory(afterGC2ext));

console.log(`\nDifference between GC #1 and GC #2: ${((afterGC2ext.external - afterGC1ext.external) / 1024 / 1024).toFixed(2)} MB`);
