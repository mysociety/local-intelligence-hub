import $ from 'jquery/dist/jquery.slim'
import Collapse from 'bootstrap/js/dist/collapse'
import trackEvent from './analytics.esm.js'

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

    $('.js-homepage-search').on('submit', function(e){
        var $form = $(this);
        if ( ! $form.data('submitRecorded') ) {
            e.preventDefault();
            trackEvent('homepage_search_form_submit', {
                search_term: $form.find('input[type="search"]').val()
            }).always(function(){
                $form.data('submitRecorded', true).trigger('submit');
            });
        }
    })

    $('.js-email-your-mp').on('click', function(e){
        e.preventDefault()
        let href = $(this).attr('href')
        trackEvent('email_your_mp', {
            area_name: $('#area_name').text(),
            area_mp_name: $('#mp_name').text()
        }).always(function(){
            window.location.href = href
        })
    })
    $('.js-landingpage-search').on('submit', function(e){
        var $form = $(this);
        if ( ! $form.data('submitRecorded') ) {
            e.preventDefault();
            trackEvent('landingpage_search_form_submit', {
                page_path: window.location.pathname,
                search_term: $form.find('input[type="search"]').val()
            }).always(function(){
                $form.data('submitRecorded', true).trigger('submit');
            });
        }
    })

    $('.js-landingpage-cta').on('click', function(e){
        e.preventDefault();
        var href = $(this).attr('href');
        trackEvent('landingpage_cta', {
            page_path: window.location.pathname,
            cta_destination: href
        }).always(function(){
            window.location.href = href;
        });
    })
})
