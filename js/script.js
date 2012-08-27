// disable slideshow
$("#surveyCarousel").carousel({
    interval : false
});

// handle user typing "enter"
$("#surveyCarousel input").on("keypress", function(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
        $("#surveyCarousel").carousel("next");
    }
});

// handle carousel changes
$("#surveyCarousel").on("slid", function(e) {
    var $active, activePos, $navItems;

    // update nav selection
    $active = $(this).find(".active");
    activePos = $active.parent().children().index($active);
    $navItems = $("#carouselNav li");
    $navItems.removeClass("active");
    $navItems.eq(activePos).addClass("active");

    // keyboard focus on first input
    $("#surveyCarousel input:visible").filter(":first").focus();
});

// update carousel when nav is clicked
$("#carouselNav li").click(function(e) {
    $("#surveyCarousel").carousel($(this).parent().children().index(this));
    e.preventDefault();
});
