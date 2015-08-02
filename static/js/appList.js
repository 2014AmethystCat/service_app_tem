var appServerUrl = "http://livew.mobdsp.com/cb"; var callback = "callback=?";
// var localServerUrl = "http://127.0.0.1:5000"; var callback = "callback=?";
var milkPapaServerUrl = "http://app.milkpapa.com:5000";
var isAutoLogin = true;
var checkNetworkInterval = 1500; // ms
var checkNetworkUrl = "http://115.159.3.16/cb/app_test";
var countDownTimer = null;
var checkNetworkTimer = null;
var connectedSSID = null;

(function($){
    $.ajaxSetup({
        timeout: 10000,
        cache: false,
        error: function (x, e) {
            showLoader("T_T 网络出问题了，请稍后再试");
            setTimeout("hideLoader()", 3000);
        }
    });
})(jQuery);
// js-Android interface
var updateDownloadProgress = function (progress) {
    $('.load-bar').show();
    $('#counter').html(progress+'%');
    $('.wrapper .load-bar-inner').width(progress+'%');
    var offset = (323+25)*progress/100 - 25;
    // console.log('counter offset:'+offset);
    $('.wrapper #counter').css('left', offset+'px');
}
// js-Android interface
var finishDownloadProgress = function () {
    $('.load-bar').hide();
}
// js-Android interface
var appInstallFinished = function (appId) {
    var phone_number = $(".acount_list #account").text();
    var url = appServerUrl+"/download_report?"+callback+"&appid="+appId+"&phone_number="+phone_number;
    console.log("Report app install:"+url);

    $.ajax({
        type: "GET",
        url: url,
        data: '',
        dataType: "jsonp",
        xhrFields: {
            withCredentials: true
        },
        crossDomain: true,
        success: function (data, textStatus) {
            if (data.ret_code == 0) {
                showLoader('您现在有 '+data.coin_num+' 个金币了');
                setTimeout("hideLoader()", 3000);
                $("#coin").text(data.coin_num);
            } else {
                showLoader(data.ret_msg);
            }
            setTimeout("hideLoader()", 3000);
        },
    });
}
// js-Android interface
var wifiStatusChanged = function (ssid) {
    if ($(".acount_list #account").text() == '') {
        console.log('wifiStatusChanged: not login yet.');
        return;
    }
    if (window.android != undefined) {
        if (ssid != undefined) {
            connectedSSID = ssid;
            console.log("wifiStatusChanged: wifi is available, ssid:"+ssid);
            $(".wifiStatus .statusOn").text(connectedSSID+' 已连接');
            me.checkNetwork();
        } else {
            console.log("wifiStatusChanged: wifi is unavailable.");
            $(".wifiStatus .statusOff").show();
            $(".wifiStatus .statusOn").hide();
        }
    } else {
        console.log("wifiStatusChanged: window.android undefined.");
    }
}

$("#LoginPage").on("pageinit", function () {
    console.log("login page init");
    $("#loginUsername").attr("value", localStorage.getItem("userName"));
    $("#loginPassword").attr("value", localStorage.getItem("passWord"));
    $("#checkbox-1").prop("checked",  localStorage.getItem("rmbUser")).checkboxradio("refresh");
});

$("#LoginPage").on("pagebeforeshow", function () {
    console.log("login page show");
    me.showBackBtn(false);
    if (isAutoLogin && $("#loginUsername").val()!='' && $("#loginUsername").val()!='手机号' && isPhoneNumber($("#loginUsername").val())
        && $("#loginPassword").val()!='') {
        me.login();
    }
});

$("#RegisterPage").on("pagebeforeshow", function () {
    console.log("register page show");
    me.showBackBtn(true);
    if (me.isChangingPassword) {
        setTitle("修改密码");
    } else {
        setTitle("注册");
    }

    $("#registPassword").val('');
    $("#registVerifyCode").val('');
    $("#repeatPassword").val('');
});

