// Code mostly migrated from splus-bookmarklet
class ExtensionInjectorMV2 extends ExtensionInjector {
  constructor(extension) {
    super();
    this.extension = extension;
    this.manifest = extension.manifest;
  }

  parseManifest() {
    const content_scripts = this.manifest["content_scripts"];
    let domcontentloaded = [];
    let loaded = [];
    if(!content_scripts) throw new Error("Manifest does not contain \"content_scripts\" key.");
    for(const cs of content_scripts) {
      if(!cs.matches) throw new Error("Content script id "+content_scripts.indexOf(cs)+" does not contain \"matches\" key.")
      for(const m of cs.matches) this.validateMatchSequence(m);
      if(!cs.run_at || cs.run_at === "document_idle") {
        loaded.push(cs)
      } else {
        domcontentloaded.push(cs);
      }
    }
    this.domcontentloaded = domcontentloaded;
    this.loaded = loaded;
  }

  async inject(url, frame, list) {
    // all_frames and match_about_blank not supported
    let jsToInject = [];
    let cssToInject = [];
    for(const cs of list) {
      // matches
      // excludes
      // js
      // css
      let matches = false;
      let excludes = false;
      let globMatches = false;
      let globExcludes = false;

      for(const match of cs.matches) {
        if(this.parseMatchSequence(match, url)) {matches = true; break};
      }

      for(const exclude of cs.exclude_matches || []) {
        if(this.parseMatchSequence(exclude, url)) {excludes = true; break};
      }

      for(const match of cs.include_globs || []) {
        if(this.parseChromeGlob(match, url)) {globMatches = true; break};
      }

      for(const exclude of cs.exclude_globs || []) {
        if(this.parseChromeGlob(exclude, url)) {globExcludes = true; break};
      }

      if(cs.include_globs) matches = matches && globMatches;
      if(cs.exclude_globs) excludes = excludes && globExcludes;

      if(matches && !excludes) {
        for(const path of cs.js || []) {
          let code = await this.extension.resources.fs.readFile("/" + this.extension.id + "/" + path, 'utf8');
          // maybe sanitize any URLs in the code?
          jsToInject.push(code);
        }
        if(jsToInject.length) jsToInject.push("/*aboutbrowserExtensionContentScriptSeparator*/");

        for(const path of cs.css || []) {
          let code = await this.extension.resources.fs.readFile("/" + this.extension.id + "/" + path, 'utf8');
          // maybe sanitize any URLs in the code?
          cssToInject.push(code);
        }
        if(cssToInject.length) cssToInject.push("/*aboutbrowserExtensionContentScriptSeparator*/");
      }
    }

    let code = "(()=>{"+Extension.chromeApis+"/*aboutBrowserExtensionApisSeparator*/"+jsToInject.join(";/*aboutbrowserExtensionInjectedScriptSeparator*/")+"})();";
    let el = document.createElement("script");
    el.textContent = code;
    el.setAttribute("data-aboutproxy-extid", this.extension.id);
    el.setAttribute("data-aboutproxy-manifest", JSON.stringify(this.extension.manifest));
    frame.contentWindow.document.head.appendChild(el);

    code = cssToInject.join("/*aboutBrowserExtensionInjectedCssSeparator*/");
    el = document.createElement("style");
    el.textContent = code;
    el.setAttribute("data-aboutproxy-extid", this.extension.id);
    frame.contentWindow.document.head.appendChild(el);
  }

  async injectDOMContentLoaded(url, frame) {
    await this.inject(url, frame, this.domcontentloaded);
  }

  async injectLoaded(url, frame) {
    await this.inject(url, frame, this.loaded);
  }
}
