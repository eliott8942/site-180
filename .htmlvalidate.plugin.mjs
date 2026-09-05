import { definePlugin, Rule } from "html-validate";

const SITE_HOST = process.env.HUGO_HOST_DOMAIN || "localhost:1313"

function isExternalHref(href) {
  let url;
  try {
    url = new URL(href.trim(), `https://${SITE_HOST}/`);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(url.protocol)) return false;
  return url.host !== SITE_HOST;
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
    }
  },
  configs: {
    recommended: {
      rules: {
        "custom-plugin/attrs-required-for-external-links": "error",
      },
    },
  },
})
