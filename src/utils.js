module.exports.removeSuffix = function(s, suffix) {
    if (!s.endsWith(suffix)) return s;
    return s.slice(0, s.length - suffix.length);
};

