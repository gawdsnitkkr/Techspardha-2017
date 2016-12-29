/**
 * @preserve
 *
 * Menu.js
 * Includes important functioning of the Menu component of the website.
 *
 * @licence MIT
 * @author Kaushik Sarma <kausyap10@gmail.com>
 * @author Divya Mamgai <divyamamgai21@gmail.com>
 *
 */

(function ($, w, d, t, undefined) {

    /** @property {jQuery} */
    var $Cache = {
            NoSearchResults: $("<div id=\"NoSearchResults\">\n    <h3>No Events Found, Please Try Another Query.</h3>\n</div>")
        },
        $Objects = {};

    // Take in references from the Main.js so as to access them here.
    var Globals = $.extend(w.Globals, {
            MenuSectionShowing: false,
            MenuSectionTransiting: false,
            MenuFrameTransiting: false
        }),
        Functions = $.extend(w.Functions, {
            ShowSearchBar: function (duration, callback) {
                duration = duration || 1.5;
                callback = callback || undefined;
                var oneThirdDuration = duration / 3,
                    twoThirdDuration = duration * 2 / 3;
                t.killTweensOf($Objects.MenuIcon);
                t.fromTo($Objects.MenuIcon, oneThirdDuration, {
                    scale: 0.5,
                    transformOrigin: '50% 50% 0'
                }, {
                    scale: 0.88,
                    transformOrigin: '50% 50% 0',
                    ease: Power4.easeOut
                });
                $Objects.SearchBarBorder.css('display', 'block');
                if (Globals.TrailSearchBarBorder === undefined) {
                    Globals.TrailSearchBarBorder = $Objects.SearchBarBorder.Trail({
                        stagger: true,
                        staggerDelay: 0.1,
                        duration: twoThirdDuration,
                        ease: Power4.easeOut
                    }, {
                        paused: true
                    }).GetTrail();
                }
                Globals.TrailSearchBarBorder.timeLine
                    .eventCallback('onComplete', function () {
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    });
                setTimeout(function () {
                    Globals.TrailSearchBarBorder.play();
                }, (oneThirdDuration / 2) * 1000);
                t.killTweensOf($Objects.MenuIconMiddle);
                t.fromTo($Objects.MenuIconMiddle, oneThirdDuration, {
                    attr: {
                        d: 'm 3.4532481,1031.6817 48.8640159,0'
                    }
                }, {
                    attr: {
                        d: 'm 10.555653,1043.6641 9.469718,-8.7922'
                    },
                    ease: Power4.easeOut,
                    onComplete: function () {
                        $Objects.SearchGlass.css('display', 'block');
                        if (Globals.TrailSearchGlass === undefined) {
                            Globals.TrailSearchGlass = $Objects.SearchGlass.Trail({
                                duration: twoThirdDuration,
                                ease: Power4.easeOut
                            }, {
                                paused: true
                            }).GetTrail();
                        }
                        Globals.TrailSearchGlass.play();
                        $Objects.MenuIconTop.css('display', 'none');
                        $Objects.MenuIconBottom.css('display', 'none');
                        t.killTweensOf($Objects.SearchBarInput);
                        t.fromTo($Objects.SearchBarInput.css('display', 'block'), twoThirdDuration, {
                            opacity: 0,
                            x: 48
                        }, {
                            opacity: 1,
                            x: 0,
                            ease: Power4.easeOut
                        });
                    }
                });
            },
            HideSearchBar: function (duration, callback) {
                duration = duration || 1.5;
                callback = callback || undefined;
                var oneThirdDuration = duration / 3,
                    twoThirdDuration = duration * 2 / 3;
                Globals.TrailSearchGlass.timeLine
                    .eventCallback('onReverseComplete', function () {
                        t.killTweensOf($Objects.MenuIconMiddle);
                        t.fromTo($Objects.MenuIconMiddle, oneThirdDuration, {
                            attr: {
                                d: 'm 10.555653,1043.6641 9.469718,-8.7922'
                            }
                        }, {
                            attr: {
                                d: 'm 3.4532481,1031.6817 48.8640159,0'
                            },
                            ease: Power4.easeOut,
                            onComplete: function () {
                                t.killTweensOf($Objects.MenuIcon);
                                t.fromTo($Objects.MenuIcon, oneThirdDuration, {
                                    scale: 0.88,
                                    transformOrigin: '50% 50% 0'
                                }, {
                                    scale: 0.5,
                                    transformOrigin: '50% 50% 0',
                                    ease: Power4.easeOut,
                                    onComplete: function () {
                                        if ($.isFunction(callback)) {
                                            callback();
                                        }
                                    }
                                });
                            }
                        });
                    })
                    .reverse();
                Globals.TrailSearchBarBorder.reverse();
                $Objects.MenuIconTop.css('display', 'block');
                $Objects.MenuIconBottom.css('display', 'block');
                t.killTweensOf($Objects.SearchBarInput);
                t.fromTo($Objects.SearchBarInput, twoThirdDuration, {
                    opacity: 1,
                    x: 0
                }, {
                    opacity: 0,
                    x: 48,
                    ease: Power4.easeOut,
                    onComplete: function () {
                        $Objects.SearchBarInput.css('display', 'none');
                    }
                });
            },
            /**
             * Shows the #MenuSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowMenuSection: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                if (!Globals.MenuSectionShowing && !Globals.MenuSectionTransiting) {
                    Globals.MenuSectionTransiting = true;
                    Functions.HideLogo();
                    Functions.ShowHeaderCloseButton();
                    Functions.ShowSearchBar();
                    t.killTweensOf($Objects.MenuSection);
                    t.fromTo($Objects.MenuSection.css('display', 'block'), duration, {
                        opacity: 0,
                        top: '100vh'
                    }, {
                        opacity: 1,
                        top: 0,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.MenuSectionTransiting = false;
                            Globals.MenuSectionShowing = true;
                            Functions.CancelGalaxyMovementAnimationLoop();
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                }
            },
            /**
             * Hides the #MenuSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideMenuSection: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                if (Globals.MenuSectionShowing && !Globals.MenuSectionTransiting) {
                    Globals.MenuSectionTransiting = true;
                    if (!Globals.EventSectionShowing) {
                        Functions.ShowLogo();
                        Functions.HideHeaderCloseButton();
                    }
                    Functions.HideSearchBar();
                    t.killTweensOf($Objects.MenuSection);
                    t.fromTo($Objects.MenuSection, duration, {
                        opacity: 1,
                        top: 0
                    }, {
                        opacity: 0,
                        top: '100vh',
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.MenuSectionTransiting = false;
                            $Objects.MenuSection.css('display', 'none');
                            Globals.MenuSectionShowing = false;
                            if (!Globals.EventSectionShowing) {
                                Functions.RequestGalaxyMovementAnimationLoop();
                            }
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                }
            },
            /**
             * Shows the Menu Heading defined by the given headingID and hides the currently active Menu Heading.
             * @param {String} headingID - ID of the Menu Heading to show.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowMenuHeading: function (headingID, duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                var $MenuHeading = $('#' + headingID, $Objects.MenuHeadingFrame);
                if (!$MenuHeading.hasClass('Active')) {
                    var $ActiveMenuHeading = $('.MenuHeading.Active:not(#' + headingID + ')', $Objects.MenuHeadingFrame);
                    t.killTweensOf($MenuHeading);
                    t.fromTo($MenuHeading, duration, {
                        left: '-24rem',
                        opacity: 0
                    }, {
                        left: '1rem',
                        opacity: 1,
                        ease: Power4.easeOut,
                        clearProps: 'all',
                        onComplete: function () {
                            $MenuHeading.addClass('Active');
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                    t.killTweensOf($ActiveMenuHeading);
                    t.fromTo($ActiveMenuHeading, duration, {
                        left: '1rem',
                        opacity: 1
                    }, {
                        left: '24rem',
                        opacity: 0,
                        ease: Power4.easeOut,
                        clearProps: 'all',
                        onComplete: function () {
                            $ActiveMenuHeading.removeClass('Active');
                        }
                    });
                } else if ($.isFunction(callback)) {
                    callback();
                }
            },
            /**
             * Shows the Menu Frame given as the parameter and currently active one is automatically hidden.
             * @param {jQuery} $menuFrame - jQuery object of the Menu Frame to be shown.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowMenuFrame: function ($menuFrame, duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                if (!Globals.MenuFrameTransiting) {
                    Globals.MenuFrameTransiting = true;
                    if (!$menuFrame.hasClass('Active')) {
                        var $ActiveMenuFrame = $('.MenuFrame.Active:not(' + $menuFrame.prop('id') + ')', $Objects.MenuSection);
                        $Objects.MenuSection.css('overflow-y', 'hidden');
                        t.killTweensOf($menuFrame);
                        t.fromTo($menuFrame.css('display', 'block'), duration, {
                            opacity: 0,
                            left: '-100vw',
                            rotationY: '-22.5deg',
                            transformOrigin: '50% 50% 0',
                            transformPerspective: Globals.WindowWidth
                        }, {
                            opacity: 1,
                            left: 0,
                            rotationY: '0deg',
                            transformOrigin: '50% 50% 0',
                            transformPerspective: Globals.WindowWidth,
                            ease: Power4.easeOut,
                            clearProps: 'all',
                            onComplete: function () {
                                Globals.MenuFrameTransiting = false;
                                $menuFrame.addClass('Active');
                                $Objects.MenuSection.css('overflow-y', 'auto');
                                if ($.isFunction(callback)) {
                                    callback();
                                }
                                var onShow = w[$menuFrame.attr('data-onShow')];
                                if ($.isFunction(onShow)) {
                                    onShow();
                                }
                            }
                        });
                        t.killTweensOf($ActiveMenuFrame);
                        t.fromTo($ActiveMenuFrame.css('display', 'block'), duration, {
                            opacity: 1,
                            left: 0,
                            rotationY: '0deg',
                            transformOrigin: '50% 50% 0',
                            transformPerspective: Globals.WindowWidth
                        }, {
                            opacity: 0,
                            left: '100vw',
                            rotationY: '22.5deg',
                            transformOrigin: '50% 50% 0',
                            transformPerspective: Globals.WindowWidth,
                            ease: Power4.easeOut,
                            clearProps: 'all',
                            onComplete: function () {
                                $ActiveMenuFrame.removeClass('Active');
                                var onHide = w[$ActiveMenuFrame.attr('data-onHide')];
                                if ($.isFunction(onHide)) {
                                    onHide();
                                }
                            }
                        });
                    } else if ($.isFunction(callback)) {
                        Globals.MenuFrameTransiting = false;
                        callback();
                    }
                }
            },
            /**
             * Shows the #MenuBackButton element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowMenuBackButton: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                var $ActiveMenuHeading = $('.MenuHeading.Active', $Objects.MenuHeadingFrame);
                t.killTweensOf($Objects.MenuBackButton);
                t.fromTo($Objects.MenuBackButton, duration, {
                    left: '-4.2rem',
                    opacity: 0
                }, {
                    left: '1rem',
                    opacity: 1,
                    ease: Power4.easeOut,
                    clearProps: 'all',
                    onComplete: function () {
                        $Objects.MenuBackButton.addClass('Show');
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                });
                t.killTweensOf($ActiveMenuHeading);
                t.fromTo($ActiveMenuHeading, duration, {
                    left: '1rem'
                }, {
                    left: '5.6rem',
                    ease: Power4.easeOut
                });
            },
            /**
             * Hides the #MenuBackButton element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             * @param {Boolean} [disableActiveMenuHeadingAnimation]
             */
            HideMenuBackButton: function (duration, callback, disableActiveMenuHeadingAnimation) {
                duration = duration || 1;
                callback = callback || undefined;
                disableActiveMenuHeadingAnimation = disableActiveMenuHeadingAnimation || true;
                t.killTweensOf($Objects.MenuBackButton);
                t.fromTo($Objects.MenuBackButton, duration, {
                    left: '1rem',
                    opacity: 1
                }, {
                    left: '-4.2rem',
                    opacity: 0,
                    ease: Power4.easeOut,
                    clearProps: 'all',
                    onComplete: function () {
                        $Objects.MenuBackButton.removeClass('Show');
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                });
                if (disableActiveMenuHeadingAnimation === false) {
                    var $ActiveMenuHeading = $('.MenuHeading.Active', $Objects.MenuHeadingFrame);
                    t.killTweensOf($ActiveMenuHeading);
                    t.fromTo($ActiveMenuHeading, duration, {
                        left: '5.6rem'
                    }, {
                        left: '1rem',
                        ease: Power4.easeOut
                    });
                }
            },
            MenuIconOverlayOnClick: function (event) {
                event.stopPropagation();
                Functions.ShowMenuSection();
            },
            GenerateCategoryListFrame: function () {
                var $CategoryListFrame = $Objects.CategoryListFrame.detach().empty(),
                    categories = Globals.Categories,
                    categoryCount = categories.length,
                    $CategoryButtonCache = $Cache.CategoryButton,
                    $CategoryButton,
                    category;
                for (var categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                    category = categories[categoryIndex];
                    $.data(($CategoryButton = $CategoryButtonCache.clone()).get(0), 'Category', category);
                    $CategoryButton.find('text').text(category.properties.title);
                    $CategoryListFrame.append($CategoryButton);
                }
                $Objects.EventListFrame.before($CategoryListFrame);
            },
            /**
             * Generates the Events list in the #EventListFrame for the given Category object.
             * @param {Category} category
             */
            GenerateEventListFrame: function (category) {
                var $EventListFrame = $Objects.EventListFrame.detach().empty(),
                    $EventButtonCache = $Cache.EventButton,
                    events = category.events,
                    eventCount = events.length,
                    event,
                    $EventButton;
                for (var eventIndex = 0; eventIndex < eventCount; eventIndex++) {
                    event = events[eventIndex];
                    $.data(($EventButton = $EventButtonCache.clone()).get(0), 'Event', event);
                    $EventButton.find('.EventButtonTitle').text(event.properties.title);
                    $EventListFrame.append($EventButton);
                }
                $Objects.CategoryListFrame.after($EventListFrame);
            },
            GenerateSearchResults: function (resultArray) {
                var $SearchListFrame = $Objects.SearchListFrame.detach().empty(),
                    $EventButtonCache = $Cache.EventButton,
                    resultCount = resultArray.length,
                    result,
                    event,
                    $EventButton;
                if (resultCount > 0) {
                    for (var resultIndex = 0; resultIndex < resultCount; resultIndex++) {
                        result = resultArray[resultIndex];
                        event = Functions.GetEventFromID(result.CategoryId, result.Id);
                        $.data(($EventButton = $EventButtonCache.clone()).get(0), 'Event', event);
                        $EventButton.find('.EventButtonTitle').text(event.properties.title);
                        $SearchListFrame.append($EventButton);
                    }
                } else {
                    $SearchListFrame.append($Cache.NoSearchResults.clone());
                }
                $Objects.EventListFrame.after($SearchListFrame);
                t.staggerFromTo($SearchListFrame.children(), 1, {
                    opacity: 0,
                    y: '100%',
                    rotationX: '-22.5deg',
                    transformOrigin: '50% 50% 0',
                    transformPerspective: '200rem'
                }, {
                    opacity: 1,
                    y: '0%',
                    rotationX: '0deg',
                    transformOrigin: '50% 50% 0',
                    transformPerspective: '200rem',
                    ease: Power4.easeOut
                }, 0.1);
            },
            CategoryListFrameCategoryButtonOnClick: function (event) {
                event.stopPropagation();
                if (!Globals.MenuFrameTransiting) {
                    /** @type Category */
                    var category = $.data(this, 'Category');
                    $Objects.CategoryHeading.text(category.properties.title);
                    Functions.GenerateEventListFrame(category);
                    Functions.ShowMenuHeading('CategoryHeading', 1, Functions.ShowMenuBackButton);
                    Functions.ShowMenuFrame($Objects.EventListFrame);
                }
            },
            EventButtonOnClick: function (e) {
                e.stopPropagation();
                /** @type Event */
                var event = $.data(this, 'Event');
                Functions.HideMenuSection();
                event.showDetails();
            },
            MenuBackButtonOnClick: function (event) {
                event.stopPropagation();
                if (!Globals.MenuFrameTransiting) {
                    Functions.HideMenuBackButton(0.5);
                    Functions.ShowMenuFrame($Objects.CategoryListFrame);
                    Functions.ShowMenuHeading('CategoriesHeading');
                }
            },
            SearchBarInputOnKeyDown: function (event) {
                if (event.keyCode === 13) {
                    event.stopPropagation();
                    event.preventDefault();
                    var searchQuery = $Objects.SearchBarInput.blur().val();
                    if (searchQuery.length > 0) {
                        $.ajax({
                            url: Globals.APIAddress + '/events?query=' + encodeURI(searchQuery),
                            type: 'GET',
                            beforeSend: function () {
                                Functions.ShowLoading();
                            },
                            success: function (response) {
                                response = Functions.ExtendResponse(response);
                                if (response.status.code === 200) {
                                    Functions.GenerateSearchResults(response.data);
                                    Functions.HideMenuBackButton(0.5);
                                    Functions.ShowMenuHeading('SearchResultsHeading', 1, Functions.ShowMenuBackButton);
                                    Functions.ShowMenuFrame($Objects.SearchListFrame);
                                }
                            },
                            complete: function () {
                                Functions.HideLoading();
                            }
                        });
                    }
                }
            },
            MenuButtonOnClick: function (event) {
                event.stopPropagation();
                if (!Globals.MenuFrameTransiting) {
                    var component = $(this).attr('data-for'),
                        $menuFrame = $('#' + component + 'Frame', $Objects.MenuSection);
                    if (!$menuFrame.hasClass('Active')) {
                        Functions.HideMenuBackButton(0.5);
                        Functions.ShowMenuHeading(component + 'Heading', 1, Functions.ShowMenuBackButton);
                        Functions.ShowMenuFrame($('#' + component + 'Frame', $Objects.MenuSection));
                    }
                }
            },
            OnInitialized: function () {
                Functions.GenerateCategoryListFrame();
            }
        });

    $(function () {
        $Objects.SearchBar = $('#SearchBar', d);
        if ($Objects.SearchBar.length > 0) {
            $Objects.SearchBarSVG = $('#SearchBarSVG', $Objects.SearchBar);
            if ($Objects.SearchBarSVG.length > 0) {
                $Objects.SearchBarBorder = $('#SearchBarBorder', $Objects.SearchBarSVG);
                $Objects.SearchGlass = $('#SearchGlass', $Objects.SearchBarSVG);
                t.set($Objects.MenuIcon = $('#MenuIcon', $Objects.SearchBarSVG), {
                    scale: 0.5,
                    transformOrigin: '50% 50% 0'
                });
                if ($Objects.MenuIcon.length > 0) {
                    $Objects.MenuIconTop = $('#MenuIconTop', $Objects.MenuIcon);
                    $Objects.MenuIconMiddle = $('#MenuIconMiddle', $Objects.MenuIcon);
                    $Objects.MenuIconBottom = $('#MenuIconBottom', $Objects.MenuIcon);
                }
            }
            $Objects.SearchBarInput = $('#SearchBarInput', $Objects.SearchBar)
                .on('keydown', Functions.SearchBarInputOnKeyDown);
        }
        $Objects.MenuSection = $('#MenuSection', d);
        if ($Objects.MenuSection.length > 0) {
            $Objects.MenuHeadingFrame = $('#MenuHeadingFrame', $Objects.MenuSection);
            if ($Objects.MenuHeadingFrame.length > 0) {
                $Objects.MenuBackButton = $('#MenuBackButton', $Objects.MenuHeadingFrame)
                    .on('click', Functions.MenuBackButtonOnClick);
                $Objects.CategoryHeading = $('#CategoryHeading', $Objects.MenuHeadingFrame);
            }
            $Objects.CategoryListFrame = $('#CategoryListFrame', $Objects.MenuSection);
            if ($Objects.CategoryListFrame.length > 0) {
                var $CategoryButton = $('.CategoryButton', $Objects.CategoryListFrame);
                $Cache.CategoryButton = $CategoryButton.clone();
                $CategoryButton.remove();
            }
            $Objects.EventListFrame = $('#EventListFrame', $Objects.MenuSection);
            if ($Objects.EventListFrame.length > 0) {
                var $EventButton = $('.EventButton', $Objects.EventListFrame);
                $Cache.EventButton = $EventButton.clone();
                $EventButton.remove();
            }
            $Objects.SearchListFrame = $('#SearchListFrame', $Objects.MenuSection);
        }
        $Objects.HeaderCloseButton = $('#HeaderCloseButton', d).on('click', Functions.HeaderCloseButtonOnClick);
    });

    $(d)
        .on('click', '#MenuIconOverlay', Functions.MenuIconOverlayOnClick)
        .on('mouseup', '#CategoryListFrame .CategoryButton', Functions.CategoryListFrameCategoryButtonOnClick)
        .on('mouseup', '.EventButton', Functions.EventButtonOnClick)
        .on('mouseup', '.MenuButton', Functions.MenuButtonOnClick)
        .on('initialized', Functions.OnInitialized);

})(jQuery, window, document, TweenMax);
