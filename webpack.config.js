const {nodeLibrary} = require('webpack-config-prefabs');
module.exports = nodeLibrary(module, {
    entry: './cli.ts',
    outputFilepath: 'ansi-to-html'
});
