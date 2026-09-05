import { defineConfig } from "html-validate";

export default defineConfig({
  "elements": [
    "html5"
  ],
  "extends": [
    "html-validate:recommended",
    "custom-plugin:recommended"
  ],
  "plugins": [
    "./.htmlvalidate.plugin.mjs",
  ],
  "rules": {
    "element-permitted-content": "error",
    "doctype-style": "off",
    "no-inline-style": "off",
    "attr-quotes": "off",
    "no-trailing-whitespace": "off",
    "no-raw-characters": ["error", { "relaxed": true }],
    "valid-id": ["error", { "relaxed": true }]
  }
})