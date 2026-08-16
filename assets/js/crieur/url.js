function setURLFile(str) {
  window.history.replaceState({}, "", PAGE_URL + "#" + str)
}

function clearURLFile() {
  window.history.replaceState({}, "", PAGE_URL)
}

function getURLFile() {
  const raw = window.location.hash
  if (raw) {
    return raw.slice(1)
  } else {
    return null
  }
}


