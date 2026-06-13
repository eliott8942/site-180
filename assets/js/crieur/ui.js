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
  
  showAllCards(placeData)

  console.log("Done")
}

function updateSchedule(container, hoursContainer, scheduleData) {
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

  function convertDayFromSundayBasedToMondayBasedWeek(day) {
    return (day + 6) % 7
  }

  const range = (n) => Array.from({ length: n }, (_, i) => i)

  function formatHour([hours, minutes]) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // return the ticks for the hours above the schedule
  function getTimespanDisplay() {
    const startMinutes = Math.min(...scheduleData.flat().map(timeSpan => hourTupleToMinutes(timeSpan[0])))
    const endMinutes = Math.max(...scheduleData.flat().map(timeSpan => hourTupleToMinutes(denormalizeEndHourTime(timeSpan)[1])))

    const duration = endMinutes - startMinutes;
  
    let step;
    if (duration <= 60)        step = 15;   // 1h        → every 15 min
    else if (duration <= 120)  step = 30;   // 1h–2h     → every 30 min
    else if (duration <= 360)  step = 60;   // 2h–6h     → every 1h
    else if (duration <= 720)  step = 120;  // 6h–12h    → every 2h
    else                       step = 360;  // 12h–24h   → every 6h
  
    const snappedStart = Math.floor(startMinutes / step) * step;
  
    const ticks = [];
    for (let t = snappedStart + step / 2; t <= endMinutes; t += step) {
      ticks.push(t);
    }
    
    return [ticks, snappedStart, endMinutes];
  }

  // Compute now in swiss local time (UTC+2:00), so we can compare it to our swiss based schedule
  let now = getDayInUTCTimeZone([1, 0], [2, 0]);
  let day = now.getDay()
  let todayInMinutes = hourTupleToMinutes([now.getHours(), now.getMinutes()])

  // update now bar
  const [hourTicks, startTotalMinutes, endTotalMinutes] = getTimespanDisplay()

  // If the range crosses midnight and current time is before the start,
  // it means we're in the "next day" portion — so add a full day to normalize it
  const normalizedNow = todayInMinutes < startTotalMinutes
    ? todayInMinutes + MINUTES_IN_DAY
    : todayInMinutes
  
  const rawOffset = (normalizedNow - startTotalMinutes) / (endTotalMinutes - startTotalMinutes) * 100
  const nowBarOffset = `${rawOffset}%`

  hoursContainer.replaceChildren(...hourTicks.map(tick => {
    const hour = Math.floor(tick / 60)
    const minutes = tick % 60
    const offset = (tick - startTotalMinutes) / (endTotalMinutes - startTotalMinutes) * 100
    
    return div([
      div([formatHour([hour, minutes])], ["leading-none", "text-xs"]),
      div([], ["w-px", "grow", "bg-black/15"])
    ], ["absolute", "flex", "flex-col", "h-full", "items-center", "-translate-x-1/2"], { style: { left: `${offset}%` } })
  }))
  
  function nowBarOverlay() {
    return div([
      div([], ["dayTagSpace"]),
      div([
        div([], ["relative", "h-4/5", "w-[2px]", "bg-primary"], { style: { left: nowBarOffset } })
      ], ["grow", "h-full", "flex", "flex-row", "items-center"]),
      div([], ["w-20"])
    ], ["absolute", "w-full", "h-full", "flex", "flex-row", "items-center"])
  }

  container.replaceChildren(...range(7).map(i => {
    const scheduleOfTheDay = scheduleData[i];
    const isActiveDay = convertDayFromSundayBasedToMondayBasedWeek(day) == i;

    const els = [
      div([], ["dayTagSpace"]),
      div(scheduleOfTheDay.flatMap((timeSpan, j) => {
        let lastTimeSpanEndInMinutes = startTotalMinutes
        if (j != 0) {
          lastTimeSpanEndInMinutes = hourTupleToMinutes(scheduleOfTheDay[j - 1][1])
        }
        const spaceWidth = differenceBetweenHoursInMinutes(lastTimeSpanEndInMinutes, timeSpan[0]) / (endTotalMinutes - startTotalMinutes) * 100
        const timeSpanWidth = differenceBetweenHoursInMinutes(timeSpan[0], timeSpan[1]) / (endTotalMinutes - startTotalMinutes) * 100
  
        const spaceElement = span([], [], { style: { width: `${spaceWidth}%` } })
        let timeSpanElement;
        if (isActiveDay) {
          timeSpanElement = span([], [
            "h-1/3", "rounded-full",
            "shadow-inner", "shadow-white/50",
            "bg-gradient-to-b", "from-gray-300", "to-gray-500","border", "border-gray-300/50"
          ], { style: { width: `${timeSpanWidth}%` } });
        } else {
          timeSpanElement = span([], [
            "h-1/3", "rounded-full",
            "bg-gray-300","border", "border-gray-400/50"
          ], { style: { width: `${timeSpanWidth}%` } });
        }
        
        return [spaceElement, timeSpanElement]
      }), ["grow", "flex", "flex-row", "items-center", "h-full"])
    ]

    let openingHoursText;
    if (scheduleOfTheDay.length == 0) {
      openingHoursText = div(["Fermé"], ["w-20", "text-xs", "flex", "items-center", "justify-center", "flex-col", "h-8", "text-gray-500"])
    } else {
      openingHoursText = div(scheduleOfTheDay.map(timeSpan => {
        let [start, end] = timeSpan;

        if (isNowInHourSpan(todayInMinutes, start, end) && isActiveDay) {
          return span(`${formatHour(start)} - ${formatHour(end)}`, ["font-bold"])
        } else {
          return span(`${formatHour(start)} - ${formatHour(end)}`, [])
        }
        
      }), ["w-20", "text-xs", "flex", "items-center", "justify-center", "flex-col", "h-8"])
    }

    els.push(openingHoursText)
    
    if (isActiveDay) {
      els.push(nowBarOverlay())
    }
    
    return div(els, ["scheduleRow", "relative"])
  }))
}

