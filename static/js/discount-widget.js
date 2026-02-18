(function () {
    'use strict';

    function setupDiscountWidget(widget) {
        var input = widget.querySelector('[data-discount-input]');
        var applyForm = widget.querySelector('[data-discount-apply-form]');
        var applyButton = widget.querySelector('[data-discount-apply-btn]');
        var removeForm = widget.querySelector('[data-discount-remove-form]');
        var removeButton = widget.querySelector('.discount-widget__remove-btn');

        if (!input || !applyForm || !applyButton) {
            return;
        }

        input.setAttribute('required', 'required');

        var toggleInputState = function () {
            var hasValue = input.value.trim().length > 0;
            widget.classList.toggle('has-input', hasValue);
            applyButton.disabled = !hasValue;
            applyButton.setAttribute('aria-disabled', String(!hasValue));
        };

        input.addEventListener('input', toggleInputState);
        input.addEventListener('focus', function () {
            widget.classList.add('is-focused');
        });
        input.addEventListener('blur', function () {
            widget.classList.remove('is-focused');
        });

        applyForm.addEventListener('submit', function () {
            widget.classList.add('is-loading');
            window.setTimeout(function () {
                widget.classList.remove('is-loading');
            }, 1500);
        });

        if (removeForm && removeButton) {
            removeForm.addEventListener('submit', function () {
                widget.classList.add('is-loading');
            });

            removeButton.addEventListener('click', function (event) {
                var rect = removeButton.getBoundingClientRect();
                var rippleX = event.clientX - rect.left;
                var rippleY = event.clientY - rect.top;
                removeButton.style.setProperty('--ripple-x', rippleX + 'px');
                removeButton.style.setProperty('--ripple-y', rippleY + 'px');
                removeButton.classList.remove('ripple-armed');
                void removeButton.offsetWidth;
                removeButton.classList.add('ripple-armed');
                window.setTimeout(function () {
                    removeButton.classList.remove('ripple-armed');
                }, 480);
            });
        }

        toggleInputState();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var widgets = document.querySelectorAll('[data-discount-widget]');
        widgets.forEach(setupDiscountWidget);
    });
})();
