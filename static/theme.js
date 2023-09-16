// https://chromium.googlesource.com/chromium/src/+/main/ui/color/core_default_color_mixer.cc 
// https://chromium.googlesource.com/chromium/src/+/main/ui/gfx/color_palette.h
// https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/themes/browser_theme_pack.cc;l=223

/*
colorMap needs to contain:
 * frame
 * toolbar - this one is BOTH active tab and toolbar background
 * tab_text
 * tab_background_text

colorMap may contain but will fallback if does not exist:
 * button_background
 * ntp_background
 * ntp_link
 * ntp_text
 * omnibox_background
 * omnibox_text
 * toolbar_button_icon
 * toolbar_text
 * bookmark_text

colorMap will ignore incognito and inactive variants of colors, and:
 * ntp_header

colorMap needs to contain (for aboutbrowser themes):
 * accent_color
 * ui_search_background
 * ui_toolbar_background
 * ui_sidebar_background
 * ui_sidebar_active_background
 * ui_layer1_background
 * ui_layer1_foreground
colorMap can optionally contain (for aboutbrowser themes):
 * ui_toolbar_foreground
 * ui_sidebar_foreground
 * ui_search_foreground
 * ui_sidebar_active_foreground
 */


class ThemeDummy {
  constructor() {}
  inject() {}
  injectIntoFrame() {}
  getCSSForTheme() {return []}
}

class Theme {
  constructor(themeJson, extension) {
    this.json = themeJson;
    // Sanity check the json
    
    // Ignore manifest_version as that is for Chrome.
    // Will be needed for extension parsing
    if(
      !themeJson.version ||
      !themeJson.name || 
      !themeJson.theme ||
      !themeJson.theme.colors
    ) throw new Error("Invalid theme, did not contain any of version, name, theme, or theme.colors");

    this.version = themeJson.version;
    this.name = themeJson.name;
    this.isAboutBrowserTheme = !!themeJson.aboutbrowser;
    this.colorMap = themeJson.theme.colors;
    this.imageMap = themeJson.theme.images || {};
    this.flags = [];
    let colorMap = this.colorMap;

    this.extension = extension;

    // Sanity check the theme
    let colorMapContains = Object.keys(colorMap);
    let imageMapContains = Object.keys(this.imageMap);
    for(const k of [
      "frame",
      "toolbar",
    ]) if(!colorMapContains.includes(k)) throw new Error("Invalid theme, did not contain "+k);

    // Set any fallbacks necessary
    if(!colorMapContains.includes("tab_text")) colorMap.tab_text = gcp.Grey900; // chrome defaults this to dark, seen in the wild
    if(!colorMapContains.includes("tab_background_text")) colorMap.tab_background_text = gcp.Grey900; // same for this in the m3 refresh 
    if(!colorMapContains.includes("background_tab")) colorMap.background_tab = colorMap.frame;
    if(!colorMapContains.includes("button_background")) colorMap.button_background = colorMap.frame;
    if(!colorMapContains.includes("ntp_background")) colorMap.ntp_background = colorMap.toolbar;
    if(!colorMapContains.includes("ntp_link")) colorMap.ntp_link = colorMap.tab_text;
    if(!colorMapContains.includes("ntp_text")) colorMap.ntp_text = colorMap.tab_text;
    if(!colorMapContains.includes("omnibox_background")) colorMap.omnibox_background = gcp.Grey100; //chrome defaults this to white
    if(!colorMapContains.includes("omnibox_text")) colorMap.omnibox_text = gcp.Grey900; // black on white
    if(!colorMapContains.includes("toolbar_button_icon")) colorMap.toolbar_button_icon = colorMap.tab_text;
    if(!colorMapContains.includes("toolbar_text")) colorMap.toolbar_text = colorMap.tab_text;
    if(!colorMapContains.includes("bookmark_text")) colorMap.bookmark_text = colorMap.tab_text;

    // Set flags
    if(arraysEqual(colorMap.frame, colorMap.toolbar)) this.flags.push("theme-need-tab-contrast");
    if(imageMapContains.includes("theme_frame")) this.flags.push("theme-use-image-for-frame");
    if(imageMapContains.includes("theme_ntp_background")) this.flags.push("theme-use-image-for-ntp-bg");
    // Check aboutbrowser theme
    if(this.isAboutBrowserTheme) {
      // Sanity check
      for(const k of [
        "accent_color",
        "ui_search_background",
        "ui_toolbar_background",
        "ui_sidebar_background",
        "ui_sidebar_active_foreground",
        "ui_layer1_background",
        "ui_layer1_foreground"
      ]) if(!colorMapContains.includes(k)) throw new Error("Invalid theme, did not contain "+k);
      // Fallback
      if(!colorMapContains.includes("ui_toolbar_foreground")) colorMap.ui_toolbar_foreground = colorMap.tab_text;
      if(!colorMapContains.includes("ui_sidebar_foreground")) colorMap.ui_sidebar_foreground = colorMap.tab_text;
      if(!colorMapContains.includes("ui_search_foreground")) colorMap.ui_search_foreground = colorMap.tab_text;
      if(!colorMapContains.includes("ui_sidebar_active_foreground")) colorMap.ui_sidebar_active_foreground = colorMap.tab_text;
    }

    this.colorToCSSMap = {
      frame: "--aboutbrowser-frame-bg",
      toolbar: "--aboutbrowser-toolbar-bg",
      toolbar_button_icon: "--aboutbrowser-toolbar-button-fg",
      toolbar_text: "--aboutbrowser-toolbar-fg",
      background_tab: "--aboutbrowser-inactive-tab-bg",
      tab_text: "--aboutbrowser-active-tab-fg",
      tab_background_text: "--aboutbrowser-inactive-tab-fg",
      button_background: "--aboutbrowser-button-bg",
      ntp_background: "--aboutbrowser-ui-bg",
      ntp_link: "--aboutbrowser-ui-link-fg",
      ntp_text: "--aboutbrowser-ui-fg",
      omnibox_background: "--aboutbrowser-omnibox-bg",
      omnibox_text: "--aboutbrowser-omnibox-fg",
      bookmark_text: "--aboutbrowser-bookmark-fg"
    };
    this.aboutBrowserColorToCSSMap = {
      accent_color: "--aboutbrowser-ui-accent",
      ui_search_background: "--aboutbrowser-ui-search-bg",
      ui_search_foreground: "--aboutbrowser-ui-search-fg",
      ui_toolbar_background: "--aboutbrowser-ui-toolbar-bg",
      ui_toolbar_foreground: "--aboutbrowser-ui-toolbar-fg",
      ui_sidebar_background: "--aboutbrowser-ui-sidebar-bg",
      ui_sidebar_foreground: "--aboutbrowser-ui-sidebar-fg",
      ui_sidebar_active_background: "--aboutbrowser-ui-sidebar-active-bg",
      ui_sidebar_active_foreground: "--aboutbrowser-ui-sidebar-active-fg",
      ui_layer1_background: "--aboutbrowser-ui-layer1-bg",
      ui_layer1_foreground: "--aboutbrowser-ui-layer1-fg"
    };
    // TODO: implement more images
    this.imageToCSSMap = {
      theme_frame: "--aboutbrowser-image-frame-bg",
      theme_ntp_background: "--aboutbrowser-image-ui-bg"
    }
  }

