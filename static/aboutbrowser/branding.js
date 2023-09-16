function replaceInText(element, pattern, replacement) {
  for (let node of element.childNodes) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        replaceInText(node, pattern, replacement);
        break;
      case Node.TEXT_NODE:
        node.textContent = node.textContent.replace(pattern, replacement);
        break;
      case Node.DOCUMENT_NODE:
        replaceInText(node, pattern, replacement);
    }
  }
}

function brandingCallback({ branding }) {
  replaceInText(document.body, /\${name}/g, branding.name);
  replaceInText(document.body, /\${version}/g, branding.version);
}

sendMessage({type: "getBranding"});
