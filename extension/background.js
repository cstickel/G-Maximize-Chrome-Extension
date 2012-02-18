$(document).ready(function () {
    var sizingTypes = {
        "fit":"Fit screen",
        "fitLimited":"Fit screen (don't enlarge)",
        "cover":"Fill Screen",
        "coverLimited":"Fill Screen (don't enlarge)"
    };

    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse) {
            switch (request.action) {
                case "getSettings":
                    sendResponse(JSON.parse(localStorage["gplusmaximizeSettings"]));
                    break;
                case "showPageAction":
                    chrome.pageAction.show(sender.tab.id);
                    break;
                case "hidePageAction":
                    chrome.pageAction.hide(sender.tab.id);
                    break;
                case "contentScriptInit":
                    chrome.tabs.getSelected(null, function (tab) {
                        if (!tab || tab.id == sender.tab.id) {
                            localStorage["lastTabId"] = sender.tab.id;
                        }
                    });
                    break;
                case "getSizingTypes":
                    sendResponse(sizingTypes);
                    break;
                case "toggelSizingType":
                    var settings = JSON.parse(localStorage["gplusmaximizeSettings"]);
                    var response = {};
                    switch (settings['scaling']) {
                        case "fit":
                            settings['scaling'] = "fitLimited";
                            break;
                        case "fitLimited":
                            settings['scaling'] = "cover";
                            break;
                        case "cover":
                            settings['scaling'] = "coverLimited";
                            break;
                        case "coverLimited":
                            settings['scaling'] = "fit";
                            break;
                    }
                    localStorage["gplusmaximizeSettings"] = JSON.stringify(settings);
                    sendResponse({
                        "scaling": settings['scaling'],
                        "description": sizingTypes[settings['scaling']]
                    });
                    break;
            }
        });

    chrome.windows.onFocusChanged.addListener(function () {
        chrome.tabs.getSelected(null, function (tab) {
            localStorage["lastTabId"] = tab.id;
        });
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == 'complete') {
            if (tab.url.indexOf('https://plus.google.com/') === 0) chrome.pageAction.show(tabId);
        }
    });

    chrome.tabs.onActiveChanged.addListener(function (tabId) {
        if (tabId) localStorage["lastTabId"] = tabId;
        chrome.tabs.sendRequest(Number(localStorage["lastTabId"]), {
            "action":"updateSettings",
            "settings":JSON.parse(localStorage["gplusmaximizeSettings"])
        });
    });
});