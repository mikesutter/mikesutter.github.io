$(document).ready(function(){
    
    $('.project-gallery-slider').slick({
        accessibility: true,
        adaptiveHeight: true,
        arrows: true,
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1
    });

    $(window).on('resize orientationchange', function() {
        $('.js-slider').slick('resize');
    });

    $('a[data-slide]').click(function(e) {
        e.preventDefault();
        var slideno = $(this).data('slide');
        $('.project-gallery-slider').slick('slickGoTo', slideno - 1);
        $('a[data-slide]').removeClass('active');
        this.classList.add('active');
        var aTag = $('#MainContent');
        $('html,body').animate({scrollTop: aTag.offset().top},'slow');
    });

    var $grid = $('.project-gallery-thumbs').imagesLoaded( function() {
        // init Masonry after all images have loaded
        $grid.masonry({
          // options...
          itemSelector: '.project-gallery-thumb-item',
          columnWidth: 220,
          gutter: 12,
          fitWidth: true
        });
    });

  });