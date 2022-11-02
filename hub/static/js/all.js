import * as _ from '../underscore/underscore.esm.min.js'
import $ from '../jquery/jquery.esm.js'
import L from '../leaflet/leaflet-1.8.0.esm.js'

$(function(){
    window.map = setUpMap()

    if ( $('.fake-data').length ) {
        var $warning = $(`<div class="fake-data-warning alert alert-danger mb-0">
            <div class="container">
                <div class="d-md-flex align-items-center">
                    <h2 class="h6 mb-md-0 me-md-3">Prototype warning</h2>
                    <p class="mb-md-0 me-md-3">This page contains a mixture of real and fake data.</p>
                    <button class="btn btn-sm btn-danger ms-md-auto">Show only real data</button>
                </div>
            </div>
        </div>`).on('click', 'button', function(){
            if ( $(this).data('hidden') ) {
                $('.fake-data').removeClass('fake-data--hidden')
                $(this).text('Show only real data')
                $(this).data('hidden', null)
            } else {
                $('.fake-data').addClass('fake-data--hidden')
                $(this).text('Reveal fake data')
                $(this).data('hidden', true)
            }
        })
        $('body').append($warning)
        $('.site-footer > .container').addClass('pb-8 pb-md-6')
        $('head').append('<link href="https://fonts.googleapis.com/css2?family=Redacted+Script" rel="stylesheet">')
    }
})

var getAreaColor = function(feature) {
    return '#ed6832'
}

var getVisibilityForArea = function(feature) {
    return 1
}

var getFeatureStyle = function(feature) {
    return {
        fillColor: getAreaColor(feature),
        weight: 2,
        opacity: ( getVisibilityForArea(feature) ? 1 : 0 ),
        color: 'white',
        fillOpacity: ( getVisibilityForArea(feature) ? 0.7 : 0 )
    }
}

var highlightFeature = function(e) {
    var layer = e.target

    layer.setStyle({
        weight: 5
    })

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
        layer.openTooltip();
    }
}

var unhighlightFeature = function(e) {
    window.geojson.resetStyle(e.target);
    e.target.closeTooltip();
}

var setUpMap = function() {
    var $map = $('.explore-map')

    if ( ! $map.length ) {
        return undefined
    }

    var map = L.map($map[0]).setView([54.0934, -2.8948], 7)

    var tiles = L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)

    $.getJSON("/filter_areas/", function(data) {
        window.geojson = L.geoJson(data, {
            style: getFeatureStyle,
            onEachFeature: function(feature, layer){
                layer.bindTooltip(feature.properties.name);
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: unhighlightFeature,
                    click: function(){
                        window.location.href = '/area/' + feature.properties.type + '/' + feature.properties.name
                    }
                })
            }
        }).addTo(map)
    });

    return map
}
