var renderSidebarNav = function(type, headers) {
    var $sidebar = $(".sidebar .accordion"),
        sidebarContents = '';

    $.each(headers, function (index, header) {
        var $typeEl = $("." + type + "s-" + header),
            typeTitle = $typeEl.find('h2').text(),
            typeLink = "#"+$typeEl.find('h2').attr('id');

        sidebarContents += "<div class='accordion-group'>" +
                                "<div class='accordion-heading'>" +
                                    "<a href='#' data-target='." + type + "-" + header + "-accordion' data-parent='.sidebar-accordion' data-toggle='collapse'>" +
                                        "<b>" + typeTitle + "</b>" +
                                    "</a>" +
                                "</div>" +
                                "<div class='" + type + "-" + header + "-accordion accordion-body collapse in'>" +
                                    "<div class='accordion-inner'>" +
                                        "<ul class='nav nav-list'>";
        $typeEl.children('.' + type).each(function (idx, sub_type) {
            var el = "h4",
                $type = $(sub_type).find(el);
                title = $type.attr('id');
                link = '#'+title;

            sidebarContents +=  "<li><a href='" + link + "'>" + title + "</a></li>";
        });

        $typeEl.children('.' + type + '-parent').each(function (idx, sub_type) {
            var el = "h3",
                $type = $(sub_type).find(el);
                title = $type.attr('id');
                link = '#'+title;

            sidebarContents +=  "<li><a href='" + link + "'>" + title + "</a></li>";
        });

        sidebarContents +=              "</ul>" +
                                    "</div>" +
                                "</div>" +
                            "</div>";
    });
    $sidebar.append(sidebarContents);
}

var renderOptionsSidebarNav = function(option_types) {
    renderSidebarNav('option', option_types);
}

var renderMethodsSidebarNav = function(method_types) {
    renderSidebarNav('method', method_types);
}

var renderEventsSidebarNav = function(event_types) {
    renderSidebarNav('event', event_types);
}
