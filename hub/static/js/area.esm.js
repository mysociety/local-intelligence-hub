import $ from 'jquery/dist/jquery.slim'
import trackEvent from './analytics.esm.js'

const hashes = ["#favourites", "#mp", "#opinion", "#place", "#movement"]

function getHashFromSection(section) {
    let hash = '#' + section
    if ( hashes.indexOf(hash) > -1 ) {
        return hash
    } else {
        return ''
    }
}

function getSectionFromHash(hash) {
    if ( hashes.indexOf(hash) > -1 ) {
        return hash.slice(1)
    } else {
        return "featured"
    }
}

function getSelectedSection() {
    if ( window.history.state && window.history.state.section ) {
        return window.history.state.section
    } else {
        return getSectionFromHash(window.location.hash)
    }
}

function updateUI() {
    let section = getSelectedSection()

    $('.area-content').attr('data-section', section)

    $('.area-tabs .nav-link').each(function(){
        let href = $(this).attr('href')
        let linkSection = getSectionFromHash(href)
        $(this).toggleClass('active', (section == linkSection))
    })
}

function setUpAreaPage() {
    // The page URL without any hash fragment
    let pageUrl = window.location.href.split('#')[0]

    window.addEventListener("popstate", function(e){
        updateUI()
    })

    $('.js-nav-item-featured, .js-nav-item-favourites').removeClass('d-none')

    $('.area-tabs .nav-link, .area-data-more a').on('click', function(e){
        e.preventDefault()

        let href = $(this).attr('href')
        let section = getSectionFromHash(href)
        let url = getHashFromSection(section) || pageUrl

        window.history.pushState({"section": section}, null, url)
        updateUI()

        trackEvent('area_page_switch_section', { "section": section })
    })

    $('.js-favourite-this-dataset, .js-unfavourite-this-dataset').on('submit', function(e){
        e.preventDefault();
        var $form = $(this);
        // XXX Needs changing to use fetch() or similar
        $.ajax({
            url: $form.attr('action'),
            type: $form.attr('method') || 'get',
            data: $form.serialize(),
            accepts: 'application/json; charset=utf-8',
            dataType: 'json'
        }).done(function(){
            $form.parents('.dataset-card').toggleClass('dataset-card--favourite');
        });
    });

    updateUI()
}

export default setUpAreaPage
