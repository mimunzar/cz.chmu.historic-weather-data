const puppeteer = require('puppeteer');

const fs = require('fs');
const path = require('path');


const CHMI_URL = 'https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb';
const DATA_DST = './data/';

async function openMainPage(browser, url) {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('#loadedcontent');
    return Promise.resolve(page);
}

async function mkNewDir(path) {
    if (fs.existsSync(path)) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
        return fs.mkdir(path, { recursive: true }, (err) => {
            if (err) reject(err);
            else resolve(path);
        });
    });
}

function normalizeName(s) {
    return s.trim()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replaceAll(/, | (- )?| /g, '_')
        .toLowerCase();
}

function takeNth(arr, n) {
    return arr.reduce((acc, el, idx) => {
        if (0 < idx % n) return acc;
        return acc.concat([el]);
    }, []);
}

async function downloadRegionClimateStatistics(page, pEl, dst) {
    // await pEl.evaluate(el => el.click())
    // await page.waitForXPath('/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table[2]');
    // console.log('##', dst);
    return Promise.resolve();
}

async function downloadClimateStatistics(page, pEl, dst) {
    await pEl.evaluate(el => el.click())
    const tableEl = await page.waitForXPath(
        '/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/table');

    let rIdx = 1;
    for (_ of (await tableEl.$$('tr'))) {
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
    await backLink.evaluate((el) => el.click());
    return page.waitForXPath('/html/body/div[2]/div[2]/div/div/div[4]/div/div[2]/div/ul');
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
        headless: false,
        devtools: true,
    });
    await downloadStatistics(browser, DATA_DST);
    await browser.close();
})();

