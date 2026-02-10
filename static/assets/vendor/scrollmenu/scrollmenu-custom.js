$(document).ready(function () {
  // jquery.serialscrolling initialisation
  $('[data-serialscrolling]').serialscrolling();




  var pageHeaderheight = $(".sticky-header").height();
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 200) {
        $(".navbar-products").css(
                "top",
                pageHeaderheight - 39
            );
    }
});
});