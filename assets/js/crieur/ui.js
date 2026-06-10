let CARDS_CACHE = []

function uiInit(placeData) {
  console.log("Initialize ui...")

  let tuple = getElementForEachId("searchMenuPanelContainer", "placeInfoScrollableContainer", "placeInfoTitle", "placeInfoTitleInHeader")
  if (tuple == undefined) {
    console.error("Couldn't initialize the ui properly.")
    return
  }
  let [searchMenuPanelContainer, placeInfoScrollableContainer, placeInfoTitle, placeInfoTitleInHeader] = tuple

  function syncTitlesPosition() {
    let parentRect = searchMenuPanelContainer.getBoundingClientRect()
    let titleRect = placeInfoTitle.getBoundingClientRect()

    let offset = Math.max(titleRect.top - parentRect.top, 0)
    placeInfoTitleInHeader.style.top = `${ offset }px`
  }
  syncTitlesPosition()

  let observer = new IntersectionObserver(
    () => syncTitlesPosition(),
    {
      root: placeInfoScrollableContainer,
      // a little hack to make the transition be smooth
      threshold: Array.from({ length: 101 }, (_, i) => i / 100)
    }
  )
  observer.observe(placeInfoTitle)

  for (const place of placeData) {
    CARDS_CACHE.push(createEntryCard(place))
  }
  updateCards()

  console.log("Done")
}

// extends the end hour by 24 hours if the timeSpan crosses midnight
function denormalizeEndHourTime(timeSpan) {
  const start = hourTupleToMinutes(timeSpan[0])
  const end = hourTupleToMinutes(timeSpan[1])

  if (end < start) {
    return [Array.from(timeSpan[0]), [timeSpan[1][0] + 24, timeSpan[1][1]]]
  } else {
    return timeSpan
  }
}

function updateSchedule(container, otherElements, scheduleData) {
  let [nowBar] = otherElements
  
  let now = getDayInTimeOffset([1, 0]);
  let day = now.getDay()
  let todayInMinutes = hourTupleToMinutes([now.getHours(), now.getMinutes()])

  // update now bar
  const startTotalMinutes = 0
  const endTotalMinutes = Math.max(24, ...scheduleData.flatMap(day => Math.max(...day.map(timeSpan => hourTupleToMinutes(denormalizeEndHourTime(timeSpan)[1])))))

  nowBar.style.left = `${ todayInMinutes / (endTotalMinutes - startTotalMinutes) * 100}%`

  // update schedule table rows
  for (let index = 0; index < scheduleData.length; index++) {
    const scheduleOfTheDayContainer = container[index];
    const scheduleOfTheDay = scheduleData[index];
    
    // clear childrens
    scheduleOfTheDayContainer.replaceChildren()
    scheduleOfTheDayContainer.appendChild(span([], ["scheduleDayTagSpace"]))

    if ((day + 6) % 7 == index) {
      scheduleOfTheDayContainer.parentElement.classList.add("active")
    }

    for (let j = 0; j < scheduleOfTheDay.length; j++) {
      const timeSpan = scheduleOfTheDay[j];
      
      let lastTimeSpanEndInMinutes = startTotalMinutes
      if (j != 0) {
        lastTimeSpanEndInMinutes = hourTupleToMinutes(scheduleOfTheDay[j - 1][1])
      }
      const spaceElement = document.createElement("span")
      const spaceWidth = differenceBetweenHoursInMinutes(lastTimeSpanEndInMinutes, timeSpan[0]) / (endTotalMinutes - startTotalMinutes) * 100
      spaceElement.style.width = `${ spaceWidth }%`
      
      const timeSpanElement = document.createElement("span")
      const timeSpanWidth = differenceBetweenHoursInMinutes(timeSpan[0], timeSpan[1]) / (endTotalMinutes - startTotalMinutes) * 100
      timeSpanElement.style.width = `${ timeSpanWidth }%`
      timeSpanElement.style.background = "linear-gradient(0deg,rgba(255, 255, 255, 0) 10%, rgba(0, 0, 0, 0.15) 10%, rgba(0, 0, 0, 0.15) 90%, rgba(255, 255, 255, 0) 90%)"

      scheduleOfTheDayContainer.appendChild(spaceElement)
      scheduleOfTheDayContainer.appendChild(timeSpanElement)
    }
  }
}

function updateLinks(linksContainer, linksData, googleMapLink) {
  let childrens = []
  // if (googleMapLink) {
  //   childrens.push(a(
  //     [
  //       span([], ["crieur-icon", `crieur-icon-google-map`]),
  //     ],
  //     googleMapLink,
  //     ["crieur-social-links"]
  //   ))
  // }

  for (const link of linksData) {
    childrens.push(a(
      [
        span([], ["crieur-icon", `crieur-icon-${link.social}`]),
      ],
      link.url,
      ["crieur-social-links"]
    ))
  }

  linksContainer.replaceChildren(...childrens)
}

function updateGallery(container, galeryData) {
  if (galeryData.length == 0) {
    container.style.display = "none"
  } else {
    container.style.removeProperty("display")
    container.replaceChildren(...galeryData.map(srcURL => img(srcURL, ["h-full", "w-auto"])))
  }
}

function updateDescription(container, description) {
  container.textContent = description

  // apparently parseFloat ignore the px suffix, which is a good thing here
  const height = parseFloat(getComputedStyle(container).height)
  const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const sizeInRem = height / fontSize

  const MAX_HEIGHT_REM = 5
  console.log(height, fontSize)
  if (sizeInRem < MAX_HEIGHT_REM) {
    container.parentElement.classList.add("fold-hidden")
  } else {
    container.parentElement.classList.remove("fold-hidden")
  }
}

