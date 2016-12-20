/**
 * Created by Kaushik on 11/2/2016.
 */

(function (d, dO, w, $, t) {
    var Globals = {
            // Public variables and properties inherited from Main.js
            /** @type Category[] */
            Categories: w.Categories,
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
        $Objects = {
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
                if (Globals.isCollapsed) {
                    t.set($Objects.MainMenuCloseButton, {
                        display: 'block'
                    });

                    TweenLite.fromTo($Objects.MainMenuButton, 0.5, {
                        scale: 0.5
                    }, {
                        scale: 0.88,
                        ease: Back.easeOut
                    });
                    t.to($Objects.MainMenu, 0.2, {
                        left: '0'
                    });
                    var $searchBoxBorder = $('#searchBoxBorder');
                    var SearchBorders = $searchBoxBorder.children();
                    t.set($searchBoxBorder, {
                        display: 'block'
                    });
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
                            var $searchBox = $('#searchBox');
                            t.set($searchBox, {
                                display: 'block'
                            });
                            Globals.isCollapsed = false;
                            $searchBox.focus();
                            Functions.DisplayPrimaryOption();
                        }
                    });
                }
            },
            CloseMenu: function () {
                if (Globals.isCollapsed === false) {
                    var SearchBorders = $('#searchBoxBorder').children();
                    Globals.isCollapsing = true;
                    var glass = $('#magnifying').PathAnimation();
                    glass.data('PathAnimation').ReverseDraw(1, {
                        ease: Back.easeOut,
                        clearOpacity: true,
                        onComplete: function () {
                            t.set($Objects.MainMenuCloseButton, {
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
                                    t.fromTo($Objects.MainMenuButton, 0.2, {
                                        scale: 0.88
                                    }, {
                                        scale: 0.5,
                                        onComplete: function () {
                                            Globals.isCollapsed = true;
                                            Globals.isCollapsing = false;
                                        }
                                    });
                                    $Objects.PrimaryMenuContainer.html('');
                                }
                            });
                            t.to($Objects.MainMenu, 0.2, {
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
                $Objects.categoryTab.addClass('activeTab');
                $Objects.searchTab.removeClass('activeTab');
                $Objects.categoryTab.html('Categories<div class="tabLine"></div>');
                $Objects.PrimaryMenuContainer.html('');
                Globals.primaryMenuData = Globals.Categories;
                for (var a = 0; a < Globals.primaryMenuData.length; a++){
                    var option = $("<div id=\"menuCategory" + a + "\" class=\"menuOption\"><span id = \"MenuCategory"+ a +"\" class=\"category\">" + Globals.primaryMenuData[a].$title[0].innerHTML + "</div>")
                        .bind('click', Functions.DisplayEvents);
                    $Objects.PrimaryMenuContainer.append(option);
                }
                Functions.RevealMenuOptions();
            },
            DisplayEvents: function (target) {
                var CategoryIndex = $(target.target).attr('id').substr(12),
                    CategoryObject = Globals.Categories[CategoryIndex];
                $Objects.PrimaryMenuContainer.html('');
                $Objects.categoryTab.html('<span class="glyphicon glyphicon-chevron-left"></span>' + CategoryObject.$title[0].innerHTML + '<div class="tabLine"></div>');
                for (var i = 0; i < CategoryObject.events.length; i++) {
                    var Event = $("<div id=\""+ CategoryObject.events[i].$title[0].innerHTML +"\" class=\"menuEventOption\">" + CategoryObject.events[i].$title[0].innerHTML + "<span class=\"eventCorner\"></span></div>")
                        .bind('click', Functions.MenuEventClicked);
                    $Objects.PrimaryMenuContainer.append(Event);
                }
                if (CategoryObject.events.length === 0) {
                    $Objects.PrimaryMenuContainer.append('<h3>Events coming soon</h3>');
                }
                Functions.RevealMenuOptions();
            },
            MenuEventClicked: function(target){
                console.log("Hello" + target.target.innerText);
            },
            RandomEventGenerator: function () {
                $.each(Globals.mainMenuData, function (e) {
                    var cat = Globals.mainMenuData[e];
                    var n = Math.floor(Math.random() * (14 - 4 + 1)) + 4;
                    for (var i = 1; i <= n; i++) {
                        Globals.categorizedEvents[cat][i] = cat + "_event_" + i;
                    }
                });
            },
            GetSearchResults: function (searchString) {
                $Objects.PrimaryMenuContainer.html('');
                $Objects.searchTab.addClass('activeTab');
                $Objects.categoryTab.removeClass('activeTab');
                if (searchString.length === 0) {
                    Globals.searchResult = [];
                    Functions.RenderSearchResults(Globals.searchResult);
                }
                else {
                    $.ajax({
                        url: Globals.primaryUrl + '/events?query=' + searchString,
                        type: 'GET',
                        success: function (data) {
                            Globals.searchResult = data.data;
                            Functions.RenderSearchResults(Globals.searchResult);
                        }
                    });
                }
            },
            RenderSearchResults: function (data) {
                Globals.primaryMenuData = data;
                $Objects.categoryTab.html('Categories<div class="tabLine"></div>');
                if (data.length === 0) {
                    $Objects.PrimaryMenuContainer.append('<h3 style="opacity: 0.5; font-size: 20px;">No Results to Display</h3>');
                } else {
                    for(var i = 0; i < Globals.primaryMenuData.length; i++){
                        var $this = Globals.primaryMenuData[i],
                            hour = parseInt($this.Start.substr(11, 2));
                        var date = {
                            day: $this.Start.substr(8, 2),
                            month: $this.Start.substr(5, 2),
                            hour: hour > 12 ? (hour - 12) : hour,
                            min: $this.Start.substr(14, 2) + ' ' + (hour >= 12 ? 'pm' : 'am')
                        };
                        var searchResult = $("<div class=\"searchOption\">\n    <div class=\"row\">\n        <div class=\"searchNameInfo\">\n            <div class=\"searchName\">" + $this.Name + "<span class=\"searchDate\"><span>" + date.day + '</span> ' + Functions.toMonth(date.month) + ", <span>" + date.hour + ':' + date.min + "</span></span></div>\n        </div>\n        <div class=\"searchDesc\">" + $this.Description + "</div>\n        <div class=\"grad\"></div>\n    </div>\n</div>");
                        $Objects.PrimaryMenuContainer.append(searchResult);
                    }
                    Functions.RevealMenuOptions();
                }
            },
            RevealMenuOptions: function () {
                t.fromTo($Objects.PrimaryMenuContainer.children(), 1, {
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
            // Public methods inherited from the Main.js
            GetCategoryFromID: w.GetCategoryFromID,
            GetEventFromID: w.GetEventFromID
        };
    dO.ready(function () {
        $Objects.SearchSVG = $('svg#searchBarSVG');
        $Objects.MainMenu = $('aside#searchMenu');
        $Objects.MainMenuButton = $('#MenuIcon');
        $Objects.MainMenuButtonOverlay = $('#menuButtonOverlay')
            .bind('click', function () {
                if (Globals.isCollapsed && !Globals.isCollapsing)
                    Functions.OpenMenu();
            });
        $Objects.MainMenuCloseButton = $('#menuClose')
            .bind('click', function () {
                if (!Globals.isCollapsed && !Globals.isCollapsing)
                    Functions.CloseMenu();
            });
        $Objects.PrimaryMenuContainer = $('div#primaryMenuOptions');
        $Objects.searchInput = $('#searchBox')
            .bind('keyup', function (e) {
                if (e.keyCode == 13) {
                    var s = $Objects.searchInput.val();
                    Functions.GetSearchResults(s);
                }
            });
        $Objects.categoryTab = $('#categoryTabButton')
            .bind('click', function () {
                Functions.DisplayPrimaryOption();
            });
        $Objects.searchTab = $('#resultTabButton')
            .bind('click', function () {
                Functions.GetSearchResults($Objects.searchInput.val());
            });
        dO.on("keyup", function (e) {
            if (e.keyCode == 27 && !Globals.isCollapsed && !Globals.isCollapsing) {
                Functions.CloseMenu();
            }
        });
        t.set($Objects.MainMenuButton, {
            transformOrigin: '50% 50%',
            scale: 0.5
        });
    });
})(document, jQuery(document), window, jQuery, TweenMax);
