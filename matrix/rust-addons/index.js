if (process.platform === 'darwin') {
    module.exports = require('./matrix-rust.darwin-arm64');
} else if (process.platform === 'linux') {
    module.exports = require('./matrix-rust.linux-x64-gnu');
} else {
    throw new Error(`Unsupported platform: ${process.platform}`);
}