$(document).ready(function () {
    var settings = $.extend({
       "autoinit": false,
       "autofullscreen": true,
       "showarrows": true,
       "showkeys": true,
       "showbar": true,
       "scaling": "fit"
    },localStorage["gplusmaximizeSettings"] ? JSON.parse(localStorage["gplusmaximizeSettings"]) : {});

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

    $('select').change(function() {
        var setting = $(this).data('setting');
        if(setting) settings[setting] = $(this).val();
        updateSettings();
    });

    switches.on('keyup', function(e) {
        if(e.keyCode == 32 || e.keyCode == 13) $(this).trigger('click');
        if((e.keyCode == 37 && $(this).is(':not(.active)')) || (e.keyCode == 39 && $(this).is('.active'))) $(this).trigger('click');
    });

    chrome.extension.sendRequest({"action":"getSizingTypes"}, function(response) {
       var select = $('#sizingType');
       $.each(response, function(key, value) {
           var option = $('<option value="'+key+'">'+value+'</option>');
           if(settings['scaling'] == key) option.prop('selected', 'selected');
           select.append(option);
       });
       select.sbCustomSelect();
    });
});