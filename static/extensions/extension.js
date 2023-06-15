// Extension.type can be:
// * theme
// * extension

class Extension {
  constructor(controller) {
    this.controller = controller;
  }

  async readFromCrxBlob(blob) {
    let buffer = Filer.Buffer.from(await blob.arrayBuffer()));
    let fs = this.controller.fs

    // holy shit, filer's buffer is basically identical with node buffer
    // so i can actually just use some repo for getting the extension id in nodejs with minimal changes!
    // (except i have to use some other crypto lib instead of node's)
    // https://github.com/zhw2590582/chrome-extensions-id
    if(buffer.readUInt32LE(0) !== 0x34327243) throw new Error("Unexpected CRX magic number")

    const ver = buffer.readUInt32LE(4);
    if(ver !== 2) throw new Error("Unexpected version "+ver);

    const pubKeyLen = buffer.readUInt32LE(8);
    const metaOffset = 16;
    const publicKey = Filer.Buffer.from(buffer.slice(metaOffset, metaOffset + pubKeyLen));
    const id = await CH.createHash("sha256")
      .update(publicKey) // *should* work since Filer.Buffer is a UInt8Array in disguise
      .digest('hex')
      .slice(0, 32)
      .split('')
      .map(char => {
        return char >= 'a'
          ? String.fromCharCode(char.charCodeAt()+10)
          : String.fromCharCode('a'.charCodeAt() + char.charCodeAt() - '0'.charCodeAt())
      })
      .join('')

    // Now we extract the CRX to it's respective folder on the fs
    let zipper = new JSZip();
    await zipper.loadAsync(buffer, {createFolders: true});
    zipper.forEach((relativePath, file) => {
      let actualPath = '/' + id + '/' + relativePath;
      if(file.dir) {
        await fs.mkdir(actualPath);
        return;
      }
      await fs.writeFile(actualPath, Filer.Buffer.from(file.async('arraybuffer')));
    })

    return id;
  }

  // use when extension has already been installed via `readFromCrxBlob`
  async readFromFilerFs(id) {
    this.manifest = await this.controller.fs.readFile("/"+id+"/manifest.json", 'utf8');
    this.id = id;
  }

  async init() {
    if(this.manifest.theme) {
      this.type = "theme";
      this.theme = new Theme(this.manifest, this.id);
      return;
    }
    // actual extensions not implemented
  }
}
