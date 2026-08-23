class HelpControl {
  constructor() {
    this._elementFactory = Lit.html`
      <div class="toggle maplibregl-ctrl maplibregl-ctrl-help h-6 aspect-square bg-white rounded-full font-bold text-lg">
        <label for="infopanel-toggle-inner">?</label>
      </div>
    `
  }
  
  onAdd(_map) {
    this._element = document.createElement("div")
    Lit.render(this._elementFactory, this._element);
    
    return this._element;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container)

    delete this._element;
    this._element = undefined;
  }
}