const AdmZip = require('adm-zip');
const iconv  = require('iconv-lite');

const fs     = require('fs/promises');
const path   = require('path');

const utils  = require('./utils');


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

function labelParser(s, nLinesRead, result, context) {
    switch (nLinesRead) {
        case 0:
            break;
        case 1:
            context['listOfLabels'] = parseCSVLabels(s);
            break;
        default:
            result.push(parseCSVLine(s, context['listOfLabels']));
    };
}

function priznakPopisSectionParser(s, nLinesRead, result, _) {
    if (0 == nLinesRead) return;
    const [ k, v ] = s.split(';');
    result[k] = v;
}

function prvekSectionParser(s, nLinesRead, result, _) {
    if (0 == nLinesRead) return;
    result.push(s);
}

function makeSectionParser(fnParseSection) {
    return function(listOfLines, startIdx, result) {
        let idx     = startIdx;
        let context = {};
        for (;idx < listOfLines.length && '' != listOfLines[idx].trim(); ++idx)
            fnParseSection(listOfLines[idx], idx - startIdx, result, context);
        return idx - startIdx;
    };
}

const parseDataSection         = makeSectionParser(labelParser);
const parsePristrojeSection    = makeSectionParser(labelParser);
const parseMetadataSection     = makeSectionParser(labelParser);
const parsePriznakPopisSection = makeSectionParser(priznakPopisSectionParser);
const parsePrvekSection        = makeSectionParser(prvekSectionParser);

function parseFile(listOfLines) {
    const result = {};
    for (let idx = 0; idx < listOfLines.length;) {
        switch (utils.removeAccent(listOfLines[idx].trim()).toLowerCase()) {
            case 'metadata':
                result['metadata'] = [];
                idx += parseMetadataSection(listOfLines, idx, result['metadata']);
                break;
            case 'pristroje':
                result['pristroje'] = [];
                idx += parsePristrojeSection(listOfLines, idx, result['pristroje']);
                break;
            case 'prvek':
                result['prvek'] = [];
                idx += parsePrvekSection(listOfLines, idx, result['prvek']);
                break;
            case 'priznak;popis':
                result['priznak;popis'] = {};
                idx += parsePriznakPopisSection(listOfLines, idx, result['priznak;popis']);
                break;
            case 'data':
                result['data'] = [];
                idx += parseDataSection(listOfLines, idx, result['data']);
                break;
            default:
                ++idx;
        };
    }
    return result;
}

function priznakAssembler(aDataEntry, aParsedFile) {
    if (!aDataEntry.priznak)
        return { priznak: '' };
    if (aDataEntry.priznak in aParsedFile['priznak;popis'])
        return { priznak: aParsedFile['priznak;popis'][aDataEntry.priznak] };
    throw new Error(`Failed to assemble priznak (unknown value ${val})`);
}

function dataEntryToDate(aDataEntry) {
    if (['mesic', 'den', 'rok'].every((prop) => prop in aDataEntry))
        return new Date(`${aDataEntry.mesic}.${aDataEntry.den}.${aDataEntry.rok}`);
    throw new Error(`Failed to convert aDataEntry to date (${JSON.stringify(aDataEntry)})`);
}

function dataStringToDate(s) {
    const [ day, month, year ] = s.split('.');
    if ([day, month, year].every(utils.existy))
        return new Date(`${month}.${day}.${year}`);
    throw new Error(`Failed to convert dataString to date (${s})`);
}

function makeIsInDateInterval(aDate) {
    return function(aStationOrAPristroj) {
        return aDate >= dataStringToDate(aStationOrAPristroj.zacatek_mereni)
            && aDate <= dataStringToDate(aStationOrAPristroj.konec_mereni);
    };
}

function pristrojAssembler(aDataEntry, aParsedFile) {
    const fnWithinDate = makeIsInDateInterval(dataEntryToDate(aDataEntry));
    const deviceUsed   = aParsedFile.pristroje.filter(fnWithinDate)[0];
    if (deviceUsed)
        return {
            'pristroj'                 : deviceUsed['pristroj'],
            'zacatek_mereni_pristroje' : deviceUsed['zacatek_mereni'],
            'konec_mereni_pristroje'   : deviceUsed['konec_mereni'],
            'vyska_pristroje_[m]'      : deviceUsed['vyska_pristroje_[m]'],
        };
    throw new Error(
        `Failed to assemble device (unknown pristroj for ${deDate.toISOString()})`);
}

function prvekAssembler(aDataEntry, aParsedFile) {
    return { 'prvek': aParsedFile['prvek'].join(', ') };
}

function stationAssembler(aDataEntry, aParsedFile) {
    const fnWithinDate = makeIsInDateInterval(dataEntryToDate(aDataEntry));
    const stationUsed  = aParsedFile.metadata.filter(fnWithinDate)[0];
    if (stationUsed)
        return {
            'stanice_id'              : stationUsed['stanice_id'],
            'jmeno_stanice'           : stationUsed['jmeno_stanice'],
            'zacatek_mereni_stanice'  : stationUsed['zacatek_mereni'],
            'konec_mereni_stanice'    : stationUsed['konec_mereni'],
            'zemepisna_delka_stanice' : stationUsed['zemepisna_delka'],
            'zemepisna_sirka_stanice' : stationUsed['zemepisna_sirka'],
            'nadmorska_vyska_stanice' : stationUsed['nadmorska_vyska'],
        };
    throw new Error(
        `Failed to assemble station (unknown station for ${deDate.toISOString()})`);
}

function makeDataAssembler(anAssembler) {
    return function(aParsedFile) {
        return aParsedFile.data.map((aDataEntry) => {
            return Object.values(anAssembler).reduce((acc, fnAssembler) => {
                try {
                    return Object.assign(aDataEntry, fnAssembler(aDataEntry, aParsedFile))
                } catch (ex) {
                    console.error(`[ERROR]: ${ex.message}`);
                }
            }, Object.assign({}, aDataEntry));
        });
    };
}

const dataAssembler = makeDataAssembler({
    priznak  : priznakAssembler,
    pristroj : pristrojAssembler,
    prvek    : prvekAssembler,
    stanice  : stationAssembler,
});

async function writeClimateContent(f, dPath) {
    for (const fPath of (await zipFilePathsOfDir(dPath))) {
        // console.log(parseFileContent(readLinesFromZIPFile(fPath)));
        // const d = dataAssembler(parseFile(readLinesFromZIPFile(fPath)));
        console.log(dataAssembler(parseFile(readLinesFromZIPFile(fPath))));
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
    dataEntryToDate,
    dataStringToDate,
    makeDataAssembler,
    makeIsInDateInterval,
    parseCSVLabels,
    parseCSVLine,
    parseDataSection,
    parseFile,
    parseMetadataSection,
    parsePristrojeSection,
    parsePriznakPopisSection,
    parsePrvekSection,
    pristrojAssembler,
    priznakAssembler,
    run,
    stationAssembler,
};

