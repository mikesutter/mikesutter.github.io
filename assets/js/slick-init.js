$(document).ready(function(){
    
    $('.project-gallery-slider').slick({
        accessibility: true,
        adaptiveHeight: true,
        arrows: true,
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false // Disable default arrows since we are using custom click navigation
    });

    // Custom click navigation
    $('.project-gallery-slider').on('click', function(event) {
        var $slider = $(this);
        var clickX = event.pageX - $slider.offset().left;
        var sliderWidth = $slider.width();
        var leftThird = sliderWidth / 3;
        var rightThird = sliderWidth * (2 / 3);

        if (clickX < leftThird) {
            $slider.slick('slickPrev');
        } else if (clickX > rightThird) {
            $slider.slick('slickNext');
        }
    });

    $(window).on('resize orientationchange', function() {
        // Note: Resizing might affect the click areas, but this basic implementation doesn't recalculate on resize.
        // Consider adding resize handling if precise areas are critical after window resize.
        $('.project-gallery-slider').slick('resize'); // Changed target from .js-slider
    });

    // Thumbnail navigation (keep existing functionality)
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
