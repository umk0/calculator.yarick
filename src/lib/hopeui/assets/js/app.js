! function (r) {
    r.fn. /*  */
        serializeObject = function () {
            var n = this,
                u = {},
                i = {},
                h = {
                    validate: /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
                    key: /[a-zA-Z0-9_]+|(?=\[\])/g,
                    push: /^$/,
                    fixed: /^\d+$/,
                    named: /^[a-zA-Z0-9_]+$/
                };
            return this.build = function (e, i, t) {
                return e[i] = t, e
            }, this.push_counter = function (e) {
                return void 0 === i[e] && (i[e] = 0), i[e]++
            }, r.each(r(this).serializeArray(), function () {
                if (h.validate.test(this.name)) {
                    for (var e, i = this.name.match(h.key), t = this.value, a = this.name; void 0 !== (e = i.pop());) a = a.replace(new RegExp("\\[" + e + "\\]$"), ""), e.match(h.push) ? t = n.build([], n.push_counter(a), t) : e.match(h.fixed) ? t = n.build([], e, t) : e.match(h.named) && (t = n.build({}, e, t));
                    u = r.extend(!0, u, t)
                }
            }), u
        }
}(jQuery);
var app = {
    loadedPage: false,
    /* `breadcrumbTpl` is a property of the `app` object that is being assigned a value. The value is
    an instance of the `Twig.twig` function, which is used to compile and render Twig templates. */
    breadcrumbTpl: Twig.twig({
        href: '/template/breadcrumb.twig',
        async: false
    }),
    setValue: function (parrent, allElem) {
        $(allElem).val($(parrent).val()).change();
    },
    deRequireCb: function (className) {
        el = document.getElementsByClassName(className);

        var atLeastOneChecked = false; //at least one cb is checked
        for (i = 0; i < el.length; i++) {
            if (el[i].checked === true) {
                atLeastOneChecked = true;
            }
        }

        if (atLeastOneChecked === true) {
            for (i = 0; i < el.length; i++) {
                el[i].required = false;
            }
        } else {
            for (i = 0; i < el.length; i++) {
                el[i].required = true;
            }
        }
    },
    flights: {
        check_waybill: function () {
            $("select[name='id_driver']").each(function () {
                var id = $(this).val();
                var id_route = $(this).data("id");
                var data = $("#array_drivers row[data-id='" + id + "']").data('inn');
                var button = $(".btn-waybill[data-id='" + id_route + "']");
                if (data) {
                    button.removeClass('d-none');
                } else {
                    button.addClass('d-none');
                }
            });
        },
        init: function () {
            var self = this;
            /* The `if (flights_calendar_within) { ... }` block of code is checking if the variable
                    `flights_calendar_within` is truthy (not `null`, `undefined`, `0`, `false`, or an empty
                    string). If `flights_calendar_within` is truthy, it executes the code inside the block. */

            if (flights_calendar_within.length > 0) {
                new Datepicker('#flights_calendar', {
                    multiple: false,
                    inline: true,
                    weekStart: 1,
                    within: flights_calendar_within,
                    classNames: {
                        node: 'datepicker custom'
                    },
                    templates: {
                        container: [
                            '<div class="datepicker__container">',
                            '<% for (var i = -1; i <= 1; i++) { %>',
                            '<div class="datepicker__pane">',
                            '<%= renderHeader(i) %>',
                            '<%= renderCalendar(i) %>',
                            '</div>',
                            '<% } %>',
                            '</div>'
                        ].join('')
                    },
                    onChange: function (data) {
                        if (data) {
                            app.getAjaxPage(null, "/" + shortname + "/flights/" + moment(data).format('DD.MM.YYYY'));
                        }
                    },
                    onRender: function (El) {
                        $.each(flights_calendar_title, function (k, v) {
                            $(El).find('[data-day="' + v.date + '"]').attr("title", "Количество маршрутов: " + v.num);
                        });
                    }
                });
            }
            /* The above JavaScript code is handling a change event on elements with the class
            "online_save". When a change event occurs, it serializes the form data into an object,
            converts the timestamp_load and timestamp_exit values to Unix timestamps using moment.js,
            and then sends an AJAX POST request to the specified URL with the serialized data. Upon
            successful completion of the AJAX request, it displays a success notification using the Noty
            library. Additionally, the code prevents the default form submission behavior by returning
            false in the submit event handler for elements with the class "online_save". */
            $(".online_save").on("change", function () {
                var data = $(this).serializeObject();
                var elem = $(this);
                if (elem.find('[type="checkbox"]').is(':checked')) {
                    elem.find('[name="id_car"]').attr("disabled", false);
                } else {
                    elem.find('[name="id_car"]').attr("disabled", true);
                }
                data.timestamp_load = moment(data.timestamp_load).unix();
                data.timestamp_exit = moment(data.timestamp_exit).unix();
                $.ajax({
                    url: "/" + shortname + "/api/flights/edit",
                    method: "POST",
                    data: data,
                    dataType: 'json',
                    success: function (data) {
                        new Noty({
                            type: 'success',
                            layout: 'topRight',
                            text: 'Сохранено',
                            timeout: 1000
                        }).show();
                        elem.find('[name="id_car"]').val(data.id_car);
                        elem.find('[name="id_car"]').next().find(".select2-selection__rendered").html($("#array_car [data-id='"+data.id_car+"']").data("value")).attr("titile",$("#array_car [data-id='"+data.id_car+"']").data("value"));
                        self.check_waybill();
                    },
                });
            })
            $(".online_save").submit(function () { return false; });
            self.check_waybill();

        }
    },
    init: function () {
        var self = this;
        /* The code is a jQuery function that is executed when the DOM is ready. It selects all anchor elements with the class "nav-link" and iterates over them using the `each` function. */
        $(function () {
            $("#sidebar-menu").find(".active").removeClass('active');
            $("#sidebar-menu").find(".collapse").removeClass('show');
            $("#sidebar-menu").find('[aria-expanded]').attr('aria-expanded', 'false');
            $('a.nav-link').each(function () {
                if (path.indexOf("/flights/") > 0) {
                    if ($(this).attr('href').indexOf("/flights") > 0) {
                        $(this).addClass('active');
                    }
                }
                if (path.indexOf("/drivers/") > 0) {
                    if ($(this).attr('href').indexOf("/drivers") > 0) {
                        $(this).addClass('active');
                    }
                }
                if (path.indexOf("/cars/") > 0) {
                    if ($(this).attr('href').indexOf("/cars") > 0) {
                        $(this).addClass('active');
                    }
                }
                if (path.indexOf("/settings/") > 0) {
                    if ($(this).attr('href').indexOf("/settings") > 0) {
                        $(this).addClass('active');
                    }
                }
                if ($(this).attr('href') == path) {
                    $(this).addClass('active');
                    var id = $(this).parents('.sub-nav').attr("id");
                    $(this).parents('.nav-item').each(function () {
                        $(this).find('[data-bs-toggle][aria-controls="' + id + '"]').attr('aria-expanded', 'true')
                    })
                    $(this).parents('.sub-nav').addClass('show');
                    $(this).parents('.sub-nav').each(function () {
                        var parrent_id = $(this).attr('data-bs-parent');
                        $("a[href='" + parrent_id + "']").attr('aria-expanded', 'true')
                    });
                }
            })
        });
        /**
         * Copy to clipboard on click and show noty on click of input field ( data - bs - toggle
         */
        $("[data-clipboard]").each(function () {
            /**
             * a / object / string / etc can be used to get the value of a field. This is a bit
             */
            $(this).click(function () {
                var copy = $(this).data('clipboard');
                var id_tmp = moment().unix();
                $("body").append("<textarea id='cl" + id_tmp + "' readonly='readonly'></textarea>");
                var el = $("#cl" + id_tmp);
                el.val(copy).select();
                document.execCommand('copy')
                el.remove();
                new Noty({
                    type: 'success',
                    layout: 'bottomRight',
                    text: 'Содержимое скопировано в буффер обмена',
                    timeout: 1500
                }).show();
            }).attr("data-bs-toggle", "tooltip") // .attr('title','Нажмите чтобы скопировать')
        });

        if (typeof bootstrap !== typeof undefined) {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl)
            })

            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-sidebar-toggle="tooltip"]'))
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl)
            })
        }
        $(".ajax").each(function () {

            if (!$(this).data("ajax-handler")) {
                $(this).data("ajax-handler", true);
                $(this).click(function () {
                    self.getAjaxPage(this);
                    return false;
                });
            }
        });


        window.addEventListener("popstate", (e) => {
            self.getAjaxPage("", location.pathname);
        });
        self.deRequireCb("user_rights");
        self.flights.init();
        $(".js-select2").each(function () {
            $(this).select2({
                "language": {
                    "noResults": function () {
                        return "Нет результатов... ¯༽_(ツ)_༼¯";
                    }
                }, placeholder: $(this).attr('placeholder')
            });
        })

    },
    util: {
        /* The `rand` function is generating a random integer between a minimum and maximum value. */
        rand: function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        /* The `addParams` function is used to add query parameters to a URL. It takes two parameters:
        `url` (the original URL) and `data` (an object containing the query parameters). */
        addParams: function (url, data) {
            if (!$.isEmptyObject(data)) {
                url += (url.indexOf('?') >= 0 ? '&' : '?') + $.param(data);
            }

            return url;
        },
        /* The above code is a JavaScript function that is used to retrieve query parameters from the
        URL. It takes a parameter `name` which represents the name of the query parameter to
        retrieve. It then uses a regular expression to search for the parameter in the
        `location.search` string (which contains the query parameters of the URL). If the parameter
        is found, it decodes and returns its value. */
        $_GET: function (name) {
            if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
                return decodeURIComponent(name[1]);
        },
        /* The above code is a JavaScript function that toggles the visibility of an HTML element with
        the id "id_sub_tr". When the function is called with a specific id as a parameter, it will
        toggle the visibility of the corresponding element on and off. */
        toggleSub: function (id) {
            $("#" + id + "_sub_tr").toggle()
        }
    },

    /* The `getAjaxPage` function is responsible for making an AJAX request to retrieve a page and
    update the content of the current page dynamically. */
    getAjaxPage: function (elem, url = false) {
        if (!$(elem).hasClass('ajax') && elem != null) {
            return true;
        }
        var self = this;
        if (self.loadedPage)
            return false;
        self.loadedPage = true;
        if (!url) {
            url = $(elem).attr('href');
        }
        var new_url = url;
        url = self.util.addParams(url, {
            ajax: true
        });
        $("#load").stop().fadeIn();
        $("#load .progress-bar").stop().animate({
            width: self.util.rand(30, 60) + "%"
        });
        $.ajax({
            url: url,
            dataType: 'json',
            success: function (data) {
                if (data.redirect) {
                    location.pathname = data.redirect;
                    return false;
                }
                document.title = data.title + " - " + branchname;
                window.history.pushState({
                    "html": data.response,
                    "pageTitle": document.title
                }, "", new_url);
                path = location.pathname;
                var doc = document.implementation.createHTMLDocument(); // Sandbox
                doc.body.innerHTML = data.response; // Parse HTML properly
                [].map.call(doc.getElementsByTagName('script'), function (el) {
                    eval(el.textContent);
                });
                document.getElementById("content-ajax").innerHTML = data.response;
                document.getElementById("breadcrumb-ajax").innerHTML = self.breadcrumbTpl.render({
                    'breadcrumb': data.breadcrumb
                });
                self.init();
                $("#load .progress-bar").stop().animate({
                    width: "100%"
                }, function () {
                    $("#load").stop().fadeOut(function () {
                        $("#load .progress-bar").css({
                            width: "0%"
                        });
                        self.loadedPage = false;
                    });

                });
            },
        });
    }
};

app.init();