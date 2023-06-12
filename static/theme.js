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


class Theme {
  constructor(themeJson) {
    // Sanity check the json
    
    // Ignore manifest_version as that is for Chrome.
    // Will be needed for extension parsing
    if(
      !themeJson.version ||
      !themeJson.name || 
      !themeJson.theme ||
      !themeJson.theme.colors
    ) throw new Error("Invalid theme");

    this.version = themeJson.version;
    this.name = themeJson.name;
    this.isAboutBrowserTheme = !!themeJson.aboutbrowser;
    colorMap = this.colorMap = themeJson.theme.colors;

    // Sanity check the theme
    let colorMapContains = Object.keys(colorMap);
    for(const k of [
      "frame",
      "toolbar",
      "tab_text",
      "tab_background_text"
    ]) if(!colorMapContains.includes(k)) throw new Error("Invalid theme");
    // Set any fallbacks necessary
    if(!colorMapContains.includes("button_background")) colorMap.button_background = colorMap.frame;
    if(!colorMapContains.includes("ntp_background")) colorMap.ntp_background = colorMap.toolbar;
    if(!colorMapContains.includes("ntp_link")) colorMap.ntp_link = colorMap.tab_text;
    if(!colorMapContains.includes("ntp_text")) colorMap.ntp_text = colorMap.tab_text;
    if(!colorMapContains.includes("omnibox_background")) colorMap.omnibox_background = colorMap.frame;
    if(!colorMapContains.includes("omnibox_text")) colorMap.omnibox_text = colorMap.tab_text;
    if(!colorMapContains.includes("toolbar_button_icon")) colorMap.toolbar_button_icon = colorMap.tab_text;
    if(!colorMapContains.includes("toolbar_text")) colorMap.toolbar_text = colorMap.tab_text;
    if(!colorMapContains.includes("bookmark_text")) colorMap.bookmark_text = colorMap.tab_text;

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
      ]) if(!colorMapContains.includes(k)) throw new Error("Invalid theme");
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
      ui_search_foreground: "--aboutbrouser-ui-search-fg",
      ui_toolbar_background: "--aboutbrowser-ui-toolbar-bg",
      ui_toolbar_foreground: "--aboutbrowser-ui-toolbar-fg",
      ui_sidebar_background: "--aboutbrowser-ui-sidebar-bg",
      ui_sidebar_foreground: "--aboutbrowser-ui-sidebar-fg",
      ui_sidebar_active_background: "--aboutbrowser-ui-sidebar-active-bg",
      ui_sidebar_active_foreground: "--aboutbrowser-ui-sidebar-active-fg",
      ui_layer1_background: "--aboutbrowser-ui-layer1-bg",
      ui_layer1_foreground: "--aboutbrowser-ui-layer1-fg"
    };
  }
  
  inject() {
    let style = document.documentElement.style;
    let css = this.getCSSForTheme(false);
    for(const directive of css) {
      style.setProperty(directive[0], directive[1]);
    }
  }

  injectIntoFrame(frame, isNtp) {
    let style = frame.contentWindow.document.documentElement.style;
    let css = this.getCSSForTheme(isNtp);
    for(const directive of css) {
      style.setProperty(directive[0], directive[1]);
    }
  }

  getCSSForTheme(isNtp) {
    let themeCSS = [];

    if(this.isAboutBrowserTheme) {
      // AboutBrowser theme, parse aboutbrowser-only features
      for(const color of Object.entries(this.aboutBrowserColorToCSSMap)) {
        let colorData = this.colorMap[color[0]];
        // color: [255, 255, 255] turns into
        // colorDeclaration: "rgb(255, 255, 255)"
        let colorDeclaration = "rgb(" + colorData[0] + ", " + colorData[1] + ", " + colorData[2] + ")";
        themeCSS.push([color[1], colorDeclaration]);
      }
    }
    for(const color of Object.entries(this.colorToCSSMap)) {
      // Don't inject UI theme CSS if this theme is a Chrome theme and this isn't the new tab page
      // This allows only aboutbrowser themes to theme internal pages, similar to the default Chrome behavior
      if(!this.isAboutBrowserTheme && !isNtp && color[1].includes('--aboutbrowser-ui')) continue;
      let colorData = this.colorMap[color[0]];
      // color: [255, 255, 255] turns into
      // colorDeclaration: "rgb(255, 255, 255)"
      let colorDeclaration = "rgb(" + colorData[0] + ", " + colorData[1] + ", " + colorData[2] + ")";
      themeCSS.push([color[1], colorDeclaration]);
    }
    return themeCSS;
  }
}

let gcp = new GoogleColorPalette();
window.googlecolorpalette = gcp;


Theme.default = new Theme({
  manifest_version: 3,
  version: "0.2_alpha",
  name: "Chrome Dark",
  theme: {
    images: {
      frame: gcp.Grey900,
      toolbar: gcp.Grey800,
      tab_text: gcp.Grey050,
      tab_background_text: gcp.Grey300,
      button_background: gcp.Grey800,
      ntp_background: gcp.Grey800,
      ntp_link: gcp.Blue800,
      ntp_text: gcp.Grey050,
      omnibox_background: gcp.Grey900,
      omnibox_text: gcp.Grey050,
      toolbar_button_icon: gcp.Grey050,
      toobar_text: gcp.Grey050,
      bookmark_text: gcp.Grey050,
      accent_color: gcp.Blue700,
      ui_search_background: gcp.Grey900,
      ui_search_foreground: gcp.Grey050,
      ui_sidebar_background: gcp.Grey800,
      ui_sidebar_foreground: gcp.Grey050,
      ui_toolbar_background: gcp.Grey800,
      ui_toolbar_foreground: gcp.Grey050,
      ui_sidebar_active_background: gcp.Grey900,
      ui_sidebar_active_foreground: gcp.Blue700,
      ui_layer1_background: gcp.Grey800,
      ui_layer1_foreground: gcp.Grey050
    },
  },
  aboutbrowser: "true",
});

// Inject default theme early so there is no unstyled content as everything else loads
Theme.default.inject();

class ThemeController {
  constructor(currentTheme = Theme.default) {    
    this.currentTheme = currentTheme;
    this.themeList = [];
    this.themeList.push(currentTheme);
  }

  applyTheme() {
    this.currentTheme.inject();
  }

  applyThemeToFrame(frame, isNtp) {
    this.currentTheme.injectIntoFrame(frame, isNtp);
  }
}
