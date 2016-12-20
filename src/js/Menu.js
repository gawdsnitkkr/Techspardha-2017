/**
 * Created by Kaushik on 11/2/2016.
 */

(function (d, dO, w, $, t) {
    var Globals = {
            // Public variables and properties inherited from Main.js
            /** @type Category[] */
            Categories: w.Categories
        },
        // Why is Var and Globals two different things when they are performing the same functions. :? :? :?
        // #RIP-LOGIC
        // Merge Var into Globals.
        Var = {
            isCollapsed: true,
            isCollapsing: false,
            isSecondaryCollapsed: true,
            isSecondaryCollapsing: false,
            mainMenuData: [
                "Managerial",
                "Quizzes",
                "Fun Zone",
                "Online Events",
                "Paper Events",
                "Technopolis",
                "Design",
                "Brainstorming",
                "Future Builder",
                "Mechnium",
                "Design N Build",
                "Code Conclave",
                "ElectroVolt",
                "Robotic Challenge"
            ],
            categorizedEvents: {
                "Managerial": [],
                "Quizzes": [],
                "Fun Zone": [],
                "Online Events": [],
                "Paper Events": [],
                "Technopolis": [],
                "Design": [],
                "Brainstorming": [],
                "Future Builder": [],
                "Mechnium": [],
                "Design N Build": [],
                "Code Conclave": [],
                "ElectroVolt": [],
                "Robotic Challenge": []
            },
            primaryMenuData: [],
            searchResult: [],
            primaryUrl: 'http://anshulmalik.me/api'
        },
        // Actually DOM is different, as they used to refer to the RAW document elements, but you are majorly only
        // storing jQuery objects of those DOMs (again not correct, Document Object Model is still a different thing :|)
        // Fix naming scheme, make it logically so that it is easier to understand, like $Objects -> Which is self
        // explanatory what it contains jQuery Objects.
        DOM = {
            SearchSVG: null,
            MainMenuButton: null,
            MainMenuButtonOverlay: null
        },
        Functions = {
            toMonth: function (mon) {
                switch (mon) {
                    case '01':
                        return 'Jan';
                    case '02':
                        return 'Feb';
                    case '03':
                        return 'Mar';
                    case '04':
                        return 'Apr';
                    case '05':
                        return 'May';
                    case '06':
                        return 'Jun';
                    case '07':
                        return 'Jul';
                    case '08':
                        return 'Aug';
                    case '09':
                        return 'Sep';
                    case '10':
                        return 'Oct';
                    case '11':
                        return 'Nov';
                    case '12':
                        return 'Dec';
                }
            },
            OpenMenu: function () {
                if (Var.isCollapsed) {
                    t.set(DOM.MainMenuCloseButton, {
                        display: 'block'
                    });

                    TweenLite.fromTo(DOM.MainMenuButton, 0.5, {
                        scale: 0.5
                    }, {
                        scale: 0.88,
                        ease: Back.easeOut
                    });
                    t.to(DOM.MainMenu, 0.2, {
                        left: '0'
                    });
                    // Do not do duplicate jQuery selection.
                    var $searchBoxBorder = $('#searchBoxBorder');
                    var SearchBorders = $searchBoxBorder.children();
                    t.set($searchBoxBorder, {
                        display: 'block'
                    });
                    // Unused variable count, removed.
                    SearchBorders.each(function () {
                        var $Path = $(this).PathAnimation();
                        $Path.data('PathAnimation').Animate(1, {
                            delay: 0.4,
                            ease: Power4.easeOut,
                            clearOpacity: true
                        });
                    });
                    t.fromTo($('#searchHandle'), 0.5, {
                        attr: {
                            d: 'm 3.4532481,1031.6817 48.8640159,0'
                        }
                    }, {
                        attr: {
                            d: 'm 10.555653,1043.6641 9.469718,-8.7922'
                        },
                        ease: Power4.easeOut,
                        onComplete: function () {
                            var glass = $('#magnifying').PathAnimation();
                            glass.data('PathAnimation').Animate(1, {
                                ease: Back.easeOut,
                                clearOpacity: true
                            });
                            t.set($('#menuTopLine'), {
                                opacity: 0
                            });
                            t.set($('#menuBottomLine'), {
                                opacity: 0
                            });
                            // Again do not use duplicate jQuery selection, also remove tag name to increase jQuery
                            // selection performance, consult jQuery documentation.
                            var $searchBox = $('#searchBox');
                            t.set($searchBox, {
                                display: 'block'
                            });
                            Var.isCollapsed = false;
                            $searchBox.focus();
                            Functions.DisplayPrimaryOption();
                        }
                    });
                }
            },
            CloseMenu: function () {
                // Use === to compare with primitive types, consult web for why.
                if (Var.isCollapsed === false) {
                    var SearchBorders = $('#searchBoxBorder').children();
                    Var.isCollapsing = true;
                    var glass = $('#magnifying').PathAnimation();
                    glass.data('PathAnimation').ReverseDraw(1, {
                        ease: Back.easeOut,
                        clearOpacity: true,
                        onComplete: function () {
                            t.set(DOM.MainMenuCloseButton, {
                                display: 'none'
                            });
                            t.set($('#menuTopLine'), {
                                opacity: 1
                            });
                            t.set($('#menuBottomLine'), {
                                opacity: 1
                            });
                            t.set($('input#searchBox'), {
                                display: 'none'
                            });
                            t.fromTo($('#searchHandle'), 0.5, {
                                attr: {
                                    d: 'm 10.555653,1043.6641 9.469718,-8.7922'
                                }
                            }, {
                                attr: {
                                    d: 'm 3.4532481,1031.6817 48.8640159,0'
                                },
                                ease: Power4.easeIn,
                                onComplete: function () {
                                    t.fromTo(DOM.MainMenuButton, 0.2, {
                                        scale: 0.88
                                    }, {
                                        scale: 0.5,
                                        onComplete: function () {
                                            Var.isCollapsed = true;
                                            Var.isCollapsing = false;
                                        }
                                    });
                                    DOM.PrimaryMenuContainer.html('');
                                }
                            });
                            t.to(DOM.MainMenu, 0.2, {
                                left: '-100%'
                            });
                        }
                    });
                    SearchBorders.each(function () {
                        var $Path = $(this).PathAnimation();
                        $Path.data('PathAnimation').ReverseDraw(1, {
                            delay: 0.4,
                            clearOpacity: true,
                            ease: Power4.easeIn
                        });
                    });
                }
            },
            DisplayPrimaryOption: function () {
                DOM.categoryTab.addClass('activeTab');
                DOM.searchTab.removeClass('activeTab');
                DOM.categoryTab.html('Categories<div class="tabLine"></div>');
                DOM.PrimaryMenuContainer.html('');
                Var.primaryMenuData = Globals.Categories;
                // Do not use $.each(), instead use For Loop logic, this slows down the website by about 10 - 20x.
                $(Var.primaryMenuData).each(function (a) {
                    var option = $("<div id=\"category" + Var.primaryMenuData[a].Id + "\" class=\"menuOption\"><span class=\"category\">" + Var.primaryMenuData[a].Name + "</div>")
                        .bind('click', Functions.DisplayEvents); // No need to enclose function having same argument sets in one another, only decreases performance.
                    DOM.PrimaryMenuContainer.append(option);
                });
                Functions.RevealMenuOptions();
            },
            DisplayEvents: function (target) {
                var category = $('span.category', target.currentTarget).html(),
                    id = $(target.currentTarget).attr('id').substr(8);
                console.log(id);
                // Again use !== and also follow one quote style, i.e., either single or double, for this project I
                // have set single quotes as the primary ones in the settings. Double are needed for different purposes
                // when you want to preserve meaning of the special symbols such as \n, its textbook :P.
                // Single are used to increase performance since JS engine do not have to process the text to look for
                // special escaped symbols, albeit its very marginal at best but still.
                if (category !== '') {
                    DOM.PrimaryMenuContainer.html('');
                    // Try not to use inline CSS, make it a class and add it's CSS to the stylesheet so that it can
                    // be modified later easily.
                    DOM.categoryTab.html('<span style="position: absolute; left: 10px; top: 18px; opacity: 0.5; font-size: 15px;" class="glyphicon glyphicon-chevron-left"></span>' + category + '<div class="tabLine"></div>');
                    var isEmpty = true;
                    for (var i = 0; i < Globals.Events.length; i++) {
                        if (Globals.Events[i].CategoryId == id) {
                            DOM.PrimaryMenuContainer.append(
                                '<div class="menuEventOption">' + Globals.Events[i].Name + '<span class="eventCorner"></span></div>'
                            );
                            isEmpty = false;
                        }
                    }
                    if (isEmpty) {
                        DOM.PrimaryMenuContainer.append('<h3 style="opacity: 0.5; font-size: 20px;">Events coming soon</h3>');
                    }
                    Functions.RevealMenuOptions();
                }
            },
            RandomEventGenerator: function () {
                $.each(Var.mainMenuData, function (e) {
                    var cat = Var.mainMenuData[e];
                    var n = Math.floor(Math.random() * (14 - 4 + 1)) + 4;
                    for (var i = 1; i <= n; i++) {
                        Var.categorizedEvents[cat][i] = cat + "_event_" + i;
                    }
                });
            },
            GetSearchResults: function (searchString) {
                DOM.PrimaryMenuContainer.html('');
                DOM.searchTab.addClass('activeTab');
                DOM.categoryTab.removeClass('activeTab');
                // Again use === instead of ==, Google for the reason, its quite simple.
                if (searchString.length === 0) {
                    Var.searchResult = [];
                    Functions.RenderSearchResults(Var.searchResult);
                }
                else {
                    $.ajax({
                        url: Var.primaryUrl + '/events?query=' + searchString,
                        type: 'GET',
                        success: function (data) {
                            // Object['property'] notation is not accepted by strict JS Lint.
                            Var.searchResult = data.data;
                            Functions.RenderSearchResults(Var.searchResult);
                        }
                    });
                }
            },
            RenderSearchResults: function (data) {
                Var.primaryMenuData = data;
                DOM.categoryTab.html('Categories<div class="tabLine"></div>');
                // Again use === instead of ==.
                if (data.length === 0) {
                    DOM.PrimaryMenuContainer.append('<h3 style="opacity: 0.5; font-size: 20px;">No Results to Display</h3>');
                } else {
                    // DOM.searchAnimation not defined, verify this.
                    DOM.PrimaryMenuContainer.append(DOM.searchAnimation);
                    // Try not to use $.each() as it is very slow, convert the logic to for () {...} loop.
                    $(Var.primaryMenuData).each(function () {
                        var hour = parseInt(this.Start.substr(11, 2));
                        var date = {
                            day: this.Start.substr(8, 2),
                            month: this.Start.substr(5, 2),
                            hour: hour > 12 ? (hour - 12) : hour,
                            min: this.Start.substr(14, 2) + ' ' + (hour >= 12 ? 'pm' : 'am')
                        };
                        // This is not ideal, convert the entire string concatenation to a single large string with
                        // minimal concatenation. To edit use WebStorm's inbuilt Edit As HTML option.
                        var searchResult = $("<div class=\"searchOption\">\n    <div class=\"row\">\n        <div class=\"searchNameInfo\">\n            <div class=\"searchName\">" + this.Name + "<span class=\"searchDate\"><span>" + date.day + '</span> ' + Functions.toMonth(date.month) + ", <span>" + date.hour + ':' + date.min + "</span></span></div>\n        </div>\n        <div class=\"searchDesc\">" + this.Description + "</div>\n        <div class=\"grad\"></div>\n    </div>\n</div>");
                        DOM.PrimaryMenuContainer.append(searchResult);
                    });
                    Functions.RevealMenuOptions();
                }
            },
            RevealMenuOptions: function () {
                // Invalid number of arguments, only four are required removing last 0.1.
                t.fromTo(DOM.PrimaryMenuContainer.children(), 1, {
                    marginTop: '-10px',
                    opacity: 0
                }, {
                    marginTop: '10px',
                    opacity: 1,
                    ease: Back.easeOut
                });
            },
            ExtendResponse: function (response) {
                return $.extend({
                    status: {
                        code: 200,
                        message: 'SUCCESS'
                    },
                    data: []
                }, response);
            },
            Initialize: function () {
                // Why are you doing a AJAX call? It has already been done Main.js.
                $.ajax({
                    url: Var.primaryUrl + '/categories',
                    type: 'GET',
                    beforeSend: function () {

                    },
                    success: function (response) {
                        response = Functions.ExtendResponse(response);
                        if (response.status.code === 200) {
                            Globals.Categories = response.data;
                            $.ajax({
                                url: Var.primaryUrl + '/events',
                                type: 'GET',
                                beforeSend: function () {

                                },
                                success: function (response) {
                                    response = Functions.ExtendResponse(response);
                                    if (response.status.code === 200) {
                                        Globals.Events = response.data;
                                    }
                                },
                                complete: function () {

                                }
                            });
                        }
                    },
                    complete: function () {

                    }
                });
            },
            // Public methods inherited from the Main.js
            GetCategoryFromID: w.GetCategoryFromID,
            GetEventFromID: w.GetEventFromID
        };
    dO.ready(function () {
        console.log(Globals.Categories);
        Functions.Initialize();
        DOM.SearchSVG = $('svg#searchBarSVG');
        DOM.MainMenu = $('aside#searchMenu');
        DOM.MainMenuButton = $('#MenuIcon');
        DOM.MainMenuButtonOverlay = $('#menuButtonOverlay')
            .bind('click', function () {
                if (Var.isCollapsed && !Var.isCollapsing)
                    Functions.OpenMenu();
            });
        DOM.MainMenuCloseButton = $('#menuClose')
            .bind('click', function () {
                if (!Var.isCollapsed && !Var.isCollapsing)
                    Functions.CloseMenu();
            });
        DOM.PrimaryMenuContainer = $('div#primaryMenuOptions');
        DOM.searchInput = $('#searchBox')
            .bind('keyup', function (e) {
                if (e.keyCode == 13) {
                    var s = DOM.searchInput.val();
                    Functions.GetSearchResults(s);
                }
            });
        DOM.categoryTab = $('#categoryTabButton')
            .bind('click', function () {
                Functions.DisplayPrimaryOption();
            });
        DOM.searchTab = $('#resultTabButton')
            .bind('click', function () {
                Functions.GetSearchResults(DOM.searchInput.val());
            });
        dO.on("keyup", function (e) {
            if (e.keyCode == 27 && !Var.isCollapsed && !Var.isCollapsing) {
                Functions.CloseMenu();
            }
        });
        t.set(DOM.MainMenuButton, {
            transformOrigin: '50% 50%',
            scale: 0.5
        });
    });
})(document, jQuery(document), window, jQuery, TweenMax);
