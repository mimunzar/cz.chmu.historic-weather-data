module.exports.removeSuffix = function(s, suffix) {
    if (! s.endsWith(suffix)) return s;
    return s.slice(0, s.length - suffix.length);
};

module.exports.removeAccent = function(s) {
    return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
};

module.exports.existy = function(x) {
    return null != x
};

module.exports.makePrintProgress = function(width) {
    const maxPercLen = '100'.length;
    return function(curr, total) {
        const ratio = Math.min(curr, total)/total;
        const fill  = '#'.repeat(Math.round(width*ratio)).padEnd(width);
        const perc  = `${Math.round(ratio*100)}`.padStart(maxPercLen);
        return `[${fill}] ${perc}%`;
    }
};

module.exports.set = function(anObject, k, v) {
    anObject[k] = v;
    return anObject;
};

module.exports.slidingWindow = function(n, anArray) {
    const result    = []
    const fullSlice = anArray.length - (n - 1);
    for (let i = 0; i < fullSlice; ++i)
        result.push(anArray.slice(i, i + n));
    return result
};

module.exports.zip = function(anArrayA, anArrayB) {
    const result = [];
    const minLen = Math.min(anArrayA.length, anArrayB.length);
    for (let i = 0; i < minLen; ++i)
        result.push([anArrayA[i], anArrayB[i]]);
    return result;
};

module.exports.namedArgs = function(anArrayOfArgs) {
    return Object.fromEntries(
        this.slidingWindow(2, anArrayOfArgs)
            .filter(([k, _]) => k.startsWith('-'))
            .map   (([k, v]) => [k.replace(/^--?/, ''), v]));
};

module.exports.positionalArgs = function(anArrayOfArgs) {
    let followsOptArg = false;
    return anArrayOfArgs.reduce((acc, s) => {
        const isOptArg = s.startsWith('-');
        if (! (isOptArg || followsOptArg))
            acc.push(s);
        followsOptArg = isOptArg;
        return acc;
    }, []);
};

