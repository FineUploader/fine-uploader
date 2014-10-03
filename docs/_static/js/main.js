/**
 * Resize the dropdown-menu's to be 80% of the window height, and
 * add an overflow-y property so that all the elements are shown.
 */
$(function() {
    'use strict';

    var setDropdownHeight = function(){

        var dropdownHeight = $(window.top).height() * .80; // take 80% of the current window height
        $('.dropdown-menu').css('max-height', dropdownHeight);
        $('.dropdown-menu').css('overflow-y',  'auto');

    };

    $(window).resize(setDropdownHeight);
    setDropdownHeight();
});
