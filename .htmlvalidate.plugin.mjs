import { definePlugin, Rule } from "html-validate";

const SITE_HOST = process.env.HUGO_HOST_DOMAIN || "https://localhost:1313/"
const SITE_URL = new URL(SITE_HOST);

function isExternalHref(href) {
  let url;
  try {
    url = new URL(href.trim(), SITE_URL);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(url.protocol)) return false;
  return url.host !== SITE_URL.host;
}

export default definePlugin({
  name: "custom-plugin",
  rules: {
    "custom-plugin/attrs-required-for-external-links": class extends Rule {
      setup() {
        this.on("dom:ready", ({ document }) => {
          const anchor = document.querySelectorAll("a");
          for (const a of anchor) {
            const href = a.getAttributeValue("href")
            if (!href || !isExternalHref(href)) {
              continue;
            }
            
            const target = a.getAttributeValue("target")
            const rel = a.getAttributeValue("rel")

            if (target != "_blank") {
              this.report(a, `target should be set to '_blank' for external link '${href}'`)
            }
            if (!rel || !rel.trim().split(/\s+/).includes("noreferrer")) {
              this.report(a, `rel should contains 'noreferrer' for external link '${href}'`)
            }
     			}
        })
      }
    },
    "custom-plugin/attrs-not-needed-for-internal-links": class extends Rule {
      setup() {
        this.on("dom:ready", ({ document }) => {
          const anchor = document.querySelectorAll("a");
          for (const a of anchor) {
            const href = a.getAttributeValue("href")
            if (!href || isExternalHref(href)) {
              continue;
            }
            
            const target = a.getAttributeValue("target")
            const rel = a.getAttributeValue("rel")

            if (target === "_blank") {
              this.report(a, `'target' attribute should not be used for internal link '${href}'`)
            }
            if (rel && rel.trim().split(/\s+/).includes("noreferrer")) {
              this.report(a, `'rel' attribute should not be used for internal link '${href}'`)
            }
     			}
        })
      }
    }
  },
  configs: {
    recommended: {
      rules: {
        "custom-plugin/attrs-required-for-external-links": "error",
        "custom-plugin/attrs-not-needed-for-internal-links": "warn",
      },
    },
  },
})
