
var isAutoSearch = false;

$(document).ready(function(){
    var url = window.location.href;
    var idx = url.indexOf("#"); // if current location is not home page, go to home page when user refresh the page.
    if (idx != -1) {
        window.location = url.substring(0, idx);
        return;
    }
    init();
});

$.ajaxSetup ({
    cache: false
});

function init()
{
    applicationCacheHandeler();

    $("a.goBack").fastClick( function(e) {
        $.mobile.back();
        e.stopPropagation();
        return false;
    });
    // if (typeof(document.referrer) == "undefined") {
    //     console.log("document.referrer:" + document.referrer);
    //     sessionStorage.referrer = document.referrer;
    // } else {
    //     console.log("browser not support document.referrer.");
    // }
    // setTimeout(function(){
    //     $.mobile.changePage($("#appListPage"), {transition: "none"});
    // }, 100);
}

$(document).bind("mobileinit", function() {

    // $.mobile.loadingMessage = '页面载入中';
    // $.mobile.pageLoadErrorMessage = '页面载入失败';
    // $.mobile.transitionFallbacks.slideout = "none";
    // jquery mobile used $.ajax() to load page for using page transition,
    // in jquery, $.ajax() method set cache option default by true, but in Android platform this will cause some problems, if loaded from cache
    // ajax request event will not be fired.
    // in order to improve the speed of loading resources, HTML5 feature application cache must to be used.
    // to fix this issue , set cache option to false before jquery mobile setting up.
//  var agent = navigator.userAgent.toLowerCase();
//  if (agent.match(/android/i) == "android") {
        $.ajaxSetup({
            cache: false,
            headers: {"Cache-Control": "no-cache"}
        });
//  }
    
});

function applicationCacheHandeler() 
{
    applicationCache.onchecking = function(){
        console.log(" application cache checking");
    };

    applicationCache.ondownloading = function(){
        console.log(" application cache downloading");
    };

    applicationCache.onnoupdate = function(){
        console.log(" application cache no update");
    };

    applicationCache.onprogress = function(){
        console.log(" application cache progress");
    };

    applicationCache.oncached = function(){
        console.log(" application cache cached");
//        location.reload(true); // reload the whole web page
    };

    applicationCache.onupdateready = function(){
        console.log(" application cache update ready");
        location.reload(true); // reload the whole web page
    };

    applicationCache.onerror = function(){
        console.log(" application cache error");
    };
    
}

function isAndroid()
{
    var agent = navigator.userAgent.toLowerCase();  // on Android, when click on 'input', it doesn't scroll up automatic.
    if (agent.match(/android/i) != "android") {
        return false;
    }
    return true;
}

function clearStorage()
{
    for (var i=0, len = sessionStorage.length; i < len; i++){
        var key = sessionStorage.key(i);
        var value = sessionStorage.getItem(key);
        console.log("removing " + key + " : " + value);
        sessionStorage.removeItem(key); /// ?????
    }
}

function getQueryString(name) // get parameter from url
{
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) 
        return decodeURIComponent(r[2]);
    return null;
}

function isPhoneNumber(number)
{
    var reg = /^1[3-8]\d{9}$/;
    if (reg.test(number)) {
        return true;
    }
    return false;
}

function isEmail(str)
{
    var reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
    if (reg.test(str)) {
        return true;
    }
    return false;
}

function makePostData(para)
{
    var para2 = commonPara();
    for( var i in para2) {
        para[i] = para2[i];
    }
    return para;
}

function dateDiff(date1Str, date2Str)
{
    var dateString = date1Str.replace(/-/g, "/");
    date1 = new Date(dateString);
    dateString = date2Str.replace(/-/g, "/");
    date2 = new Date(dateString);
    return parseInt(Math.abs(date1.getTime() - date2.getTime())/1000/60/60/24);    // ms -> day
}

function changePage(pageName)
{
    if (isAndroid()) {
        // console.log("changePage without transition on Android.");
        $.mobile.changePage($(pageName), {transition: "none"});
    } else {
        $.mobile.changePage($(pageName), {transition: "slidefade"});
    }
}

function showLoader(txt) {  
    var onlyTxt = true;
    if (txt === undefined) {
        txt = "请稍候...";
        onlyTxt = false;
    }
    $.mobile.loading('show', {  
        text: txt, //加载器中显示的文字  
        textVisible: true, //是否显示文字  
        theme: 'b',        //加载器主题样式
        textonly: onlyTxt,   //是否只显示文字  
        html: ""           //要显示的html内容，如图片等  
    });  
}

