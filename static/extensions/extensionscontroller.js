class ExtensionsController {
  constructor() {

  }

  async setup() {
    // i realize that now i could have just done this for ExtensionResources but it's fine
    this.resources = await ExtensionResources.new();
  }
}