function updateTipsAndTops(tipsContainer, topsContainers, tips, tops, title) {
  let tipsEmpty = tips == undefined || tips == ""
  let topsEmpty = tops == undefined || tops.length == 0

  if (tipsEmpty && topsEmpty) {
    tipsContainer.parentElement.style.display = "none"
    return
  } else {
    tipsContainer.parentElement.style.removeProperty("display")
  }

  if (!tipsEmpty && !topsEmpty) {
    title.textContent = "Tips and Tops"
  } else if (!tipsEmpty) {
    title.textContent = "Tips"
  } else {
    title.textContent = "Tops"
  }

  if (!tipsEmpty) {
    tipsContainer.textContent = tips
  }

  if (!topsEmpty) {
    topsContainers.replaceChildren(...tops.map(top => {
      return div([
        img(top.photo, ["image"]),
        div([
          div([top.price], ["price"]),
          div([], ["priceSpacer"]),
          div([top.name], ["title"]),

          ...(top.description != undefined ? [div([top.description], ["description"])] : []),
        ], ["metadata"])
      ], ["crieur-tops"])
    }))
  }
}

function resetPanelState(scrollableContainer) {
  scrollableContainer.scrollTop = 0
}

function updatePanelInfo(data) {
  let tuple = getElementForEachId(
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
    "placeInfoTipsAndTopsTitle"
  )
  let scheduleContainerTuples = getElementForEachId(...Array.from({ length: 7 }, (_, i) => `placeInfoScheduleRow${i + 1}`))
  let scheduleOtherElement = getElementForEachId("placeInfoScheduleNowBar")
  if (tuple == undefined || scheduleContainerTuples == undefined || scheduleOtherElement == undefined) { return }
  let [scrollableContainer, titleElement, titleInHeaderElement, typesContainer, priceElement, addressElement, descriptionElement, linksContainer, tipsContainer, galleryContainer, placeBannerElement, placeInfoTops, tipsAndTopsTitle] = tuple

  resetPanelState(scrollableContainer)

  titleElement.textContent = data.title
  titleInHeaderElement.textContent = data.title
  priceElement.textContent = data.price
  // addressElement.textContent = formatLongAddress(data.location.address)
  placeBannerElement.src = data.banner

  if (data.location.map != undefined) {
    addressElement.replaceChildren(
      a([
        span([], ["crieur-icon", "crieur-icon-google-map"]),
        formatLongAddress(data.location.address)
      ],
      data.location.map
    ))
  } else {
    addressElement.replaceChildren(
      formatLongAddress(data.location.address)
    )
  }

  updateDescription(descriptionElement, data.description)

  typesContainer.replaceChildren(...mapSeparated(
    data.types, 
    span(", "), 
    (_, el) => span(el)
  ))

  updateSchedule(scheduleContainerTuples, scheduleOtherElement, data.location.schedule)
  updateLinks(linksContainer, data.links, data.location.map)

  updateGallery(galleryContainer, data.gallery)
  updateTipsAndTops(tipsContainer, placeInfoTops, data.tips, data.tops, tipsAndTopsTitle)
}

function showPlaceInfo(placeData) {
  let tuple = getElementForEachId("searchMenuPanelContainer", "searchMenuContainer", "searchMenuInputHeader", "searchmenu-toggle-inner")
  if (tuple == undefined) { return }
  let [panelContainer, container, inputHeader, searchMenuToggle] = tuple;
  
  updatePanelInfo(placeData)
  
  panelContainer.style.left = "-100%";
  container.classList.add("crieur-info-shown");
  inputHeader.classList.add("crieur-info-shown");
  searchMenuToggle.checked = true
}

function closePanelInfo() {
  let tuple = getElementForEachId("searchMenuPanelContainer", "searchMenuContainer", "searchMenuInputHeader")
  if (tuple == undefined) { return }
  let [panelContainer, container, inputHeader] = tuple;

  panelContainer.style.left = "0%";
  container.classList.remove("crieur-info-shown");
  inputHeader.classList.remove("crieur-info-shown");
}

function createEntryCard(placeInfo) {
  return div([
    // image
    div([
      img(placeInfo.thumbnail, ["h-full", "aspect-square", "object-cover", "rounded-md"])
    ], ["w-28", "overflow-hidden", "p-3", "shrink-0"]),

    // metadata
    div([
      el("h5", [placeInfo.title]),

      // type
      div([
        // types
        span([placeInfo.types.join(", ")]),
        span([' ‧ ']),
        span([placeInfo.price]),
        span([' ‧ ']),
        span([placeInfo.location.address.address]),
        span([' ‧ ']),
        createStatusSpan(placeInfo.location.schedule)
      ])
    ], ["py-3"])
  ], ["max-h-28", "w-full", "flex", "shrink-0", "flex-row", "overflow-hidden", "first:border-0", "border-t", "hover:bg-gray-100", "cursor-pointer", "unselectable"], { onclick: () => showPlace(placeInfo.id, 'fromCard') })
}

function updateCards(newCards = CARDS_CACHE) {
  let tuple = getElementForEachId("searchMenuCardContainer")
  if (tuple == undefined) { return }
  let [cardContainer] = tuple

  cardContainer.replaceChildren(...newCards)
}