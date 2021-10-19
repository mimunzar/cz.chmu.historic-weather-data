const puppeteer  = require('puppeteer');
const downloader = require('./downloader');
const path       = require('path');


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

    const browser = await puppeteer.launch({
//        headless: false,
//        devtools: true,
        slowMo: 50,
    });
    await downloader.run(browser, path.resolve('./data/'), checkpoint);
    await browser.close();
})();

