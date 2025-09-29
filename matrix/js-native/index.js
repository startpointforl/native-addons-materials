const { multiplyBase } = require('./base');
const { multiplyNonBlocking } = require('./non-blocking');
const { multiplyWorker } = require('./worker');
const { multiplyOptimized } = require('./optimized');
const { multiplyOptimizedWorker } = require('./optimized-worker');

module.exports = {
    multiplyBase,
    multiplyNonBlocking,
    multiplyWorker,
    multiplyOptimized,
    multiplyOptimizedWorker
}