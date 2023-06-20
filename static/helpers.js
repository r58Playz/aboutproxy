function isUrl(val = '') {
    if (/^http(s?):\/\//.test(val) || val.includes('.') && val.substr(0, 1) !== ' ') return true;
    return false;
};

function hasHttps(val = '') {
    if (/^http(s?):\/\//.test(val)) return true;
    return false;
};


/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

function getIconNoFallback(doc) {
    return (Array.from(doc.head.querySelectorAll("link[rel~='icon']")).slice(-1)[0] || 0).href
}

function getIcon(doc, winLocation) {
    return getIconNoFallback(doc) || winLocation.origin + "/favicon.ico"
}

function blobToDataUrl(inputBlob) {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsDataURL(inputBlob);
  });
};

function unicodebtoa(str) {
  return btoa(encodeURIComponent(str));
}

function unicodeatob(str) {
  return decodeURIComponent(atob(str));
}

function arraysEqual(a, b) {
  return a.every(item => b.includes(item)) && b.every(item => a.includes(item));
}

function arr2hexstr(arr) {
  return Array.from(arr)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('');
}
