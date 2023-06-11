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
 */


class Theme {
  constructor(name, colorMap, themeVersion) {
    // Sanity check the theme
    let colorMapContains = Object.keys(colorMap);
    if(
      !colorMapContains.includes("frame") ||
      !colorMapContains.includes("toolbar") ||
      !colorMapContains.includes("tab_text") ||
      !colorMapContains.includes("tab_background_text")
    ) {
      throw new Error("Invalid theme");
    }

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

    this.name = name;
    this.colorMap = colorMap;
    this.version = themeVersion;
    this.isAboutBrowserTheme = themeVersion.endsWith('-aboutbrowser');
    
    // Sanity check the aboutbrowser theme
    if(this.isAboutBrowserTheme && !colorMapContains.includes("accent_color")) throw new Error("Invalid theme");

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
      accent_color: "--aboutbrowser-ui-accent"
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


Theme.default = new Theme(
  "Chrome Dark",
  {
    frame: gcp.Grey900,
    toolbar: gcp.Grey800,
    tab_text: gcp.Grey050,
    tab_background_text: gcp.Grey300,
    accent_color: gcp.Blue700
  },
  '0.1_alpha-aboutbrowser');

// Inject default theme early so there is no unstyled content as everything else loads
try{Theme.default.inject();}catch(err){alert(err.stack)};

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
