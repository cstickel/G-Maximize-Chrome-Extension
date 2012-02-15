$(document).ready(function () {
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
            }
        });

    chrome.windows.onFocusChanged.addListener(function() {
        chrome.tabs.getSelected(null, function (tab) {
            localStorage["lastTabId"] = tab.id;
        });
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if(changeInfo.status == 'complete') {
            if(tab.url.indexOf('https://plus.google.com/') === 0) chrome.pageAction.show(tabId);
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