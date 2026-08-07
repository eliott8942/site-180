function parseStrId(str_id) {
  const parts = str_id.split('-')
  const id = parseInt(parts[0])

  if (Number.isNaN(id)) {
    return null
  } else {
    return [id, str_id]
  }
}

function getPlaceFromStrId(str_id, place_array) {
  const tuple = parseStrId(str_id)
  if (!tuple) {
    return null
  } 
  const [id, place_str_id] = tuple
  if (id < 0 || id >= place_array.length) {
    return null
  }
  const placeData = place_array[id]
  if (placeData.str_id !== place_str_id) {
    return null
  }

  return placeData
}