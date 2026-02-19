const purgecss = {
  content: ["./hugo_stats.json"],
  defaultExtractor: (content) => {
    const elements = JSON.parse(content).htmlElements;
    return [
      ...(elements.tags || []),
      ...(elements.classes || []),
      ...(elements.ids || []),
    ];
  },
  safelist: [
    // the swiper library doesn't detect properly if the classes are removed
    /^swiper-/,

    // crieur classes are applied dinamically
    /^crieur-status-/,
    /crieur-deco/, /crieur-place/,
    /^crieur-info/,
    /^crieur-icon/,
    /^crieur-social/,
    /^crieur-tops/,

    // maplibregl are applied dinamically
    /^maplibregl/,

    // some generic css words used on crieur
    /^active/, /^text/,

    // used on crieur tops, generated dynamically
    /^title/, /^description/, /^price/, /^priceSpacer/, /^image/, /^metadata/, /^main/,

    // fold classes are applied dynamically
    /^fold-/,

    // can be used in crieur maps for links
    /^fa-google/, /^fa-instagram/, /^fa-linkedin/, /^fa-twitter/, /^fa-facebook/, /^fa-tiktok/
  ],
};

module.exports = {
  plugins: {
    tailwindcss: {},
    "@fullhuman/postcss-purgecss": purgecss,
    autoprefixer: {},
  },
};
