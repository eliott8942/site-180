function getElementForEachId(...ids) {
  let array = []
  let notFound = false
  for (const id of ids) {
    let element = document.getElementById(id)
    if (element == undefined) {
      console.warn(`Warning : ${id} could not be found. Make sure an element has that id.`)
      notFound = true;

      continue
    }

    array.push(element)
  }
  
  if (notFound) {
    return undefined
  } else {
    return array
  }
}

function mapSeparated(array, separator, elementFactory) {
  let typesNode = []
  for (let index = 0; index < array.length; index++) {
    if (index != 0) {
      typesNode.push(separator)
    }

    typesNode.push(elementFactory(index, array[index]))
  }

  return typesNode
}

function formatLongAddress(address) {
  return `${address.address}, ${address.postal_code} ${address.city}`
}

function hourTupleToMinutes(hourTuple) {
  return hourTuple[0] * 60 + hourTuple[1]
}

const MINUTES_IN_DAY = 1440

function differenceBetweenHoursInMinutes(hourTupleStart, hourTupleEnd) {
  let start = 0
  if (typeof hourTupleStart == "number") {
    start = hourTupleStart
  } else {
    start = hourTupleToMinutes(hourTupleStart)
  }

  let end = 0
  if (typeof hourTupleEnd == "number") {
    end = hourTupleEnd
  } else {
    end = hourTupleToMinutes(hourTupleEnd)
  }

  if (start > end) {
    end += MINUTES_IN_DAY
  }

  return end - start
}

function getDayInTimeOffset(timeOffset) {
  const local = new Date()
  return new Date(local.getTime() + (local.getTimezoneOffset() + hourTupleToMinutes(timeOffset)) * 60000)
}

function assignIds(array, getId = (_, i) => i) {
  return array.map((item, i) => ({ ...item, id: getId(item, i) }));
}