function updateLinks(linksContainer, linksData, googleMapLink) {
  let childrens = []
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
          priceTag(top.price),
          div([], ["priceSpacer"]),
          div([top.name], ["title"]),

          ...(top.description != undefined ? [div([top.description], ["description"])] : []),
        ], ["metadata"])
      ], ["crieur-tops"])
    }))
  }

  function priceTag(price) {
    return div([
      svgEl("svg", [
        // shape
        svgEl("g", [
          svgEl("path", [], [], { d: "M 50,0 L 56.82816127056449,15.672515185886937 L 69.1341716182545,3.806023374435661 L 69.44495815568608,20.898563569410918 L 85.35533905932738,14.64466094067263 L 79.10143643058908,30.555041844313923 L 96.19397662556435,30.865828381745512 L 84.32748481411306,43.171838729435514 L 100,50 L 84.32748481411306,56.828161270564486 L 96.19397662556435,69.13417161825448 L 79.10143643058909,69.44495815568607 L 85.35533905932738,85.35533905932738 L 69.44495815568607,79.10143643058909 L 69.1341716182545,96.19397662556435 L 56.8281612705645,84.32748481411306 L 50,100 L 43.17183872943551,84.32748481411306 L 30.865828381745512,96.19397662556435 L 30.55504184431393,79.10143643058909 L 14.64466094067263,85.35533905932738 L 20.898563569410914,69.44495815568608 L 3.806023374435675,69.13417161825451 L 15.672515185886937,56.8281612705645 L 0,50.00000000000001 L 15.672515185886937,43.17183872943551 L 3.806023374435668,30.865828381745498 L 20.89856356941091,30.55504184431393 L 14.644660940672615,14.64466094067263 L 30.555041844313923,20.898563569410918 L 30.865828381745484,3.806023374435675 L 43.1718387294355,15.672515185886937 Z", fill:"#EE323E", stroke:"#000000", 'stroke-width':"1" })
        ], [], { style: { transformOrigin: "50px 50px" } }),
        svgEl("circle", [], [], { cx: "50", cy: "50", r: "28", fill: "#EE323E", opacity: "1" }),
      ], ["absolute", "w-full", "aspect-square", "z-0"], { width: "120", height: "120", viewBox: "0 0 100 100" }),

      div([price], ["w-full", "p-2", "z-10", "text-xs", "text-white", "text-center", "font-bold"]),
    ], ["price"])
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
    "placeInfoTipsAndTopsTitle",
    "placeInfoScheduleContainer",
    "placeInfoScheduleHourBarsContainer"
  )
  if (tuple == undefined) { return }
  let [scrollableContainer, titleElement, titleInHeaderElement, typesContainer, priceElement, addressElement, descriptionElement, linksContainer, tipsContainer, galleryContainer, placeBannerElement, placeInfoTops, tipsAndTopsTitle, placeInfoScheduleContainer, placeInfoScheduleHourBarsContainer] = tuple

  resetPanelState(scrollableContainer)

  titleElement.textContent = data.title
  titleInHeaderElement.textContent = data.title
  priceElement.textContent = data.price
  // addressElement.textContent = formatLongAddress(data.location.address)
  placeBannerElement.src = data.banner

  if (data.location.map != undefined) {
    addressElement.replaceChildren(
      a([
        div([], ["crieur-icon", "crieur-icon-google-map"]),
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

  updateSchedule(placeInfoScheduleContainer, placeInfoScheduleHourBarsContainer, data.location.schedule)
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

function createEntryCard(placeInfo, hints = []) {
  function applyHintsOnString(element, hint) {
    if (hint == undefined) {
      return [span([element], ["searchresult-part"])]
    } else {
      let start = 0
      const finalEls = []
      for (const highlightIndices of hint.indices) {
        if (highlightIndices[0] > start) {
          let stringPart = element.substring(start, highlightIndices[0]);
          finalEls.push(span([stringPart], ["searchresult-part"]))
        }

        let stringPart = element.substring(highlightIndices[0], highlightIndices[1] + 1)
        finalEls.push(span([stringPart], ["searchresult-part", "highlighted"]))

        start = highlightIndices[1] + 1;
      }

      if (start < element.length) {
        let stringPart = element.substring(start)
        finalEls.push(span([stringPart], ["searchresult-part"]))
      }

      return finalEls
    }
  }

  function joinElements(arr, separator) {
    return arr.flatMap((item, i) => {
      if (i === 0) return [item];
      const sep = typeof separator === "function" ? separator(i) : separator;
      return [sep, item];
    });
  }
  
  return div([
    // image
    div([
      img(placeInfo.thumbnail, ["h-full", "aspect-square", "object-cover", "rounded-md"])
    ], ["w-28", "overflow-hidden", "p-3", "shrink-0"]),

    // metadata
    div([
      el("h5", applyHintsOnString(placeInfo.title, hints["title"])),

      // type
      div([
        // types
        span(
          joinElements(
            placeInfo.types.map((ty, i) => applyHintsOnString(ty, hints["types"] == undefined ? undefined : hints["types"][i])),
            () => span([", "])
          ).flat()
        ),
        span([' ‧ ']),
        span([placeInfo.price], ["searchresult-part"]),
        span([' ‧ ']),
        span(applyHintsOnString(placeInfo.location.address.address, hints["address"])),
        span([' ‧ ']),
        createStatusSpan(placeInfo.location.schedule)
      ], ["metadata"])
    ], ["py-3"])
  ], ["max-h-28", "w-full", "flex", "shrink-0", "flex-row", "overflow-hidden", "first:border-0", "border-t", "hover:bg-gray-100", "cursor-pointer", "unselectable"], { onclick: () => showPlace(placeInfo.id, 'fromCard') })
}

function queryNotFound() {
  return div([
    span(["🍳"], ["text-[4rem]"]),
    el("h1", ["Oh... on dirais que la page que tu cherches n'est pas la !"], ["h3", "mt-2", "text-center", "px-8"]),
    span(["Peut etre cherche autre chose ?"], ["font-bold", "text-lg", "pt-2"])
  ], ["h-80", "w-full", "flex", "items-center", "justify-center", "flex-col"])
}
