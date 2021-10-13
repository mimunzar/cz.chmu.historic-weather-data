const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');

const fs = require('fs/promises');
const path = require('path');

const utils = require('./utils');


const DATA_DST = './data/';
const FIELDS = [
    'Prvek',
    'Rok',
    'Měsíc',
    'Den',
    'Hodnota',
    'Příznak',
    'Popis Příznaku',
    'Stanice ID',
    'Jméno stanice',
    'Začátek měření',
    'Konec měření',
    'Zeměpisná délka',
    'Zeměpisná šířka',
    'Nadmořská výška',
    'Přístroj',
    'Výška přístroje [m]',
    'Název souboru',
];

async function climateDirPaths(dst) {
    return (await fs.readdir(dst, { withFileTypes: true}))
        .filter((dirent) => dirent.isDirectory())
        .map   ((dirent) => path.join(dst, dirent.name))
}

async function zipFilePathsOfDir(dPath) {
    let result = [];
    for (let dirent of (await fs.readdir(dPath, { withFileTypes: true })))
        if (dirent.isDirectory())
            result = result.concat(await zipFilePathsOfDir(path.join(dPath, dirent.name)));
        else if (dirent.name.endsWith('.zip'))
            result.push(path.join(dPath, dirent.name));
    return result;
}

function zipFileContent(fPath) {
    const zName = utils.removeSuffix(path.basename(fPath), '.zip')
    return iconv.decode(new AdmZip(fPath).getEntry(zName).getData(), 'CP1250');
}

async function writeClimateContent(f, dPath) {
    for (let fPath of (await zipFilePathsOfDir(dPath))) {
        console.log(zipFileContent(fPath));

        // const csv = fileStructToCSV(struct, labels);
        break;
    }
}

(async () => {
    for (let dPath of (await climateDirPaths(DATA_DST))) {
        const f = await fs.open(`${dPath}.csv`, 'w');
        await f.write(`${FIELDS.join(',')}\n`);
        await writeClimateContent(f, dPath);
        break;
    };
})();

