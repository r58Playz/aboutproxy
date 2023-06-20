class ExtensionResources {
  constructor(fs) {
    this.fs = fs.promises;
    this.regularFs = fs;
    this.resourcesUri = "chrome-extension://";
    this.resourcesUrl = window.location.origin + "/extension";
  }

  static new(fsName = "aboutproxy-extensions") {
    // least confusing code
    // it's what? 2 promises nested? no 3
    // 1
    return new Promise((resolve, reject) => {
      let filesystem = new Filer.FileSystem({ name: fsName }, (err, fs) => {
        if(err) reject(err);
        let cls = new ExtensionResources(fs);
        cls.setUpSw().then(
          ()=>{resolve(cls)},
          (val)=>{reject(val)}
        );
      })
    });
  }

  setUpSw() {
    return window.navigator.serviceWorker.register(
      "/nohost-sw.js?route=extension&disableIndexes",
      { scope: "/extension" });
  }
}

