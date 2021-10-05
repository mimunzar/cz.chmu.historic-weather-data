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

async function downloadClimateStatistics(el, path) {
    console.log(path);
    return Promise.resolve();
}

async function downloadPageStatistics(page, dst) {
    await mkNewDir(dst);
    return Promise.all((await page.$$('#loadedcontent li a')).map(async (el) => {
        const climate = normalizeName(await el.evaluate((el) => el.innerHTML));
        return downloadClimateStatistics(el, path.join(dst, climate));
    }));
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
    });

    const page = await openMainPage(browser, CHMI_URL);
    await downloadPageStatistics(page, DATA_DST);

    await browser.close();
})();

