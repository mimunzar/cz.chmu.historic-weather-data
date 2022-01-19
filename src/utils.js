module.exports.removeSuffix = function(s, suffix) {
    if (!s.endsWith(suffix)) return s;
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

