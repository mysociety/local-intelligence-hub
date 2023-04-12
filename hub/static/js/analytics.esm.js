import $ from '../jquery/jquery.esm.js'

const trackEvent = function(eventName, params) {
    // We'll return a promise, and resolve it when either Gtag handles
    // our event, or a maximum fallback period elapses. Promises can
    // only be resolved once, so this also ensures whatever callbacks
    // are attached to the promise only execute once.
    var dfd = $.Deferred();

    var gtag = window.gtag || function(){}

    var callback = function(){
        dfd.resolve();
    };

    // Tell Gtag to resolve our promise when it's done.
    var params = $.extend(params, {
        event_callback: callback
    });

    gtag('event', eventName, params);

    // Wait a maximum of 2 seconds for Gtag to resolve promise.
    setTimeout(callback, 2000);

    return dfd.promise();
};

export default trackEvent