$("#MainPage").on("pageinit", function() {
    console.log("main page init");
    // use fastClick will cause pop to home page when tap the tab on PC.
    $("#connectionBtn").click(function() {me.showTab(0);});
    $("#excellentBtn").click(function() {me.showTab(1);});
    $("#mineBtn").click(function() {me.showTab(2);});

    me.requestAppAds();
    me.requestAppList();
    me.getVersion();    
    me.requestKulianWifi();

    // me.checkNetwork();
});

$("#MainPage").on("pagebeforeshow", function () {
    console.log("main page before show");
    me.showBackBtn(false);
    me.showTab(me.currentTabIdx);

    finishDownloadProgress();
});

$("#MainPage").on("pageshow", function () {
    console.log("main page show");
    if (window.android != undefined) {
        window.android.checkConnection();
    }
});

$("#AppDetailPage").on("pagebeforeshow", function () {
    me.showBackBtn(true);
});

$("#AppDetailPage").on("pageshow", function () {
    var gallery = $('.swiper-container').swiper({
        slidesPerView:'auto',
        watchActiveIndex: true,
        centeredSlides: true,
        pagination:'.pagination',
        paginationClickable: true,
        resizeReInit: true,
        keyboardControl: true,
        grabCursor: true,
        onImagesReady: function(){
            gallerySwiper.changeSize();
        }
    });
    gallerySwiper.changeSize();
});

$("#ExchangePage").on("pagebeforeshow", function () {
    me.showBackBtn(true);
    $(".exchangeHeader .coin_num").text($("#coin").text());
});

$("#logoutBtn").fastClick(function() {
    isAutoLogin = false;
    changePage("#LoginPage");
});

$("#registBtn").fastClick(function() {
    me.register();
});

$("#loginBtn").fastClick( function() {
    me.login();
    isAutoLogin = true;
});

$("#coin").fastClick( function() {
    changePage("#ExchangePage");
});

$("input").bind("focus", function() { 
    if ($(this).attr("value")=='手机号')
        $(this).attr("value",""); 
});

$(".verifyCodeBtn").fastClick(function() {
    me.requestVerifyCode();
});

$(".changePwdBtn").fastClick(function() {
    me.isChangingPassword = true;
    changePage("#RegisterPage");
});

$(".qqBtn").fastClick(function() {
    console.log("QQ");
    if (window.android != undefined) {
        window.android.openQQ('123456789');
    }
});

$(".feedbackBtn").fastClick(function() {
    console.log("feedback");
    if (window.android != undefined) {
        window.android.feedback();
    }
});

$("#toRegistBtn").fastClick(function() {
    me.isChangingPassword = false;
    changePage("#RegisterPage");
});

$(".wifiStatus img").fastClick(function() {
    if ($(".wifiStatus .statusOn").css("display") == 'none') {
        me.connectWifi(this);
        me.checkNetwork();
    }
});

$(".exchange_item").fastClick(function() {
    me.requestExchange(this);
});

$(".refresh-app-list").fastClick(function() {
    me.requestAppList();
});

