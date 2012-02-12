$(document).ready(function () {
    var scaleTo = 'w' + screen.width + '-h' + screen.height,
        images = false,
        maximize = false,
        keyFrame = false,
        count = false,
        sizingType = false;

    var selectors = {
        "viewAll":'.CNBrCd div[role=button]',
        "images":'.U3zdn .s-W-mMnEh',
        "selected":".yaUgJc",
        "frame":'.cL8Mff',
        "singleImage": '.g7DSrf .photo-container.pUf9Gc'
    }

    function addFlashClass(name, time) {
        if(typeof(time) !== 'number') time = 2000;
        maximize.addClass(name);
        if (maximize.data(name+'Timeout')) window.clearTimeout(maximize.data(name+'Timeout'));
            var timeout = window.setTimeout(function () {
                if(maximize) maximize.removeClass(name);
            }, time);
        maximize.data(name+'Timeout', timeout);
    }

    function clickElement(target) {
        var events = ["mouseenter", "mousedown", "mouseup", "click", "mouseout"];
        for (var i = 0; i < events.length; i++) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(events[i], true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            target.get(0).dispatchEvent(evt);
        }
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
                if(nativeWidth < width || nativeHeight < height) {
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

            switch (getSizingType()) {
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

    function initSizingType(force) {
        if (!localStorage["gplusmaximizeSizingType"] || force) setSizingType("fit");
        return getSizingType();
    }

    function toggleSizingType() {
        var current = getSizingType();
        switch (current) {
            case "fit":
                setSizingType("fitLimited");
                break;
            case "fitLimited":
                setSizingType("cover");
                break;
            case "cover":
                setSizingType("coverLimited");
                break;
            case "coverLimited":
                setSizingType("fit");
                break;
            default:
                initSizingType(true);
        }
        addFlashClass('showSizingType');
        scaleImage();
    }

    function getSizingType() {
        return localStorage["gplusmaximizeSizingType"] || initSizingType();
    }

    function setSizingType(type) {
        var sizingTypes = {
            "fit": "Fit to screen",
            "fitLimited": "Limited fit to screen",
            "cover": "Cover screen",
            "coverLimited": "Limited cover screen"
        }

        localStorage["gplusmaximizeSizingType"] = type;
        sizingType.html(sizingTypes[type]);
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

        if(next.is(current) && maximize.children('img').length) return false;

        maximize.children('img').removeClass('active').fadeOut(500, function () {
            $(this).remove();
        });
        var image = $('<img src="' + getUrl(next.find('img').attr('src'), scaleTo) + '" class="active" />').appendTo(maximize);
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

    $(document).keyup(function (e) {
        if (e.keyCode == 38) {
            if (!maximize && $(selectors['frame']).length) turnLightsOff();
            else turnLightsOn();
        } else if (maximize) {
            switch (e.keyCode) {
                case 32:
                    updateImage(1);
                    break;
                case 39:
                    updateImage(1);
                    addFlashClass('showKeyRight', 500);
                    break;
                case 37:
                    updateImage(-1);
                    addFlashClass('showKeyLeft', 500);
                    break;
                case 33:
                    updateImage(10);
                    break;
                case 34:
                    updateImage(-10);
                    break;
                case 27:
                    turnLightsOn();
                    addFlashClass('showKeyUp', 500);
                    break;
                case 40:
                    toggleSizingType();
                    addFlashClass('showKeyDown', 500);
                    break;
            }
        }
    });

    function turnLightsOff() {
        initSizingType();
        $(window).on("resize", scaleImage);
        maximize = $('<div id="gplusmaximize" tabindex="0" class="loading"></div>');
        var bar = $('<div id="gplusmaximizeBar"></div>').appendTo(maximize);
        var close = $('<span id="gplusmaximizeClose">Close</span>').appendTo(bar);
        count = $('<span id="gplusmaximizeCount"></span>').appendTo(bar);
        keyFrame = $('<span id="gplusmaximizeBarKeyFrame"></span>').appendTo(maximize);
        keyFrame.append('<span id="gplusmaximizeBarKeyUp">Close</span>');
        keyFrame.append('<span id="gplusmaximizeBarKeyLeft">Previous image</span>');
        keyFrame.append('<span id="gplusmaximizeBarKeyRight">Next image</span>');
        keyFrame.append('<span id="gplusmaximizeBarKeyDown">Toggle scaling</span>');
        sizingType = $('<div id="gplusmaximizeSizingType"></div>').appendTo(maximize);

        $('body').append(maximize);

        var viewAll = $(selectors["viewAll"]);
        clickElement(viewAll);
        images = $(selectors['images']);
        if(images.length < 1) images = $(selectors['singleImage']).addClass('gplusmaximizeSelected');
        else images.filter(selectors['selected']).addClass('gplusmaximizeSelected');
        updateImage();
        addFlashClass('showKeys');

        maximize.requestFullScreen().focus();
        maximize.blur(function () {
            $(this).focus();
        });
        close.click(function () {
            turnLightsOn();
        });
    }

    function turnLightsOn() {
        clickElement($(images.filter('.gplusmaximizeSelected').get(0)));
        images.removeClass('gplusmaximizeSelected');
        window.fullScreenApi.cancelFullScreen();
        maximize.fadeOut(400, function () {
            $(this).remove();
            $(selectors['frame']).focus();
        });
        $(window).off("resize", scaleImage);
        maximize = false;
    }
});