import { Modal } from '../bootstrap/bootstrap.esm.min.js'
import { createApp } from '../vue/vue.esm-browser.prod.js'
import L from '../leaflet/leaflet-1.9.3.esm.js'

const app = createApp({
  delimiters: ['${', '}'],
  data() {
    return {
      currentType: 'filter',
      loaded: false,
      datasets: [],
      filters: [],
      columns: [],
      shader: null,
      key: null,
      legend: null,
      view: 'map',
      map: null,
      table: null,
      searchText: '',
      browseDatasets: false,
      downloadCsvWithNextTableUpdate: false,
    }
  },
  watch: {
  },
  computed: {
    modal() {
      return new Modal(this.$refs.modal)
    },
    favouriteDatasets() {
      return this.datasets.filter((d) => {
        return ( d.is_favourite === true ) && this.datasetMatchesSearchText(d) && this.datasetIsFilterable(d)
      })
    },
    featuredDatasets() {
      return this.datasets.filter((d) => {
        return ( d.featured === true ) && this.datasetMatchesSearchText(d) && this.datasetIsFilterable(d)
      })
    },
    otherDatasets() {
      return this.datasets.filter((d) => {
        return ( d.is_favourite === false && d.featured === false ) && ( this.browseDatasets == true || this.searchText != '' ) && this.datasetMatchesSearchText(d) && this.datasetIsFilterable(d)
      })
    },
    mapViewActive() {
      return this.view == 'map'
    },
    tableViewActive() {
      return this.view == 'table'
    },
  },
  mounted() {
    this.restoreState()
    this.$refs.filtersContainer.removeAttribute('hidden')
    this.$refs.shaderContainer.removeAttribute('hidden')
    this.$refs.columnContainer.removeAttribute('hidden')
    this.$refs.modal.addEventListener('hidden.bs.modal', (e) => {
      this.searchText = ''
      this.browseDatasets = false
    })

    window.vuethis = this;
  },
  methods: {
    loadDatasets(datasets = []) {
      const url = new URL(window.location.origin + '/explore/datasets.json')
      if (datasets.length > 0) { url.searchParams.set('datasets', datasets) }

      return fetch(url.href)
        .then(response => response.json())
        .then((datasets) => { this.datasets = datasets })
    },
    getDataset(datasetName) {
      // Get the first dataset which has the given datasetName,
      // or contains a "type" (sub-dataset) with the given datasetName.
      const dataset = this.datasets.find(d => {
        if (d.name == datasetName) {
          return true
        } else if (d.types && d.types.find(t => t.name == datasetName)) {
          return true
        }
      })
      if (dataset) { return dataset }
      console.log(`Cannot load dataset: ${datasetName}`)
    },
    selectFilter() {
      this.currentType = 'filter'
      this.modal.show()
      this.loadDatasets().then(() => { this.loaded = true })
    },
    selectShader() {
      this.currentType = 'shader'
      this.modal.show()
      this.loadDatasets().then(() => { this.loaded = true })
    },
    selectColumn() {
      this.currentType = 'column'
      this.modal.show()
      this.loadDatasets().then(() => { this.loaded = true })
    },
    addFilterOrShader(datasetName) {
      switch (this.currentType) {
        case 'filter': this.addFilter(datasetName); break
        case 'shader': this.addShader(datasetName); break
        case 'column': this.addColumn(datasetName); break
      }
      this.modal.hide()
    },
    addFilter(datasetName, current = {}) {
      const dataset = this.getDataset(datasetName)

      dataset.selectedComparator = current.comparator ||
        Object.keys(dataset.comparators)[0]
      dataset.selectedValue = current.value || dataset.defaultValue

      if (!dataset.selectedValue && dataset.options) {
        dataset.selectedValue = dataset.options[0]
      }

      if (!dataset.selectedType && dataset.types) {
        dataset.selectedType = dataset.types[0].name
      }

      this.filters.push(dataset)
    },
    removeFilter(filterName) {
      this.filters = this.filters.filter(f => f.name != filterName)
    },
    addColumn(datasetName) {
      const dataset = this.getDataset(datasetName)

      this.columns.push(dataset)
    },
    removeColumn(columnName) {
      this.columns = this.columns.filter(f => f.name != columnName)
    },
    addShader(datasetName) {
      this.shader = this.getDataset(datasetName)
    },
    removeShader(_shaderName) {
      this.shader = null
      this.key = null
      this.legend = null
    },
    toggleBrowseDatasets() {
      this.browseDatasets = !this.browseDatasets
    },
    state() {
      const state = {}

      this.filters.forEach(function(d) {
        var value = d.selectedValue
        if ( value && Array.isArray(value) ) {
          value = value.join(",")
        }

        if (d.selectedType) {
          state[`${d.selectedType}__${d.selectedComparator}`] = value
        } else {
          state[`${d.name}__${d.selectedComparator}`] = value
        }
      })

      if (this.shader) { state['shader'] = this.shader.name }

      // don’t bother saving view unless it’s been changed from default
      if ( this.view != 'map' ) { state['view'] = this.view }

      if (this.columns.length) {
        var cols = []
        this.columns.forEach(function(d) {
          cols.push(d.name)
        })

        state['columns'] = cols.join(',')
      }

      return state
    },
    url(pathname = window.location.pathname) {
      const url = new URL(window.location.origin + pathname)

      for (const [key, value] of Object.entries(this.state())) {
        url.searchParams.set(key, value)
      }

      return url
    },
    updateState() {
      window.history.replaceState(this.state(), '', this.url())
      this.updateResults()
    },
    restoreState() {
      const params = new URL(window.location).searchParams
      const pending = {}

      for (const [key, v] of params.entries()) {
        if (key == 'view' ) {
          this.view = v;
        } else if (key == 'shader') {
          pending[v] = () => { this.addShader(v) }
        } else if (key == 'columns') {
          pending[v] = () => { for (const col of v.split(',')) { this.addColumn(col) } }
        } else {
          const index = key.indexOf('__')
          const name = key.slice(0, index)
          const comparator = key.slice(index + 2)
          const is_in = key.indexOf('__in')
          var value = v
          if ( is_in > 0 ) {
            value = value.split(',')
          }
          pending[name] = () => { this.addFilter(name, { comparator, value }) }
        }
      }

      const request = this.loadDatasets(Object.keys(pending))
      for (let i in pending) { request.then(pending[i]) }

      request.then(() => { this.updateResults() })
    },
    changeView(newView) {
      this.view = newView
      this.updateState()

      if ( this.view == 'map' ){
        // Sometimes a race condition means the map is initialised while hidden.
        // When this happens, Leaflet is unable to determine which tiles to load,
        // because it doesn’t know what is visible and what isn’t.
        // To fix this, we tell Leaflet to recalculate dimensions, on a slight delay,
        // because the map element should be visible by then.
        var _this = this
        setTimeout(function(){
          _this.map.invalidateSize()
        }, 100)
      }
    },
    updateResults() {
      if (this.view == 'map') {
        this.updateMap()
      } else {
        this.updateTable()
      }
    },
    setUpMap() {
      this.map = L.map(this.$refs.map).setView([54.0934, -2.8948], 7)

      var tiles = L.tileLayer(
        'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d',
        {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      ).addTo(this.map)

      // Fetch and plot all boundary polygons once
      return fetch('/exploregeometry.json')
        .then(response => response.json())
        .then(data => {
          window.geojson = L.geoJson(data, {
            style: (feature) => {
              return {
                fillColor: feature.properties.color,
                fillOpacity: feature.properties.opacity,
                color: 'white',
                weight: 2,
                opacity: 1,
              }
            },
            onEachFeature: (feature, layer) => {
              layer.bindTooltip(feature.properties.name)
              layer.on({
                mouseover: (e) => { e.target.setStyle({ weight: 5 }) },
                mouseout: (e) => { e.target.setStyle({ weight: 2}) },
                click: (e) => {
                  window.location.href = `/area/${feature.properties.type}/${feature.properties.name}`
                },
              })
            }
          }).addTo(this.map)
          this.key = null
          this.legend = null
          if ("properties" in data && data["properties"]) {
            var p = data["properties"]
            if ("legend" in p) {
              this.legend = p["legend"]
            } else {
              this.key = p
            }
          }
        })
    },
    updateMap() {
      if (!this.map) {
        this.setUpMap().then( this.filterMap )
      } else {
        this.filterMap()
      }
    },
    filterMap() {
      fetch(this.url('/explore.json'))
        .then(response => response.json())
        .then(data => {
          var features = {};
          data.features.forEach((feature) => {
            features[feature.properties.PCON13CD] = feature.properties;
          });

          window.geojson.eachLayer(function (layer) {
            if ( features[layer.feature.properties.PCON13CD] ) {
              var props = features[layer.feature.properties.PCON13CD];
              // "show" the feature
              layer.setStyle({
                opacity: 1,
                fillColor: props.color,
                fillOpacity: props.opacity
              })
            } else {
              // "hide" the feature
              layer.setStyle({
                opacity: 0,
                fillOpacity: 0
              })
            }
          })

          this.key = null
          this.legend = null
          if ("properties" in data && data["properties"]) {
            var p = data["properties"]
            if ("legend" in p) {
              this.legend = p["legend"]
            } else {
              this.key = p
            }
          }
        })
    },
    updateTable() {
      fetch(this.url('/explore.csv'))
        .then(response => response.blob())
        .then(data => {
          Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => { this.table = results }
          })

          if ( this.downloadCsvWithNextTableUpdate ) {
            this.downloadCsvWithNextTableUpdate = false
            var a = document.createElement("a")
            a.href = window.URL.createObjectURL(data)
            a.download = "explore.csv"
            a.click()
            window.URL.revokeObjectURL(a.href)
          }
        })
    },
    downloadCSV() {
      this.downloadCsvWithNextTableUpdate = true
      this.updateState()
    },
    datasetMatchesSearchText(dataset) {
      var haystack = dataset.title + ' ' + dataset.source
      var needle = this.searchText
      return haystack.toLowerCase().indexOf(needle.toLowerCase()) > -1
    },
    datasetIsFilterable(dataset) {
      // All datasets are considered "filterable" (ie: selectable from the modal)
      // if we are currently picking a column to add to the table view.
      return ( this.currentType == 'column' ) || dataset.is_filterable
    }
  }
})

export default app
