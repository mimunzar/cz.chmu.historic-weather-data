const AdmZip = require('adm-zip');
const iconv  = require('iconv-lite');

const fs     = require('fs/promises');
const path   = require('path');

const utils  = require('./utils');


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
    return (await fs.readdir(dst, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map   ((dirent) => path.join(dst, dirent.name))
}

async function zipFilePathsOfDir(dPath) {
    let result = [];
    for (const dirent of (await fs.readdir(dPath, { withFileTypes: true })))
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

function csvLineToDict(line, listOfLabels) {
    const result = {}
    const values = line.split(';');
    for (let i = 0; i < listOfLabels.length; ++i)
        result[listOfLabels[i]] = values[i] || '';
    return result;
};

function parseContent(s) {
    const result = {};
    let state = { section: null, expectingHeader: false, listOfLabels: null };

    for (const line of s.split('\n')) {
        if ('metadata' == utils.removeAccent(line).toLowerCase()) {
            state = { section: 'metadata', expectingHeader: true };
            continue;
        }

        if ('pristroje' == utils.removeAccent(line).toLowerCase()) {
            state = { section: 'pristroje', expectingHeader: true };
            continue;
        }

        if ('data' == utils.removeAccent(line).toLowerCase()) {
            state = { section: 'data', expectingHeader: true };
            continue;
        }

        if ('' == line) {
            state = { section: null, expectingHeader: false };
            continue;
        }

        if (state.expectingHeader) {
            state.listOfLabels = line.split(';')
                .map((l => utils.removeAccent(l).toLowerCase()));
            state.expectingHeader = false;
            continue;
        }

        if (state.section) {
            if (!result[state.section])
                result[state.section] = [];
            result[state.section].push(utils.csvLineToDict(line, state.listOfLabels));
            continue;
        }
    }

    return result;
}

async function writeClimateContent(f, dPath) {
    for (const fPath of (await zipFilePathsOfDir(dPath))) {
        console.log(parseContent(zipFileContent(fPath)));
        break;
    }
}

async function run(dPath) {
    for (const p of (await climateDirPaths((dPath)))) {
        const f = await fs.open(`${p}.csv`, 'w');
        await f.write(`${FIELDS.join(',')}\n`);
        await writeClimateContent(f, p);
        break;
    };
};

module.exports = {
    run,
    csvLineToDict,
};

