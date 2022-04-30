const path       = require('path');
const puppeteer  = require('puppeteer');
const downloader = require('./downloader');
const utils      = require('./utils');


function formatHelp() {
    return [
        'usage: node src/download.js --url STR [--checkpoint INT] DIR',
        '',
        'positional arguments:',
        'DIR               The directory which contains measurement files',
        '',
        'optional arguments:',
        '--url STR         The url of the CHMU page from which to start download',
        '--checkpoint INT  The checkpoint number from which to start download',
    ].join('\n');
}

function parseArgs(anArrayOfArgs) {
    const nam = Object.assign({ 'checkpoint': 1 }, utils.namedArgs(anArrayOfArgs));
    const pos = utils.positionalArgs(anArrayOfArgs);

    if (! nam['url']) {
        console.error('No URL provided\n');
        console.error(formatHelp())
        process.exit(1);
    }

    if (isNaN(nam['checkpoint'])) {
        console.error(`Checkpoint is not a number (${result['checkpoint']})\n`);
        console.error(formatHelp())
        process.exit(1);
    }

    if (! pos.length) {
        console.error(`No input dir provided\n`);
        console.error(formatHelp())
        process.exit(1);
    }

    return {
        'checkpoint': parseInt(nam['checkpoint'], 10),
        'url'       : nam['url'],
        'dir'       : pos[0],
    };
}

(async () => {
    const { url, checkpoint, dir } = parseArgs(process.argv.slice(2));
    const browser = await puppeteer.launch({
//        headless: false,
//        devtools: true,
        slowMo: 50,
    });
    await downloader.run(browser, dir, url, checkpoint);
    await browser.close();
})();

