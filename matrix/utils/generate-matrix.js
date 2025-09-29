function generateMatrix(n, filler = () => Math.random()) {
    return Array.from({ length: n }, () =>
        Array.from({ length: n }, () => filler())
    );
}

module.exports = { generateMatrix };