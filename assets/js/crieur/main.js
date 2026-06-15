let PLACE_DATA = null

let SEARCH_COMPONENTS = null
let PLACE_INFO_COMPONENTS = null

function initComponents() {
  const [
    menuLayer,
    menuContainer,
    inputHeader,
    toggle,
    input,
    cardContainer,
    panelContainer
  ] = getElementForEachId(
    "searchMenuLayer",
    "searchMenuContainer",
    "searchMenuInputHeader",
    "searchmenu-toggle-inner",
    "searchmenu-input",
    "searchMenuCardContainer",
    "searchMenuPanelContainer"
  ) ?? [];
  
  if (!menuLayer) {
    console.warn("Failed to get all the elements for the search")
    return;
  }
  
  SEARCH_COMPONENTS = {
    menuLayer,
    menuContainer,
    inputHeader,
    toggle,
    input,
    cardContainer,
    panelContainer
  };

  const [
    scrollableContainer,
    title,
    titleInHeader,
    types,
    price,
    address,
    description,
    links,
    tips,
    gallery,
    banner,
    tops,
    tipsAndTopsTitle,
    scheduleContainer,
    scheduleHourBarsContainer
  ] = getElementForEachId(
    "placeInfoScrollableContainer",
    "placeInfoTitle",
    "placeInfoTitleInHeader",
    "placeInfoTypes",
    "placeInfoPrice",
    "placeInfoAddress",
    "placeInfoDescription",
    "placeInfoLinks",
    "placeInfoTips",
    "placeInfoGallery",
    "placeInfoBanner",
    "placeInfoTops",
    "placeInfoTipsAndTopsTitle",
    "placeInfoScheduleContainer",
    "placeInfoScheduleHourBarsContainer"
    ) ?? [];
  
  if (!scrollableContainer) {
    console.warn("Failed to get all the elements for the panelInfo")
    return;
  }

  PLACE_INFO_COMPONENTS = {
    scrollableContainer,
    title,
    titleInHeader,
    types,
    price,
    address,
    description,
    links,
    tips,
    gallery,
    banner,
    tops,
    tipsAndTopsTitle,
    scheduleContainer,
    scheduleHourBarsContainer
  };
}

function init(config, placeData, decoData, style) {
  placeData = assignIds(placeData)
  
  PLACE_DATA = placeData

  initComponents()
  initMap(config, placeData, decoData, style)
  uiInit(placeData)
  initSearch(placeData)

  // fold the search menu on mobile to make the attribution visible on first view
  if (document.documentElement.clientWidth <= 520) {
    let showMenuToggle = document.getElementById("searchmenu-toggle-inner")
    if (showMenuToggle == undefined) {
      console.log("Warning : searchmenu-menu-toggle is linked to nothing")
    } else if (showMenuToggle.tagName?.toLowerCase() != "input"){
      console.log("Warning : searchmenu-menu-toggle is not linked to an input")
    } else {
      showMenuToggle.checked = false
    }
  }
}

function showPlace(id, mode) {
  if (PLACE_DATA == null) {
    console.warn("Warning : tried to fetch place data before initialisation")
    return
  }

  let placeData = PLACE_DATA[id];
  if (placeData == undefined) {
    console.warn("Warning : not a valid id.")
    return
  }

  console.log(placeData)

  showPlaceInfo(placeData)
  exitSearchMode()
  selectPlaceOnMap(placeData, id, mode)
}

