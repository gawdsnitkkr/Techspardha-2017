/**
 * Created by Kaushik on 11/2/2016.
 */

(function ($, d, w, t) {
    var Globals = {
            // Public variables and properties inherited from Main.js
            /** @type Category[] */
            Categories: w.Categories,
            APIAddress: w.APIAddress,
            //Variables
            isCollapsed: true,
            isCollapsing: false,
            isCategoriesDisplayed: false,
            primaryMenuData: [],
            searchResult: []
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
                    t.fromTo($Objects.MainMenuButton, 0.5, {
                        scale: 0.5
                    }, {
                        scale: 0.88,
                        ease: Power4.easeOut
                    });
                    t.to($Objects.MainMenu, 1, {
                        top: 0,
                        opacity: 1,
                        ease: Power4.easeOut
                    });
                    t.to($Objects.Logo, 1, {
                        top: '-6.4rem',
                        ease: Power4.easeOut
                    });
                    Globals.TrailSearchBoxBorders = $Objects.SearchBox.Borders
                        .css('display', 'block')
                        .Trail({
                            stagger: true,
                            staggerDelay: 0,
                            delay: 0.4,
                            duration: 1,
                            ease: Power4.easeOut
                        }, {
                            paused: true
                        }).GetTrail().play();
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
                            Globals.TrailSearchBoxGlass = $Objects.SearchBox.Glass
                                .css('opacity', '1')
                                .Trail({
                                    duration: 1,
                                    ease: Power4.easeOut
                                }, {
                                    paused: true
                                })
                                .GetTrail().play();
                            t.set($Objects.MenuButton.TopLine, {
                                opacity: 0
                            });
                            t.set($Objects.MenuButton.BottomLine, {
                                opacity: 0
                            });
                            t.fromTo($Objects.SearchInput, 1, {
                                display: 'block',
                                opacity: 0,
                                x: 48
                            }, {
                                opacity: 1,
                                x: 0,
                                ease: Power4.easeOut
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
                    Globals.isCollapsing = true;
                    Globals.TrailSearchBoxGlass.timeLine.eventCallback("onReverseComplete", function () {
                        t.fromTo($Objects.SearchBox.GlassHandle, 0.5, {
                            attr: {
                                d: 'm 10.555653,1043.6641 9.469718,-8.7922'
                            }
                        }, {
                            attr: {
                                d: 'm 3.4532481,1031.6817 48.8640159,0'
                            },
                            ease: Power4.easeOut,
                            onComplete: function () {
                                t.fromTo($Objects.MainMenuButton, 0.5, {
                                    scale: 0.88
                                }, {
                                    scale: 0.5,
                                    ease: Power4.easeOut,
                                    onComplete: function () {
                                        Globals.isCollapsed = true;
                                        Globals.isCollapsing = false;
                                    }
                                });
                            }
                        });
                    });
                    Globals.TrailSearchBoxGlass.reverse();
                    Globals.TrailSearchBoxBorders.reverse();
                    $Objects.MenuButton.TopLine.css('opacity', 1);
                    $Objects.MenuButton.BottomLine.css('opacity', 1);
                    t.fromTo($Objects.SearchInput, 1, {
                        opacity: 1,
                        x: 0
                    }, {
                        opacity: 0,
                        x: 48,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            $Objects.SearchInput.css('display', 'none');
                        }
                    });
                    t.to($Objects.MainMenu, 1, {
                        top: '100vh',
                        opacity: 0,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            $Objects.PrimaryMenuContainer.html('');
                        }
                    });
                    t.to($Objects.Logo, 1, {
                        top: 0,
                        ease: Power4.easeOut
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
                for (var i = 0; i < Globals.Categories.length; i++) {
                    $Objects.PrimaryMenuContainer
                        .append($("<div data-index=\"" + i + "\" data-catid=\"" + Globals.Categories[i].properties.id + "\" class=\"menuOption\">" + Globals.Categories[i].properties.title + "</div>")
                            .on('click', Functions.DisplayEvents));
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
                    var Event = $("<div data-catid=\"" + (CategoryId + 1) + "\" data-eventid=\"" + CategoryObject.events[i].properties.id + "\" class=\"menuEventOption\">" + CategoryObject.events[i].properties.title + "<span class=\"eventCorner\"></span></div>")
                        .on('click', Functions.MenuEventClicked);
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
                        /*
                         substr() is very costly. Just think about the complexity for a bit. You are calling substr()
                         on the same string, lets say of N length, for at least 4 times which means 4N time for each
                         of the M search results that's 4NM which might be a lot if the N > 10 (Which it is :|).
                         */
                        var currentEvent = Globals.searchResult[i],
                            hour = parseInt(currentEvent.Start.substr(11, 2));
                        var date = {
                            day: currentEvent.Start.substr(8, 2),
                            month: currentEvent.Start.substr(5, 2),
                            hour: hour > 12 ? (hour - 12) : hour,
                            min: currentEvent.Start.substr(14, 2) + ' ' + (hour >= 12 ? 'pm' : 'am')
                        };
                        var id = parseInt(currentEvent.Id),
                            categoryID = parseInt(currentEvent.CategoryId);
                        // Why so many data-catid and data-eventid?
                        var searchResult = $("<div data-catid=\"" + categoryID + "\" data-eventid=\"" + id + "\" class=\"searchOption\">\n    <div data-catid=\"" + categoryID + "\" data-eventid=\"" + id + "\" class=\"row\">\n        <div data-catid=\"" + categoryID + "\" data-eventid=\"" + id + "\"  class=\"searchNameInfo\">\n            <div data-catid=\"" + categoryID + "\" data-eventid=\"" + id + "\" class=\"searchName\">" + currentEvent.Name + "<span data-catid=\"" + categoryID + "\" data-eventid=\"" + id + "\" class=\"searchDate\"><span>" + date.day + '</span> ' + Functions.toMonth(date.month) + ", <span>" + date.hour + ':' + date.min + "</span></span></div>\n        </div>\n        <div data-catid=\"" + categoryID + "\" data-eventid=\"" + id + "\" class=\"searchDesc\">" + currentEvent.Description + "</div>\n     </div>\n</div>")
                            .on('click', Functions.MenuEventClicked);
                        $Objects.PrimaryMenuContainer.append(searchResult);
                    }
                    Functions.RevealMenuOptions();
                }
            },
            RevealMenuOptions: function () {
                t.fromTo($Objects.PrimaryMenuContainer.children(), 1, {
                    top: '-48px',
                    opacity: 0
                }, {
                    top: 0,
                    opacity: 1,
                    ease: Power4.easeOut
                });
            },
            // Public methods inherited from the Main.js
            GetCategoryFromID: w.GetCategoryFromID,
            GetEventFromID: w.GetEventFromID
        };
    $(function () {
        $Objects.Logo = $('#Logo');
        $Objects.SearchSVG = $('#searchBarSVG');
        $Objects.MainMenu = $('#searchMenu');
        $Objects.MainMenuButton = $('#MenuIcon');
        $Objects.MenuButton = {
            TopLine: $('#menuTopLine'),
            BottomLine: $('#menuBottomLine')
        };
        $Objects.SearchBox = {
            Borders: $('#searchBoxBorder'),
            Glass: $('#magnifying'),
            GlassHandle: $('#searchHandle')
        };
        $Objects.MainMenuButtonOverlay = $('#menuButtonOverlay')
            .on('click', function () {
                if (Globals.isCollapsed && !Globals.isCollapsing)
                    Functions.OpenMenu();
            });
        $Objects.MainMenuCloseButton = $('#MenuClose')
            .on('click', function () {
                if (!Globals.isCollapsed && !Globals.isCollapsing) {
                    Functions.CloseMenu();
                }
            });
        $Objects.PrimaryMenuContainer = $('div#primaryMenuOptions');
        $Objects.SearchInput = $('#searchBox')
            .on('keyup', function (event) {
                if (event.keyCode === 13) {
                    Functions.GetSearchResults($Objects.SearchInput.val());
                }
            });
        $Objects.CategoryTab = $('#categoryTabButton')
            .on('click', function () {
                if (!Globals.isCategoriesDisplayed) {
                    Functions.DisplayPrimaryOption();
                }
            });
        $Objects.SearchTab = $('#resultTabButton')
            .on('click', function () {
                Functions.GetSearchResults($Objects.SearchInput.val());
            });
        t.set($Objects.MainMenuButton, {
            transformOrigin: '50% 50% 0',
            scale: 0.5
        });
    });
    $(d)
        .on("keyup", function (event) {
            if ((event.keyCode === 27) && !Globals.isCollapsed && !Globals.isCollapsing) {
                Functions.CloseMenu();
            }
        });
})(jQuery, document, window, TweenMax);
