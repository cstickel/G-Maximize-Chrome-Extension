$(document).ready(function () {
    var settings = $.extend({
       "autoinit": false
    },localStorage["gplusmaximizeSettings"] ? JSON.parse(localStorage["gplusmaximizeSettings"]) : {});

    chrome.tabs.getCurrent(function(tab) {
        $('body').append(tab.id+'test');
    });

    function updateSettings() {
        localStorage["gplusmaximizeSettings"] = JSON.stringify(settings);
        chrome.tabs.sendRequest(Number(localStorage["lastTabId"]), {
            "action": "updateSettings",
            "settings": settings
        });
    }

    $(document).on('click', '.switch', function () {
        $(this).toggleClass('active');
        $(this).trigger('change');
    });


    var switches = $('span.switch');
    switches.each(function() {
        var setting = $(this).data('setting');
        if(setting && settings[setting]) $(this).addClass('active');
    });
    switches.change(function() {
        var setting = $(this).data('setting');
        if(setting) settings[setting] = $(this).hasClass('active');
        updateSettings();
    });
});