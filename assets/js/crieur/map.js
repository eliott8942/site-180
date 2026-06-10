const INITIAL_ZOOM = 12

let MAP = null;

function clamp(max, min, a) {
  return Math.max(Math.min(a, max), min)
}

function initMap(config, placeData, decoData, style) {
  if (typeof maplibregl == 'undefined') {
    console.warn("Warning : maplibregl is not defined.")
    return
  }

  // TODO : consider using sources instead of placing markers individually
  console.log("initializing Map...")

  MAP = new maplibregl.Map({
    style: style,
    center: [6.5938508507480265, 46.52364708705065],
    zoom: INITIAL_ZOOM,
    container: 'map',

    // disable 3D view and rotate
    touchPitch: false,
    dragRotate: false,

    // limite view
    minZoom: 11,
    maxBounds: [
      [6.400746, 46.450811],
      [6.793507, 46.602508],
    ],

    // disable attribution control, we readd it ourselves
    attributionControl: false
  })

  MAP.addControl(new maplibregl.ScaleControl({
    maxWidth: 80,
    unit: 'metric'
  }))

  MAP.addControl(new maplibregl.NavigationControl({
    showCompass: false
  }), 'top-right')

  MAP.addControl(new maplibregl.AttributionControl(), 'bottom-right')
  MAP.addControl(new HelpControl(), 'bottom-right')

  MAP.on('load', () => {
    // place deco
    let decoMarkers = []
    for (let index = 0; index < decoData.length; index++) {
      const deco = decoData[index];
      // console.log(deco);

      const element = div([
        div([deco.title], [], {
          className: 'crieur-deco',
          style: {
            color: `${deco.color}`
          }
        })
      ])

      let marker = new maplibregl.Marker({ element })
        .setLngLat([deco.location.longitude, deco.location.latitude])
        .addTo(MAP)

      decoMarkers.push(marker)
    }
    MAP.on('zoom', (e) => {
      let zoom = e.target.getZoom()
      let scaleFactor = Math.pow(2, (zoom - INITIAL_ZOOM))

      let opacity = clamp(1, 0, 1 - (zoom - 12) / (15 - 12))

      decoMarkers.forEach(deco => {
        deco.getElement().children[0].style.transform = `scale(${scaleFactor})`
        deco.getElement().children[0].style.opacity = opacity
      })
    })

    initPlaceMarkers(placeData)
  })

  console.log("Done.")
}

function initPlaceMarkers(placeData) {
  // convert the data to geosource. this is needed for clustering
  MAP.addSource('places', {
    type: 'geojson',
    data: convertToGeoJSON(placeData),
    cluster: true,
    clusterRadius: 40
  })
  // add a layer that force the source to be loaded, otherwise it will not
  MAP.addLayer({
    id: 'places',
    source: 'places',
    type: 'symbol',

    // we can't use visibility none, because otherwise the source is not loaded...
    layout: {
      'icon-size': 0
    }
  })

  // precompute all the markers element since those will not change
  const placeElementCache = placeData.map((place, index) => {
    const element = div([
      div([], [], {
        className: 'crieur-place',
        style: {
          backgroundImage: `url(${place.thumbnail})`
        }
      })
    ])

    element.onclick = () => showPlace(index, 'fromPlace')

    return element
  })

  // I'm fairly sure my way of handling the promises below is wrong and has a bug somewhere, but for now the code
  // seems to be working fine enough.

  let clusterCache = {}
  let placeOnScreen = {}
  let clustersOnScreen = {}
  function updateMarkers() {
    let newPlaceOnScreen = {}
    let newClustersOnScreen = {}
    const features = MAP.querySourceFeatures('places')
    const source = MAP.getSource('places')

    for (let index = 0; index < features.length; index++) {
      const place = features[index];
      
      const coords = place.geometry.coordinates
      const props = place.properties

      if (props.cluster != undefined) {
        const id = props.cluster_id
        if (clustersOnScreen[id] == undefined) {
          if (clusterCache[id] == undefined) {
            clusterCache[id] = Promise.all([source.getClusterLeaves(id, 1, 0), source.getClusterExpansionZoom(id)])
              .then(tuple => {
                let [list, zoom] = tuple
                let [place] = list
                const element = div([
                  div([
                    div([ `+${props.point_count - 1}` ], ['text'])
                  ], [], {
                    className: 'crieur-place',
                    style: {
                      width: `${ 40 + props.point_count * 2 }px`,
                      backgroundImage: `url(${place.properties.thumbnail})`,
                    }
                  })
                ])

                element.onclick = () => {
                  const z = Math.min(MAP.getZoom(), zoom + 1)
                  
                  MAP.flyTo({ center: coords, zoom: z })
                }

                return element
              })
          }

          // create a mock element while the marker is generated
          const element = document.createElement("div")
          
          let marker = new maplibregl.Marker({ element })
            .setLngLat(coords)
            .addTo(MAP)

          // keep a reference to the promise
          marker.updaterPromise = clusterCache[id].then(element => {
            marker.getElement().replaceChildren(element)
          })

          newClustersOnScreen[id] = marker;
        } else {
          newClustersOnScreen[id] = clustersOnScreen[id]
        }
      } else {
        if (placeOnScreen[props.id] == undefined) {
          let placeElement = placeElementCache[props.id]

          let marker = new maplibregl.Marker({ element: placeElement })
            .setLngLat(coords)
            .addTo(MAP)
          newPlaceOnScreen[props.id] = marker
        } else {
          newPlaceOnScreen[props.id] = placeOnScreen[props.id]
        }
      }
    }

    for (placeId in placeOnScreen) {
      if (newPlaceOnScreen[placeId] == undefined) {
        placeOnScreen[placeId].remove()
      }
    }
    for (clusterId in clustersOnScreen) {
      if (newClustersOnScreen[clusterId] == undefined) {
        clustersOnScreen[clusterId].remove()
      }
    }

    placeOnScreen = newPlaceOnScreen
    clustersOnScreen = newClustersOnScreen
  }

  // Setup hooks once the geojson data is loaded
  MAP.on('data', (e) => {
    // ignore other data events
    if (e.sourceId != 'places' || !e.isSourceLoaded) {
      return
    }

    MAP.on('move', updateMarkers)
    MAP.on('zoom', updateMarkers)
    MAP.on('zoomend', updateMarkers)
    MAP.on('moveend', updateMarkers)
    updateMarkers()
  })
}

function convertToGeoJSON(placeData) {
  return {
    type: "FeatureCollection",
    features: placeData.map((place, index) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [place.location.longitude, place.location.latitude]
      },
      properties: {
        // Add any other properties you want to include
        id: index,
        thumbnail: place.thumbnail,
      }
    }))
  };
}

class HelpControl {
  onAdd(map) {
    this._map = map
    this._element = div([
      label(["?"], "infopanel-toggle-inner")
    ], ["toggle", "maplibregl-ctrl", "maplibregl-ctrl-help", "h-6", "aspect-square", "bg-white", "rounded-full", "font-bold", "text-lg"])

    return this._element;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container)
    this._map = undefined
  }
}

function selectPlaceOnMap(placeData, id, mode) {
  if (MAP == undefined) {
    console.warn("Warning : map has not been loaded.")
  } else {
    switch (mode) {
      case 'fromCard':
        MAP.flyTo({
          center: [placeData.location.longitude, placeData.location.latitude],
          zoom: 17,
        })
        
        break;

      case 'fromPlace':
        MAP.flyTo({
          center: [placeData.location.longitude, placeData.location.latitude],
        })

        break;
    
      default:
        console.warn(`Warning : unknown mode ${mode}`)

        break;
    }
  }
}