function hideLoader() {  
    $.mobile.loading('hide');  
}

function setTitle(title) {
    console.log("setTitle："+title);
    // if (window.android != undefined) {
    //     window.android.setPageTitle(title);
    // }
    $(document).attr("title",title);
}

function changePageAndHideLoader(pageName) {
    if (isAndroid()) {
        $.mobile.changePage($(pageName), {transition: "none"});
    } else {
        $.mobile.changePage($(pageName), {transition: "slidefade"});
    }
    hideLoader();
}

function scrollToObj(obj) {
    window.scrollTo(0, obj.offset().top);
}

var slide = {
    slidePanle: null,
    scrollX: 0,
    isGesture: false,
    isRun: false,
    isInited : false,
    intIndex: 1,
    itemWidth: 0,
    itemLen: 0,
    interval: null,
    bug: 0,
    init: function () {
        var deviceWidth, deviceHeight;
        deviceWidth = $(document).width();
        if (deviceWidth == 320) {
            deviceHeight = 167;
        }
        else if (deviceWidth == 375) {
            deviceHeight = 196;
        } else {
            deviceHeight = 217;
        }
        $('#slidebox').find('li').css({ 'width': (deviceWidth + 'px'), 'height': (deviceHeight + 'px') });

        slide.itemLen = $('#slidebox').find('li').length;
        slide.itemWidth = $(document).width();

        var ulSlide = $('#slidebox').find('ul');
        var liFirst = $(ulSlide).find("li").first().clone();
        var liLast = $(ulSlide).find("li").last().clone();
        $(ulSlide).append(liFirst).prepend(liLast);

        $('#slidebox').css({ "width": slide.itemWidth * (slide.itemLen + 2) });
        slide.bind();
        slide.isInited = true;
    },
    bind: function () {

        if (slide.slidePanle != null) {
            slide.slidePanle.destroy();
            slide.slidePanle = null;
        }
        slide.stop();
        slide.slidePanle = new iScroll('divSlidePanle', {
            momentum: false,
            hScrollbar: false,
            vScrollbar: false,
            bounce: false,
            vScroll: false
        });

        slide.intIndex = 1;

        slide.slidePanle.scrollTo(0 - slide.itemWidth, 0, 0, false);
        $("#olSlideNum").find("li:eq(0)").addClass("cur").siblings().removeClass("cur");

        slide.slidePanle.disable();

        fnslide(jQuery);
        $("#divSlidePanle").touchwipe({
            min_move_x: 20,
            min_move_y: 40,
            wipeLeft: function () {
                slide.scroll(true);
            },
            wipeRight: function () {
                slide.scroll(false);
            },
            preventDefaultEvents: false
        });

        slide.start();
    },
    show: function () {
        if (!$(".fouce").is(":visible")) {
            $(".fouce").show();
            slide.bind();
        }
    },
    hide: function () {
        $(".fouce").hide();
        slide.stop();
    },
    scroll: function (isLeft) {

        if (slide.isRun) {
            slide.bug++;
            if (slide.bug > 1) {
                slide.isRun = false;
                slide.bug = 0;
            }
            return;
        }

        slide.isRun = true;
        slide.stop();

        if (isLeft) {
            slide.intIndex += 1;
        }
        else {
            slide.intIndex -= 1;
        }

        var scrollNum = 0 - slide.intIndex * slide.itemWidth;
        var time = 200;
        slide.slidePanle.scrollTo(scrollNum, 0, time, false);

        setTimeout(function () {

            if (slide.intIndex > slide.itemLen) {
                slide.slidePanle.scrollTo(0 - slide.itemWidth, 0, 0, false);
                slide.intIndex = 1;
                $("#olSlideNum").find("li:eq(0)").addClass("cur").siblings().removeClass("cur");
            }
            else if (slide.intIndex < 1) {
                slide.slidePanle.scrollTo(0 - slide.itemWidth * slide.itemLen, 0, 0, false);
                slide.intIndex = slide.itemLen;
                $("#olSlideNum").find("li:eq(" + (slide.itemLen - 1) + ")").addClass("cur").siblings().removeClass("cur");
            }
            else {
                $("#olSlideNum").find("li:eq(" + (slide.intIndex - 1) + ")").addClass("cur").siblings().removeClass("cur");
            }

            slide.isRun = false;
            slide.start();
        }, time + 10);
    },
    start: function () {
        slide.interval = setInterval(function () {
            slide.scroll(true);
        }, 4000);
    },
    stop: function () {
        if (slide.interval != null) {
            clearInterval(slide.interval);
            slide.interval = null;
        }
    }
};

