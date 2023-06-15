class ExtensionResourcesProvider {
  constructor(fs) {
    this.fs = fs;
    this.resourcesUri = "chrome-extension://";
    this.resourcesUrl = window.location.origin + "/extension";
  }

  static new(fsName = "aboutproxy-extensions") {
    // least confusing code
    // it's what? 2 promises nested? no 3
    // 1
    return new Promise((resolve, reject) => {
      let filesystem = new Filer.FileSystem({ name: fsName }, (err, fs) => {
        if(err) reject(err); return;
        // 2
        resolve(new Promise((res, rej) => {
          let cls = new ExtensionResourcesProvider(fs.promises);
          // 3?
          cls.setUpSw().then(
            ()=>{res(cls)},
            (val)=>{rej(val)}
          );
        }));
      })
    });
  }

  setUpSw() {
    return window.navigator.serviceWorker.register(
      "/nohost-sw.js?route=extension&disableIndexes",
      { scope: "/extension" });
  }
}

