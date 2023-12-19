class ExtensionResources {
  constructor(fs) {
    this.fs = fs.promises;
    this.regularFs = fs;
    this.resourcesUri = "chrome-extension://";
    this.resourcesUrl = window.location.origin + "/extension";
  }

  static new(fsName = "local") {
    // least confusing code
    // it's what? 2 promises nested? no 3
    // 1
    // As a gift from rafflesia, here is another callback
    return new Promise((resolve, reject) => {
      let filesystem = new Filer.FileSystem({ name: fsName }, (err, fs) => {
        if(err) reject(err);
        (new Filer.fs.Shell()).mkdirp("/extension", () => {
          let cls = new ExtensionResources(Filer.fs);
          cls.setUpSw().then(
            ()=>{resolve(cls)},
            (val)=>{reject(val)}
          );
        })

      })
    });
  }

  async setUpSw() {
    // Stub
    return; 
    // return window.navigator.serviceWorker.register("/nohost-sw.js?route=extension&fsName=aboutproxy-extensions");
  }
}

