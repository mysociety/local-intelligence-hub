import { Modal } from '../bootstrap/bootstrap.esm.min.js'
import { createApp } from '../vue/vue.esm-browser.prod.js'
import L from '../leaflet/leaflet-1.9.3.esm.js'
import trackEvent from './analytics.esm.js'

const app = createApp({
  delimiters: ['${', '}'],
  data() {
    return {
      view: 'map', // which page view is active (map or table)
      datasets: [], // datasets from datasets.json
      datasetsLoaded: false, // whether we are fetching datasets for display in the filter modal
      map: null, // the Leaflet Map instance
      table: null, // rows of data to be rendered as a table
      loading: true, // whether map/table data is currently loading (default to true on pageload, even though that's technically a lie, because we know the first thing we'll do is start loading)

      filters: [], // filters to be applied on next Update
      shader: null, // shader to applied on next Update
      columns: [], // additional columns to be requested on next Update
      area_type: "WMC", // the area type to fetch
      area_type_changed: false, // so we know to reload the map
      area_types: [{
        slug: "WMC",
        label: "2010–2024 constituencies"
      }, {
        slug: "WMC23",
        label: "2025 constituencies"
      }],

      filters_applied: false, // were filters applied on the last Update?
      area_count: 0, // number of areas returned on last Update

      key: null, // info to be displayed in the "key" for the currenly selected shader
      legend: null, // info to be displayed in the "legend" for the currenly selected shader

      currentType: 'filter', // what to add from the Add Dataset modal (filter, shader, or column)
      searchText: '', // filter datasets by name in the Add Dataset modal
      browseDatasets: false, // show the full list of datasets in the Add Dataset modal?
      sortBy: 'Constituency Name', // column to use to sort the table
      sortOrder: 1, // sort order direction - 1 for ascending, 0 for descending
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
        return ( d.is_favourite === true ) && this.datasetMatchesSearchText(d) && this.datasetIsSelectable(d)
      })
    },
    featuredDatasets() {
      return this.datasets.filter((d) => {
        return ( d.featured === true ) && this.datasetMatchesSearchText(d) && this.datasetIsSelectable(d)
      })
    },
    availableOtherDatasets() {
      return this.datasets.filter((d) => {
        return ( d.is_favourite === false && d.featured === false ) && this.datasetIsSelectable(d)
      })
    },
    otherDatasets() {
      return this.datasets.filter((d) => {
        return ( d.is_favourite === false && d.featured === false ) && ( this.browseDatasets == true || this.searchText != '' ) && this.datasetMatchesSearchText(d) && this.datasetIsSelectable(d)
      })
    },
    mapViewActive() {
      return this.view == 'map'
    },
    tableViewActive() {
      return this.view == 'table'
    },

    sortedTable() {
      var sortType = this.getSortType()
      return [...this.table.data]
        .sort((a,b) => {
          var a_c = a[this.sortBy]
          var b_c = b[this.sortBy]

          // we need to convert numbers into number objects in order for the sorting to work
          if (sortType == "numeric") {
            a_c = Number(a_c)
            b_c = Number(b_c)
          }

          if (a_c >= b_c) {
            return this.sortOrder
          }
          return -this.sortOrder
        })
    }
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

      var area_type = this.area_type

      return fetch(url.href)
        .then(response => response.json())
        .then((datasets) => {
          datasets.forEach(function(d) {
            if ("stats" in d && area_type in d["stats"]) {
              d["defaultValue"] = d["stats"][area_type]["defaultValue"]
              d["stats"] = d["stats"][area_type]
            }
          })
          this.datasets = datasets
        })
    },
    getSortType() {
      var filterType = "text"
      var all_cols = this.filters.concat(this.columns)
      var ds = all_cols.filter(f => f.title == this.sortBy)
      if (ds.length > 0) {
        filterType = ds[0].data_type
      }

      if (["percent", "float", "integer"].includes(filterType)) {
        return "numeric"
      }
      return "natural"
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
      this.loadDatasets().then(() => { this.datasetsLoaded = true })
      trackEvent('explore_add_filter_click')
    },
    selectShader() {
      this.currentType = 'shader'
      this.modal.show()
      this.loadDatasets().then(() => { this.datasetsLoaded = true })
      trackEvent('explore_add_shader_click')
    },
    selectColumn() {
      this.currentType = 'column'
      this.modal.show()
      this.loadDatasets().then(() => { this.datasetsLoaded = true })
      trackEvent('explore_add_column_click')
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

      trackEvent('explore_filter_added', {
        'dataset': datasetName
      });
    },
    removeFilter(filterName) {
      this.filters = this.filters.filter(f => f.name != filterName)
    },
    addColumn(datasetName) {
      const dataset = this.getDataset(datasetName)

      if (!dataset.selectedType && dataset.types) {
        dataset.selectedType = dataset.types[0].name
      }

      this.columns.push(dataset)

      trackEvent('explore_column_added', {
        'dataset': datasetName
      });
    },
    removeColumn(columnName) {
      this.columns = this.columns.filter(f => f.name != columnName)
    },
    addShader(datasetName) {
      this.shader = this.getDataset(datasetName)

      if (!this.shader.selectedType && this.shader.types) {
        this.shader.selectedType = this.shader.types[0].name
      }

      trackEvent('explore_shader_added', {
        'dataset': datasetName
      });
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

      if (this.shader) {
        if (this.shader.selectedType) {
          state['shader'] = this.shader.selectedType
        } else {
          state['shader'] = this.shader.name
        }
      }

      // don’t bother saving view unless it’s been changed from default
      if ( this.view != 'map' ) { state['view'] = this.view }

      if ( this.area_type != 'WMC' ) { state['area_type'] = this.area_type }

      if (this.columns.length) {
        var cols = []
        this.columns.forEach(function(d) {
          if (d.selectedType) {
            cols.push(d.selectedType)
          } else {
            cols.push(d.name)
          }
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
    filtersValid() {
      return this.filters.every(function(filter){
        return filter.selectedValue !== "";
      });
    },
    geomUrl() {
      const url = new URL(window.location.origin + '/exploregeometry.json')

      if ('area_type' in this.state()) {
        url.searchParams.set('area_type', this.state()['area_type'])
      }

      return url
    },
    updateState() {
      if (this.filtersValid()) {
        window.history.replaceState(this.state(), '', this.url())
        this.updateResults()
      }
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
        } else if (key == 'area_type') {
          pending[v] = () => { this.area_type = v }
        } else {
          const index = key.indexOf('__')
          const name = key.slice(0, index)
          const comparator = key.slice(index + 2)
          const is_in = key.indexOf('__in')
          const value = v
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
    changeAreaType() {
      this.area_type_changed = true
    },
    getAreaTypeLabel(slug) {
      return this.area_types.find((t) => {
        return t["slug"] == slug
      })["label"]
    },
    updateResults() {
      if (this.view == 'map') {
        this.updateMap()
      } else {
        this.updateTable()
      }

      trackEvent('explore_update_view', {
        'view': this.view
      });
    },
    setUpMap() {
      this.loading = true
      this.map = L.map(this.$refs.map).setView([54.0934, -2.8948], 7)

      var tiles = L.tileLayer(
        'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d',
        {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      ).addTo(this.map)

      return this.setUpMapAreas()
    },
    removeMapAreas() {
      this.map.removeLayer(window.geojson)
      return this.setUpMapAreas()
    },
    setUpMapAreas() {
      // Fetch and plot all boundary polygons once
      return fetch(this.geomUrl())
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
              layer.name = feature.properties.name
              layer.bindTooltip(feature.properties.name)
              layer.on({
                mouseover: (e) => { e.target.setStyle({ weight: 5 }) },
                mouseout: (e) => { e.target.setStyle({ weight: 2}) },
                click: (e) => {
                  trackEvent('explore_area_click', {
                    'area_type': feature.properties.type,
                    'area_name': feature.properties.name
                  }).always(function(e){
                    window.location.href = `/area/${feature.properties.type}/${feature.properties.name}`
                  });
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

          this.loading = false
          this.area_type_changed = false
        })
    },
    updateMap() {
      if (!this.map) {
        this.setUpMap().then( this.filterMap )
      } else if ( this.area_type_changed) {
        this.removeMapAreas().then( this.filterMap )
      } else {
        this.filterMap()
      }
    },
    filterMap() {
      this.loading = true
      this.filters_applied = (this.filters.length > 0)

      fetch(this.url('/explore.json'))
        .then(response => response.json())
        .then(data => {
          var features = {};
          data.features.forEach((feature) => {
            features[feature.properties.PCON13CD] = feature.properties;
          });

          this.area_count = Object.keys(features).length

          window.geojson.eachLayer(function (layer) {
            if ( features[layer.feature.properties.PCON13CD] ) {
              var props = features[layer.feature.properties.PCON13CD];
              // "show" the feature
              var text = "<strong>" + props["name"] + "</strong><table class=\"table table-sm\">"
              for (p in props) {
                if (["name", "type", "color", "opacity", "PCON13CD"].includes(p)) {
                  continue
                }
                text += "<tr><td>" + p + "</td><td> " + props[p] + "</td></tr>"
              }
              text += "</table>"
              layer.bindTooltip(text)
              layer.setStyle({
                opacity: 1,
                fillColor: props.color,
                fillOpacity: props.opacity
              })
            } else {
              layer.bindTooltip(layer.name)
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

          this.loading = false
        })
    },
    updateTable() {
      this.loading = true
      this.filters_applied = (this.filters.length > 0)

      fetch(this.url('/explore.csv'))
        .then(response => response.blob())
        .then(data => {
          Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              this.area_count = results["data"].length
              this.table = results
            }
          })

          if ( this.downloadCsvWithNextTableUpdate ) {
            this.downloadCsvWithNextTableUpdate = false
            var a = document.createElement("a")
            a.href = window.URL.createObjectURL(data)
            a.download = "explore.csv"
            a.click()
            window.URL.revokeObjectURL(a.href)
          }

          this.loading = false
        })
    },
    sort: function(sortBy){
      if(this.sortBy === sortBy) {
        this.sortOrder = -this.sortOrder;
      } else {
        this.sortBy = sortBy
      }
    },
    ariaSort: function(header){
      if ( this.sortBy === header ) {
        if ( this.sortOrder === -1 ) {
          return 'descending'
        } else {
          return 'ascending'
        }
      } else {
        return undefined // remove the aria-sort attribute
      }
    },
    downloadCSV() {
      this.downloadCsvWithNextTableUpdate = true
      this.updateState()
    },
    datasetMatchesSearchText(dataset) {
      var haystack = dataset.title + ' ' + dataset.source_label
      if ( dataset.description ) {
        haystack = haystack + ' ' + dataset.description
      }
      var needle = this.searchText
      return haystack.toLowerCase().indexOf(needle.toLowerCase()) > -1
    },
    datasetIsSelectable(dataset) {
      if (!dataset.areas_available.includes(this.area_type)) {
        return false
      }
      switch(this.currentType) {
        case 'column':
          // All datasets are selectable if we are currently
          // picking a column to add to the table view.
          return true
        case 'filter':
          return dataset.is_filterable
        case 'shader':
          return ["party", "constituency_ruc"].includes(dataset.name) || !["text", "json", "date", "profile_id"].includes(dataset.data_type)
        default:
          return true
      }
    }
  }
})

export default app
