const PATHS = absolutizeURLMap({
  'facebook': "images/brands/facebook.png",
  'instagram': "images/brands/instagram.png",
  'x': "images/brands/x-white.svg",
  'tiktok': "images/brands/tiktok.png",
  'tripadvisor': "images/bicons/tripadvisor.png",
  'site': "images/icons/www.svg"
})

const defaultSocial = (social) => Lit.html`
  <img src="${PATHS[social]}" class="h-full object-cover" alt="${social} icon image"/>
`

const xSocial = () => Lit.html`
  <div class="h-full aspect-square p-2 rounded-md bg-black text-white overflow-hidden">
    <img src="${PATHS.x}" class="h-full aspect-square object-cover" alt="x icon image"/>
  </div>
`

const tripadvisorSocial = () => Lit.html`
  <div class="h-full aspect-square rounded-md overflow-hidden">
    <img src="${PATHS.tripadvisor}" class="h-full aspect-square object-cover" alt="tripadvisor icon image"/>
  </div>
`

const socialImage = (social) => {
  switch (social) {
    case 'facebook':
    case 'instagram':
    case 'tiktok':
    case 'site':
      return defaultSocial(social)
    case 'x':
      return xSocial()
    case 'tripadvisor':
      return tripadvisorSocial()
    default:
      console.warn(`unknown social ${social}`)
      return null
  }
}

const socialLinkElement = (link) => Lit.html`
  <a class="crieur-social-links" href="${link.url}">
    ${socialImage(link.social)}
  </a>
`