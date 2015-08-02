var gallerySwiper = {

    changeSize: function () {
        //Unset Width
        $('.swiper-slide').css('width','')
        //Get Size
        var imgWidth = $('.swiper-slide img').width();
        if (imgWidth+160>$(window).width()) {
            imgWidth = $(window).width()-160+40;
        }
        //Set Width
        $('.swiper-slide').css('width', imgWidth);
    }
    
    // changeSize();   
    // console.log("代码笔记");
    // $(window).resize(function(){
    //     changeSize()
    //     gallery.resizeFix(true) 
    // })
}
