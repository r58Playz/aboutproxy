// TODO: Support injecting extensions into webworkers with via.js

class ExtensionInjector {
  constructor() {
    if(this.constructor === ExtensionInjector) throw new Error("no fuck off");
  }

  parseManifest() {
    throw new Error("no fuck off");
  }

  validateMatchSequence(s) {
    /*
     * baby's first regex
     * (\*|http|https|file|ftp):\/\/ matches any of *:// http:// https:// file:// ftp:// and puts the protocol in the first capture group 
     * (\*|\*\.[^\/\n*]*|[^\/\n*]*|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}) matches any of * *.<any character except / and *> <any character except / and *> or an IPv4 address
     *   and puts the host in the second capture group
     * (\/.*) just matches /<anything> and puts the path in the third capture group
     * |urn:(\S.*)|<all_urls> or it can skip all that and match either urn:<anything except end of string> or "<all_urls>"
     */
    let regex = /(\*|http|https|file|ftp):\/\/(\*|\*\.[^\/\n*]*|[^\/\n*]*|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(\/.*)|urn:(\S.*)|<all_urls>/;
    const m = s.match(regex);
    if(!m) throw new Error("Invalid match sequence");
    if(m.length != 1) {
      if(m[1] === "file" || m[1] === "ftp") throw new Error("file or ftp protocols not supported")
    } else {
      if(m[0].startsWith("urn:")) throw new Error("urn protocol is not suppowted");
    }
    return m;
  }

  parseMatchSequence(s, url) {
    if(this.#parseGlob(s, url)) return true;

    let m = this.validateMatchSequence(s);
    if(m.length != 1 && m[3] === "/*") return this.#parseGlob(m[1]+"://"+m[2]+"*", url);
  }

  parseChromeGlob(pattern, input) {
    let re = new RegExp(pattern.replace(/\?/g, '.').replace(/\*/g, '.*'));
    return re.test(input);
  }

  #parseGlob(pattern, input) {
    var re = new RegExp(pattern.replace(/([.?+^$[\]\\(){}|\/-])/g, "\\$1").replace(/\*/g, '.*'));
    return re.test(input);
  }

  async injectDOMContentLoaded(url) {
    throw new Error("no fuck off");
  }

  async injectLoaded(url) {
    throw new Error("no fuck off");
  }
}
