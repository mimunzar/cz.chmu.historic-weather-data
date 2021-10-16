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

