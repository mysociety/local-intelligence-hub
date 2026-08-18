import $ from 'jquery/dist/jquery.slim'
import Modal from 'bootstrap/js/dist/modal'
import trackEvent from './analytics.esm.js'
import setUpCollapsable from './collapsable.esm.js'

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

    $('.js-collapsable-mailing-list-form').each(function(){
        setUpCollapsable(
            $(this).find('.js-mailing-list-name, .js-mailing-list-extras'),
            $(this).find('.js-mailing-list-email input[name="email"]'),
            'keyup change',
            function($targets, $triggers){
                return $triggers.eq(0).val() !== '';
            }
        );
    });

    // A page can contain more than one signup form (eg: one in the main
    // content and one in the footer) so everything here is scoped to the
    // form that was actually submitted.
    $('.js-mailing-list-signup').on('submit', function(e){
        e.preventDefault();
        var $form = $(this);
        $form.find('.invalid-feedback').remove()
        $form.find('.is-invalid').removeClass('is-invalid')

        mailingListSignup($form).then(function(response){
            if (response['response'] == 'ok') {
                $form.hide()
                $form.next('.js-mailing-list-success').removeClass('d-none')
                return
            }

            var generalErrors = []

            for (var k in response['errors']) {
                var $field = $form.find('[name="' + k + '"]').eq(0)
                if ( k === 'mailchimp' || $field.length === 0 ) {
                    // Either a non-field error, or an error about a field
                    // this particular variant of the form doesn’t display.
                    generalErrors.push('There was a problem signing you up, please try again.')
                } else {
                    $field.addClass('is-invalid')
                    $('<div>')
                        .addClass('invalid-feedback d-block fs-6 mt-2')
                        .html('<p>' + response['errors'][k].join(', ') + '</p>')
                        .insertAfter($field)
                }
            }

            if ( generalErrors.length ) {
                $('<div>')
                    .addClass('invalid-feedback d-block fs-6 mb-3')
                    .html('<p class="mb-0">' + generalErrors[0] + '</p>')
                    .prependTo($form)
            }
        });
    })

    $('.feedback-modal').each(function(){
        var modal = new Modal(this);

        var shouldShowModal = function() {
            if ( ! window.localStorage ) {
                // Can’t trigger modal, because no localStorage support.
                return false;
            }
            if ( localStorage.getItem('submitted-feedback-modal-timestamp') ) {
                // Browser has already submitted the feedback form.
                return false;
            }
            if ( localStorage.getItem('skipped-feedback-modal-timestamp') ) {
                // Respect skipped modals for 7 days.
                var skippedTimestamp = localStorage.getItem('skipped-feedback-modal-timestamp');
                var nowTimestamp = (new Date()).getTime() / 1000;
                var coolingOffPeriod = 60 * 60 * 24 * 7;
                if ( nowTimestamp - skippedTimestamp < coolingOffPeriod ) {
                    return false;
                }
            }
            return true;
        }

        this.addEventListener('hide.bs.modal', event => {
            if ( ! localStorage.getItem('submitted-feedback-modal-timestamp') ) {
                var timestamp = (new Date()).getTime() / 1000;
                localStorage.setItem('skipped-feedback-modal-timestamp', timestamp);
            }
        });

        if ( shouldShowModal() ) {
            localStorage.removeItem('skipped-feedback-modal-timestamp');
            modal.show();
        }

        this.addEventListener('submit', function(e){
            e.preventDefault();
            let form = this.querySelector('form');
            let hasMadeSelection = form.querySelectorAll('input[type="checkbox"]:checked').length > 0;
            let params = new URLSearchParams(Array.from(new FormData(form))).toString()

            if ( hasMadeSelection ) {
                fetch(form.action + '?' + params, {
                    method: form.method,
                    mode: 'no-cors',
                    cache: 'no-cache',
                    credentials: 'omit',
                    headers: {
                        "Content-Type": 'application/x-www-form-urlencoded'
                    }
                });

                if ( window.localStorage ) {
                    var timestamp = (new Date()).getTime() / 1000;
                    if ( hasMadeSelection ) {
                        localStorage.setItem('submitted-feedback-modal-timestamp', timestamp);
                    } else {
                        localStorage.setItem('skipped-feedback-modal-timestamp', timestamp);
                    }
                }
            }

            modal.hide();
        });
    })
})
