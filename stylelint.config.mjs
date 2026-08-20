export default {
  // FIXME : i didn't managed to make that config work with stylelint-config-tailwindcss/scss.
  // When used with it, it generates non senses errors.
  extends: [
    "stylelint-config-recommended",
    "stylelint-config-recommended-scss",
  ],
  rules: {
    "scss/at-rule-no-unknown": [
      true,
      {
        // include tailwind @-rules
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "reference",
          "theme",
          "utility",
        ],
      },
    ],
    "no-invalid-position-at-import-rule": [
      true,
      {
        // include tailwind @-rules
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "reference",
          "theme",
          "utility",
        ],
      },
    ],
  },
};
