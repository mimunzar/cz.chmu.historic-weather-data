const aggregator = require('../aggregator');


test("CSV line to dict", () => {
    const tests = [
        { args: ['42;43', []],             res: {}},
        { args: ['',      ['foo', 'bar']], res: { foo: '', bar: '' }},
        { args: ['42;',   ['foo', 'bar']], res: { foo: '42', bar: '' }},
        { args: ['42;43', ['foo', 'bar']], res: { foo: '42', bar: '43' }},

    ].forEach((t) => {
        expect(aggregator.csvLineToDict.apply(null, t.args)).toEqual(t.res)
    });
});

