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
    addFilter(datasetName) {
      const dataset = this.getDataset(datasetName)

      dataset.selectedComparator = Object.keys(dataset.comparators)[0]
      dataset.selectedValue = dataset.defaultValue || dataset.options[0]

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
  }
})

export default app
