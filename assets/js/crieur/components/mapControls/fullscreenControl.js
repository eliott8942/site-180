class FullscreenControl {
  constructor(params) {
    this._params = params
    this._fullscreenHandler = new FullscreenControler() 
  }

  _elementFactory() {
    return Lit.html`
      <div class="maplibregl-ctrl maplibregl-ctrl-group">
        <button type="button" class="${this._fullscreenHandler.isInFullscreen() ? "maplibregl-ctrl-shrink" : "maplibregl-ctrl-fullscreen"}" type="button" @click=${() => this._onFullscreenClick()} aria-label="Fullscreen">
          <span class="maplibregl-ctrl-icon"></span>
        </button>
      </div>
    `
  }

  _onFullscreenClick() {
    if (this._fullscreenHandler.isInFullscreen()) {
      this._fullscreenHandler.exitFullscreen()
    } else {
      this._fullscreenHandler.enterFullscreen(this._params.container)
    }

    this._fullscreen = !this._fullscreen
    Lit.render(this._elementFactory(), this._element);
  }

  onAdd(_map) {
    this._element = document.createElement("div")
    Lit.render(this._elementFactory(), this._element);

    return this._element
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container)
    
    delete this._element;
    this._element = undefined;
  }
}