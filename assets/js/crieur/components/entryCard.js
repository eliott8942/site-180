const _searchPartComponent = (element, highlighted = false) => Lit.html`<span class="searchresult-part ${highlighted ? "highlighted" : ""}">${element}</span>`

function _applyHintsOnString(element, hint) {
  if (hint == undefined) {
    return [_searchPartComponent(element)]
  } else {
    let start = 0
    const parts = []
    for (const highlightIndices of hint.indices) {
      if (highlightIndices[0] > start) {
        let stringPart = element.substring(start, highlightIndices[0]);
        parts.push(_searchPartComponent(stringPart))
      }

      let stringPart = element.substring(highlightIndices[0], highlightIndices[1] + 1)
      parts.push(_searchPartComponent(stringPart, true))

      start = highlightIndices[1] + 1;
    }

    if (start < element.length) {
      let stringPart = element.substring(start)
      parts.push(_searchPartComponent(stringPart))
    }

    return parts
  }
}

const entryCardElement = (placeInfo, hints = {}) => {
  const types = placeInfo.types.flatMap((ty, i) => {
    const part = _applyHintsOnString(ty, hints.types?.[i]);
    return i === 0 ? part : [Lit.html`<span>, </span>`, ...part];
  });
  
  return Lit.html`
    <div 
      class="min-h-28 w-full flex shrink-0 flex-row overflow-hidden first:border-0 border-t hover:bg-gray-100 cursor-pointer unselectable"
      @click=${() => showPlace(placeInfo.id, 'fromCard')}
    >
      <div class="w-28 overflow-hidden p-3 shrink-0">
        <img src="${placeInfo.thumbnail}" class="w-full aspect-square object-cover rounded-md"/>
      </div>
      <div class="py-3 pr-2 leading-6">
        <h5>${_applyHintsOnString(placeInfo.title, hints["title"])}</h5>
        <div class="metadata">
          <span>${types}</span>
          <span> ‧ </span>
          <span class="searchresult-part">${placeInfo.price}</span>
          <span> ‧ </span>
          <span>${_applyHintsOnString(placeInfo.location.address.address, hints["address"])}</span>
          <span> ‧ </span>
          ${statusSpanElement(placeInfo.location.schedule)}
        </div>
      </div>
    </div>
  `
}