var me = {
    countDownSeconds : 0, 
    isChangingPassword : false,
    currentTabIdx : 0,
    kuLianWifi : null,
    appList : null,

    showBackBtn : function (isShowBackBtn) {
        console.log("showBackBtn:"+isShowBackBtn);
        if (window.android != undefined) {
            window.android.showBackBtn(isShowBackBtn);
        }
        if (isShowBackBtn) {
            console.log("ShowBackBtn: history.length:"+window.history.length);
        }
    },

    checkNetwork : function() {
        clearTimeout(checkNetworkTimer);
        var url = checkNetworkUrl + "?mobile="+$("#account").text();
        console.log("checkNetwork: "+checkNetworkUrl);
        $("#statusDesc").text("检查网络...");
        $.ajax({
            type: "GET",
            url: url,
            dataType : "jsonp",
            jsonp: "callback",//"callname",//服务端用于接收callback调用的function名的参数
            // jsonpCallback:"success",//callback的function名称  todo：启用会造成appdetail无法获取？？
            success : function(data) {
                        console.log("checkNetwork success.");
                        $("#statusDesc").text("网络连接成功");
                        $(".wifiStatus .statusOn").show();
                        $(".wifiStatus .statusOff").hide();
                      },
            error : function() {
                        console.log("checkNetwork fail.");
                        $("#statusDesc").text("网络连接失败");
                        $(".wifiStatus .statusOn").hide();
                        $(".wifiStatus .statusOff").show();
                        
                        checkNetworkTimer = setTimeout(me.authentication(), checkNetworkInterval);
                      }
        });
    },

    authentication : function() {
        console.log("authentication.");
        clearTimeout(checkNetworkTimer);
        $("#statusDesc").text("认证中...");
        if (checkNetworkInterval > 10000) {
            checkNetworkInterval = 1500;
            console.log("authentication timeout.");
            $("#statusDesc").text("认证超时");
            return;
        }
        var authUrl = "http://182.254.140.228/portaltt/Logon.html";
        $.ajax({
            type: "GET",
            crossDomain: true,
            url: authUrl,
            data: '',
            dataType : "jsonp",
            // jsonp: "callback",//服务端用于接收callback调用的function名的参数
            // jsonpCallback:"success_jsonpCallback",//callback的function名称
            success : function(data, textStatus) {
                        $("#statusDesc").text("认证成功");
                        // checkNetworkTimer = setTimeout(me.checkNetwork(), checkNetworkInterval);
                      },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                    // alert(XMLHttpRequest.status);
                    if (XMLHttpRequest.status == 302) {
                        $("#statusDesc").text("认证成功");
                        // checkNetworkTimer = setTimeout(me.checkNetwork(), checkNetworkInterval);
                    } else {
                        console.log("authentication fail.");
                        $("#statusDesc").text("认证失败");
                        // checkNetworkTimer = setTimeout(me.authentication(), checkNetworkInterval);
                    }
            }
        });

        checkNetworkTimer = setTimeout(me.checkNetwork(), checkNetworkInterval);
        // end

        checkNetworkInterval = checkNetworkInterval + 1000;
    },

    showTab : function(idx) {
        var tabs = new Array("connectionView", "choiceView", "mineView");
        for (var i = 0; i < tabs.length; i++) {
            if (i == idx) {
                $("#" + tabs[i]).show();
                $("#" + tabs[i] + "Btn").addClass("ui-btn-active");
            } else {
                $("#" + tabs[i]).hide();
                $("#" + tabs[i] + "Btn").removeClass("ui-btn-active");
            }
        }
        me.currentTabIdx = idx;
        if (idx == 1 && slide.isInited == true) {
            slide.show();
        } else {
            slide.hide();
        }
        var titles = new Array("连接", "精选", "我的");
        setTitle(titles[idx]);
    },

    requestKulianWifi : function()
    {
        // var url = milkPapaServerUrl+"/kulianwifi?"+callback;
        // console.log("requestKulianWifi:"+url);
        // $.getJSON(url, function(data) {
            var data = {"wifilist": [ {"SSID":"@小鸿科技","password":""}]};
            me.kuLianWifi = data;
            me.requestWifiList();
        // });
    },

    requestAppAds : function()
    {
        var url = appServerUrl+"/appad?"+callback;
        console.log("requestAppAds:"+url);
        $.getJSON(url, function(data) {
            // var obj = eval("(" + data +")");
            if (data.total_count != undefined && data.total_count > 0) {
                me.parseAppAds(data);
                slide.init();
                $("#olSlideNum").hide();
                if (me.currentTabIdx == 1) {
                    $(".fouce").show();
                }
            }
        });
    },

    parseAppAds : function(data)
    {
    // console.log(data);
        // var obj = eval("("+data+")"); // json to object
        var html = me.appAdsTemplate(data);

        $("#adlist").empty();
        $("#adlist").append(html);
    },

    appAdsTemplate : function(data)
    {
        var ads = data.adlist;
        var arrHtml = new Array();

        for (var i = 0; i < ads.length; i++) {
            arrHtml.push("<li>");
            arrHtml.push("<a href=\"" + ads[i].Link + "\">");
            arrHtml.push("<img src=\"" + ads[i].ImageSrc + "\" />");
            arrHtml.push("</a>");
            arrHtml.push("</li>");
        }
        return arrHtml.join("");
    },

    requestWifiList : function()
    {
        if (window.android == undefined) {
            var url = milkPapaServerUrl + "/wifilist?"+callback;
            console.log("requestWifiList:" + url);
            $.getJSON(url, function(data) {
                me.parseWifiList(data);
            });
        } else {
            var jsonStr= window.android.wifiListJsonString();
            var obj = eval("(" + jsonStr +")");
            me.parseWifiList(obj);
        }
        wifiStatusChanged();
    },

    parseWifiList : function(data)
    {
        // var html = me.wifiListTemplate(data);

        // $("#connectionView .wifi-list").empty();
        // $("#connectionView .wifi-list").append(html);

        // $("#connectionView .wifi-list li").fastClick(function() {
        //    me.connectWifi(this);
        // });
        var arrKuLianWifi = me.kuLianWifi.wifilist;
        var arrWifiList = data.wifilist;

        for (var i = 0; i < arrWifiList.length; i++) {

            var isKuLian = false;
            var passwd = "";
            for (var j = 0; j < arrKuLianWifi.length; j++) {
                if (arrKuLianWifi[j].SSID == arrWifiList[i].SSID) {
                    isKuLian = true;
                    passwd = arrKuLianWifi[j].password;
                    // $(".wifiStatus .statusOn").text(connectedSSID+' 已连接');// arrWifiList[i].SSID
                    $(".wifiStatus").data("wifissid", arrWifiList[i].SSID);
                    $(".wifiStatus").data("wifipasswd", passwd);
                    break;
                }
            }
        }
    },

    wifiListTemplate : function(res)
    {
        var data = res.wifilist;
        var arrHtml = new Array();
        var arrKuLianWifi = me.kuLianWifi.wifilist;

        for (var i = 0; i < data.length; i++) {

            var isKuLian = false;
            var passwd = "";
            for (var j = 0; j < arrKuLianWifi.length; j++) {
                if (arrKuLianWifi[j].SSID == data[i].SSID) {
                    isKuLian = true;
                    passwd = arrKuLianWifi[j].password;
                    $(".wifiStatus").data("wifissid", data[i].SSID);
                    $(".wifiStatus").data("wifipasswd", passwd);
                    break;
                }
            }

            var level = Math.abs(data[i].level);
            if (level > 90) { level = 1;}
            else if (level > 70) { level = 2; }
            else if (level > 50) { level = 3; }
            else { level = 4; }
            arrHtml.push("<li data-wifissid='"+data[i].SSID+"' data-wifipasswd='"+passwd+"' class=\"index-item list-index\" >"); // style=\"display:none;\"
            arrHtml.push("<div class=\"index-item-main\">");
            arrHtml.push("<dl class=\"clearfix\">");
            arrHtml.push("<dt class=\"item-icon\">");
            arrHtml.push("<img src=\"images/wifi_signal_"+ level +".png\" />");
            arrHtml.push("</dt>");
            arrHtml.push("<dd class=\"item-title\">");
            arrHtml.push("<div class=\"wifi-SSID\">");
            arrHtml.push(subString.autoAddEllipsis(data[i].SSID, 22, true));
            arrHtml.push("</div>");
            if (isKuLian) {
                arrHtml.push("<div class=\"wifi-desc\">可连接</div>");
            }
            arrHtml.push("</dd></dl></div>");
            arrHtml.push("</li>");
        }

        return arrHtml.join("");
    },

    connectWifi : function (obj)
    {
        if (window.android != undefined) {
            var ssid = $(obj).data("wifissid");
            var pwd = $(obj).data("wifipasswd");
            if (ssid == undefined) {
                ssid = me.kuLianWifi.wifilist[0].SSID;
                pwd = me.kuLianWifi.wifilist[0].password;
            }

            console.log("connectWifi " + ssid);
            showLoader("正在连接Wifi，请稍候");
            setTimeout("hideLoader()", 3000);

            window.android.connectWifi(ssid, pwd);
        } else {
            console.log("try to connect wifi but window.android is undefined");
        }
    },

    requestAppList : function()
    {
    	showLoader();
        $(".refresh-app-list").show();
        var url = appServerUrl+"/applist?"+callback;
        console.log("requestAppList:" + url);
        $.getJSON(url, function(data) {
    		hideLoader();
            me.appList = data;
    		me.parseAppList(data);
    	});
    },

    parseAppList : function(data)
    {
        // console.log(data);
    	// var obj = eval("("+data+")"); // json to object
    	var html = me.appListTemplate(data);

        // $("#"+currentCat+" .app-list").empty();
        // $("#"+currentCat+" .app-list").append(html);

        $(".app-list").empty();
        $(".app-list").append(html);

        $(".app-list li").fastClick(function() {
           me.clickOnApp(this);
        });
        $(".app-list .installBtn").fastClick(function() {
           me.downloadApp(this);
           $(this).addClass("inactive");
        });
    },

    appListTemplate : function(res)
    {
        var data = res.chosenapplist;
        var arrHtml = new Array();

        if (data.length > 0) {
            $(".refresh-app-list").hide();
        }

        for (var i = 0; i < data.length; i++) {

            if (data[i].PackageName == undefined) {
                break;
            }

            var isAppInstalled = false;
            if (window.android != undefined && window.android.isAppInstalled(data[i].PackageName, 1)) {
                isAppInstalled = true;
            }

            arrHtml.push("<li data-appid='" + data[i].AppId + "' id=\"myId" + data[i].AppId +"\" class=\"index-item list-index\" >");
            arrHtml.push("<div class=\"index-item-main\">");
            arrHtml.push("<dl class=\"clearfix\">");
            arrHtml.push("<dt class=\"item-icon\"><span class=\"app-tags hide\"></span>");
            arrHtml.push("<img src=\"" + data[i].AppLogo + "\" />");
            arrHtml.push("</dt>");
            arrHtml.push("<dd class=\"item-title\">");
            arrHtml.push("<div class=\"item-title-sname\">");
            arrHtml.push("<div class=\"baiying-name\">");
            arrHtml.push(subString.autoAddEllipsis(data[i].AppName, 30, true) + "</div></div></dd>");
            arrHtml.push("<dd class=\"item-star\">");
            // arrHtml.push("<span class=\"score-star\"><span style=\"width:" + data[i].AppScore + "%;\"></span></span>");

            if (data[i].AppSize != "") {
                // var size = parseFloat(data[i].AppSize/1000000).toFixed(1) + "MB";
                arrHtml.push("<span class=\"new-item-size\">" + data[i].AppSize + "</span>");
            }

            arrHtml.push("</dd>");
            arrHtml.push("<dd>");
            arrHtml.push("<div class=\"xiaobian-comment\">");
            arrHtml.push(data[i].BriefSummary == "" ? "暂无介绍" : subString.autoAddEllipsis(data[i].BriefSummary, 34, true));
            arrHtml.push("</div></dd></dl></div>");

            arrHtml.push("<div class='coin_num' >+"+data[i].GiveCoin+"</div>");
            arrHtml.push("<img class='coin_icon' src='images/coins.png' />");

            if (isAppInstalled) {
                arrHtml.push("<div class='ui-btn installBtn inactive' data-installed='YES' ></div>");
            } else {
                arrHtml.push("<div class='ui-btn installBtn' data-installed='NO' data-appname=\""+data[i].AppName+"\" data-appurl=\""+data[i].AppSource+"\" data-appid="+data[i].AppId+" data-pkgname=\""+data[i].PackageName+"\"></div>");
            }

            arrHtml.push("</li>");
        }

        return arrHtml.join("");
    },

    getAppInfoById : function (appId)
    {
        var choosenAppList = me.appList.chosenapplist;
        for (var i = 0; i < choosenAppList.length; i++) {
            if (choosenAppList[i].AppId == appId) {
                return choosenAppList[i];
            }
        }
        return null;
    },

    clickOnApp : function (obj)
    {
        var appId = $(obj).data("appid");
        me.requestAppDetail(appId);
    },

    requestAppDetail : function (appId)
    {
        var url = appServerUrl+"/appdetail?"+callback+"&apptype=1&appid="+appId;
        console.log(url);
        showLoader();
        $.getJSON(url, function(data) {
            hideLoader();
            me.parseAppDetail(data);
        });
    },

    parseAppDetail : function (data)
    {
    	$(".appDetail").empty();
        // var obj = eval("("+data+")");
        var html = me.appDetailTemplate(data.detail_info);
        $(".appDetail").append(html);

        $(".content-BaiYingFreeDownload").fastClick(function() {
           me.downloadApp(this);
        });

        $.mobile.changePage("#AppDetailPage", "slideup");
    },

    downloadApp : function (obj)
    {
        console.log("downloadApp");
        if ($(obj).data("installed") == 'YES') {
            showLoader("您已经安装了这个软件");
            setTimeout("hideLoader()", 2000);
            return;
        }

        if (window.android != undefined) {
            var appId = $(obj).data("appid");
            var appInfo = me.getAppInfoById(appId);
            if (appInfo != null) {
                var mac = window.android.getMacAddress();
                var url= appInfo.Clickurl.replace("[M_MAC]", mac);
                var imei = window.android.getIMEI();
                url = url.replace("[M_IMEI]", imei);
                $.getJSON(url, function(data) {
                    console.log("report click:"+url);
                });
            }

            window.android.downloadApp(appId, $(obj).data("appname"), $(obj).data("pkgname"), $(obj).data("appurl"));
            showLoader("开始下载，完成安装前请不要退出本应用");
            setTimeout("hideLoader()", 2000);
        } else {
            console.log("window.android undefined. url:" + $(obj).data("appurl"));
        }
    },

    appDetailTemplate : function(data)
    {
        var arrHtml  = new Array();
        arrHtml.push(me.appIntroTemplate(data));

        // arrHtml.push("<div class='snapshot'>");
        // for (var i = 0; i < data.ImageSrcList.length; i++) {
        //   arrHtml.push("<img src='" + data.ImageSrcList[i] + "'>");
        // }
        arrHtml.push("<div class='swiper-container'><div class='pagination' style='display:none;'></div><div class='swiper-wrapper' style='width:2424px;'>");
        for (var i = 0; i < data.ImageSrcList.length; i++) {
          arrHtml.push("<div class='swiper-slide'><div class='inner'> <img src='" + data.ImageSrcList[i] + "' alt=''> </div></div>");
        }
        arrHtml.push("</div></div>");
        arrHtml.push(me.descriptionTemplate(data))
        return arrHtml.join("");
    },

    appIntroTemplate : function (data)
    {
        var isAppInstalled = false;
        if (window.android != undefined && window.android.isAppInstalled(data.PackageName, 1)) {
            isAppInstalled = true;
        }

        var arrHtml = new Array();
        arrHtml.push("<section class=\"intro\">");
        arrHtml.push("<div class=\"icon-brief\">");
        arrHtml.push("<div class=\"icon\">");
        arrHtml.push("<img src=\"" + data.AppLogo + "\" alt=\"\" />");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"content-brief\">");
        arrHtml.push("<span class=\"sname contentAppName\">" + data.AppName+ "</span>");
        // arrHtml.push("<br>");
        // arrHtml.push("<span class=\"score-star\">");
        // arrHtml.push("<span style=\"width: " + data.AppScore + "%;\">");
        // arrHtml.push("</span>");
        // arrHtml.push("</span>");
        // arrHtml.push("<br>");
        arrHtml.push("<div class=\"download_size\">");
        arrHtml.push("<span>");
        // var size = parseFloat(data.AppSize/1000000).toFixed(1) + "MB";
        arrHtml.push("v" + subString.autoAddEllipsis(data.AppVersion, 10, false) + "&nbsp;|&nbsp;" + data.AppSize);
        arrHtml.push("</span>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");

        arrHtml.push("</div>");
        // var gaAppName = data.AppName.replace(/\"/g, "”").replace(/'/g, "’");

        arrHtml.push("<div id=\"divdownarea\" class=\"down-area\">");
        arrHtml.push("<div class=\"content-btn-con\">");
        arrHtml.push("<a class=\"content-BaiYingFreeDownload\" data-appurl=\""+data.AppSource+"\" data-appname=\""+data.AppName+"\" data-appid=\""+data.AppId+"\" data-pkgname=\""+data.PackageName+"\" ");
        if (isAppInstalled) {
            arrHtml.push("data-installed='YES' >已安装</a>");
        } else {
            arrHtml.push("data-installed='NO' >安装</a>");
        }
        arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</section>");

        return arrHtml.join("");
    },

    descriptionTemplate : function (data)
    {
        var arrHtml = new Array();
        arrHtml.push("<section class=\"description\">");
        arrHtml.push("<div class=\"content-navdes-wrapper\">");
        arrHtml.push("<div class=\"des-main\">");
        // arrHtml.push("<div class=\"des-indent des-short\">");

        arrHtml.push("<div class=\"des-long-content\">");
        // arrHtml.push("<p>" + data.BriefSummary + "</p>");
        arrHtml.push("<p>" + data.AppSummary.replace(/\r\n/g,"<br/>").replace(/\\n/g,"<br/>").replace(/\n/g,"<br/>") + "</p>");
        arrHtml.push("</div>");
        // arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</section>");
        return arrHtml.join("");
    },

    //获取查询参数
    parseQueryString : function ()
    {
        var str = window.location.search;
        var objURL = {};
        str.replace(
            new RegExp("([^?=&]+)(=([^&]*))?", "g"),
            function ($0, $1, $2, $3) {
                objURL[$1] = $3;
            }
        );
        return objURL;
    },

    showMessage : function ()
    {
        $("#twitter li:not(:first)").css("display","none");
        var B = $("#twitter li:last");
        var C = $("#twitter li:first");
        setInterval(function() {
            if (B.is(":visible")) {
                C.fadeIn(500).addClass("in");
                B.hide()
            } else {
                $("#twitter li:visible").addClass("in");
                $("#twitter li.in").next().fadeIn(500);
                $("li.in").hide().removeClass("in");
            }
        },3000); //每3秒切换一条
    },

    requestVerifyCode : function()
    {
        if ($(".verifyCodeBtn").hasClass("text_disabled")) {
            console.log("Please wait...");
            return;
        }

        var phone_number = $("#registPhoneNumber").val();
        if (phone_number == '' || phone_number == '手机号' || !isPhoneNumber(phone_number)) {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return;
        }
        var url = appServerUrl+"/appverifycode?"+callback+"&phone_number="+phone_number;
        console.log(url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                showLoader("验证码已通过短信发送");
                setTimeout("hideLoader()", 2000);
                $(".verifyCodeBtn").addClass("text_disabled");
                me.countDownSeconds = 60;
                setTimeout("me.countDown()", 1000);
                $(".verifyCodeBtn").attr("disabled","disabled");
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        }
    )},

    countDown : function()
    {
        $(".verifyCodeBtn").text(me.countDownSeconds + "秒");
        me.countDownSeconds = me.countDownSeconds - 1;
        if (me.countDownSeconds <= 0) {
            me.resetCountDown();
        } else {
            countDownTimer = setTimeout("me.countDown()", 1000);
        }
    },

    resetCountDown : function ()
    {
        if (countDownTimer != null) {
            clearTimeout(countDownTimer);
            countDownTimer = null;
        }
        $(".verifyCodeBtn").removeClass("text_disabled").text("获取验证码");
        $(".verifyCodeBtn").attr("disabled","");
    },

    validLogin : function()
    {
        if ($("#loginUsername").val()=='' || $("#loginUsername").val()=='手机号' || !isPhoneNumber($("#loginUsername").val())) {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#loginPassword").val()=='') {
            showLoader("请填写密码");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        return true;
    },

    validRegist : function()
    {
        if ($("#registPhoneNumber").val()=='' || $("#registPhoneNumber").val()=='手机号' || !isPhoneNumber($("#registPhoneNumber").val())) {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#registVerifyCode").val()=='') {
            showLoader("请填写验证码");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#registPassword").val()=='') {
            showLoader("请填写密码");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#registPassword").val().length>16) {
            showLoader("密码长度不能超过16位");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        var filter=/[`~!@#$^&*()\-\+=|\\\[\]\{\}:;'\,.<>/?]/;
        if (filter.test($("#registPassword").val())) {
            showLoader("密码只能包含字母、数字和下划线");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#repeatPassword").val()!=$("#registPassword").val()) {
            showLoader("两次输入的密码不一致");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        return true;
    },

    register : function ()
    {
        if (me.validRegist()) {
            var phone_number = $("#registPhoneNumber").val();
            var passwd       = $("#registPassword").val();
            var verify_code  = $("#registVerifyCode").val();
            if (me.isChangingPassword) {
                var url = appServerUrl+"/reset_passwd?"+callback+"&phone_number="+phone_number+"&new_passwd="+passwd+"&verify_code="+verify_code;
            } else {
                var url = appServerUrl+"/appregister?"+callback+"&phone_number="+phone_number+"&passwd="+passwd+"&verify_code="+verify_code;
            }

            console.log(url);

            $.getJSON(url, function(data) {
                me.resetCountDown();  // 重置验证码倒计时
                if (data.ret_code == 0) {
                    if (me.isChangingPassword == false) {
                        me.saveToken(data.token);
                        showLoader("注册成功");
                    } else {
                        showLoader("密码修改成功");
                    }

                    if (data.coin_num == undefined) {
                        data.coin_num = 0;
                    }
                    $("#coin").text(data.coin_num);

                    setTimeout("changePageAndHideLoader(\"#MainPage\")", 2000);
                    $("#account").text(phone_number);

                } else {
                    showLoader(data.ret_msg);
                    setTimeout("hideLoader()", 3000);
                }
            });
        }
    },

    login : function()
    {
        if (me.validLogin()) {
            var phone_number = $("#loginUsername").val();
            var passwd       = $("#loginPassword").val();
            var url = appServerUrl+"/applogin?"+callback+"&phone_number="+phone_number+"&passwd="+passwd;
            console.log(url);
            showLoader("登录中，请稍候");

            $.getJSON(url, function(data) {
                hideLoader();
                if (data.ret_code == 0) {
                    me.saveToken(data.token);
                    changePage("#MainPage");
                    console.log("login success, coin num:" + data.coin_num);
                    if (data.coin_num == undefined) {
                        data.coin_num = 0;
                    }

                    $("#account").text(phone_number);
                    $("#coin").text(data.coin_num);

                    if ($("#checkbox-1").prop("checked") == true) { 
                        localStorage.setItem("rmbUser", "true");
                        localStorage.setItem("userName", phone_number);
                        localStorage.setItem("passWord", passwd);
                    } else {
                        localStorage.setItem("rmbUser", "false");
                        localStorage.setItem("userName", '');
                        localStorage.setItem("passWord", '');
                    }

                } else {
                    showLoader(data.ret_msg);
                    setTimeout("hideLoader()", 3000);
                }
            });
        }
    },

    requestExchange : function(obj)
    {
        var myCoin = parseInt($("#coin").text());
        var needCoin = $(obj).data("coin");
        if (myCoin < needCoin) {
            showLoader("您的金币数不足");
            setTimeout("hideLoader()", 3000);
            return;
        }
        var type = $(obj).data("exchangetype");
        var phone_number = $(".acount_list #account").text();
        var url = appServerUrl+"/exchange?"+callback+"&phone_number="+phone_number+"&coin="+needCoin+"&exchange_type="+type;
        console.log(url);
        showLoader();

        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                showLoader("话费兑换申请已提交，将在两个工作日内充值到您手机号码内");
                $("#coin").text(data.coin_num);// update coin num
                setTimeout("changePageAndHideLoader(\"#MainPage\")", 3000);
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    },

    saveToken : function(token)
    {
        $.cookie("token", token, {expires:10});
    },

    getVersion : function()
    {
        if (window.android != undefined) {
            $("#version").text(window.android.getVersion());
        }
    }
}; // end of var me
