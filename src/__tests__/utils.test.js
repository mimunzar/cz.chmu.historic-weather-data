const utils = require('../utils');


test("removes suffix", () => {
    [
        { args: ['', ''],       res: '' },
        { args: ['foo', ''],    res: 'foo' },
        { args: ['foo', 'o'],   res: 'fo' },
        { args: ['foo', 'oo'],  res: 'f' },
        { args: ['foo', 'foo'], res: '' },
    ].forEach((t) => {
        expect(utils.removeSuffix.apply(null, t.args)).toBe(t.res);
    });
});

test("removes accent", () => {
    [
        { args: [''],        res: '' },
        { args: ['foo'],     res: 'foo' },
        { args: ['žščřďťň'], res: 'zscrdtn' },
    ].forEach((t) => {
        expect(utils.removeAccent.apply(null, t.args)).toBe(t.res);
    });
});

