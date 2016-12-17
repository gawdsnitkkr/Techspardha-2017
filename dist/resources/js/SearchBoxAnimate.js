/**
 * Created by Kaushik on 11/2/2016.
 */
(function (d, dO, w, $, t) {
    var Var = {
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
            primaryUrl: 'http://anshulmalik.me'
        },
        DOM = {
            SearchSVG: null,
            MainMenuButton: null,
            MainMenuButtonOverlay: null
        },
        Functions = {
            toMonth: function(mon){
                switch(mon){
                    case '01': return 'Jan';
                    case '02': return 'Feb';
                    case '03': return 'Mar';
                    case '04': return 'Apr';
                    case '05': return 'May';
                    case '06': return 'Jun';
                    case '07': return 'Jul';
                    case '08': return 'Aug';
                    case '09': return 'Sep';
                    case '10': return 'Oct';
                    case '11': return 'Nov';
                    case '12': return 'Dec';
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
                    var SearchBorders = $('#searchBoxBorder').children();
                    t.set($('#searchBoxBorder'), {
                        display: 'block'
                    });
                    var count = 0;
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
                            t.set($('input#searchBox'), {
                                display: 'block'
                            });
                            Var.isCollapsed = false;
                            $('input#searchBox').focus();
                            Functions.DisplayPrimaryOption();
                        }
                    });
                }
            },
            CloseMenu: function () {
                if (Var.isCollapsed == false) {
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
                Var.primaryMenuData = Var.mainMenuData;
                $(Var.primaryMenuData).each(function (a) {
                    var option = $('<div id="'+Var.primaryMenuData[a]+'" ' +
                                    'class="menuOption"><span class="category">'
                                    + Var.primaryMenuData[a] + '</div>')
                                    .bind('click', function(target){
                                        Functions.DisplayEvents(target);
                                });
                    DOM.PrimaryMenuContainer.append(option);
                });
                Functions.RevealMenuOptions();
            },
            DisplayEvents: function(target){
                var category = $('span.category', target.currentTarget).html();
                if (category != "") {
                    var n = Var.categorizedEvents[category].length;
                    DOM.categoryTab.html('<span style="position: absolute; left: 10px; top: 18px; opacity: 0.5; font-size: 15px;" class="glyphicon glyphicon-chevron-left"></span>'+category+'<div class="tabLine"></div>');
                    DOM.PrimaryMenuContainer.html('');
                    for (var i = 1; i < n; i++) {
                        DOM.PrimaryMenuContainer.append(
                            '<div class="menuEventOption">' + Var.categorizedEvents[category][i] + '<span class="eventCorner"></span></div>'
                        );
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
                if (searchString.length == 0) {
                    Var.searchResult = [];
                    Functions.RenderSearchResults(Var.searchResult);
                }
                else {
                    var url = 'http://anshulmalik.me/api/events?query=' + searchString;
                    $.ajax({
                        url: url,
                        dataType: 'json',
                        type: 'get',
                        success: function (data) {
                            Var.searchResult = data['data'];
                            Functions.RenderSearchResults(Var.searchResult);
                        }
                    });
                }
            },
            RenderSearchResults: function (data) {
                Var.primaryMenuData = data;
                DOM.categoryTab.html('Categories<div class="tabLine"></div>');
                if (data.length == 0) {
                    DOM.PrimaryMenuContainer.append(
                        '<h3 style="opacity: 0.5; font-size: 20px;">No Results to Display</h3>'
                    );
                } else {
                    DOM.PrimaryMenuContainer.append(DOM.searchAnimation);
                    $(Var.primaryMenuData).each(function () {
                        console.log(this);
                        var hour = parseInt(this.Start.substr(11,2));
                        var date = {
                            day: this.Start.substr(8,2),
                            month: this.Start.substr(5,2),
                            hour: hour > 12 ? (hour - 12) : hour,
                            min: this.Start.substr(14,2) + ' ' + (hour >= 12 ? 'pm':'am')
                        };
                        DOM.PrimaryMenuContainer.append(
                            '<div class="searchOption col-md-12">' +
                                '<div class="row">' +
                                    '<div class="searchNameInfo">' +
                                        '<div class="searchName">' + this.Name + '' +
                                            '<span class="searchDate">'
                                            + '<span>' + date.day + '</span> ' + Functions.toMonth(date.month) + ', '
                                            + '<span>' + date.hour + ':' + date.min + '</span>' +
                                            '</span>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="searchDesc">'
                                        + this.Description +
                                    '</div>' +
                                    '<div class="grad"></div>' +
                                '</div>' +
                            '</div>'
                        );
                    });
                    Functions.RevealMenuOptions();
                }
            },
            RevealMenuOptions: function(){
                t.fromTo(DOM.PrimaryMenuContainer.children(), 1, {
                    marginTop: '-10px',
                    opacity: 0
                },{
                    marginTop: '10px',
                    opacity: 1,
                    ease: Back.easeOut
                }, 0.1);
            }
        };
    dO.ready(function () {
        Functions.RandomEventGenerator();
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
