let FUSE = undefined

const SEARCH_THRESHOLD = 0.35

function initSearch(placeData) {
  console.log('Initializing search...')

  FUSE = new Fuse(placeData, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'types', weight: 0.5 },
      { name: 'tags', weight: 0.5 },
      { name: 'location.address.address', weight: 0.3 },
      { name: 'location.address.city', weight: 0.3 }
    ],

    threshold: SEARCH_THRESHOLD,

    includeScore: true,
    ignoreDiacritics: true,
    includeMatches: true,

    useTokenSearch: true,
    tokenMatch: 'all'
  })

  console.log('Done.')
}

function switchToSearchMode() {
  if (FUSE == undefined || SEARCH_COMPONENTS == null) {
    console.warn("Search has not been initialized.")
    return;
  }

  SEARCH_COMPONENTS.menuLayer.classList.add("searchmode");
  SEARCH_COMPONENTS.toggle.checked = true; 
  SEARCH_COMPONENTS.input.select();
}

function updateSearchMode() {
  if (FUSE == undefined || SEARCH_COMPONENTS == null) {
    console.warn("Search has not been initialized.")
    return;
  }

  if (SEARCH_COMPONENTS.toggle.checked == false) {
    exitSearchMode()
  }
}

function exitSearchMode() {
  SEARCH_COMPONENTS.menuLayer.classList.remove("searchmode");
}

function updateSearch() {
  if (FUSE == undefined || SEARCH_COMPONENTS == null) {
    console.warn("Search has not been initialized.")
    return;
  }

  const searchQuery = SEARCH_COMPONENTS.input.value.trim()

  const results = FUSE.search(searchQuery)
  
  if (searchQuery.length == 0) {
    showAllCards(results.map(entry => entry.item))
  } else {
    // fore some reason Fuse.js returns results with score higher than that threshold,
    // so what i did was i will filter those results out here
    const resultsToShow = results.filter(place => place.score <= SEARCH_THRESHOLD)

    const places = resultsToShow.map(entry => entry.item)
    const hints = resultsToShow.map(entry => {
      const hintPlace = {
        title: undefined,
        types: new Array(entry.item.types.length).fill(undefined),
        address: undefined
      }
    
      for (const match of entry.matches) {
        switch (match.key) {
          case "title":
            hintPlace.title = match
            break
          case "types":
            hintPlace.types[match.refIndex] = match
            break
          case "location.address.address":
            hintPlace.address = match
            break
        }
      }
    
      return hintPlace
    })   

    const finalResults = zip(places, hints)
    showSearchResults(finalResults)
  }
}

function showSearchResults(results) {
  if (results.length == 0) {
    SEARCH_COMPONENTS.cardContainer.replaceChildren(queryNotFound())
  } else {
    const cards = []
    for (const [data, hints] of results) {
      cards.push(createEntryCard(data, hints))
    }
    SEARCH_COMPONENTS.cardContainer.replaceChildren(...cards)
  }
}

function showAllCards(placeData) {
  const cards = []
  for (const data of placeData) {
    cards.push(createEntryCard(data))
  }
  SEARCH_COMPONENTS.cardContainer.replaceChildren(...cards)
}