  #rgbArrayToCSSDirective(colorData) {
    // color: [255, 255, 255] turns into
    // colorDeclaration: "rgb(255, 255, 255)"
    return "rgb(" + colorData[0] + ", " + colorData[1] + ", " + colorData[2] + ")";
  }

  #removeAllAboutbrowserTagsFromEl(el) {
    let tags = el.getAttributeNames();
    for(const tag of tags) {
      if(tag.startsWith("data-aboutbrowser-")) el.removeAttribute(tag)
    }
  }
  
  inject() {
    let style = document.documentElement.style;
    let css = this.getCSSForTheme(false);
    for(const directive of css) {
      style.setProperty(directive[0], directive[1]);
    }
    this.#removeAllAboutbrowserTagsFromEl(document.documentElement);
    for(const flag of this.flags) document.documentElement.setAttribute("data-aboutbrowser-"+flag, "");
    if(this.isAboutBrowserTheme) return;
    
    // Apply default styling if this is not an aboutbrowser theme
    css = Extension.internalThemeExtension.theme.getCSSForTheme(false);
    for(const directive of css) {
      if(!directive[0].includes('--aboutbrowser-ui')) continue;
      style.setProperty(directive[0], directive[1]);
    }
  }

  injectIntoFrame(frame, isNtp) {
    let style = frame.contentWindow.document.documentElement.style;
    let css = this.getCSSForTheme(isNtp);
    for(const directive of css) {
      style.setProperty(directive[0], directive[1]);
    }
    this.#removeAllAboutbrowserTagsFromEl(frame.contentWindow.document.documentElement);
    for(const flag of this.flags) frame.contentWindow.document.documentElement.setAttribute("data-aboutbrowser-"+flag, "");

    if(this.isAboutBrowserTheme || isNtp) return;
    
    // Apply default styling if this is not an aboutbrowser theme
    css = Extension.internalThemeExtension.theme.getCSSForTheme(isNtp);
    for(const directive of css) {
      if(!directive[0].includes('--aboutbrowser-ui')) continue;
      style.setProperty(directive[0], directive[1]);
    }
  }

  getCSSForTheme(isNtp) {
    let themeCSS = [];

    if(this.isAboutBrowserTheme) {
      // AboutBrowser theme, parse aboutbrowser-only features
      for(const color of Object.entries(this.aboutBrowserColorToCSSMap)) {
        themeCSS.push([color[1], this.#rgbArrayToCSSDirective(this.colorMap[color[0]])]);
      }
    }
    for(const color of Object.entries(this.colorToCSSMap)) {
      // Don't inject UI theme CSS if this theme is a Chrome theme and this isn't the new tab page
      // This allows only aboutbrowser themes to theme internal pages, similar to the default Chrome behavior
      if(!this.isAboutBrowserTheme && !isNtp && color[1].includes('--aboutbrowser-ui')) continue;
      themeCSS.push([color[1], this.#rgbArrayToCSSDirective(this.colorMap[color[0]])]);
    }

    for(const image of Object.entries(this.imageToCSSMap)) {
      themeCSS.push([image[1], `url(/extension/${this.extension.id}/${this.imageMap[image[0]]})`]);
    }

    return themeCSS;
  }
  
  toJSON() {
    return this.json;
  }
}
