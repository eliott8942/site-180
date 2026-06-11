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
  if (searchQuery.length == 0) {
    updateCards()
  } else {
    const results = FUSE.search(input.value)
    
    // fore some reason Fuse.js returns results with score higher than that threshold,
    // so what i did was i will filter those results out here
    updateCards(results
      .filter(place => place.score <= SEARCH_THRESHOLD)
      .map(place => CARDS_CACHE[place.item.id])
    )
  }
}
