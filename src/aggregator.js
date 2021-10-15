const AdmZip = require('adm-zip');
const iconv  = require('iconv-lite');

const fs     = require('fs/promises');
const path   = require('path');

const utils  = require('./utils');


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

function genericSectionParser(line, linesRead, result, context) {
    switch (linesRead) {
        case 0:
            break;
        case 1:
            context['listOfLabels'] = parseCSVLabels(line);
            break;
        default:
            result.push(parseCSVLine(line, context['listOfLabels']));
    };
}

function priznakPopisSectionParser(line, linesRead, result, _) {
    switch (linesRead) {
        case 0:
            break;
        default:
            const [ k, v ] = line.split(';');
            result[k] = v;
    };
}

function makeSectionParser(fnParseSection) {
    return function(lines, startIdx, result) {
        let idx     = startIdx;
        let context = {};
        while (idx < lines.length && '' != lines[idx].trim()) {
            fnParseSection(lines[idx], idx - startIdx, result, context);
            ++idx;
        }
        return idx - startIdx;
    };
}

const parseDataSection         = makeSectionParser(genericSectionParser);
const parsePristrojeSection    = makeSectionParser(genericSectionParser);
const parseMetadataSection     = makeSectionParser(genericSectionParser);
const parsePriznakPopisSection = makeSectionParser(priznakPopisSectionParser);

function parseContent(lines) {
    const result = {};
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
            case 'priznak;popis':
                result['priznak;popis'] = {};
                idx += parsePriznakPopisSection(lines, idx, result['priznak;popis']);
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
    parsePriznakPopisSection,
    run,
};

