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

  let clusterCache = {}
  let placeOnScreen = {}
  let clustersOnScreen = {}
  
  function updateMarkers() {
    let newPlaceOnScreen = {}
    let newClustersOnScreen = {}
    const features = MAP.querySourceFeatures('places')
    const source = MAP.getSource('places')
  
    for (let index = 0; index < features.length; index++) {
      const place = features[index]
      const coords = place.geometry.coordinates
      const props = place.properties

      // draw new clusters / places
      if (props.cluster != undefined) {
        const id = props.cluster_id
  
        if (clustersOnScreen[id] != undefined) {
          // already on screen, keep it
          newClustersOnScreen[id] = clustersOnScreen[id]
          continue
        }
        if (newClustersOnScreen[id] != undefined) {
          // duplicate feature for the same cluster (tile boundary), skip
          continue
        }
  
        const element = document.createElement("div")
        const marker = new maplibregl.Marker({ element })
          .setLngLat(coords)
          .addTo(MAP)
  
        marker._valid = true
        newClustersOnScreen[id] = marker
  
        if (clusterCache[id] == undefined) {
          clusterCache[id] = Promise.all([
            source.getClusterLeaves(id, 1, 0),
            source.getClusterExpansionZoom(id)
          ])
        }
  
        clusterCache[id]
          .then(([list, zoom]) => {
            // bail out if this marker was removed before the promise resolved
            if (!marker._valid) return
  
            const [leaf] = list
            const content = div([
              div([div([`+${props.point_count - 1}`], ['text'])], [], {
                className: 'crieur-place',
                style: {
                  width: `${40 + props.point_count * 2}px`,
                  height: `${40 + props.point_count * 2}px`,
                  backgroundImage: `url(${leaf.properties.thumbnail})`,
                }
              })
            ])
  
            content.onclick = () => {
              // the zoom offset we add should avoid us zooming to a number exactly where one cluster is about to split into smaller ones, otherwise there is a possibility of seeing both a cluster and it's children
              // For now, the +0.5 seems to do the trick
              const z = Math.max(MAP.getZoom(), zoom + 0.5)
              MAP.flyTo({ center: coords, zoom: z })
            }
  
            marker.getElement().replaceChildren(content)
          })
          .catch(err => {
            console.error('cluster leaf fetch failed', id, err)
          })
  
      } else {
        if (placeOnScreen[props.id] == undefined) {
          const placeElement = placeElementCache[props.id]
          const marker = new maplibregl.Marker({ element: placeElement })
            .setLngLat(coords)
            .addTo(MAP)
          newPlaceOnScreen[props.id] = marker
        } else {
          newPlaceOnScreen[props.id] = placeOnScreen[props.id]
        }
      }
    }

    // remove clusters / places that aren't on screen any more
    for (const clusterId in clustersOnScreen) {
      if (newClustersOnScreen[clusterId] == undefined) {
        const marker = clustersOnScreen[clusterId]
        marker._valid = false   // tell any pending promise to ignore this marker
        marker.remove()
        delete clusterCache[clusterId] // don't let stale content come back later
      }
    }
    for (const placeId in placeOnScreen) {
      if (newPlaceOnScreen[placeId] == undefined) {
        placeOnScreen[placeId].remove()
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