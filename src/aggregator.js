const AdmZip = require('adm-zip');
const iconv  = require('iconv-lite');

const fs     = require('fs/promises');
const path   = require('path');
const assert = require('assert');

const utils  = require('./utils');


const printProgress  = utils.makePrintProgress(30);
const LABEL_ORDERING = [
    'nazev_souboru',
    'stanice_id',
    'jmeno_stanice',
    'zacatek_mereni_stanice',
    'konec_mereni_stanice',
    'zemepisna_delka_stanice',
    'zemepisna_sirka_stanice',
    'nadmorska_vyska_stanice',
    'pristroj',
    'prvek',
    'rok',
    'mesic',
    'den',
    'hodnota',
    'priznak',
    'datum',
];
const WIND_LABEL_ORDERING = [
    'nazev_souboru',
    'stanice_id',
    'jmeno_stanice',
    'zacatek_mereni_stanice',
    'konec_mereni_stanice',
    'zemepisna_delka_stanice',
    'zemepisna_sirka_stanice',
    'nadmorska_vyska_stanice',
    'pristroj',
    'prvek',
    'rok',
    'mesic',
    'den',
    'fmax',
    'dmax',
    'casmax',
    'priznak',
    'datum',
];
const LABEL_NAMES = {
    'nazev_souboru'           : 'Název souboru',
    'stanice_id'              : 'Stanice ID',
    'jmeno_stanice'           : 'Jméno stanice',
    'zacatek_mereni_stanice'  : 'Začátek měření',
    'konec_mereni_stanice'    : 'Konec měření',
    'zemepisna_delka_stanice' : 'Zeměpisná délka',
    'zemepisna_sirka_stanice' : 'Zeměpisná šířka',
    'nadmorska_vyska_stanice' : 'Nadmořská výška',
    'pristroj'                : 'Přístroj',
    'prvek'                   : 'Prvek',
    'rok'                     : 'Rok',
    'mesic'                   : 'Měsíc',
    'den'                     : 'Den',
    'hodnota'                 : 'Hodnota',
    'fmax'                    : 'Fmax',
    'dmax'                    : 'Dmax',
    'casmax'                  : 'Casmax',
    'priznak'                 : 'Příznak',
    'datum'                   : 'Datum',
};

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

function parseFile(listOfLines, fPath) {
    const result = {
        'nazev_souboru' : utils.removeSuffix(path.basename(fPath), '.zip'),
        'metadata'      : [],
        'pristroje'     : [],
        'prvek'         : [],
        'priznak;popis' : {},
        'data'          : [],
    };
    for (let idx = 0; idx < listOfLines.length;) {
        switch (utils.removeAccent(listOfLines[idx].trim()).toLowerCase()) {
            case 'metadata':
                idx += parseMetadataSection(listOfLines, idx, result['metadata']);
                break;
            case 'pristroje':
                idx += parsePristrojeSection(listOfLines, idx, result['pristroje']);
                break;
            case 'prvek':
                idx += parsePrvekSection(listOfLines, idx, result['prvek']);
                break;
            case 'priznak;popis':
                idx += parsePriznakPopisSection(listOfLines, idx, result['priznak;popis']);
                break;
            case 'data':
                idx += parseDataSection(listOfLines, idx, result['data']);
                break;
            default:
                ++idx;
        };
    }
    return result;
}

function priznakAssembler(aDataEntry, aParsedFile) {
    if (aDataEntry.priznak && (aDataEntry.priznak in aParsedFile['priznak;popis']))
        return { priznak: aParsedFile['priznak;popis'][aDataEntry.priznak] };
    return { priznak: '' };
    //^ Not all symptom symbols have associated description
}

function dataEntryToDate(aDataEntry) {
    if (['den', 'mesic', 'rok'].every((prop) => prop in aDataEntry))
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
    const deDate = dataEntryToDate(aDataEntry);
    const device = aParsedFile.pristroje.filter(makeIsInDateInterval(deDate))[0];
    return {
        'pristroj'                 : (device && device['pristroj'])            || 'UNKNOWN',
        'zacatek_mereni_pristroje' : (device && device['zacatek_mereni'])      || 'UNKNOWN',
        'konec_mereni_pristroje'   : (device && device['konec_mereni'])        || 'UNKNOWN',
        'vyska_pristroje_[m]'      : (device && device['vyska_pristroje_[m]']) || 'UNKNOWN',
    };
    //^ Not all records have associated device
}

function prvekAssembler(_, aParsedFile) {
    return { 'prvek': aParsedFile['prvek'].join(', ') };
}

