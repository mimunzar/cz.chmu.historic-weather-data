const path       = require('path');
const puppeteer  = require('puppeteer');
const downloader = require('./downloader');
const utils      = require('./utils');


function parseArgs(listOfArgs) {
    const args = [ 'url', 'checkpoint' ];
    listOfArgs = listOfArgs.slice(0, args.len);
    let result = listOfArgs.reduce((acc, v, i) => utils.set(acc, args[i], v), {});
    result     = Object.assign({ 'checkpoint': 1 }, result);

    if (!result['url']) {
        console.error('No URL provided');
        process.exit(1);
    }

    if (isNaN(result['checkpoint'])) {
        console.error(`Checkpoint is not a number (${result['checkpoint']})`);
        process.exit(1);
    }

    return result;
}

(async () => {
    const { url, checkpoint } = parseArgs(process.argv.slice(2));
    const browser = await puppeteer.launch({
//        headless: false,
//        devtools: true,
        slowMo: 50,
    });
    await downloader.run(browser, path.resolve('./data/'), url, checkpoint);
    await browser.close();
})();

