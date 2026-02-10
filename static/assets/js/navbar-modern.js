/* =============================================
   Ario Navbar  –  JS  (vanilla, no jQuery)
   v5 – always-visible fixed bar, compact search, RTL-safe cart
   ============================================= */
(function(){
    'use strict';

    var wrap = document.getElementById('az-nav');
    if(!wrap) return;

    /* -------- refs -------- */
    var mainBar        = document.getElementById('azMain');
    var hamburger      = document.getElementById('azHamburger');
    var sidebar        = document.getElementById('azSidebar');
    var sidebarOverlay = document.getElementById('azSidebarOverlay');
    var sidebarClose   = document.getElementById('azSidebarClose');
    var searchToggle   = document.getElementById('azSearchToggle');
    var searchDrop     = document.getElementById('azSearchDrop');
    var searchWrap     = document.getElementById('azSearchWrap');
    var searchInput    = document.getElementById('azSearchInput');
    var cartTrigger    = document.getElementById('azCartTrigger');
    var cartPopup      = cartTrigger ? cartTrigger.nextElementSibling : null;

    /* ===================  SIDEBAR (mobile menu)  =================== */
    function openSidebar(){
        if(!sidebar) return;
        sidebar.classList.add('az-open');
        sidebarOverlay.classList.add('az-open');
        hamburger.classList.add('az-active');
        document.body.style.overflow='hidden';
    }
    function closeSidebar(){
        if(!sidebar) return;
        sidebar.classList.remove('az-open');
        sidebarOverlay.classList.remove('az-open');
        hamburger.classList.remove('az-active');
        document.body.style.overflow='';
    }
    if(hamburger)      hamburger.addEventListener('click', openSidebar);
    if(sidebarClose)   sidebarClose.addEventListener('click', closeSidebar);
    if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    /* mobile accordion */
    wrap.querySelectorAll('.az-mob-has-dd').forEach(function(li){
        var link = li.querySelector(':scope > a');
        if(!link) return;
        link.addEventListener('click', function(e){
            if(li.querySelector('.az-mob-dd')){
                e.preventDefault();
                var wasOpen = li.classList.contains('az-mob-open');
                wrap.querySelectorAll('.az-mob-has-dd').forEach(function(o){ o.classList.remove('az-mob-open'); });
                if(!wasOpen) li.classList.add('az-mob-open');
            }
        });
    });

    /* ===================  COMPACT SEARCH DROPDOWN  =================== */
    var searchOpen = false;

    function openSearch(){
        if(searchOpen) return;
        searchOpen = true;
        searchDrop.classList.add('az-open');
        searchToggle.classList.add('az-active');
        setTimeout(function(){ if(searchInput) searchInput.focus(); }, 120);
    }

    function closeSearch(){
        if(!searchOpen) return;
        searchOpen = false;
        searchDrop.classList.remove('az-open');
        searchToggle.classList.remove('az-active');
        if(searchInput) searchInput.value = '';
    }

    if(searchToggle) searchToggle.addEventListener('click', function(e){
        e.stopPropagation();
        if(searchOpen) closeSearch(); else openSearch();
    });

    /* close search on click outside */
    document.addEventListener('click', function(e){
        if(!searchOpen) return;
        if(searchWrap && !searchWrap.contains(e.target)){
            closeSearch();
        }
    });

    /* ===================  ESC KEY  =================== */
    document.addEventListener('keydown', function(e){
        if(e.key === 'Escape'){
            if(searchOpen) closeSearch();
            if(cartOpen) closeCart();
            closeSidebar();
        }
    });

    /* ===================  CART DROPDOWN  =================== */
    var cartOpen = false;
    
    function openCart() {
        if(cartOpen) return;
        cartOpen = true;
        if(cartPopup) cartPopup.classList.add('az-open');
        if(cartTrigger) cartTrigger.classList.add('az-active');
        // Close other dropdowns
        if(searchOpen) closeSearch();
    }
    
    function closeCart() {
        if(!cartOpen) return;
        cartOpen = false;
        if(cartPopup) cartPopup.classList.remove('az-open');
        if(cartTrigger) cartTrigger.classList.remove('az-active');
    }
    
    if(cartTrigger && cartPopup) {
        cartTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if(cartOpen) {
                closeCart();
            } else {
                openCart();
            }
        });
        
        // Click outside to close
        document.addEventListener('click', function(e) {
            if(cartOpen && cartPopup && !cartPopup.contains(e.target) && e.target !== cartTrigger) {
                closeCart();
            }
        });
    }
    
    /* ===================  SCROLL SHADOW (navbar always visible)  =================== */
    var ticking = false;
    window.addEventListener('scroll', function(){
        if(!ticking){
            window.requestAnimationFrame(function(){
                if(mainBar){
                    mainBar.classList.toggle('az-scrolled', window.pageYOffset > 20);
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    /* ===================  ACTIVE LINK  =================== */
    var path = window.location.pathname;
    wrap.querySelectorAll('.az-links > li > a').forEach(function(a){
        try {
            if(new URL(a.href).pathname === path){
                a.style.color = 'var(--az)';
                a.style.fontWeight = '700';
            }
        } catch(ex){}
    });

    console.log('✓ az-nav v5 ready');
})();
