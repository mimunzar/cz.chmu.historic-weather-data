const path       = require('path');
const aggregator = require('./aggregator');
const utils      = require('./utils');


function parseArgs(listOfArgs) {
    const args = [ 'checkpoint' ];
    listOfArgs = listOfArgs.slice(0, args.len);
    let result = listOfArgs.reduce((acc, v, i) => utils.set(acc, args[i], v), {});
    result     = Object.assign({ 'checkpoint': 1 }, result);

    if (isNaN(result['checkpoint'])) {
        console.error(`Checkpoint is not a number (${result['checkpoint']})`);
        process.exit(1);
    }

    return result;
}

(async () => {
    const { checkpoint } = parseArgs(process.argv.slice(2));
    await aggregator.run(path.resolve('./data/'), checkpoint);
})();

