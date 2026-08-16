let SORTED_SYSTEMS_IDS = null
let V_SYSTEMS = null
let V_INPUTS = null

function updateURL() {
  const params = Object.fromEntries(Object.entries(V_INPUTS)
    .filter(([_, value]) => value.value !== value.baseValue)
    .map(([key, value]) => [key, value.value])
  )

  setURLFile("", params)
}

function getInitialValuesFromURL() {
  let [_, params] = [null, null]
  try {
    [_, params] = getURLFile()
  } catch (e) { }

  return params
}

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
    // We use nan to check later if the base value is set
    const baseValue = parseFloat(element.getAttribute('v-base-value'))
    if (baseValue == 0.0) {
      invalidElements.push(element)
      continue
    }
    
    const labelElement = element.querySelector('.label')
    if (!labelElement) {
      invalidElements.push(element)
      continue
    }

    // We use nan to check later if step is set
    let step = parseFloat(element.getAttribute('v-step'))
    if (step == 0.0) {
      invalidElements.push(element)
      continue
    }

    // We use nan to check later if min is set
    let min = parseFloat(element.getAttribute('v-min'))
    if (min <= 0.0) {
      invalidElements.push(element)
      continue
    }

    let div = parseInt(element.getAttribute('v-div'))
    if (div <= 0.0) {
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
      baseValue,
      step,
      min,
      div,
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

function formatNumberWithDiv(number, div, min, roundFunction) {
  console.log(number, div, min)
  
  let round = roundFunction(number)
  
  if (!Number.isNaN(min)) {
    round = Math.max(min, round)
  }

  const fullPart = Math.floor(round / div)
  const fracPart = round - fullPart * div

  let formatted = ""
  if (fullPart) {
    formatted += fullPart.toString()
  }

  if (fracPart) {
    if (formatted.length > 0) {
      formatted += " & "
    }

    const d = gcd(fracPart, div)

    formatted += fracPart / d + '/' + div / d
  }
  
  return formatted
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

function updateElement(element, newRatio, newRawValue) {
  let newElementValue = !Number.isNaN(element.baseValue) ? element.baseValue * newRatio : newRawValue;

  let formattedValue;
  if (!Number.isNaN(element.div)) {
    formattedValue = formatNumberWithDiv(newElementValue, element.div, element.min, element.roundingMethod)
  } else if (!Number.isNaN(element.step)) {
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

function updateVInputComponent(components, value, min, max) {
  components.input.value = value;

  components.btnDec.disabled = value <= min;
  components.btnInc.disabled = (max !== undefined) ? value >= max : false
}

function registerVInput(id, system, position, sortedSystemIds, systems, initialValue) {
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

  const components = {
    input,
    btnInc: btnIncElement,
    btnDec: btnDecElement
  }

  system.value = initialValue || system.baseValue;
  system.components = components;
  system.elements = processedElements;

  updateVInputComponent(components, system.value, system.min, system.max)

  // Note : we don't update the dependencies of those values here,
  // as they are updated by the initialization function
  if (system.value !== system.baseValue) {
    for (const element of processedElements) {
      updateElement(element, system.value / system.baseValue)
    }
  }
  
  function updateValue(inputValue) {
    let newValue = parseInt(inputValue)

    if (Number.isNaN(newValue)) {
      return false
    }

    if (Object.hasOwn(system, "min")) {
      newValue = Math.max(newValue, system.min)
    }
    if (Object.hasOwn(system, "max")) {
      newValue = Math.min(newValue, system.max)
    }
    updateVInputComponent(system.components, newValue, system.min, system.max)
    
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
          updateElement(element, system.value / system.baseValue, system.value)
        }
      }
    }

    updateURL()

    return true
  }

  input.addEventListener('input', () => updateValue(input.value))
  input.addEventListener('blur', () => {
    if (!updateValue(input.value)) {
      input.value = system.value
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

function initVSystems(vSystems) {
  console.log(vSystems)
  
  if (SORTED_SYSTEMS_IDS) {
    throw 'V systems were already registered'
  }
  
  const sortedVSystems = topologicalSort(vSystems, (system) => system.dependents || [])
  SORTED_SYSTEMS_IDS = sortedVSystems;
  V_SYSTEMS = vSystems;
  V_INPUTS = Object.fromEntries(Object.entries(V_SYSTEMS).filter(([_, value]) => !value.dependencies))

  const initialInputValues = getInitialValuesFromURL()
  
  const parser = new exprEval.Parser()
  
  for (let i = 0; i < sortedVSystems.length; i += 1) {
    const systemId = sortedVSystems[i];
    const system = vSystems[sortedVSystems[i]];

    if (system.dependencies) {
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
      const dependencyVariablesForBaseValue = {};
      for (let i = 0; i < system.dependencies.length; i += 1) {
        dependencyVariables[system.expressionVariables[i]] = vSystems[system.dependencies[i]].value          
        dependencyVariablesForBaseValue[system.expressionVariables[i]] = vSystems[system.dependencies[i]].baseValue  
      }
      system.value = system.expression.evaluate(dependencyVariables);
      system.baseValue = system.expression.evaluate(dependencyVariablesForBaseValue);

      for (const element of processedElements) {
        updateElement(element, system.value / system.baseValue, system.value)
      }
    } else {
      registerVInput(systemId, system, i, sortedVSystems, vSystems, initialInputValues?.[systemId])
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
  
  for (let i = 0; i < SORTED_SYSTEMS_IDS.length; i += 1) {
    const system = V_SYSTEMS[SORTED_SYSTEMS_IDS[i]];

    // reset leafs
    if (!system.dependencies) {
      if (system.value != system.baseValue) {
        system.value = system.baseValue;
        updateVInputComponent(system.components, system.baseValue, system.min, system.max);
        
        for (const element of system.elements) {
          updateElement(element, system.value / system.baseValue, system.value)
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
          updateElement(element, system.value / system.baseValue, system.value)
        }
      }
    }
  }

  updateURL()
}
