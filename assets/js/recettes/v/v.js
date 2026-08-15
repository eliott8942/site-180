let SORTED_SYSTEMS_ID = null
let V_SYSTEMS = null

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
    const baseNumber = parseFloat(baseNumberStr)
    if (Number.isNaN(baseNumber)) {
      invalidElements.push(element)
      continue
    }
    const labelElement = element.querySelector('.label')
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
    throw `Internal Error : V system contains invalid elements : ${invalidElements}`
  }

  return processedElements
}

function formatNumberWithUnits(number, min) {
  // round to one digit by default
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

function updateElement(element, newRatio) {
  let newElementValue = element.baseNumber * newRatio

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

function registerVSystem(id, system, position, sortedSystemIds, systems) {
  const elements = getElementForEachId(...system.elements || [])
  if (elements == undefined) {
    return;
  }
  const processedElements = processElements(elements)
  
  const container = document.getElementById(`${id}_input`)
  if (!container) {
    console.warn(`vSystem ${id} is not linked to an input`)
    return
  }

  const input = container.querySelector('input')
  if (!input) {
    console.warn(`vSystem ${id} is not linked to an input`)
    return
  }
  
  const btnIncElement = container.querySelector('.btn-inc')
  const btnDecElement = container.querySelector('.btn-dec')

  let lastValidInput = system.baseValue;
  input.value = system.baseValue;
  system.value = system.baseValue;
  system.input = input;
  system.elements = processedElements;
  
  function updateValue(inputValue) {
    let newValue = parseInt(inputValue)

    if (Number.isNaN(newValue)) {
      return false
    }

    newValue = Math.max(newValue, system.min)
    if (Object.hasOwn(system, "max")) {
      newValue = Math.min(newValue, system.max)
    }
    input.value = newValue
    
    lastValidInput = newValue;
    system.value = newValue;

    for (const element of processedElements) {
      updateElement(element, newValue / system.baseValue)
    }

    // Note : Normally we would only try to update the dependents of that value,
    // but i don't know how to do that efficiently while maintining update order.
    // 
    // So i'm trying to update all the values that changed sequentially, in the
    // topologically sorted array. It's maybe underoptimized, but it should work.
    for (let i = position + 1; i < sortedSystemIds.length; i += 1) {
      const system = systems[sortedSystemIds[i]];
      if (!system.dependencies) {
        continue
      }

      const dependencyVariables = {};
      for (const id of system.dependencies) {
        dependencyVariables[id] = systems[id].value
      }
      const newValue = system.expression.evaluate(dependencyVariables);

      if (system.value != newValue) {
        system.value = newValue;

        for (const element of system.elements) {
          updateElement(element, system.value / system.baseValue)
        }
      }
    }

    return true
  }

  input.addEventListener('input', () => updateValue(input.value))
  input.addEventListener('blur', () => {
    if (!updateValue(input.value)) {
      input.value = lastValidInput
      updateValue(lastValidInput)
    }
  })
  // disable wheeling
  input.addEventListener('wheel', (e) => {
    e.preventDefault();
  }, { passive: false });

  if (btnIncElement) {
    btnIncElement.addEventListener('click', () => {
      updateValue(parseInt(input.value) + 1)
    })
  }
  if (btnDecElement) {
    btnDecElement.addEventListener('click', () => {
      updateValue(parseInt(input.value) - 1)
    })
  }
}

function validateExpression(systemId, system, expressionStr, parser) {
  let expression;
  try {
    expression = parser.parse(expressionStr)
  } catch (e) {
    console.error(`v system ${systemId} has an invalid expression '${system.expression}' : ${e}`)
    return null;
  }

  const expressionVariables = new Set(expression.variables())
  const dependencySet = new Set(system.expressionVariables)

  // Note : technically Set.isSubsetOf exists, but for the moment it's far too new
  if (!isSubsetOf(expressionVariables, dependencySet)) {
    const unknownVariables = expression.variables().filter(x => !dependencySet.has(x))

    console.error(`v system ${systemId} has unknown variables '${unknownVariables}'`)
    return null;
  }

  return expression
}

function registerVSystems(vSystems) {
  if (SORTED_SYSTEMS_ID) {
    throw 'V systems were already registered'
  }
  
  const sortedVSystems = topologicalSort(vSystems, (system) => system.dependents || [])
  SORTED_SYSTEMS_ID = sortedVSystems;
  V_SYSTEMS = vSystems;

  const parser = new exprEval.Parser()
  
  for (let i = 0; i < sortedVSystems.length; i += 1) {
    const systemId = sortedVSystems[i];
    const system = vSystems[sortedVSystems[i]];

    if (system.expressionVariables) {
      const expression = validateExpression(systemId, system, system.expression, parser)
      if (expression === null) {
        continue;
      }
      system.expression = expression;
      
      const elements = getElementForEachId(...system.elements || [])
      if (elements == undefined) {
        continue;
      }
      const processedElements = processElements(elements)
      system.elements = processedElements;

      const dependencyVariables = {};
      for (const id of system.dependencies) {
        dependencyVariables[id] = vSystems[id].value
      }
      system.value = system.expression.evaluate(dependencyVariables);
      system.baseValue = system.value;

      for (const element of processedElements) {
        updateElement(element, system.value / system.baseValue)
      }
    } else {
      registerVSystem(systemId, system, i, sortedVSystems, vSystems)
    }
  }
}

function resetVSystems(btn) {
  requestAnimationFrame(() => {
    btn.classList.remove('reset-animation')

    requestAnimationFrame(() => {
      btn.classList.add('reset-animation')
    })
  })
  
  for (let i = 0; i < SORTED_SYSTEMS_ID.length; i += 1) {
    const system = V_SYSTEMS[SORTED_SYSTEMS_ID[i]];

    // reset leafs
    if (!system.dependencies) {
      if (system.value != system.baseValue) {
        system.value = system.baseValue;
        system.input.value = system.baseValue;
        
        for (const element of system.elements) {
          updateElement(element, system.value / system.baseValue)
        }
      }
    } else {
      const dependencyVariables = {};
      for (const id of system.dependencies) {
        dependencyVariables[id] = V_SYSTEMS[id].value
      }
      const newValue = system.expression.evaluate(dependencyVariables);
  
      if (system.value != newValue) {
        system.value = newValue;
        
        for (const element of system.elements) {
          updateElement(element, system.value / system.baseValue)
        }
      }
    }
  }
}
