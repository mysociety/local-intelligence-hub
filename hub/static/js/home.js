import $ from 'jquery/dist/jquery.slim'
import Collapse from 'bootstrap/js/dist/collapse'
import trackEvent from './analytics.esm.js'

async function mailingListSignup($form) {
    const response = await fetch($form.attr('action'), {
        method: $form.attr('method') || 'GET',
        mode: 'cors',
        credentials: 'same-origin',
        body: $form.serialize(),
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Accept": 'application/json; charset=utf-8',
        },
    })
    return response.json()
}

var setUpCollapsable = function(targets, triggers, triggerEvents, showTest) {
    var instances = [];
    var $targets = $(targets); // targets can either be a jQuery object or selector(s)
    var $triggers = $(triggers); // triggers can either be a jQuery object or selector(s)

    var updateUI = function() {
        var show = showTest($targets, $triggers);
        $.each(instances, function(i, instance){
            show ? instance.show() : instance.hide();
        });
    };

    $targets.addClass('collapse').each(function(){
        instances.push(new Collapse(this, { toggle: false}));
    });

    $triggers.on(triggerEvents, function(){
        updateUI();
    });

    updateUI();
}

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

    $('.js-collapsable-mailing-list-form').each(function(){
        setUpCollapsable(
            $(this).find('.js-mailing-list-name, .js-mailing-list-extras'),
            $(this).find('.js-mailing-list-email input#email'),
            'keyup change',
            function($targets, $triggers){
                return $triggers.eq(0).val() !== '';
            }
        );
    });

    $('.js-mailing-list-signup').on('submit', function(e){
        e.preventDefault();
        var $form = $(this);
        $('.invalid-feedback').remove()
        mailingListSignup($form).then(function(response){
            if (response['response'] == 'ok') {
                $form.hide()
                $('.js-mailing-list-success').removeClass('d-none')
            } else {
                console.log(response)
                for (var k in response["errors"]) {
                    var id = '#' + k
                    var el = $(id)
                    el.addClass('is-invalid')
                    var error_el = $('<div>')
                    error_el.addClass('invalid-feedback d-block fs-6 mt-2')
                    error_el.html( '<p>' + response["errors"][k].join(", ") + '</p>' )
                    el.after(error_el)
                }

                if ("mailchimp" in response["errors"]) {
                    var error_el = $('<div>')
                    error_el.addClass('invalid-feedback d-block fs-6 mt-2')
                    error_el.html( '<p>There was a problem signing you up, please try again.</p>' )
                    $form.before(error_el)
                }
            }
        });
    })

    $('.form-check + .conditional-fields').each(function(){
        var $target = $(this); // the .conditional-fields element
        var inputSetName = $target.prev().find('input').eq(0).attr('name');
        var $triggers = $('input[name="' + inputSetName + '"]');

        // jQuery can't see custom bootstrap events, so use .addEventListener instead
        $target[0].addEventListener('shown.bs.collapse', function(){
            $target.find('input').eq(0).trigger('focus');
        });

        setUpCollapsable(
            $target,
            $triggers,
            'change',
            function($target, $triggers){
                return $target.prev().find('input').eq(0).prop('checked');
            }
        );
    });
})