//手势操作
var fnslide = function (a) {
    a.prototype.touchwipe = function (c) {
        var b = {
            min_move_x: 20,
            min_move_y: 20,
            wipeLeft: function () {
            },
            wipeRight: function () {
            },
            wipeUp: function () {
            },
            wipeDown: function () {
            },
            wipe: function () {
            },
            wipehold: function () {
            },
            preventDefaultEvents: true
        };
        if (c) {
            a.extend(b, c);
        }
        this.each(function () {
            var h;
            var g;
            var j = false;
            var i = false;
            var e;

            function m() {
                this.removeEventListener("touchmove", d);
                h = null;
                j = false;
                clearTimeout(e);
            }

            function d(q) {
                if (b.preventDefaultEvents) {
                    q.preventDefault();
                }
                if (j) {
                    var n = q.touches[0].pageX;
                    var r = q.touches[0].pageY;
                    var p = h - n;
                    var o = g - r;
                    if (Math.abs(p) >= b.min_move_x) {
                        q.preventDefault();
                        m();
                        if (p > 0) {
                            b.wipeLeft();
                        } else {
                            b.wipeRight();
                        }
                    } else {
                        if (Math.abs(o) >= b.min_move_y) {
                            m();
                            if (o > 0) {
                                b.wipeUp();
                            } else {
                                b.wipeDown();
                            }
                        }
                    }
                }
            }

            function k() {
                clearTimeout(e);
                if (!i && j) {
                    b.wipe();
                }
                i = false;
            }

            function l() {
                i = true;
                b.wipehold();
            }

            function f(n) {
                if (n.touches.length == 1) {
                    h = n.touches[0].pageX;
                    g = n.touches[0].pageY;
                    j = true;
                    this.addEventListener("touchmove", d, false);
                    e = setTimeout(l, 750);
                }
            }

            if ("ontouchstart" in document.documentElement) {
                this.addEventListener("touchstart", f, false);
                this.addEventListener("touchend", k, false);
            }
        });
        return this;
    };
    a.extend(a.prototype.touchwipe, 1);
};

var subString = {
    thisStr: "",
    thisLen: 10,
    thisFlag: true,
    autoAddEllipsis: function (pStr, pLen, pFlag) {
        this.thisStr = pStr;
        this.thisLen = pLen;
        this.thisFlag = pFlag;
        var _ret = this.cutString();
        var _cutFlag = _ret.cutflag;
        var _cutStringn = _ret.cutstring;
        if ("1" == _cutFlag && this.thisFlag) {
            return _cutStringn + "...";
        } else {
            return _cutStringn;
        }
    },
    cutString: function () {
        var pStr = this.thisStr;
        var pLen = this.thisLen;
        var pFlag = this.thisFlag;
        var _strLen = this.thisStr.length;
        var _tmpCode;
        var _cutString;
        var _cutFlag = "1";
        var _lenCount = 0;
        var _ret = false;
        if (_strLen <= pLen / 2) {
            _cutString = pStr;
            _ret = true;
        }
        if (pFlag) {
            pLen = pLen - 3;
        }
        if (!_ret) {
            for (var i = 0; i < _strLen; i++) {
                if (this.isFull(pStr.charAt(i))) {
                    _lenCount += 2;
                } else {
                    _lenCount += 1;
                }
                if (_lenCount > pLen) {
                    _cutString = pStr.substring(0, i);
                    _ret = true;
                    break;
                } else if (_lenCount == pLen) {
                    _cutString = pStr.substring(0, i + 1);
                    _ret = true;
                    break;
                }
            }
        }
        if (!_ret) {
            _cutString = pStr;
            _ret = true;
        }
        if (_cutString.length == _strLen) {
            _cutFlag = "0";
        }
        return { "cutstring": _cutString, "cutflag": _cutFlag };
    },
    isFull: function (pChar) {
        if ((pChar.charCodeAt(0) > 128)) {
            return true;
        } else {
            return false;
        }
    }
};

