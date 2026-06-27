class FullscreenControler {
  constructor() {
    this._fullscreenContainer = undefined
    this._isFullscreenAlsoAPI = false
  }

  isInFullscreen() {
    return this._fullscreenContainer != undefined
  }

  _setupDocumentHooks() {
    if (document.fullscreenHooksImplemented) {
      return
    }

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.exitFullscreen()
      }
    })

    document.fullscreenHooksImplemented = true
  }

  enterFullscreen(container) {
    if (this._fullscreenContainer) {
      this.exitFullscreen()
    }

    container.classList.add('maplibregl-fullscreen')

    this._enterFullscreenPseudo(container)
    if (document.fullscreenEnabled) {
      this._setupDocumentHooks()
      
      container.requestFullscreen()
        .then(() => {
          this._isFullscreenAlsoAPI = true
        })
    }
  }

  _enterFullscreenPseudo(container) {
    this._originalParent = container.parentNode
    this._originalNextSibling = container.nextSibling

    document.body.appendChild(container)

    container.style.position = 'fixed'
    container.style.inset = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.zIndex = '9999'

    this._fullscreenContainer = container
  }

  exitFullscreen() {
    if (this._fullscreenContainer == undefined) {
      return
    }

    this._fullscreenContainer.classList.remove('maplibregl-fullscreen')

    if (this._isFullscreenAlsoAPI && document.fullscreenElement) {
      document.exitFullscreen()
    }
    this._exitFullscreenPseudo()
    this._fullscreenContainer = undefined
    this._isFullscreenAlsoAPI = false
  }

  _exitFullscreenPseudo() {
    this._fullscreenContainer.style.position = ''
    this._fullscreenContainer.style.inset = ''
    this._fullscreenContainer.style.width = ''
    this._fullscreenContainer.style.height = ''
    this._fullscreenContainer.style.zIndex = ''
    
    if (this._originalNextSibling) {
      this._originalParent.insertBefore(this._fullscreenContainer, this._originalNextSibling)
    } else {
      this._originalParent.appendChild(this._fullscreenContainer)
    }

    this._originalParent = undefined
    this._originalNextSibling = undefined
  }
}