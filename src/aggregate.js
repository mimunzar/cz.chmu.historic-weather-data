const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');

const fs = require('fs/promises');
const path = require('path');





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

function removeSuffix(s, suffix) {
    if (!s.endsWith(s)) return s;
    return s.slice(0, Math.max(0, s.length - suffix.length));
}

function zipFileContent(fPath) {
    const zName = removeSuffix(path.basename(fPath), '.zip')
    return iconv.decode(new AdmZip(fPath).getEntry(zName).getData(), 'CP1250');
}

async function writeContent(f, dPath) {
    for (let fPath of (await zipFilePathsOfDir(dPath))) {
        zipFileContent(fPath);
    }
}

(async () => {
    for (let dPath of (await climateDirPaths(DATA_DST))) {
        const f = await fs.open(`${dPath}.csv`, 'w');
        await f.write(`${FIELDS.join(',')}\n`);
        await writeContent(f, dPath);
        break;
    };
})();

