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

function processElements(elements) {
  const invalidElements = []
  const processedElements = []
  for (const element of elements) {
    const baseNumberStr = element.getAttribute('v-base-value')
    if (!baseNumberStr) {
      invalidElements.push(element)
      continue
    }
    const baseNumber = parseInt(baseNumberStr)
    if (baseNumber == NaN) {
      invalidElements.push(element)
      continue
    }
    const labelElement = element.querySelector('#label')
    if (!labelElement) {
      invalidElements.push(element)
      continue
    }

    // We use nan to check if step is set
    let step = parseFloat(element.getAttribute('v-step'))
    if (step == 0.0) {
      invalidElements.push(element)
      continue
    }

    // We use nan to check if step is set
    let min = parseFloat(element.getAttribute('v-min'))
    if (min <= 0.0) {
      invalidElements.push(element)
      continue
    }

    const round = element.getAttribute('v-round') || "default"
    let roundingMethod;
    switch (round) {
      case "default":
        roundingMethod = Math.round
        break
      case "floor":
        roundingMethod = Math.floor
        break
      case "ceil":
        roundingMethod = Math.ceil
        break
      default:
        invalidElements.push(element)
        continue
    }

    processedElements.push({
      container: element, 
      element: labelElement,
      baseNumber: baseNumber,
      step,
      min,
      roundingMethod
    })
  }
  if (invalidElements.length > 0) {
    throw `Internal Error : V system with id ${vId} contains invalid elements : ${invalidElements}`
  }

  return processedElements
}

function formatNumberWithUnits(number, min) {
  // round to two digits by default
  let formattedVal = Math.round(number * 10) / 10
  if (!Number.isNaN(min)) {
    formattedVal = Math.max(min, formattedVal)
  }
  
  return formattedVal.toString()
}

function formatNumberWithStep(number, step, min, roundFunction) {
  let round = roundFunction(number / step)
  if (round == 0.0) {
    round = Math.ceil(number / step)
  }
  
  let formattedVal = step * round;
  if (!Number.isNaN(min)) {
    formattedVal = Math.max(min, formattedVal)
  }
  return formattedVal.toString()
}

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  return b === 0 ? (a || 1) : gcd(b, a % b)
}

function registerVSystem(config) {
  const elements = getElementForEachId(...config.elements)
  if (elements == undefined) {
    return;
  }
  const processedElements = processElements(elements)

  const container = document.getElementById(`${config.id}_input`)
  if (!container) {
    console.warn(`vSystem ${config.id}is not linked to an input`)
    return
  }

  const input = container.querySelector('input')
  if (!input) {
    console.warn(`vSystem ${config.id}is not linked to an input`)
    return
  }
  
  const btnIncElement = container.querySelector('#btn-inc')
  const btnDecElement = container.querySelector('#btn-dec')

  let lastValidInput = config.baseValue;
  input.value = config.baseValue;
  
  function handleValue(inputValue) {
    let newValue = parseInt(inputValue)

    if (Number.isNaN(newValue)) {
      return false
    }

    newValue = Math.max(newValue, config.min)
    if (Object.hasOwn(config, "max")) {
      newValue = Math.min(newValue, config.max)
    }
    input.value = newValue
    
    lastValidInput = newValue;
    for (const element of processedElements) {
      let newElementValue = element.baseNumber * newValue / config.baseValue

      let formattedValue;
      // We use nan to check if step is set
      if (!Number.isNaN(element.step)) {
        formattedValue = formatNumberWithStep(newElementValue, element.step, element.min, element.roundingMethod)
      } else {
        formattedValue = formatNumberWithUnits(newElementValue, element.min)
      }
      
      if (element.element.innerText != formattedValue) {
        element.element.innerText = formattedValue
  
        requestAnimationFrame(() => {
          element.container.classList.remove('value-changed')
  
          requestAnimationFrame(() => {
            element.container.classList.add('value-changed')
          })
        })
      }
    }

    return true
  }

  input.addEventListener('input', () => handleValue(input.value))
  input.addEventListener('blur', () => {
    if (!handleValue(container.value)) {
      container.value = lastValidInput
      handleValue(lastValidInput)
    }
  })
  // disable wheeling
  input.addEventListener('wheel', (e) => {
    e.preventDefault();
  }, { passive: false });

  if (btnIncElement) {
    btnIncElement.addEventListener('click', () => {
      handleValue(parseInt(input.value) + 1)
    })
  }
  if (btnDecElement) {
    btnDecElement.addEventListener('click', () => {
      handleValue(parseInt(input.value) - 1)
    })
  }
}

function registerVSystems(vSystems) {
  for (const system of vSystems) {
    registerVSystem(system)
  }
}
