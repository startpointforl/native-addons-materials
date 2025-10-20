const addon = require('../build/Release/addon');
const { formatMemory } = require('./utils');

const SIZE = 1000000;

console.log('=== External Buffer (память управляется C++) ===');
console.log('Before:', formatMemory(process.memoryUsage()));

// Создаем 50 буферов и храним ссылки на них
const buffers = [];
for (let i = 0; i < 50; i++) {
    buffers.push(addon.createExternalBuffer(SIZE));
}
console.log('After 50 calls:', formatMemory(process.memoryUsage()));

// Пробуем GC (буферы еще живы в массиве)
if (global.gc) {
    global.gc();
}
console.log('After first GC:', formatMemory(process.memoryUsage()));

// Очищаем ссылки на буферы
buffers.length = 0;
console.log('After clear buffers:', formatMemory(process.memoryUsage()));

// Вызываем GC - память отмечается для удаления
if (global.gc) {
    global.gc();
}
console.log('After second GC:', formatMemory(process.memoryUsage()));

// Еще один GC для физического освобождения памяти
if (global.gc) {
    global.gc();
}
console.log('After third GC:', formatMemory(process.memoryUsage()));

