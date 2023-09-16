// Extension.type can be:
// * theme
// * extension

class Extension {
  constructor(controller) {
    this.controller = controller;
    this.resources = controller.resources;
    this.enabled = true;
  }

  static async getIdFromUInt8Array(publicKey) {
    let hash = await CH.createHash("sha256")
      .update(publicKey) // *should* work since Filer.Buffer is a UInt8Array in disguise
      .digest('hex');
    return hash.slice(0, 32)
      .split('')
      .map(char => {
        return char >= 'a'
          ? String.fromCharCode(char.charCodeAt()+10)
          : String.fromCharCode('a'.charCodeAt() + char.charCodeAt() - '0'.charCodeAt())
      })
      .join('')
  }

  static #parseCrxV3Header(buf) {
    let pbf = new Pbf(buf)
    let hdr = crx3_pb.CrxFileHeader.read(pbf)

    pbf = new Pbf(hdr.signed_header_data)
    hdr.signed_header_data = crx3_pb.SignedData.read(pbf)
    return hdr
  }

  static #mpdecimal(buf) {
    let a = 'a'.charCodeAt(0)
    return arr2hexstr(buf.toString('hex').split(',').map(e=>parseInt(e))).split('').map( v => String.fromCharCode((parseInt(v, 16)+a))).join``
  }

  static #getIdFromCrxV3(buf) {
    let len = buf => buf.readUInt32LE(0)

    if ("Cr24" !== buf.slice(0, 4).toString()) throw new Error('not a crx file')
    if (3 !== len(buf.slice(4, 8))) throw new Error('not a crx3 file')
    let header_size = len(buf.slice(8, 12))
    let meta = 4*3
    let header = buf.slice(12, header_size + meta)

    let crx_file_header = Extension.#parseCrxV3Header(header)
    return Extension.#mpdecimal(crx_file_header.signed_header_data.crx_id); 
  }

  static async extractBuffer(buffer, fs, id) {
    let zipper = new JSZip();
    await zipper.loadAsync(buffer, {createFolders: true});
    let toExtractArr = [];
    zipper.forEach((relativePath, file) => {
      let actualPath = '/' + id + '/' + relativePath;
      toExtractArr.push({ path: actualPath, dir: file.dir, file: file })
    });

    await fs.mkdir("/"+id);

    for(const entry of toExtractArr) {
      if(entry.dir) {
        await fs.mkdir(entry.path);
        continue;
      }
      await fs.writeFile(entry.path, Filer.Buffer.from(await entry.file.async('arraybuffer')));
    }
  }

  async readFromUnpackedZipBlob(blob, name) {
    let buffer = Filer.Buffer.from(await blob.arrayBuffer());
    let fs = this.resources.fs;

    const id = await Extension.getIdFromUInt8Array(Filer.Buffer.from(name));

    await Extension.extractBuffer(buffer, fs, id);

    this.manifest = JSON.parse(await this.resources.fs.readFile("/"+id+"/manifest.json", 'utf8'));
    this.id = id;

    return id;
  }

  async readFromCrxBlob(blob) {
    let buffer = Filer.Buffer.from(await blob.arrayBuffer());
    let fs = this.resources.fs;
    
    const id = Extension.#getIdFromCrxV3(buffer);

    // Now we extract the CRX to it's respective folder on the fs
    await Extension.extractBuffer(buffer, fs, id);

    this.manifest = JSON.parse(await this.resources.fs.readFile("/"+id+"/manifest.json", 'utf8'));
    this.id = id;

    return id;
  }

  // use when extension has already been installed via `readFromCrxBlob`
  async readFromFilerFs(id) {
    this.manifest = JSON.parse(await this.resources.fs.readFile("/"+id+"/manifest.json", 'utf8'));
    this.id = id;
  }

  init() {
    this.theme = new ThemeDummy(); 

    if(this.manifest["theme"]) {
      this.type = "theme";
      this.injector = new ExtensionInjectorDummy();
      this.theme = new Theme(this.manifest, this);
      this.injector.parseManifest();
      return;
    } 

    this.type = "extension";

    if(this.manifest["manifest_version"] == 2) this.injector = new ExtensionInjectorMV2(this);
    // else if(this.manifest["manifest_version"] == 3) this.injector = new ExtensionInjectorMV3(this); // TODO
    else this.injector = new ExtensionInjectorDummy();

    this.injector.parseManifest();
  }

  inject() {
    this.theme.inject();
  }

  injectTheme(url, frame) {
    this.theme.injectIntoFrame(frame, url === this.controller.browser.settings.getSetting("startUrl"));
  }

  injectDOMContentLoaded(url, frame) {
    this.injectTheme(url, frame);
    this.injector.injectDOMContentLoaded(url, frame);
  }

  injectLoaded(url, frame) {
    this.injector.injectLoaded(url, frame);
  }
}
