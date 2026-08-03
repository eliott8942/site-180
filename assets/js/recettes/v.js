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

    processedElements.push({
      container: element, 
      element: labelElement,
      baseNumber: baseNumber,
    })
  }
  if (invalidElements.length > 0) {
    throw `Internal Error : V system with id ${vId} contains invalid elements : ${invalidElements}`
  }

  return processedElements
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
      const newElementValue = element.baseNumber * newValue / config.baseValue

      if (element.element.innerText != newElementValue) {
        element.element.innerText = newElementValue
  
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
