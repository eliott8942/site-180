function setURLFile(str, params = {}) {
  const paramsPresent = params && Object.keys(params).length > 0
  
  if (str == undefined && !paramsPresent) {
    clearURLFile()
    return;
  }

  if (str != undefined) {
    str = encodeURIComponent(str)
  } else {
    str = ""
  }
  
  if (paramsPresent) {
    str += '?' + new URLSearchParams(params).toString()
  }
  
  window.history.replaceState({}, "", PAGE_URL + "#" + str)
}

function clearURLFile() {
  window.history.replaceState({}, "", PAGE_URL)
}

function getURLFile() {
  const raw = window.location.hash
  if (raw) {
    const parts = raw.slice(1).split('?')
    if (parts.length > 2) {
      throw `Invalid URL : ${raw}`
    }

    const str = decodeURIComponent(parts[0]);

    let params = parts.length > 1
      ? Object.fromEntries(new URLSearchParams(parts[1]))
      : {}
    params = Object.keys(params).length > 0
      ? params
      : null
    
    return [str, params]
  } else {
    return [null, null]
  }
}