function stationAssembler(aDataEntry, aParsedFile) {
    const deDate      = dataEntryToDate(aDataEntry);
    const station = aParsedFile.metadata.filter(makeIsInDateInterval(deDate))[0];
    return {
        'stanice_id'              : (station && station['stanice_id'])      || 'UNKNOWN',
        'jmeno_stanice'           : (station && station['jmeno_stanice'])   || 'UNKNOWN',
        'zacatek_mereni_stanice'  : (station && station['zacatek_mereni'])  || 'UNKNOWN',
        'konec_mereni_stanice'    : (station && station['konec_mereni'])    || 'UNKNOWN',
        'zemepisna_delka_stanice' : (station && station['zemepisna_delka']) || 'UNKNOWN',
        'zemepisna_sirka_stanice' : (station && station['zemepisna_sirka']) || 'UNKNOWN',
        'nadmorska_vyska_stanice' : (station && station['nadmorska_vyska']) || 'UNKNOWN',
    };
    //^ Not all records have associated station
}

function nazevSouboruAssembler(_, aParsedFile) {
    return { 'nazev_souboru': aParsedFile['nazev_souboru'] };
}

function datumAssembler(aDataEntry, _) {
    const fnGetNumEntry = (x) => Number(aDataEntry[x]);
    return { 'datum': ['den', 'mesic', 'rok'].map(fnGetNumEntry).join('/') };
}

function makeDataAssembler(anAssembler) {
    return function(aParsedFile, fPath) {
        return aParsedFile.data.map((aDataEntry) => {
            return Object.values(anAssembler).reduce((acc, fnAssembler) => {
                try {
                    return Object.assign(aDataEntry, fnAssembler(aDataEntry, aParsedFile))
                } catch (ex) {
                    console.error(`[ERROR]: ${ex.message} (${fPath})`);
                }
            }, Object.assign({}, aDataEntry));
        });
    };
}

const assembleData = makeDataAssembler({
    'priznak'       : priznakAssembler,
    'pristroj'      : pristrojAssembler,
    'prvek'         : prvekAssembler,
    'stanice'       : stationAssembler,
    'nazev_souboru' : nazevSouboruAssembler,
    'datum'         : datumAssembler,
});

function formatAssembledData(listOfOrderedLabes, anAssembledData) {
    return listOfOrderedLabes.reduce((acc, l) => {
        if (l in anAssembledData) {
            acc.push(anAssembledData[l])
            return acc;
        }
        throw new Error(`Failed to find '${l}' in assembled data`)
    }, []).join(';');
}

function getOrderedLabelsFromPath(dPath) {
    if (dPath.includes('maximalni_rychlost_vetru')) return WIND_LABEL_ORDERING;
    return LABEL_ORDERING;
}

function formatData(listOfOrderedLabes, listOfAssembledData, fPath) {
    return listOfAssembledData.reduce((acc, anAssembledData) => {
        try {
            acc.push(formatAssembledData(listOfOrderedLabes, anAssembledData));
        } catch (ex) {
            console.error(`[ERROR]: ${ex.message} (${fPath})`);
        }
        return acc;
    }, []);
}

function formatLabels(listOfOrderedLabes, aLabelNames) {
    return listOfOrderedLabes.map((l) => {
        assert(l in aLabelNames);
        return aLabelNames[l];
    }).join(';');
};

async function writeAggregatedData(outFile, dPath) {
    const listOfOrderedLabes = getOrderedLabelsFromPath(dPath);
    await outFile.writeFile(formatLabels(listOfOrderedLabes, LABEL_NAMES) + '\n');

    const listOfFiles = await zipFilePathsOfDir(dPath);
    const numFiles    = listOfFiles.length;
    for (let idx = 0; idx < numFiles; ++idx) {
        const zipFilePath   = listOfFiles[idx];
        process.stdout.write(
            `\r\x1b[K ${printProgress(idx, numFiles)} (${path.basename(zipFilePath)})`);
        const parsedFile    = parseFile(readLinesFromZIPFile(zipFilePath), zipFilePath);
        const assembledData = assembleData(parsedFile, zipFilePath);
        const formattedData = formatData(listOfOrderedLabes, assembledData, zipFilePath);
        await outFile.writeFile(formattedData.join('\n') + '\n');
    }
    process.stdout.write(`\r\x1b[K ${printProgress(numFiles, numFiles)}\n`);
}

async function climateDirPaths(dst) {
    return (await fs.readdir(dst, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map   ((dirent) => path.join(dst, dirent.name))
}

async function run(dPath, checkpoint = 1) {
    const listOfDirs = await climateDirPaths((dPath));
    const numDirs    = listOfDirs.length;
    for (let idx = checkpoint - 1; idx < numDirs; ++idx) {
        const fName = `${listOfDirs[idx]}.csv`
        console.log(`Aggregating checkpoint ${idx + 1} of ${numDirs} (${fName})`);
        const outFile = await fs.open(fName, 'w');
        await writeAggregatedData(outFile, listOfDirs[idx]);
        await outFile.close();
    }
};

module.exports = {
    dataEntryToDate,
    dataStringToDate,
    makeDataAssembler,
    makeIsInDateInterval,
    formatData,
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

