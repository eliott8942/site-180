let CARDS_CACHE = []

function uiInit(placeData) {
  console.log("Initialize ui...")

  function syncTitlesPosition() {
    let parentRect = SEARCH_COMPONENTS.panelContainer.getBoundingClientRect()
    let titleRect = PLACE_INFO_COMPONENTS.title.getBoundingClientRect()

    let offset = Math.max(titleRect.top - parentRect.top, 0)
    PLACE_INFO_COMPONENTS.titleInHeader.style.top = `${ offset }px`
  }
  syncTitlesPosition()

  let observer = new IntersectionObserver(
    () => syncTitlesPosition(),
    {
      root: PLACE_INFO_COMPONENTS.scrollableContainer,
      // a little hack to make the transition be smooth
      threshold: Array.from({ length: 101 }, (_, i) => i / 100)
    }
  )
  observer.observe(placeInfoTitle)
  
  showAllCards(placeData)

  console.log("Done")
}

const socialLinkElement = (link) => Lit.html`
  <a class="crieur-social-links" href="${link.url}">
    <span class="crieur-icon crieur-icon-${link.social}"></span>
  </a>
`

function updateLinks(linksContainer, linksList) {
  Lit.render(
    linksList.map(link => socialLinkElement(link)),
    linksContainer
  )
}

function updateGallery(container, galeryData) {
  Lit.render(
    galeryData.map(srcURL => Lit.html`<img src=${srcURL} class="h-full w-auto"/>`),
    container
  )
  
  if (galeryData.length == 0) {
    container.style.display = "none"
  } else {
    container.style.removeProperty("display")
  }
}

function updateDescription(container, description) {
  container.textContent = description

  // apparently parseFloat ignore the px suffix, which is a good thing here
  const height = container.getBoundingClientRect().height;
  const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const sizeInRem = height / fontSize

  const MAX_HEIGHT_REM = 5
  if (sizeInRem < MAX_HEIGHT_REM) {
    container.parentElement.classList.add("fold-hidden")
  } else {
    container.parentElement.classList.remove("fold-hidden")
  }
}

function updateTipsAndTops(tipsContainer, topsContainers, tips, tops, titleContainer) {
  tips = tips ?? ""
  tops = tops ?? []

  if (!tips && tops.length == 0) {
    tipsContainer.parentElement.style.display = "none"
    return
  } else {
    tipsContainer.parentElement.style.removeProperty("display")
  }

  if (tips && tops.length > 0) {
    titleContainer.textContent = "Tips and Tops"
  } else if (tips) {
    titleContainer.textContent = "Tips"
  } else {
    titleContainer.textContent = "Tops"
  }

  tipsContainer.textContent = tips

  Lit.render(
    tops.map(top => topElement(top)),
    topsContainers
  )
}

const _panelAddressElement = (data) => {
  if (data.location.map) {
    return Lit.html`
      <a href="${data.location.map}">
        <span class="crieur-icon crieur-icon-google-map"></span>
        ${formatLongAddress(data.location.address)}
      </a>
    `
  } else {
    return Lit.html`
      ${formatLongAddress(data.location.address)}
    `
  }
}

function updatePanelInfo(data) {
  PLACE_INFO_COMPONENTS.scrollableContainer.scrollTop = 0

  PLACE_INFO_COMPONENTS.title.textContent = data.title
  PLACE_INFO_COMPONENTS.titleInHeader.textContent = data.title
  PLACE_INFO_COMPONENTS.price.textContent = data.price
  PLACE_INFO_COMPONENTS.banner.src = data.banner

  Lit.render(_panelAddressElement(data), PLACE_INFO_COMPONENTS.address)

  updateDescription(PLACE_INFO_COMPONENTS.description, data.description)

  PLACE_INFO_COMPONENTS.types.textContent = data.types.join(", ")

  Lit.render(scheduleElement(data.schedule), PLACE_INFO_COMPONENTS.scheduleContainer)
  
  Lit.render(
    data.links.map(link => socialLinkElement(link)),
    PLACE_INFO_COMPONENTS.links
  )

  updateGallery(PLACE_INFO_COMPONENTS.gallery, data.gallery)
  updateTipsAndTops(PLACE_INFO_COMPONENTS.tips, placeInfoTops, data.tips, data.tops, PLACE_INFO_COMPONENTS.tipsAndTopsTitle)
}

function showPlaceInfo(placeData) {
  updatePanelInfo(placeData)
  
  SEARCH_COMPONENTS.panelContainer.style.transform = "translateX(-100%)";
  SEARCH_COMPONENTS.menuLayer.classList.add("crieur-info-shown");
  SEARCH_COMPONENTS.toggle.checked = true
}

function closePanelInfo() {
  SEARCH_COMPONENTS.panelContainer.style.transform = "translateX(0%)";
  SEARCH_COMPONENTS.menuLayer.classList.remove("crieur-info-shown");
}
