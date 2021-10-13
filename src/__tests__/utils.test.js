const utils = require('../utils');


test("removes suffix", () => {
    expect(utils.removeSuffix('', '')).toBe('');
    expect(utils.removeSuffix('', 'foo')).toBe('');
    expect(utils.removeSuffix('foo', '')).toBe('foo');
    expect(utils.removeSuffix('foo', 'o')).toBe('fo');
    expect(utils.removeSuffix('foo', 'foo')).toBe('');
});

