const puppeteer = require('puppeteer');

const path = require('path');


const CHMI_URL = 'https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb';
const DATA_DST = './data/';

async function openMainPage(browser, url) {
    const page = (await browser.pages())[0];
    await page.goto(url);
    await page.waitForSelector('#loadedcontent');
    return Promise.resolve(page);
}

function normalizeName(s) {
    return s.trim()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replaceAll(/, | (- )?| /g, '_')
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
        const name  = normalizeName(await links[0].evaluate((el) => el.innerHTML));
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

async function downloadClimateStatistics(page, pEl, dst) {
    const [ tableEl, _ ] = await Promise.all([
        page.waitForXPath(
            '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table'),
        pEl.evaluate(el => el.click()),
    ]);

    let rIdx = 1;
    for (const _ of (await tableEl.$$('tr'))) {
        for (let cIdx = 1; cIdx < 3; ++cIdx) {
            const regionLink = (await page.$x(
                `/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table/tbody/tr[${rIdx}]/td[${cIdx}]/a`))[0];
            const regionName = normalizeName(await regionLink.evaluate((el) => el.innerHTML));
            console.log(' ->', regionName);
            await downloadRegionClimateStatistics(page, regionLink, path.join(dst, regionName));
        }
        rIdx += 1;
    }

    const backLink = (await page.$x(
        '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/a'))[0];
    return Promise.all([
        page.waitForXPath(
            '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/ul'),
        backLink.evaluate((el) => el.click()),
    ]);
}

async function downloadStatistics(browser, dst) {
    const page = await openMainPage(browser, CHMI_URL);

    let idx = 1;
    for (_ of (await page.$$('#loadedcontent li a'))) {
        const climateLink = (await page.$x(
            `/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/ul/li[${idx}]/a`))[0];
        const climateName = normalizeName(await climateLink.evaluate((el) => el.innerHTML));
        console.log('Downloading', climateName);
        await downloadClimateStatistics(page, climateLink, path.join(dst, climateName));
        idx += 1;
    }

    return Promise.resolve();
}

(async () => {
    const browser = await puppeteer.launch({
//        headless: false,
//        devtools: true,
        slowMo: 50,
    });
    await downloadStatistics(browser, DATA_DST);
    await browser.close();
})();

