import { Modal } from '../bootstrap/bootstrap.esm.min.js'
import { createApp } from '../vue/vue.esm-browser.prod.js'

const app = createApp({
  delimiters: ['${', '}'],
  data() {
    return {
      currentType: 'filter',
      loaded: false,
      datasets: [],
      filters: [],
      shader: null,
    }
  },
  computed: {
    modal() { return new Modal(this.$refs.modal) },
    publicDatasets() { return this.datasets.filter(d => d.scope === 'public') },
    memberDatasets() { return this.datasets.filter(d => d.scope === 'member') },
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
      this.updateMap()
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

      setTimeout(() => { this.updateMap() }, 1000)
    },
    updateMap() {
      fetch(this.url('/explore.json'))
        .then(response => response.json())
        .then(areas => {

          window.geojson.eachLayer((layer) => {
            const visible = areas.names.includes(layer.feature.properties.name)
            layer.setStyle({
              fillColor: '#ed6832',
              weight: 2,
              opacity: (visible ? 1 : 0),
              color: 'white',
              fillOpacity: (visible ? 0.7 : 0)
            })
          })
        })
    }
  }
})

export default app
