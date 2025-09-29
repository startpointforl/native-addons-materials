const divider = require('bindings')('divider');
try {
    console.log(divider.divide(10, 0));
} catch (error) {
    console.log('Error: ', error.message);
}