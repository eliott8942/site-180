let FUSE = undefined

const SEARCH_THRESHOLD = 0.6

function initSearch(placeData) {
  console.log('Initializing search...')

  FUSE = new Fuse(placeData, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'location.address.address', weight: 0.15 },
      { name: 'location.address.city', weight: 0.15 }
    ],
    threshold: SEARCH_THRESHOLD,
    includeScore: true,
    ignoreDiacritics: true,
    includeMatches: true
  })

  console.log('Done.')
}

function switchToSearchMode() {
  if (FUSE == undefined) {
    console.warn("Search has not been initialized.")
    return;
  }

  const tuple = getElementForEachId("searchmenu-toggle-inner", "searchmenu-input")
  if (tuple == undefined) { return; }
  const [searchMenuToggle, input] = tuple;

  searchMenuToggle.checked = true; 
  input.select();
}

function updateSearch() {
  if (FUSE == undefined) {
    console.warn("Search has not been initialized.")
    return;
  }
  
  const tuple = getElementForEachId("searchmenu-input")
  if (tuple == undefined) { return; }
  const [input] = tuple;

  const searchQuery = input.value.trim()

  const results = FUSE.search(searchQuery)
  
  if (searchQuery.length == 0) {
    showAllCards(results.map(entry => entry.item))
  } else {
    // fore some reason Fuse.js returns results with score higher than that threshold,
    // so what i did was i will filter those results out here
    const resultsToShow = results.filter(place => place.score <= SEARCH_THRESHOLD)

    const places = resultsToShow.map(entry => entry.item)
    const hints = resultsToShow.map(entry => {
      const hintPlace = {}

      let typeRefIndex = 0;
      for (const match of entry.matches) {
        switch (match.key) {
          case "title":
            Object.assign(hintPlace, { title: match })
            break
          case "types":
            if ("types" in hintPlace) {
              // push empty matchs
              while (typeRefIndex < match.refIndex) {
                hintPlace.types.push(undefined)
                typeRefIndex += 1;
              }
              
              hintPlace.types.push(match)
              typeRefIndex += 1;
            } else {
              let array = []
              // push empty matchs
              while (typeRefIndex < match.refIndex) {
                array.push(undefined);
                typeRefIndex += 1;
              }
              array.push(match)
              
              Object.assign(hintPlace, { types: array })
              typeRefIndex += 1;
            }
            break
          case "location.address.address":
            Object.assign(hintPlace, { "address": match })
        }
      }

      return hintPlace
    })   

    const finalResults = zip(places, hints)
    showSearchResults(finalResults)
  }
}

function showSearchResults(results) {
  const tuple = getElementForEachId("searchMenuCardContainer")
  if (tuple == undefined) { return }
  const [searchMenuCardContainer] = tuple;

  if (results.length == 0) {
    searchMenuCardContainer.replaceChildren(queryNotFound())
  } else {
    const cards = []
    for (const [data, hints] of results) {
      cards.push(createEntryCard(data, hints))
    }
    searchMenuCardContainer.replaceChildren(...cards)
  }
}

function showAllCards(placeData) {
  const tuple = getElementForEachId("searchMenuCardContainer")
  if (tuple == undefined) { return }
  const [searchMenuCardContainer] = tuple;
  
  const cards = []
  for (const data of placeData) {
    cards.push(createEntryCard(data))
  }
  searchMenuCardContainer.replaceChildren(...cards)
}
