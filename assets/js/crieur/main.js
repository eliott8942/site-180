PLACE_DATA = null

function init(config, placeData, decoData, style) {
  placeData = assignIds(placeData)
  
  PLACE_DATA = placeData
  
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

  selectPlaceOnMap(placeData, id, mode)
  showPlaceInfo(placeData)
  exitSearchMode()
}

