/**
 * Created by Kaushik on 11/2/2016.
 */

(function (d, dO, w, $, t) {
    var Globals = {
            // Public variables and properties inherited from Main.js
            /** @type Category[] */
            Categories: w.Categories,
            //Variables
            isCollapsed: true,
            isCollapsing: false,
            isCategoriesDisplayed: false,
            primaryMenuData: [],
            searchResult: [],
            APIAddress: w.APIAddress
        },
        //JQuery objects
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
                    var SearchBorders = $Objects.SearchBox.Borders.children();
                    t.set($Objects.SearchBox.Borders, {
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
                    t.fromTo($Objects.SearchBox.GlassHandle, 0.5, {
                        attr: {
                            d: 'm 3.4532481,1031.6817 48.8640159,0'
                        }
                    }, {
                        attr: {
                            d: 'm 10.555653,1043.6641 9.469718,-8.7922'
                        },
                        ease: Power4.easeOut,
                        onComplete: function () {
                            var glass = $Objects.SearchBox.Glass.PathAnimation();
                            glass.data('PathAnimation').Animate(1, {
                                ease: Back.easeOut,
                                clearOpacity: true
                            });
                            t.set($Objects.MenuButton.TopLine, {
                                opacity: 0
                            });
                            t.set($Objects.MenuButton.BottomLine, {
                                opacity: 0
                            });
                            t.set($Objects.SearchInput, {
                                display: 'block'
                            });
                            Globals.isCollapsed = false;
                            $Objects.SearchInput.focus();
                            Functions.DisplayPrimaryOption();
                        }
                    });
                }
            },
            CloseMenu: function () {
                if (Globals.isCollapsed === false) {
                    var SearchBorders = $Objects.SearchBox.Borders.children();
                    Globals.isCollapsing = true;
                    var glass = $Objects.SearchBox.Glass.PathAnimation();
                    glass.data('PathAnimation').ReverseDraw(1, {
                        ease: Back.easeOut,
                        clearOpacity: true,
                        onComplete: function () {
                            t.set($Objects.MainMenuCloseButton, {
                                display: 'none'
                            });
                            t.set($Objects.MenuButton.TopLine, {
                                opacity: 1
                            });
                            t.set($Objects.MenuButton.BottomLine, {
                                opacity: 1
                            });
                            t.set($Objects.SearchInput, {
                                display: 'none'
                            });
                            t.fromTo($Objects.SearchBox.GlassHandle, 0.5, {
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
                $Objects.CategoryTab.addClass('activeTab');
                $Objects.SearchTab.removeClass('activeTab');
                Globals.isCategoriesDisplayed = true;
                // Why use a div, when you can use a pseudo element, this again degrades the performance since the
                // changing HTML is same as append.
                $Objects.CategoryTab.html('Categories<div class="tabLine"></div>');
                $Objects.PrimaryMenuContainer.html('');
                for (var a = 0; a < Globals.Categories.length; a++) {
                    var option = $("<div data-index=\"" + a + "\" data-catid=\"" + Globals.Categories[a].properties.id + "\" class=\"menuOption\">" + Globals.Categories[a].properties.title + "</div>")
                        .bind('click', Functions.DisplayEvents);
                    $Objects.PrimaryMenuContainer.append(option);
                }
                Functions.RevealMenuOptions();
            },
            DisplayEvents: function (target) {
                Globals.isCategoriesDisplayed = false;
                var CategoryIndex = $(target.target).data().index,
                    CategoryId = $(target.target).data().catid,
                    CategoryObject = Globals.Categories[CategoryIndex];
                $Objects.PrimaryMenuContainer.html('');
                $Objects.CategoryTab.html('<span class="glyphicon glyphicon-chevron-left"></span>' + CategoryObject.properties.title + '<div class="tabLine"></div>');
                for (var i = 0; i < CategoryObject.events.length; i++) {
                    //Category id stored in Category.properties is not correct i think, all categories have id = 0
                    var Event = $("<div data-catid=\""+ (CategoryId + 1) +"\" data-eventid=\""+ CategoryObject.events[i].properties.id + "\" class=\"menuEventOption\">" + CategoryObject.events[i].properties.title + "<span class=\"eventCorner\"></span></div>")
                        .bind('click', Functions.MenuEventClicked);
                    $Objects.PrimaryMenuContainer.append(Event);
                }
                if (CategoryObject.events.length === 0) {
                    $Objects.PrimaryMenuContainer.append('<h3>Events coming soon</h3>');
                }
                Functions.RevealMenuOptions();
            },
            MenuEventClicked: function (target) {
                var Id = $(target.target).data();
                Functions.CloseMenu();
                Functions.GetEventFromID(Id.catid, Id.eventid).showDetails();
            },
            GetSearchResults: function (searchString) {
                $Objects.PrimaryMenuContainer.html('');
                $Objects.SearchTab.addClass('activeTab');
                $Objects.CategoryTab.removeClass('activeTab');
                if (searchString.length === 0) {
                    Globals.searchResult = [];
                    Functions.RenderSearchResults(Globals.searchResult);
                }
                else {
                    $.ajax({
                        url: Globals.APIAddress + '/events?query=' + searchString,
                        type: 'GET',
                        success: function (data) {
                            Globals.searchResult = data.data;
                            Functions.RenderSearchResults();
                        }
                    });
                }
            },
            RenderSearchResults: function () {
                $Objects.CategoryTab.html('Categories<div class="tabLine"></div>');
                Globals.isCategoriesDisplayed = false;
                if (Globals.searchResult.length === 0) {
                    $Objects.PrimaryMenuContainer.append('<h3>No Results to Display</h3>');
                } else {
                    for (var i = 0; i < Globals.searchResult.length; i++) {
                        var currentEvent = Globals.searchResult[i],
                            hour = parseInt(currentEvent.Start.substr(11, 2));
                        var date = {
                            day: currentEvent.Start.substr(8, 2),
                            month: currentEvent.Start.substr(5, 2),
                            hour: hour > 12 ? (hour - 12) : hour,
                            min: currentEvent.Start.substr(14, 2) + ' ' + (hour >= 12 ? 'pm' : 'am')
                        };
                        var id = parseInt(currentEvent.Id),
                            catid = parseInt(currentEvent.CategoryId);
                        var searchResult = $("<div data-catid=\"" + currentEvent.CategoryId + "\" data-eventid=\"" + id + "\" class=\"searchOption\">\n    <div data-catid=\"" + currentEvent.CategoryId + "\" data-eventid=\"" + id + "\" class=\"row\">\n        <div data-catid=\"" + currentEvent.CategoryId + "\" data-eventid=\"" + id + "\"  class=\"searchNameInfo\">\n            <div data-catid=\"" + currentEvent.CategoryId + "\" data-eventid=\"" + id + "\" class=\"searchName\">" + currentEvent.Name + "<span data-catid=\"" + currentEvent.CategoryId + "\" data-eventid=\"" + id + "\" class=\"searchDate\"><span>" + date.day + '</span> ' + Functions.toMonth(date.month) + ", <span>" + date.hour + ':' + date.min + "</span></span></div>\n        </div>\n        <div data-catid=\"" + currentEvent.CategoryId + "\" data-eventid=\"" + id + "\" class=\"searchDesc\">" + currentEvent.Description + "</div>\n     </div>\n</div>")
                            .bind('click', Functions.MenuEventClicked);
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
            // Public methods inherited from the Main.js
            GetCategoryFromID: w.GetCategoryFromID,
            GetEventFromID: w.GetEventFromID
        };
    dO.ready(function () {
        $Objects.SearchSVG = $('svg#searchBarSVG');
        $Objects.MainMenu = $('aside#searchMenu');
        $Objects.MainMenuButton = $('#MenuIcon');
        $Objects.MenuButton = {
            TopLine: $('#menuTopLine'),
            BottomLine: $('#menuBottomLine')
        };
        $Objects.SearchBox = {
            Borders : $('#searchBoxBorder'),
            Glass : $('#magnifying'),
            GlassHandle : $('#searchHandle')
        };
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
        $Objects.SearchInput = $('#searchBox')
            .bind('keyup', function (e) {
                if (e.keyCode == 13) {
                    var s = $Objects.SearchInput.val();
                    Functions.GetSearchResults(s);
                }
            });
        $Objects.CategoryTab = $('#categoryTabButton')
            .bind('click', function () {
                if(!Globals.isCategoriesDisplayed)
                    Functions.DisplayPrimaryOption();
            });
        $Objects.SearchTab = $('#resultTabButton')
            .bind('click', function () {
                Functions.GetSearchResults($Objects.SearchInput.val());
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
