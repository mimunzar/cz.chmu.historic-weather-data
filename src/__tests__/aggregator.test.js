const aggregator = require('../aggregator');


test('parses CSV labels', () => {
    [
        { args: [''],
          res : [''] },
        { args: ['Přístroj;Začátek měření;Konec měření;Výška přístroje [m]'],
          res : ['pristroj', 'zacatek_mereni', 'konec_mereni', 'vyska_pristroje_[m]'] },
    ].forEach((t) => expect(aggregator.parseCSVLabels.apply(null, t.args)).toEqual(t.res));
});

test('parses CSV line', () => {
    [
        { args: ['42;43', []],             res: {}},
        { args: ['',      ['foo', 'bar']], res: { foo: '', bar: '' }},
        { args: ['42;',   ['foo', 'bar']], res: { foo: '42', bar: '' }},
        { args: ['42;43', ['foo', 'bar']], res: { foo: '42', bar: '43' }},

    ].forEach((t) => expect(aggregator.parseCSVLine.apply(null, t.args)).toEqual(t.res));
});

test('parses METADATA section', () => {
    const fakeMetadataSection = [
        'METADATA',
        'Stanice ID;Jméno stanice;Začátek měření;Konec měření;Zeměpisná délka;Zeměpisná šířka;Nadmořská výška',
        'P1PKAR01;Praha, Karlov;01.01.1961;31.12.2002;14,4186;50,0675;260,5',
        'P1PKAR01;Praha, Karlov;01.01.2003;31.12.2020;14,427778;50,069167;260,5',
    ];
    [
        { args: { lines: [], startIdx: 0 },
          res : { linesRead: 0, result: [] }},
        { args: { lines: ['METADATA'], startIdx: 0 },
          res : { linesRead: 1, result: [] }},
        { args: { lines: ['METADATA', ' ', 'DATA'], startIdx: 0 },
          res : { linesRead: 1, result: [] }},
        { args: { lines: ['foo', 'bar', 'METADATA', ' ', 'DATA'], startIdx: 2 },
          res : { linesRead: 1, result: [] }},
        { args: { lines: fakeMetadataSection, startIdx: 0 },
          res : { linesRead: 4, result: [
              {
                  'stanice_id'      : 'P1PKAR01',
                  'jmeno_stanice'   : 'Praha, Karlov',
                  'zacatek_mereni'  : '01.01.1961',
                  'konec_mereni'    : '31.12.2002',
                  'zemepisna_delka' : '14,4186',
                  'zemepisna_sirka' : '50,0675',
                  'nadmorska_vyska' : '260,5',
              },
              {
                  'stanice_id'      : 'P1PKAR01',
                  'jmeno_stanice'   : 'Praha, Karlov',
                  'zacatek_mereni'  : '01.01.2003',
                  'konec_mereni'    : '31.12.2020',
                  'zemepisna_delka' : '14,427778',
                  'zemepisna_sirka' : '50,069167',
                  'nadmorska_vyska' : '260,5',
              },
          ]},
        },
    ].forEach((t) => {
        const result = [];
        expect(aggregator.parseMetadataSection(t.args.lines,
            t.args.startIdx, result)).toBe(t.res.linesRead);
        expect(result).toEqual(t.res.result);
    });
});

test('parses PRVEK section', () => {
    const fakePrvekSection = [
        'PRVEK',
        'Maximální rychlost větru [Fmax.00:00, m/s]',
        'Směr maximální rychlosti větru [Dmax.00:00, stupně]',
        'Čas maxima maximální rychlosti větru [Casmax.00:00, čas]',
    ];
    [
        { args: { lines: fakePrvekSection, startIdx: 0 },
          res : { linesRead: 4, result: [
              'Maximální rychlost větru [Fmax.00:00, m/s]',
              'Směr maximální rychlosti větru [Dmax.00:00, stupně]',
              'Čas maxima maximální rychlosti větru [Casmax.00:00, čas]',
          ]},
        },
    ].forEach((t) => {
        const result = [];
        expect(aggregator.parsePrvekSection(t.args.lines,
            t.args.startIdx, result)).toBe(t.res.linesRead);
        expect(result).toEqual(t.res.result);
    });
});

test('parses Priznak;Popis section', () => {
    const fakePriznakSection = [
        'Příznak;Popis',
        'A;Ovlivněno umělým sněžením',
        'N;Nesouvislá sněhová pokrývka',
        'P;Poprašek',
        'R;Padal a roztál',
        'U;Měření není možné',
    ];
    [
        { args: { lines: fakePriznakSection, startIdx: 0 },
          res : { linesRead: 6, result: {
            'A': 'Ovlivněno umělým sněžením',
            'N': 'Nesouvislá sněhová pokrývka',
            'P': 'Poprašek',
            'R': 'Padal a roztál',
            'U': 'Měření není možné',
          }},
        },
    ].forEach((t) => {
        const result = {};
        expect(aggregator.parsePriznakPopisSection(t.args.lines,
            t.args.startIdx, result)).toBe(t.res.linesRead);
        expect(result).toEqual(t.res.result);
    });
});

