function isUrl(val = '') {
    if (/^http(s?):\/\//.test(val) || val.includes('.') && val.substr(0, 1) !== ' ') return true;
    return false;
};

function hasHttps(val = '') {
    if (/^http(s?):\/\//.test(val)) return true;
    return false;
};