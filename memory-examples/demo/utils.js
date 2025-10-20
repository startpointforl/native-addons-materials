function formatMemory(mem) {
    return {
        rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
        arrayBuffers: `${(mem.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
    };
}

module.exports = {
    formatMemory,
};