const aggregator = require('./aggregator');


(async () => {
    let checkpoint = 1;
    if (3 <= process.argv.length) {
        const firstArg = process.argv[2];
        if (isNaN(firstArg)) {
            console.error(`Checkpoint is not a number (${firstArg})`);
            process.exit(1);
        } else
            checkpoint = parseInt(firstArg);
    }

    await aggregator.run('./data/', checkpoint);
})();

