const downloader = require('../downloader');


test("normalizes filenames", () => {
    [
        { args: [''],           res: '' },
        { args: ['Foo  Bar'],   res: 'foo_bar' },
        { args: ['Foo, Bar'],   res: 'foo_bar' },
        { args: ['Foo -_Bar'],  res: 'foo_bar' },
    ].forEach((t) => {
        expect(downloader.normalizeFileName.apply(null, t.args)).toBe(t.res);
    });
});

