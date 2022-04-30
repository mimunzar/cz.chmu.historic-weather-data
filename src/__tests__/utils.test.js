const utils = require('../utils');


test('removes suffix', () => {
    [
        { args: ['', ''],       res: '' },
        { args: ['foo', ''],    res: 'foo' },
        { args: ['foo', 'o'],   res: 'fo' },
        { args: ['foo', 'oo'],  res: 'f' },
        { args: ['foo', 'foo'], res: '' },
    ].forEach((t) => expect(utils.removeSuffix.apply(null, t.args)).toBe(t.res));
});

test('removes accent', () => {
    [
        { arg: '',        res: '' },
        { arg: 'foo',     res: 'foo' },
        { arg: 'žščřďťň', res: 'zscrdtn' },
    ].forEach((t) => expect(utils.removeAccent(t.arg)).toBe(t.res));
});

test('existy', () => {
    [
        { arg: null,      res: false },
        { arg: undefined, res: false },
        { arg: false,     res: true },
        { arg: [],        res: true },
        { arg: {},        res: true },
    ].forEach((t) => expect(utils.existy(t.arg)).toBe(t.res));
});

test('makes progress bar', () => {
    {
        const fnPrintProgress = utils.makePrintProgress(1);
        expect(fnPrintProgress(0, 1)).toBe('[ ]   0%');
        expect(fnPrintProgress(1, 1)).toBe('[#] 100%');
        expect(fnPrintProgress(2, 1)).toBe('[#] 100%');
    }
    {
        const fnPrintProgress = utils.makePrintProgress(5);
        expect(fnPrintProgress(0, 1)).toBe('[     ]   0%');
        expect(fnPrintProgress(0.333333, 1)).toBe('[##   ]  33%');
        expect(fnPrintProgress(1, 1)).toBe('[#####] 100%');
    }
    {
        const fnPrintProgress = utils.makePrintProgress(10);
        expect(fnPrintProgress(0, 5)).toBe('[          ]   0%');
        expect(fnPrintProgress(1, 5)).toBe('[##        ]  20%');
        expect(fnPrintProgress(5, 5)).toBe('[##########] 100%');
    }
});

test('sets object key', () => {
    expect(utils.set({}, 'foo', 42))          .toEqual({ 'foo': 42 });
    expect(utils.set({ 'foo': 0 }, 'foo', 42)).toEqual({ 'foo': 42 });
});

test('sliding window', () => {
    expect(utils.slidingWindow(2, []))       .toEqual([]);
    expect(utils.slidingWindow(2, [1]))      .toEqual([]);
    expect(utils.slidingWindow(2, [0, 1]))   .toEqual([[0, 1]]);
    expect(utils.slidingWindow(2, [0, 1, 2])).toEqual([[0, 1], [1, 2]]);
});

test('zip', () => {
    expect(utils.zip([],     []    )).toEqual([]);
    expect(utils.zip([1],    [3, 4])).toEqual([[1, 3]]);
    expect(utils.zip([1, 2], [3]   )).toEqual([[1, 3]]);
    expect(utils.zip([1, 2], [3, 4])).toEqual([[1, 3], [2, 4]]);
});

test('named args', () => {
    expect(utils.namedArgs([]))                       .toEqual({});
    expect(utils.namedArgs(['--foo']))                .toEqual({});
    expect(utils.namedArgs(['--foo', 'bar']))         .toEqual({ 'foo': 'bar' });
    expect(utils.namedArgs(['--foo', '--bar', 'baz'])).toEqual({ 'foo': '--bar', 'bar': 'baz' });
});

test('positional args', () => {
    expect(utils.positionalArgs([]))                            .toEqual([]);
    expect(utils.positionalArgs(['--foo', 'bar']))              .toEqual([]);
    expect(utils.positionalArgs(['--foo', 'bar', 'baz']))       .toEqual(['baz']);
    expect(utils.positionalArgs(['bax', '--foo', 'bar', 'baz'])).toEqual(['bax', 'baz']);
});