test('parses file content', () => {
    [
        { arg: [
            'METADATA',
            'Stanice ID;Jméno stanice;Začátek měření;Konec měření;Zeměpisná délka;Zeměpisná šířka;Nadmořská výška',
            'P1PKAR01;Praha, Karlov;01.01.1961;31.12.2002;14,4186;50,0675;260,5',
            'P1PKAR01;Praha, Karlov;01.01.2003;31.12.2020;14,427778;50,069167;260,5',
            '',
            'PŘÍSTROJE',
            'Přístroj;Začátek měření;Konec měření;Výška přístroje [m]',
            'Slunoměr;01.01.1961;31.03.2005;1,5',
            'Slunoměr čidlo;01.04.2005;31.12.2020;1,5',
            '',
            'PRVEK',
            'Maximální rychlost větru [Fmax.00:00, m/s]',
            'Směr maximální rychlosti větru [Dmax.00:00, stupně]',
            'Čas maxima maximální rychlosti větru [Casmax.00:00, čas]',
            '',
            'Příznak;Popis',
            'A;Ovlivněno umělým sněžením',
            'N;Nesouvislá sněhová pokrývka',
            'P;Poprašek',
            'R;Padal a roztál',
            'U;Měření není možné',
            '',
            'DATA',
            'Rok;Měsíc;Den;Fmax;Dmax;Casmax',
            '1961;01;01;6;110;19:32',
            '1961;01;02;4,9;160;17:21',
            '1961;01;03;7,4;90;07:14',
          ],
          res: {
              'metadata': [
                  {
                      'stanice_id'      : 'P1PKAR01',
                      'jmeno_stanice'   : 'Praha, Karlov',
                      'zacatek_mereni'  : '01.01.1961',
                      'konec_mereni'    : '31.12.2002',
                      'zemepisna_delka' : '14,4186',
                      'zemepisna_sirka' : '50,0675',
                      'nadmorska_vyska' : '260,5',
                  },
                  {
                      'stanice_id'      : 'P1PKAR01',
                      'jmeno_stanice'   : 'Praha, Karlov',
                      'zacatek_mereni'  : '01.01.2003',
                      'konec_mereni'    : '31.12.2020',
                      'zemepisna_delka' : '14,427778',
                      'zemepisna_sirka' : '50,069167',
                      'nadmorska_vyska' : '260,5',
                  },
              ],
              'pristroje': [
                  {
                      'pristroj'            : 'Slunoměr',
                      'zacatek_mereni'      : '01.01.1961',
                      'konec_mereni'        : '31.03.2005',
                      'vyska_pristroje_[m]' : '1,5',
                  },
                  {
                      'pristroj'            : 'Slunoměr čidlo',
                      'zacatek_mereni'      : '01.04.2005',
                      'konec_mereni'        : '31.12.2020',
                      'vyska_pristroje_[m]' : '1,5',
                  },
              ],
              'prvek': [
                  'Maximální rychlost větru [Fmax.00:00, m/s]',
                  'Směr maximální rychlosti větru [Dmax.00:00, stupně]',
                  'Čas maxima maximální rychlosti větru [Casmax.00:00, čas]',
              ],
              'priznak;popis': {
                  'A': 'Ovlivněno umělým sněžením',
                  'N': 'Nesouvislá sněhová pokrývka',
                  'P': 'Poprašek',
                  'R': 'Padal a roztál',
                  'U': 'Měření není možné',
              },
              'data': [
                  {
                      'casmax'  : '19:32',
                      'den'     : '01',
                      'dmax'    : '110',
                      'fmax'    : '6',
                      'mesic'   : '01',
                      'rok'     : '1961',
                  },
                  {
                      'casmax'  : '17:21',
                      'den'     : '02',
                      'dmax'    : '160',
                      'fmax'    : '4,9',
                      'mesic'   : '01',
                      'rok'     : '1961',
                  },
                  {
                      'casmax'  : '07:14',
                      'den'     : '03',
                      'dmax'    : '90',
                      'fmax'    : '7,4',
                      'mesic'   : '01',
                      'rok'     : '1961',
                  },
              ],
          }
        }
    ].forEach((t) => expect(aggregator.parseFile(t.arg)).toEqual(t.res));
});

test('assembles priznak', () => {
    const fakeParsedFile = {
        'priznak;popis': { 'F': 'foo' }
    };
    expect(aggregator.priznakAssembler({ priznak: '' }, fakeParsedFile))
        .toEqual({ priznak: '' });
    expect(aggregator.priznakAssembler({ priznak: 'F' }, fakeParsedFile))
        .toEqual({ priznak: 'foo' });
    expect(() => aggregator.priznakAssembler({ priznak: 'B' }, fakeParsedFile)).toThrow();
});

test('data entry to Date', () => {
    const d = aggregator.dataEntryToDate({ 'den': '03', 'mesic': '01', 'rok': '1961' });
    expect(d.getDate())     .toBe(3);
    expect(d.getMonth())    .toBe(0);
    expect(d.getFullYear()).toBe(1961);
    expect(() => aggregator.dataEntryToDate({ 'den': '03', 'mesic': '01' })).toThrow();
});

