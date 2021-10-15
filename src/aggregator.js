const AdmZip = require('adm-zip');
const iconv  = require('iconv-lite');

const fs     = require('fs/promises');
const path   = require('path');

const utils  = require('./utils');


const FIELDS = [
    'Rok',
    'Měsíc',
    'Den',
    'Hodnota',
    'Stanice ID',
    'Jméno stanice',
    'Zeměpisná délka',
    'Zeměpisná šířka',
    'Nadmořská výška',
    'Přístroj',
    'Začátek měření',
    'Konec měření',
    'Výška přístroje [m]',
    'Název souboru',
];

function parseCSVLine(s, listOfLabels) {
    const result = {}
    const values = s.split(';');
    for (let i = 0; i < listOfLabels.length; ++i)
        result[listOfLabels[i]] = values[i] || '';
    return result;
};

function parseCSVLabels(s) {
    return s.split(';').map((l) => {
        return utils.removeAccent(l.trim()).replaceAll(/ +/g, '_').toLowerCase();
    });
}

function parseGenericSection(lines, startIdx, result) {
    let idx          = startIdx;
    let listOfLabels = [];
    while (idx < lines.length && '' != lines[idx].trim()) {
        if (startIdx + 1 == idx)
            listOfLabels = parseCSVLabels(lines[idx]);
        else if (listOfLabels.length)
            result.push(parseCSVLine(lines[idx], listOfLabels));
        ++idx;
    }
    return idx - startIdx;
}

const parseDataSection      = parseGenericSection;
const parsePristrojeSection = parseGenericSection;
const parseMetadataSection  = parseGenericSection;

function parseContent(lines) {
    const result   = {};
    for (let idx = 0; idx < lines.length;) {
        switch (utils.removeAccent(lines[idx].trim()).toLowerCase()) {
            case 'metadata':
                result['metadata'] = [];
                idx += parseMetadataSection(lines, idx, result['metadata']);
                break;
            case 'pristroje':
                result['pristroje'] = [];
                idx += parsePristrojeSection(lines, idx, result['pristroje']);
                break;
            case 'data':
                result['data'] = [];
                idx += parseDataSection(lines, idx, result['data']);
                break;
            default:
                ++idx;
        };
    }
    return result;
}

function readLinesFromZIPFile(fPath) {
    const zName = utils.removeSuffix(path.basename(fPath), '.zip')
    return iconv.decode(new AdmZip(fPath).getEntry(zName).getData(), 'CP1250').split('\n');
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

async function writeClimateContent(f, dPath) {
    for (const fPath of (await zipFilePathsOfDir(dPath))) {
        console.log(parseContent(readLinesFromZIPFile(fPath)));
        break;
    }
}

async function climateDirPaths(dst) {
    return (await fs.readdir(dst, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map   ((dirent) => path.join(dst, dirent.name))
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
    parseCSVLabels,
    parseCSVLine,
    parseDataSection,
    parseContent,
    parseMetadataSection,
    parsePristrojeSection,
    run,
};

