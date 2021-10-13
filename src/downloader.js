const path  = require('path');
const utils = require('./utils');


const CHMU_URL = 'https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb';

async function openMainPage(browser, url) {
    const page = (await browser.pages())[0];
    await Promise.all([
        page.waitForSelector('#loadedcontent'),
        page.goto(url),
    ]);
    return page;
}

function normalizeFileName(s) {
    return utils.removeAccent(s.trim())
        .replaceAll(/[,_-]/g, ' ')
        .replaceAll(/ +/g,    '_')
        .toLowerCase();
}

async function downloadRegionClimateStatistics(page, pEl, dst) {
    const [ tableEl, _ ] = await Promise.all([
        page.waitForXPath(
            '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table[2]'),
        pEl.evaluate(el => el.click()),
    ]);

    for (const row of (await tableEl.$$('tr:not(:first-child)'))) {
        const links = await row.$$('a');
        // Filenames are not unique so we additionally use epoch
        const name  = normalizeFileName(await links[0].evaluate((el) => el.innerHTML));
        const epoch = await links[2].evaluate((el) => el.innerHTML);

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.join(dst, `${name}_${epoch}`),
        });
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            links[0].evaluate((el) => el.click()),
        ]);
    }

    const backLink = (await page.$x(
        '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table[1]/tbody/tr/td[2]/a'))[0];
    return Promise.all([
        page.waitForXPath(
            '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table[2]', { hidden: true }),
        backLink.evaluate((el) => el.click()),
    ]);
}

function progressBar(curr, total, width = 2) {
    const ratio = `${curr}/${total}`.padStart(`${total}/${total}`.length, '0');
    const fill  = '#'.repeat(Math.min(curr, total)*width).padEnd(total*width);
    return `[${fill}] ${ratio}`;
}

async function downloadClimateStatistics(page, pEl, dst) {
    const [ tableEl, _ ] = await Promise.all([
        page.waitForXPath(
            '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table'),
        pEl.evaluate(el => el.click()),
    ]);

    const numRows = (await tableEl.$$('tr')).length;
    for (let rIdx = 1; rIdx <= numRows; ++rIdx) {
        for (let cIdx = 1; cIdx <= 2; ++cIdx) {
            const regionLink = (await page.$x(
                `/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table/tbody/tr[${rIdx}]/td[${cIdx}]/a`))[0];
            const regionName = await regionLink.evaluate((el) => el.innerHTML);
            process.stdout.write(`\r\x1b[K  ${progressBar((rIdx - 1)*2 + cIdx - 1, numRows*2)} (${regionName})`);
            await downloadRegionClimateStatistics(page,
                regionLink, path.join(dst, normalizeFileName(regionName)));
        }
    }
    process.stdout.write(`\r\x1b[K  ${progressBar(numRows*2, numRows*2)}\n`);

    const backLink = (await page.$x(
        '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/a'))[0];
    return Promise.all([
        page.waitForXPath(
            '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/ul'),
        backLink.evaluate((el) => el.click()),
    ]);
}

async function run(browser, dstPath, checkpoint = 1) {
    const page = await openMainPage(browser, CHMU_URL);

    const numLinks = (await page.$$('#loadedcontent li a')).length;
    for (let idx = checkpoint; idx <= numLinks; ++idx) {
        const climateLink = (await page.$x(
            `/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/ul/li[${idx}]/a`))[0];
        const climateName = await climateLink.evaluate((el) => el.innerHTML);
        console.log(`Downloading checkpoint ${idx} of ${numLinks} (${climateName})`);
        await downloadClimateStatistics(page,
            climateLink, path.join(dstPath, normalizeFileName(climateName)));
    }
}

module.exports = {
    run,
    normalizeFileName,
};