test('data string to Date', () => {
    const d = aggregator.dataStringToDate('03.01.1961');
    expect(d.getDate())     .toBe(3);
    expect(d.getMonth())    .toBe(0);
    expect(d.getFullYear()).toBe(1961);
    expect(() => aggregator.dataStringToDate('foo')).toThrow();
});

test('is within Date', () => {
    const fnWithinDate = aggregator.makeIsInDateInterval(new Date(1961, 0, 27));
    //^ 27.01.1961
    [
        { arg: { 'zacatek_mereni': '01.01.1961', 'konec_mereni': '27.01.1961'},
          res: true },
        { arg: { 'zacatek_mereni': '27.01.1961', 'konec_mereni': '27.01.1962'},
          res: true },
        { arg: { 'zacatek_mereni': '01.01.1961', 'konec_mereni': '27.01.1962'},
          res: true },
        { arg: { 'zacatek_mereni': '01.01.1962', 'konec_mereni': '27.01.1962'},
          res: false },
    ].forEach((t) => expect(fnWithinDate(t.arg)).toBe(t.res));
});

test('assembles device', () => {
    const fakeParsedFile = {
        'pristroje': [
            {
                'pristroj'            : 'Slunoměr',
                'zacatek_mereni'      : '01.01.1961',
                'konec_mereni'        : '31.03.2005',
                'vyska_pristroje_[m]' : '1,5',
            },
            {
                'pristroj'            : 'Slunoměr čidlo',
                'zacatek_mereni'      : '01.04.2005',
                'konec_mereni'        : '31.12.2020',
                'vyska_pristroje_[m]' : '1,5',
            },
        ],
    };
    expect(aggregator.pristrojAssembler({
        'rok'   : '2005',
        'mesic' : '04',
        'den'   : '01'
    }, fakeParsedFile)).toEqual({
        'pristroj'                 : 'Slunoměr čidlo',
        'zacatek_mereni_pristroje' : '01.04.2005',
        'konec_mereni_pristroje'   : '31.12.2020',
        'vyska_pristroje_[m]'      : '1,5',
    });
    expect(() => aggregator.pristrojAssembler({
        'rok'   : '2025',
        'mesic' : '12',
        'den'   : '12'
    }, fakeParsedFile)).toThrow();
});

test('assembles station', () => {
    const fakeParsedFile = {
        'metadata': [
            {
                'stanice_id'      : 'P1PKAR01',
                'jmeno_stanice'   : 'Praha, Karlov',
                'zacatek_mereni'  : '01.01.1961',
                'konec_mereni'    : '31.12.2002',
                'zemepisna_delka' : '14,4186',
                'zemepisna_sirka' : '50,0675',
                'nadmorska_vyska' : '260,5',
            },
            {
                'stanice_id'      : 'P1PKAR01',
                'jmeno_stanice'   : 'Praha, Karlov',
                'zacatek_mereni'  : '01.01.2003',
                'konec_mereni'    : '31.12.2020',
                'zemepisna_delka' : '14,427778',
                'zemepisna_sirka' : '50,069167',
                'nadmorska_vyska' : '260,5',
            },
        ],
    };
    expect(aggregator.stationAssembler({
        'rok'   : '2002',
        'mesic' : '12',
        'den'   : '31'
    }, fakeParsedFile)).toEqual({
        'stanice_id'              : 'P1PKAR01',
        'jmeno_stanice'           : 'Praha, Karlov',
        'zacatek_mereni_stanice'  : '01.01.1961',
        'konec_mereni_stanice'    : '31.12.2002',
        'zemepisna_delka_stanice' : '14,4186',
        'zemepisna_sirka_stanice' : '50,0675',
        'nadmorska_vyska_stanice' : '260,5',
    });
    expect(() => aggregator.stationAssembler({
        'rok'   : '2025',
        'mesic' : '12',
        'den'   : '12'
    }, fakeParsedFile)).toThrow();
});

test('assembles data entries', () => {
    const fakeParsedFile = {
        'data': [
            { 'mesic': '01', 'rok': '1961' },
            { 'mesic': '01', 'rok': '1962' },
        ],
    };
    const fakeDataAssemblers = {
        rok: (aDataEntry, aParsedFile) => {
            return { rok: '42' };
        }
    };
    expect(aggregator.makeDataAssembler(fakeDataAssemblers)(fakeParsedFile)).toEqual([
        { 'mesic': '01', 'rok': '42' },
        { 'mesic': '01', 'rok': '42' },
    ]);
});

test('assembles CSV rows', () => {
    const fakeData = [
        { 'mesic': '01', 'rok': '1961' },
        { 'mesic': '02', 'rok': '1962' },
    ];
    [
        { arg: [ 'rok', 'mesic' ], res: [ '1961;01', '1962;02' ] },
        { arg: [ 'mesic', 'rok' ], res: [ '01;1961', '02;1962' ] },
        { arg: [ 'mesic', 'foo' ], res: [ '01', '02' ] },
    ].forEach((t) => expect(aggregator.makeRowAssembler(';', t.arg)(fakeData)).toEqual(t.res));
});

