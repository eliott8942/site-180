const fs = require("fs");
const path = require("path");
const themePath = path.join(__dirname, "data/theme.json");
const themeRead = fs.readFileSync(themePath, "utf8");
const theme = JSON.parse(themeRead);

let font_initial_size = Number(theme.fonts.font_size.base.replace("px", ""));
let font_scale = Number(theme.fonts.font_size.scale);

let h6 = font_initial_size / font_initial_size;
let h5 = h6 * font_scale;
let h4 = h5 * font_scale;
let h3 = h4 * font_scale;
let h2 = h3 * font_scale;
let h1 = h2 * font_scale;

let fontPrimaryName,
  fontPrimaryType,
  fontSecondaryName,
  fontSecondaryType,
  fontTeriaryName,
  fontTeriaryType;

if (theme.fonts.font_family.primary) {
  // Extract font names from google font urls
  fontPrimaryName = theme.fonts.font_family.primary.base
    .replace(/\+/g, " ")
    .replace(/:[ital,]*[ital@]*[wght@]*[0-9,;]+/gi, "");
  fontPrimaryType = theme.fonts.font_family.primary.type;
}
if (theme.fonts.font_family.secondary) {
  fontSecondaryName = theme.fonts.font_family.secondary.base
    .replace(/\+/g, " ")
    .replace(/:[ital,]*[ital@]*[wght@]*[0-9,;]+/gi, "");
  fontSecondaryType = theme.fonts.font_family.secondary.type;
}
if (theme.fonts.font_family.tertiary) {
  fontTeriaryName = theme.fonts.font_family.tertiary.base
    .replace(/\+/g, " ")
    .replace(/:[ital,]*[ital@]*[wght@]*[0-9,;]+/gi, "");
  fontTeriaryType = theme.fonts.font_family.tertiary.type;
}

const STRING_LITERAL_RE = /['"`]((?:[^'"`\\]|\\.)*)['"`]/g;
const CLASS_TOKEN_RE = /[a-zA-Z0-9_-]+/g;
const TEMPLATE_EXPR_RE = /\$\{[^}]*\}/g; // strip `${...}` interpolations

function getClassesInJS(content) {
  const classes = new Set();
  let strMatch;

  while ((strMatch = STRING_LITERAL_RE.exec(content))) {
    // Remove any ${...} interpolation so JS identifiers inside it
    // don't get mistaken for class names
    const inner = strMatch[1].replace(TEMPLATE_EXPR_RE, ' ');

    let tokenMatch;
    while ((tokenMatch = CLASS_TOKEN_RE.exec(inner))) {
      classes.add(tokenMatch[0]);
    }
  }

  return [...classes];
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // scan the hugo stats to scan html
    "./hugo_stats.json",

    // scan the crieur js files since tailwindcss classes are also used here
    "./assets/js/crieur/*.js",
    "./assets/js/crieur/components/*.js",
    "./static/js/crieur/*.js"
  ],
  extract: {
    // Custom extractor for JS — captures strings inside quotes, backticks, and dot notation
    js: getClassesInJS,
  },
  safelist: [{ pattern: /^swiper-/ }],
  darkMode: "class",
  theme: {
    screens: {
      sm: "520px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      borderColor: {
        primary: theme.colors.default.theme_color.primary,
        secondary: theme.colors.default.theme_color.secondary,
        darkMode: {
          primary: theme.colors.darkmode.theme_color.primary,
          secondary: theme.colors.darkmode.theme_color.secondary,
        },
      },
      colors: {
        text: theme.colors.default.text_color.default,
        light: theme.colors.default.text_color.light,
        dark: theme.colors.default.text_color.dark,
        primary: theme.colors.default.theme_color.primary,
        secondary: theme.colors.default.theme_color.secondary,
        body: theme.colors.default.theme_color.body,
        border: theme.colors.default.theme_color.border,
        bordeaux: theme.colors.default.theme_color.bordeaux,
        "theme-light": theme.colors.default.theme_color.theme_light,
        "theme-dark": theme.colors.default.theme_color.theme_dark,
        darkmode: {
          text: theme.colors.darkmode.text_color.default,
          light: theme.colors.darkmode.text_color.light,
          dark: theme.colors.darkmode.text_color.dark,
          primary: theme.colors.darkmode.theme_color.primary,
          secondary: theme.colors.darkmode.theme_color.secondary,
          body: theme.colors.darkmode.theme_color.body,
          border: theme.colors.darkmode.theme_color.border,
          bordeaux: theme.colors.default.theme_color.bordeaux,
          "theme-light": theme.colors.darkmode.theme_color.theme_light,
          "theme-dark": theme.colors.darkmode.theme_color.theme_dark,
        },
      },
      fontSize: {
        base: font_initial_size + "px",
        h1: h1 + "rem",
        "h1-sm": h1 * 0.8 + "rem",
        h2: h2 + "rem",
        "h2-sm": h2 * 0.8 + "rem",
        h3: h3 + "rem",
        "h3-sm": h3 * 0.8 + "rem",
        h4: h4 + "rem",
        h5: h5 + "rem",
        h6: h6 + "rem",
      },
      fontFamily: {
        primary: [fontPrimaryName, fontPrimaryType],
        secondary: [fontSecondaryName, fontSecondaryType],
        tertiary: [fontTeriaryName, fontTeriaryType],
      },
      boxShadow: {
        'centered-lg': '0 0px 15px rgb(0 0 0 / 0.1)'
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwind-bootstrap-grid")({
      generateContainer: false,
      gridGutterWidth: "2rem",
      gridGutters: {
        1: "0.25rem",
        2: "0.5rem",
        3: "1rem",
        4: "1.5rem",
        5: "3rem",
      },
    }),
    require('tailwindcss/plugin')(( { matchUtilities }) => {
      matchUtilities({
        'bg-size': (value) => ({
          'background-size': value
        })
      })
    })
  ],
};
