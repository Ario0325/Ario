/**
 * انیمیشن‌های صفحه ورود/ثبت‌نام مدرن
 */
(function () {
  'use strict';

  function initAuthModern() {
    var page = document.querySelector('.auth-page-modern');
    if (!page) return;

    var formBox = page.querySelector('.form-box');
    if (formBox) {
      formBox.style.visibility = 'visible';
    }

    // هنگام تعویض تب، انیمیشن کوتاه برای محتوای تب
    var tabLinks = page.querySelectorAll('[data-toggle="tab"]');
    tabLinks.forEach(function (link) {
      link.addEventListener('shown.bs.tab', function () {
        var pane = page.querySelector(link.getAttribute('href'));
        if (pane && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          pane.style.animation = 'none';
          pane.offsetHeight;
          pane.style.animation = 'authTabFade 0.35s ease';
        }
      });
    });

    // افکت فشرده شدن دکمه هنگام کلیک
    page.querySelectorAll('.form-footer .btn-outline-primary-2').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.style.transform = 'translateY(0) scale(0.98)';
        var self = this;
        setTimeout(function () {
          self.style.transform = '';
        }, 150);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthModern);
  } else {
    initAuthModern();
  }
})();
