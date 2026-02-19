const mergeDeep = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return mergeDeep(target, ...sources);
};

const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);   

function el(containerType, content, classList = [], attributes = {}) {
  let element = document.createElement(containerType)
  if (typeof content == "string") {
    element.textContent = content
  } else {
    element.replaceChildren(...content)
  }
  
  mergeDeep(element, attributes)

  element.classList.add(...classList)

  return element
}

function span(content, classList = [], attributes = {}) {
  return el("span", content, classList, attributes)
}

function div(content, classList = [], attributes = {}) {
  return el("div", content, classList, attributes)
}

function a(content, href, classList = []) {
  return el("a", content, classList, { href })
}

function img(src, classList = []) {
  return el("img", [], classList, { src })
}

function label(content, for_, classList = []) {
  return el("label", content, classList, { htmlFor: for_ })
}

function i(classList = []) {
  return el("i", [], classList, {})
}