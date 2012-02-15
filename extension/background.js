$(document).ready(function () {
    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse) {
            switch (request.action) {
                case "getSettings":
                    sendResponse({
                        "autoinit":localStorage["gplusmaximizeAutoinit"] ==  1
                    });
                    break;
            }
        });
});