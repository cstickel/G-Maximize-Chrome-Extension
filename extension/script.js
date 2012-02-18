$(document).ready(function () {
    var scaleTo = 'w' + screen.width + '-h' + screen.height,
        images = false,
        maximize = false,
        keyFrame = false,
        count = false,
        sizingType = false,
        autoinitTimeout = false,
        hideNative = false,
        autoinitCounter = 0,
        selectors = {
            "viewAll":'.CNBrCd div[role=button]',
            "images":'.U3zdn .s-W-mMnEh',
            "selected":".yaUgJc",
            "frame":'.cL8Mff',
            "singleImage":'.g7DSrf .photo-container.pUf9Gc',
            "close":'.y4sXHf'
        };

    chrome.extension.sendRequest({"action":"contentScriptInit"});

    chrome.extension.sendRequest({"action":"getSettings"}, function (response) {
        settings = response;

        function refreshSettingBindings() {
            function autoinit() {
                $(selectors['images']).remove();
                if (!hideNative) hideNative = $('<div id="gplusmaximizeHideNative"></div>').appendTo('body');
                autoinitCounter = 0;
                if (autoinitTimeout) window.clearTimeout(autoinitTimeout);
                autoinitTimeout = window.setTimeout(checkAutoinit, 500);
            }

            //Anyone knows better solution to detect when native lightbox opens?
            $(document).off('focusin.gplusmaximizeAutoinit');
            if (settings.autoinit) $(document).on('focusin.gplusmaximizeAutoinit', selectors['frame'] + ':not(.gplusmaximizeAvoidAutoinit)', autoinit);
        }

        function refreshSettings() {
            if (maximize) {
                if (settings.showarrows) maximize.removeClass('noArrows');
                else maximize.addClass('noArrows');
                if (settings.showkeys) maximize.removeClass('noKeys');
                else maximize.addClass('noKeys');
                if (settings.showbar) maximize.removeClass('noBar');
                else maximize.addClass('noBar');

                scaleImage();
            }
        }

        refreshSettingBindings();

        chrome.extension.onRequest.addListener(
            function (request, sender, sendResponse) {
                switch (request.action) {
                    case "updateSettings":
                        settings = request.settings
                        refreshSettings();
                        refreshSettingBindings();
                        break;
                    case "setSizingType":
                        setSizingType(request.scaling, request.description);
                        break;
                }
            });

        function checkAutoinit() {
            if ($(selectors['frame']).length) {
                var lastTry = (autoinitCounter > 4);
                if (!turnLightsOff(!lastTry ? true : false) && !lastTry) {
                    autoinitTimeout = window.setTimeout(checkAutoinit, 500);
                    autoinitCounter++;
                }
            }
        }

        function addFlashClass(name, time) {
            if (!maximize) return false;
            if (typeof(time) !== 'number') time = 2000;
            maximize.addClass(name);
            if (maximize.data(name + 'Timeout')) window.clearTimeout(maximize.data(name + 'Timeout'));
            var timeout = window.setTimeout(function () {
                if (maximize) maximize.removeClass(name);
            }, time);
            maximize.data(name + 'Timeout', timeout);
        }

        function clickElement(target) {
            if (!target || !target.length) return false;
            var events = ["mouseenter", "mousedown", "mouseup", "click", "mouseout"];
            for (var i = 0; i < events.length; i++) {
                var evt = document.createEvent("MouseEvents");
                evt.initMouseEvent(events[i], true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                target.get(0).dispatchEvent(evt);
            }
        }

        function showError() {
            var error = $('<div id="gplusmaximizeError"><h2>Something went wrong.</h2>The G+ Maximize Extension couldn\'t be initialized. Please open a ticket in the <a href="https://github.com/mixer2/G-Maximize-Chrome-Extension/issues" target="_blank">issue tracker</a>.</div>');
            var close = $('<span id="gplusmaximizeErrorClose">Close</span>');
            close.appendTo(error);
            error.appendTo('body');
            if (hideNative) {
                hideNative.remove();
                hideNative = false;
            }
            close.on('click', function () {
                error.remove();
            });
        }

        function scaleImage() {
            var imgs = maximize.children('img');
            imgs.each(function () {
                $(this).width('auto').height('auto');

                var width = maximize.width(),
                    height = maximize.height(),
                    nativeWidth = $(this).width();
                nativeHeight = $(this).height();
                posLeft = 0,
                    posTop = 0,
                    ratio = width / height,
                    targetRatio = nativeWidth / nativeHeight;

                function center() {
                    posTop = (maximize.height() - height) / 2;
                    posLeft = (maximize.width() - width) / 2;
                }

                function limit() {
                    if (nativeWidth < width || nativeHeight < height) {
                        width = nativeWidth;
                        height = nativeHeight;
                    }
                }

                function calcFit() {
                    if (ratio < targetRatio) {
                        height = width / targetRatio;
                    } else {
                        width = height * targetRatio;
                    }
                }

                function calcCover() {
                    if (ratio < targetRatio) {
                        width = height * targetRatio;
                    } else {
                        height = width / targetRatio;
                    }
                }

                switch (settings['scaling']) {
                    case "fitLimited":
                        calcFit();
                        limit();
                        break;
                    case "cover":
                        calcCover();
                        break;
                    case "coverLimited":
                        calcCover();
                        limit();
                        break;
                    default:
                        calcFit();
                }

                center();

                $(this).css({
                    width:width,
                    height:height,
                    top:posTop,
                    left:posLeft
                });
            });
        }

        function toggleSizingType() {
            chrome.extension.sendRequest({"action":"toggelSizingType"}, function (response) {
                setSizingType(response['scaling'], response["description"]);
            });
        }

        function setSizingType(scaling, description) {
            settings['scaling'] = scaling;
            sizingType.html(description);
            addFlashClass('showSizingType');
            scaleImage();
        }

        function getUrl(url, size) {
            var before = url.replace(/(.*\/)(s[0-9]+.*\/)([^\/]+)$/, '$1');
            var after = url.replace(/(.*\/)(s[0-9]+.*\/)([^\/]+)$/, '$3');
            return before + size + "/" + after;
        }

        function updateImage(steps) {
            var current = images.filter('.gplusmaximizeSelected');
            var index = images.index(current);
            var next = false;

            if (typeof(steps) === 'number') {
                index = index + steps;

                if (images.length <= index) index = 0;
                else if (index < 0) index = images.length - 1;

                next = images.eq(index);
                current.removeClass('gplusmaximizeSelected');
                next.addClass('gplusmaximizeSelected');
            } else next = current;

            if (next.is(current) && maximize.children('img').length) return false;

            maximize.children('img').removeClass('active').fadeOut(500, function () {
                $(this).remove();
            });
            var image = $('<img src="' + getUrl(next.find('img').attr('src'), scaleTo) + '" class="active main" />').appendTo(maximize);
            count.html((index + 1) + ' of ' + images.length);
            maximize.addClass('loading');
            addFlashClass('showBar');

            image.load(function () {
                if ($(this).hasClass('active')) {
                    scaleImage($(this));
                    $(this).fadeIn(1000);
                    maximize.removeClass('loading');
                }
            });
        }

        $(document).on('mousewheel', function (e) {
            if (maximize) {
                if (e.originalEvent.wheelDeltaY > 0) {
                    updateImage(1);
                } else {
                    updateImage(-1);
                }
            }
        });

        $(document).on('keyup', function (e) {
            if (maximize) {
                switch (e.keyCode) {
                    case 33:
                        updateImage(10);
                        break;
                    case 34:
                        updateImage(-10);
                        break;
                    case 27:
                        turnLightsOn();
                        break;
                    case 38:
                        $('#gplusmaximizeBarKeyUp').trigger('click');
                        break;
                    case 40:
                        $('#gplusmaximizeBarKeyDown').trigger('click');
                        break;
                }
            } else {
                switch (e.keyCode) {
                    case 38:
                        if ($(selectors['frame']).length) turnLightsOff();
                        break;
                    case 40:
                        clickElement($(selectors['close']));
                        break;
                }
            }
        });


        $(document).on('keydown', function (e) {
            if (maximize) {
                switch (e.keyCode) {
                    case 32:
                        updateImage(1);
                        break;
                    case 39:
                        $('#gplusmaximizeBarKeyRight').trigger('click');
                        break;
                    case 37:
                        $('#gplusmaximizeBarKeyLeft').trigger('click');
                        break;
                }
            }
        });

        function turnLightsOff(silent) {
            if (maximize) return true;
            var viewAll = $(selectors["viewAll"]);
            if (viewAll.length) clickElement(viewAll);
            images = $(selectors['images']);
            var selected = false;

            if (images.length < 1) images = selected = $(selectors['singleImage']);
            else selected = images.filter(selectors['selected']);

            //diagnose (maybe they changed the name of a class)
            if (!(viewAll.length == 1 && selected.length == 1 && images.length > 0)) {
                if (!silent) showError();
                return false;
            }

            $(window).on("resize", scaleImage);
            maximize = $('<div id="gplusmaximize" tabindex="0" class="loading"></div>');
            var bar = $('<div id="gplusmaximizeBar"></div>').appendTo(maximize);
            var close = $('<span id="gplusmaximizeClose">Close</span>').appendTo(bar);
            count = $('<span id="gplusmaximizeCount"></span>').appendTo(bar);
            keyFrame = $('<span id="gplusmaximizeBarKeyFrame"></span>').appendTo(maximize);
            keyFrame.append('<span id="gplusmaximizeBarKeyUp">Toggle scaling</span>');
            keyFrame.append('<span id="gplusmaximizeBarKeyLeft">Previous image</span>');
            keyFrame.append('<span id="gplusmaximizeBarKeyRight">Next image</span>');
            keyFrame.append('<span id="gplusmaximizeBarKeyDown">Close</span>');
            sizingType = $('<div id="gplusmaximizeSizingType"></div>').appendTo(maximize);
            var next = $('<span id="gplusmaximizeNext"></span>').appendTo(maximize);
            var prev = $('<span id="gplusmaximizePrev"></span>').appendTo(maximize);

            $('body').append(maximize);
            if (hideNative) {
                hideNative.remove();
                hideNative = false;
            }

            selected.addClass('gplusmaximizeSelected');

            updateImage();
            addFlashClass('showKeys', 4000);
            addFlashClass('showArrows', 2000);

            if (settings['autofullscreen']) maximize.requestFullScreen();
            maximize.focus();
            maximize.blur(function () {
                $(this).focus();
            });

            refreshSettings();

            close.click(function () {
                turnLightsOn();
            });

            next.on('click', function () {
                updateImage(1);
                addFlashClass('showArrows', 1000);
            });
            prev.on('click', function () {
                updateImage(-1);
                addFlashClass('showArrows', 1000);
            });
            maximize.on('mouseover', function () {
                addFlashClass('showAll', 1000);
            });


            maximize.on('click', 'img.main', function () {
                updateImage(1);
            });
            maximize.on('click', '#gplusmaximizeBarKeyUp', function () {
                toggleSizingType();
                addFlashClass('showKeyUp', 500);
            });
            maximize.on('click', '#gplusmaximizeBarKeyDown', function () {
                turnLightsOn();
                addFlashClass('showKeyDown', 500);
            });
            maximize.on('click', '#gplusmaximizeBarKeyLeft', function () {
                updateImage(-1);
                addFlashClass('showKeyLeft', 500);
            });
            maximize.on('click', '#gplusmaximizeBarKeyRight', function () {
                updateImage(1);
                addFlashClass('showKeyRight', 500);
            });
            return true;
        }

        function turnLightsOn() {
            clickElement($(images.filter('.gplusmaximizeSelected').get(0)));
            images.removeClass('gplusmaximizeSelected');
            window.fullScreenApi.cancelFullScreen();
            maximize.fadeOut(400, function () {
                $(this).remove();
                $(selectors['frame']).addClass('gplusmaximizeAvoidAutoinit').focus();
            });
            $(window).off("resize", scaleImage);
            maximize = false;
        }
    });
});