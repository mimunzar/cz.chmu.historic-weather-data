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

async function writeContent(f, dPath) {
    console.log((await zipFilePathsOfDir(dPath)).length);
}

(async () => {
    for (let dPath of (await climateDirPaths(DATA_DST))) {
        const f = await fs.open(`${dPath}.csv`, 'w');
        await f.write(`${FIELDS.join(',')}\n`);
        await writeContent(f, dPath);
        break;
    };
})();

