const path       = require('path');
const aggregator = require('./aggregator');
const utils      = require('./utils');


function formatHelp() {
    return [
        'usage: node src/aggregate.js [--checkpoint INT] DIR',
        '',
        'positional arguments:',
        'DIR               The directory which contains measurement files',
        '',
        'optional arguments:',
        '--checkpoint INT  The checkpoint number from which to start download',
    ].join('\n');
}

function parseArgs(anArrayOfArgs) {
    const nam = Object.assign({ 'checkpoint': 1 }, utils.namedArgs(anArrayOfArgs));
    const pos = utils.positionalArgs(anArrayOfArgs);

    if (isNaN(nam['checkpoint'])) {
        console.error(`Checkpoint is not a number (${result['checkpoint']})\n`);
        console.error(formatHelp());
        process.exit(1);
    }

    if (! pos.length) {
        console.error(`No input dir provided\n`);
        console.error(formatHelp());
        process.exit(1);
    }

    return {
        'checkpoint': parseInt(nam['checkpoint'], 10),
        'dir'       : pos[0],
    };
}

(async () => {
    const { dir, checkpoint } = parseArgs(process.argv.slice(2));
    await aggregator.run(dir, checkpoint);
})();

