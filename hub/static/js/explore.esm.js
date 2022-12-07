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
      shader: null,
      csvURL: '',
      view: 'map',
      map: null,
      table: null,
    }
  },
  watch: {
    filters: {
      handler(newValue, oldValue) { this.updateState() },
      deep: true,
    },
    shader: {
      handler(newValue, oldValue) { this.updateState() },
    },
  },
  computed: {
    modal() { return new Modal(this.$refs.modal) },
    favouriteDatasets() { return this.datasets.filter((d) => {
      return d.is_favourite === true
    }) },
    featuredDatasets() { return this.datasets.filter((d) => {
      return d.featured === true
    }) },
    otherDatasets() { return this.datasets.filter((d) => {
      return d.is_favourite === false && d.featured === false
    }) },
  },
  mounted() {
    this.restoreState()
    this.$refs.filtersContainer.removeAttribute('hidden')
    this.$refs.shaderContainer.removeAttribute('hidden')
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
      const dataset = this.datasets.find(d => d.name == datasetName)
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
    addFilterOrShader(datasetName) {
      switch (this.currentType) {
        case 'filter': this.addFilter(datasetName); break
        case 'shader': this.addShader(datasetName); break
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

      this.filters.push(dataset)
    },
    removeFilter(filterName) {
      this.filters = this.filters.filter(f => f.name != filterName)
    },
    addShader(datasetName) {
      this.shader = this.getDataset(datasetName)
    },
    removeShader(_shaderName) {
      this.shader = null
    },
    state() {
      const state = {}

      this.filters.forEach(function(d) {
        state[`${d.name}__${d.selectedComparator}`] = d.selectedValue
      })

      if (this.shader) { state['shader'] = this.shader.name }

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
      this.csvURL = this.url('/explore.csv')
      this.updateResults()
    },
    restoreState() {
      const params = new URL(window.location).searchParams
      const pending = {}

      for (const [key, value] of params.entries()) {
        if (key == 'shader') {
          pending[value] = () => { this.addShader(value) }
        } else {
          const index = key.indexOf('__')
          const name = key.slice(0, index)
          const comparator = key.slice(index + 2)
          pending[name] = () => { this.addFilter(name, { comparator, value }) }
        }
      }

      const request = this.loadDatasets(Object.keys(pending))
      for (let i in pending) { request.then(pending[i]) }

      request.then(() => { this.updateResults() })
    },
    changeView(newView) {
      this.view = newView

      if (this.view == 'map') {
        this.$refs.table.setAttribute('hidden', true)
        this.$refs.map.removeAttribute('hidden')
      }
      else {
        this.$refs.map.setAttribute('hidden', true)
        this.$refs.table.removeAttribute('hidden')
      }

      this.updateResults()
    },
    updateResults() {
      if (this.view == 'map') { this.updateMap() }
      else { this.updateTable() }
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
    },
    updateMap() {
      if (!this.map) { this.setUpMap() }

      fetch(this.url('/explore.json'))
        .then(response => response.json())
        .then(data => {
          if (window.geojson) {
            window.geojson.eachLayer((layer) => { this.map.removeLayer(layer) })
          }

          window.geojson = L.geoJson(data, {
            style: (feature) => {
              return {
                fillColor: feature.properties.color, fillOpacity: feature.properties.opacity,
                color: 'white', weight: 2, opacity: 1,
              }
            },
            onEachFeature: (feature, layer) => {
              layer.bindTooltip(feature.properties.name)
              layer.on({
                mouseover: (e) => { e.target.setStyle({ weight: 5 }) },
                mouseout: (e) => { window.geojson.resetStyle(e.target) },
                click: (e) => {
                  window.location.href = `/area/${feature.properties.type}/${feature.properties.name}`
                },
              })
            }
          }).addTo(this.map)
        })
    },
    updateTable() {
      fetch(this.url('/explore.csv'))
        .then(response => response.blob())
        .then(data => {
          console.log(data)
          Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => { this.table = results }
          })
        })
    }
  }
})

export default app
