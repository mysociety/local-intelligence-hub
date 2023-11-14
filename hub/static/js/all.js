import $ from '../jquery/jquery.esm.js'
import { Chart, registerables } from '../chartjs/chart.esm.js'
import trackEvent from './analytics.esm.js'

Chart.register(...registerables);

Chart.defaults.font.family = '"Public Sans", sans-serif'
Chart.defaults.font.size = 12
Chart.defaults.plugins.legend.labels.boxHeight = 10
Chart.defaults.plugins.legend.labels.boxWidth = 20
Chart.defaults.plugins.legend.labels.padding = 20
Chart.defaults.animation.duration = 0
Chart.defaults.responsive = true

import exploreApp from './explore.esm.js'
exploreApp.mount('#exploreApp')

import setUpAreaPage from './area.esm.js'

$(function(){
    if( 'geolocation' in navigator ) {
        $('.js-geolocate').removeClass('d-none');
        $('.js-geolocate').on('click', function(e){
            e.preventDefault();
            var $a = $(this);
            var $icon = $a.find('.js-geolocate-icon');
            var $spinner = $a.find('.js-geolocate-spinner');

            $icon.addClass('d-none');
            $spinner.removeClass('d-none');

            trackEvent('homepage_geolocate_click');

            navigator.geolocation.getCurrentPosition(function(position){
                var params = {
                    lon: position.coords.longitude.toFixed(6),
                    lat: position.coords.latitude.toFixed(6)
                };
                window.location = $a.attr('href') + '?' + $.param(params);
            }, function(err){
                if (err.code === 1) {
                    var text = 'You declined location sharing.';
                } else {
                    var text = 'Your location could not be found.'
                }
                var $p = $('<p>').attr({
                    role: 'alert',
                    class: 'mb-0 text-muted'
                }).text(text);
                $a.replaceWith($p);
            }, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        })
    }

    $('.js-chart').each(makeChart);

    $('body.js-area-page').each(setUpAreaPage);

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

    $('.js-homepage-search').on('submit', function(e){
        var $form = $(this);
        if ( ! $form.data('submitRecorded') ) {
            e.preventDefault();
            trackEvent('homepage_search_form_submit', {
                search_term: $form.find('input[type="search"]').val()
            }).always(function(){
                $form.data('submitRecorded', true).submit();
            });
        }
    })
})

var makeChart = function() {
    var $table = $(this)
    var chartType = $table.data('chart-type') || 'bar'
    var chartWidth = $table.data('chart-width') || 600
    var rowHeight = $table.data('row-height') || 45
    var legendHeight = 40
    var labelHeight = 20
    var $canvas = $('<canvas>').attr({
        'width': chartWidth,
        'height': (rowHeight * $table.find('tbody tr').length) + legendHeight + labelHeight,
        'class': 'mt-n3',
        'role': 'img',
        'aria-label': chartType + ' chart'
    }).insertBefore($table)

    var primaryAxis = $table.data('chart-direction') || 'x'
    var crossAxis = ( primaryAxis == 'x' ) ? 'y' : 'x'

    var config = {
        type: chartType,
        data: {
            labels: extractLabelsFromTable($table),
            datasets: extractDatasetsFromTable($table, primaryAxis)
        },
        options: {
            indexAxis: primaryAxis,
            scales: {
                [crossAxis]: {
                    ticks: {
                        callback: function (value) {
                            return (value / 100).toLocaleString('en-GB', { style: 'percent' })
                        }
                    }
                },
                [primaryAxis]: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: false,
                    external: function(context){
                        var $canvas = $(context.chart.canvas);
                        var $tooltip = $canvas.data('tooltip');
                        if ( typeof $tooltip === 'undefined' ) {
                            $tooltip = $('<div>').addClass('js-chart-tooltip').appendTo('body');
                            $canvas.data('tooltip', $tooltip);
                        }
                        $tooltip.toggle(context.tooltip.opacity == 1);
                        $tooltip.text(context.tooltip.body[0].lines[0]);
                    },
                    callbacks: {
                        label: function(context){
                            return context.dataset.label + ': ' + (context.raw / 100).toLocaleString('en-GB', { style: 'percent' });
                        }
                    }
                }
            }
        }
    }

    $canvas.on('mousemove', function(e){
        var $tooltip = $canvas.data('tooltip');
        if ( $tooltip ) {
            $tooltip.css({
                'left': '' + e.clientX + 'px',
                'top': '' + e.clientY + 'px'
            });
        }
    });

    new Chart($canvas, config)
}

var extractLabelsFromTable = function($table) {
    return $table.find('tbody tr').map(function(){
        return $(this).find('th').text()
    }).get()
}

var extractDatasetsFromTable = function($table, primaryAxis) {
    return $table.find('thead th').not(':first-child').map(function(i){
        var $th = $(this)
        return {
            label: $(this).text(),
            axis: primaryAxis,
            data: $table.find('tbody tr').map(function(){
                return parseInt( $(this).children().eq(i + 1).text() )
            }).get(),
            backgroundColor: $th.data('color'),
            barPercentage: 1,
            categoryPercentage: 0.7
        }
    }).get()
}
