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
    return s.normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replaceAll(' ', '_')
        .toLowerCase();
}

async function downloadRegionClimateStatistics(page, pEl, dst) {
    console.log(dst);
    return Promise.resolve();
}

async function downloadClimateStatistics(page, pEl, dst) {
    await pEl.evaluate(el => el.click())
    const tableEl = await page.waitForSelector('#loadedcontent table');
    return Promise.all((await tableEl.$$('a')).map(async (el) => {
        const region = normalizeName(await el.evaluate((el) => el.innerHTML));
        return downloadRegionClimateStatistics(page, el, path.join(dst, region));
    }));
}

async function downloadStatistics(page, dst) {
    await mkNewDir(dst);
    return Promise.all((await page.$$('#loadedcontent li a')).map(async (el) => {
        const climate = normalizeName(await el.evaluate((el) => el.innerHTML));
        return downloadClimateStatistics(page, el, path.join(dst, climate));
    }));
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
    });

    const page = await openMainPage(browser, CHMI_URL);
    await downloadStatistics(page, DATA_DST);

//    await page.waitFor(10000);

    await browser.close();
})();

