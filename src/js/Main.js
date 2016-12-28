// @include ./plugins/Trail.js

/**
 * @preserve
 *
 * Main.js
 * Includes important functioning of the various elements of the website, including fetching the data and displaying
 * the Galaxy and Stars.
 *
 * @licence MIT
 * @author Divya Mamgai <divyamamgai21@gmail.com>
 *
 */

(function ($, w, d, t, undefined) {
    'use strict';

    String.prototype.capitalize = function () {
        var WordArray = this.split(' '),
            WordIndex = 0,
            WordCount = WordArray.length,
            Word,
            CapitalizedString = '';
        if (WordCount > 0) {
            Word = WordArray[WordIndex++];
            CapitalizedString += Word.charAt(0).toUpperCase() + Word.slice(1);
            for (; WordIndex < WordCount; WordIndex++) {
                Word = WordArray[WordIndex];
                CapitalizedString += ' ' + Word.charAt(0).toUpperCase() + Word.slice(1);
            }
        }
        return CapitalizedString;
    };

    /**
     * A point having X and Y coordinates.
     * @param {Number} x - X coordinate of the point.
     * @param {Number} y - Y coordinate of the point.
     * @constructor
     */
    var Point = function (x, y) {
        this.x = x;
        this.y = y;
    };

    /** @type Function */
    var RequestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.mozRequestAnimationFrame,
        CancelAnimationFrame = w.cancelAnimationFrame || w.webkitCancelAnimationFrame || w.mozCancelAnimationFrame;

    /** @property {jQuery} */
    var $Cache = {},
        $Objects = {};

    var floor = Math.floor,
        sin = Math.sin,
        cos = Math.cos,
        PI = Math.PI,
        HalfPI = PI / 2,
        TwoPI = PI * 2,
        TwoByThreePI = TwoPI + PI;

    var Globals = {
            APIAddress: 'http://techspardha.org/api',
            WindowWidth: w.innerWidth,
            WindowHeight: w.innerHeight,
            WindowHalfWidth: w.innerWidth / 2,
            WindowHalfHeight: w.innerHeight / 2,
            MouseDeltaX: 0,
            MouseDeltaY: 0,
            MouseDeltaThreshold: 0.5,
            GalaxyContainerShowing: true,
            GalaxyContainerTransiting: false,
            GalaxyContainerX: 0,
            GalaxyContainerY: 0,
            GalaxyMovementSpeed: 2,
            GalaxyMovementAnimationFrameID: undefined,
            EventSectionShowing: false,
            EventSectionTransiting: false,
            EventSVGStarScale: 72,
            EventDefaultProperties: {
                /** @type Number */
                id: 0,
                /** @type Number */
                societyID: 0,
                /** @type String */
                title: 'Event',
                /** @type String */
                description: 'Description',
                image: 'IMAGE_URL',
                venue: 'Venue',
                startTime: 'Start Time',
                endTime: 'End Time',
                currentRound: 1,
                totalRounds: 1,
                maxParticipants: 1,
                status: 'Not Started',
                pdf: 'PDF_URL',
                rules: 'Rules',
                coordinators: [],
                /** @type Number */
                delay: 0,
                color: 'rgb(255, 255, 255)'
            },
            CategoryDefaultProperties: {
                /** @type Number */
                id: 0,
                /** @type String */
                title: 'Category'
            },
            CategoryDiameter: 512,
            /** @type Point[] */
            CategoriesPosition: [],
            /** @type Category[] */
            Categories: [],
            CategoryIDToIndexMap: {},
            EventIDToIndexMap: {}
        },
        Functions = {
            ShowLoading: function () {
                $Objects.LoadingFrame.addClass('Show');
            },
            HideLoading: function () {
                t.killTweensOf($Objects.LoadingFrame);
                t.fromTo($Objects.LoadingFrame, 1, {
                    opacity: 1,
                    scale: 1,
                    transformOrigin: '50% 50% 0'
                }, {
                    opacity: 0,
                    scale: 1.3,
                    transformOrigin: '50% 50% 0',
                    ease: Power4.easeInOut,
                    clearProps: 'all',
                    onComplete: function () {
                        $Objects.LoadingFrame.removeClass('Show');
                    }
                });
            },
            /**
             * Sets the viewBox attribute of the #GalaxySVG and the #EventSVG to '0 0 WINDOW_WIDTH WINDOW_HEIGHT'.
             */
            UpdateViewBoxSize: function () {
                var viewBox = '0 0 ' + Globals.WindowWidth + ' ' + Globals.WindowHeight;
                $Objects.GalaxySVG.attr('viewBox', viewBox);
                $Objects.EventSVG.attr('viewBox', viewBox);
            },
            UpdateEventSVGStarPosition: function () {
                t.set($Objects.EventSVGStar, {
                    x: Globals.WindowWidth,
                    y: Globals.WindowHeight,
                    scale: Globals.EventSVGStarScale,
                    transformOrigin: '50% 50% 0'
                });
            },
            /**
             * Moves the #GalaxyContainer by the desired delta in both dX and dY direction.
             * @param {Number} dX
             * @param {Number} dY
             */
            MoveGalaxyContainerBy: function (dX, dY) {
                dX = Math.abs(dX) < Globals.MouseDeltaThreshold ? 0 : dX;
                dY = Math.abs(dY) < Globals.MouseDeltaThreshold ? 0 : dY;
                t.to($Objects.GalaxyContainer, 2, {
                    x: (Globals.GalaxyContainerX += dX),
                    y: (Globals.GalaxyContainerY += dY),
                    ease: Power4.easeOut
                });
            },
            /**
             * Requests the Galaxy Movement Animation Loop and defines the Globals.GalaxyMovementAnimationFrameID with
             * the value returned by the RequestAnimationFrame() function as animation loop ID.
             */
            RequestGalaxyMovementAnimationLoop: function () {
                Globals.GalaxyMovementAnimationFrameID = RequestAnimationFrame(Functions.GalaxyMovementAnimationLoop);
            },
            /**
             * Cancels the Galaxy Movement Animation Loop defined by the Globals.GalaxyMovementAnimationFrameID and
             * makes it undefined to signify that the animation loop has been canceled.
             */
            CancelGalaxyMovementAnimationLoop: function () {
                CancelAnimationFrame(Globals.GalaxyMovementAnimationFrameID);
                Globals.GalaxyMovementAnimationFrameID = undefined;
            },
            /**
             * Galaxy movement animation loop.
             */
            GalaxyMovementAnimationLoop: function () {
                if (Globals.GalaxyContainerShowing && !Globals.GalaxyContainerTransiting) {
                    Functions.MoveGalaxyContainerBy(Globals.MouseDeltaX, Globals.MouseDeltaY);
                    Functions.RequestGalaxyMovementAnimationLoop();
                } else {
                    Functions.CancelGalaxyMovementAnimationLoop();
                }
            },
            WindowOnResize: function () {
                Globals.WindowHalfWidth = (Globals.WindowWidth = w.innerWidth) / 2;
                Globals.WindowHalfHeight = (Globals.WindowHeight = w.innerHeight) / 2;
                Functions.UpdateViewBoxSize();
                Functions.UpdateEventSVGStarPosition();
            },
            WindowOnMouseMove: function (event) {
                Globals.MouseDeltaX = ((Globals.WindowHalfWidth - event.pageX) / Globals.WindowHalfWidth) * Globals.GalaxyMovementSpeed;
                Globals.MouseDeltaY = ((Globals.WindowHalfHeight - event.pageY) / Globals.WindowHalfHeight) * Globals.GalaxyMovementSpeed;
                if (!Globals.MenuSectionShowing && !Globals.EventSectionShowing &&
                    Globals.GalaxyMovementAnimationFrameID === undefined) {
                    Functions.RequestGalaxyMovementAnimationLoop();
                }
            },
            WindowOnMouseOut: function (event) {
                var target = event.target;
                if (!target || ((target.nodeName.toLowerCase() === 'svg') && (target.id === 'GalaxySVG'))) {
                    Functions.CancelGalaxyMovementAnimationLoop();
                }
            },
            WindowOnKeyDown: function (event) {
                if (event.keyCode === 27) {
                    Functions.HeaderCloseButtonOnClick();
                }
            },
            /**
             * Generates a random RGB color representation in the form rgb(R, G, B) and returns it as a string.
             * @param {int} [minRed]
             * @param {int} [maxRed]
             * @param {int} [minGreen]
             * @param {int} [maxGreen]
             * @param {int} [minBlue]
             * @param {int} [maxBlue]
             * @return {String}
             */
            GenerateRandomColor: function (minRed, maxRed, minGreen, maxGreen, minBlue, maxBlue) {
                minRed = minRed || 0;
                maxRed = maxRed || 255;
                minGreen = minGreen || 0;
                maxGreen = maxGreen || 255;
                minBlue = minBlue || 0;
                maxBlue = maxBlue || 255;
                var R = Math.round(Math.random() * (maxRed - minRed + 1) + minRed),
                    G = Math.round(Math.random() * (maxGreen - minGreen + 1) + minGreen),
                    B = Math.round(Math.random() * (maxBlue - minBlue + 1) + minBlue);
                return 'rgb(' + R + ', ' + G + ', ' + B + ')';
            },
            /**
             * Creates a new Event jQuery object with given attributes and returns it.
             * @param {String} title - Title for the Event element.
             * @param {String} color - RGB representation of the Color of the Event Star.
             * @param {Object} [attributes] - Attributes to be given to the new Event jQuery object which are
             * applied using TweenMax.set().
             * @return {jQuery}
             */
            $CreateEvent: function (title, color, attributes) {
                var $clone = $Cache.Event.clone();
                $clone.find('text').html(title);
                $clone.find('.Star').css('fill', color);
                t.set($clone, attributes);
                return $clone;
            },
            /**
             * Creates a new Category jQuery object with given attributes and returns it.
             * @param {String} title - Title for the Category element.
             * @param {Object} [attributes] - Attributes to be given to the new Category jQuery object which are
             * applied using TweenMax.set().
             * @return {jQuery}
             */
            $CreateCategory: function (title, attributes) {
                var $clone = $Cache.Category.clone();
                $clone.find('text').html(title);
                t.set($clone, attributes);
                return $clone;
            },
            /**
             * Set's the ticking arc of the clock to given time (now) based on the total time it can show.
             * @param {Number} now - Time passed since the clock was started.
             * @param {Number} total - The total amount of time that the clock can show.
             */
            UpdateEventClock: function (now, total) {
                var Minutes = floor(now / 60),
                    Seconds = floor(now % 60),
                    Ratio = ((total - now) / total),
                    Degree = (Ratio * TwoPI) - HalfPI,
                    X = 100 + cos(Degree) * 90,
                    Y = 100 + sin(Degree) * 90;
                $Objects.EventClockMinute.html(Minutes);
                $Objects.EventClockSecond.html(Seconds > 9 ? Seconds : '0' + Seconds);
                if (Degree >= -HalfPI && Degree < 0) {
                    $Objects.EventClockTick.attr('d', 'M 100 10 A 90 90 0 0 1 ' + X + ' ' + Y);
                } else if (Degree >= 0 && Degree < HalfPI) {
                    $Objects.EventClockTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 ' + X + ' ' + Y);
                } else if (Degree >= HalfPI && Degree < PI) {
                    $Objects.EventClockTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 100 190 A 90 90 0 0 1 ' + X + ' ' + Y);
                } else if (Degree > PI && Degree <= TwoByThreePI) {
                    $Objects.EventClockTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 100 190 A 90 90 0 0 1 10 100 A 90 90 0 0 1 ' + X + ' ' + Y);
                }
            },
            /**
             * Stops the Event Clock at complete.
             */
            StopEventClock: function () {
                $Objects.EventClockTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 100 190 A 90 90 0 0 1 10 100 A 90 90 0 0 1 100 10');
            },
            EventOnClick: function () {
                /** @type Event */
                var event = $.data(this, 'Event');
                event.showDetails();
            },
            /**
             * Shows the #Logo element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowLogo: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                t.killTweensOf($Objects.Logo);
                t.fromTo($Objects.Logo, duration, {
                    top: '-6.4rem'
                }, {
                    top: '1.2rem',
                    ease: Power4.easeOut,
                    onComplete: callback
                });
            },
            /**
             * Hides the #Logo element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideLogo: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                t.killTweensOf($Objects.Logo);
                t.fromTo($Objects.Logo, duration, {
                    top: '1.2rem'
                }, {
                    top: '-6.4rem',
                    ease: Power4.easeOut,
                    onComplete: callback
                });
            },
            /**
             * Shows the #HeaderCloseButton element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowHeaderCloseButton: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                t.killTweensOf($Objects.HeaderCloseButton);
                t.fromTo($Objects.HeaderCloseButton, duration, {
                    top: '12.4rem',
                    opacity: 0
                }, {
                    top: '5.4rem',
                    opacity: 1,
                    ease: Power4.easeOut,
                    onComplete: callback
                });
            },
            /**
             * Hides the #HeaderCloseButton element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideHeaderCloseButton: function (duration, callback) {
                duration = duration || 1;
                callback = callback || undefined;
                t.killTweensOf($Objects.HeaderCloseButton);
                t.fromTo($Objects.HeaderCloseButton, duration, {
                    top: '5.4rem',
                    opacity: 1
                }, {
                    top: '12.4rem',
                    opacity: 0,
                    ease: Power4.easeOut,
                    onComplete: callback
                });
            },
            /**
             * Shows the #GalaxyContainer element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowGalaxyContainer: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                if (!Globals.GalaxyContainerShowing && !Globals.GalaxyContainerTransiting) {
                    Globals.GalaxyContainerTransiting = true;
                    t.killTweensOf($Objects.GalaxyContainer);
                    t.fromTo($Objects.GalaxyContainer.css('display', 'block'), duration, {
                        opacity: 0,
                        scale: 0.5,
                        transformOrigin: '50% 50% 0'
                    }, {
                        opacity: 1,
                        scale: 1,
                        transformOrigin: '50% 50% 0',
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.GalaxyContainerTransiting = false;
                            Globals.GalaxyContainerShowing = true;
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                }
            },
            /**
             * Hides the #GalaxyContainer element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideGalaxyContainer: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                if (Globals.GalaxyContainerShowing && !Globals.GalaxyContainerTransiting) {
                    Globals.GalaxyContainerTransiting = true;
                    t.killTweensOf($Objects.GalaxyContainer);
                    t.fromTo($Objects.GalaxyContainer.css('display', 'block'), duration, {
                        opacity: 1,
                        scale: 1,
                        transformOrigin: '50% 50% 0'
                    }, {
                        opacity: 0,
                        scale: 0.5,
                        transformOrigin: '50% 50% 0',
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.GalaxyContainerTransiting = false;
                            $Objects.GalaxyContainer.css('display', 'none');
                            Globals.GalaxyContainerShowing = false;
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                }
            },
            /**
             * Shows the #EventSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowEventSection: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                if (!Globals.EventSectionShowing && !Globals.EventSectionTransiting) {
                    var halfDuration = duration / 2;
                    Globals.EventSectionTransiting = true;
                    $Objects.EventSVGStarShells.removeClass('Animate');
                    Functions.HideLogo();
                    Functions.ShowHeaderCloseButton();
                    t.killTweensOf($Objects.EventSection);
                    t.fromTo($Objects.EventSection, duration, {
                        opacity: 0,
                        top: '100vh'
                    }, {
                        opacity: 1,
                        top: 0,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            $Objects.EventSVGStarShells.addClass('Animate');
                        }
                    });
                    t.killTweensOf($Objects.EventContentContainer);
                    t.fromTo($Objects.EventContentContainer, halfDuration, {
                        opacity: 0
                    }, {
                        opacity: 1,
                        ease: Power4.easeOut,
                        delay: halfDuration,
                        onComplete: function () {
                            Globals.EventSectionTransiting = false;
                            Globals.EventSectionShowing = true;
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                    t.killTweensOf($Objects.EventContentContainerElements);
                    t.staggerFromTo($Objects.EventContentContainerElements, halfDuration, {
                        opacity: 0,
                        top: 50
                    }, {
                        opacity: 1,
                        top: 0,
                        ease: Power4.easeOut,
                        delay: halfDuration
                    }, 0.2);
                }
            },
            /**
             * Hides the #EventSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideEventSection: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                if (Globals.EventSectionShowing && !Globals.EventSectionTransiting) {
                    Functions.ShowLogo();
                    Functions.HideHeaderCloseButton();
                    t.killTweensOf($Objects.EventSection);
                    t.fromTo($Objects.EventSection, duration, {
                        opacity: 1
                    }, {
                        opacity: 0,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.EventSectionTransiting = false;
                            $Objects.EventSVGStarShells.removeClass('Animate');
                            Globals.EventSectionShowing = false;
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                }
            },
            /**
             * Extends the response object of the Site's API call so as to maintain consistency.
             * @param {Object} response - Response object of the Site's API call.
             */
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
                $.ajax({
                    url: Globals.APIAddress + '/categories',
                    type: 'GET',
                    beforeSend: function () {

                    },
                    success: function (response) {
                        response = Functions.ExtendResponse(response);
                        if (response.status.code === 200) {
                            var categories = response.data,
                                categoryCount = categories.length;
                            $.ajax({
                                url: Globals.APIAddress + '/events',
                                type: 'GET',
                                beforeSend: function () {

                                },
                                success: function (response) {
                                    response = Functions.ExtendResponse(response);
                                    if (response.status.code === 200) {
                                        var events = response.data,
                                            eventCount = events.length,
                                            event,
                                            categoryEventMap = {},
                                            categoryIndex,
                                            category,
                                            categoryID;
                                        Globals.CategoriesPosition = [];
                                        Globals.CategoryIDToIndexMap = {};
                                        // Initialize the Category-Event Map.
                                        for (categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                                            categoryID = categories[categoryIndex].Id;
                                            categoryEventMap[categoryID] = [];
                                            // Will be needed later to get Category object from the Category ID
                                            // retrieved by the Site's API.
                                            Globals.CategoryIDToIndexMap[categoryID] = categoryIndex;
                                            Globals.CategoriesPosition.push(new Point(
                                                (Math.random() - 0.5) * 2048 + Globals.WindowHalfWidth,
                                                (Math.random() - 0.5) * 2048 + Globals.WindowHalfHeight));
                                        }
                                        // Populate the Category-Event Map.
                                        for (var eventIndex = 0; eventIndex < eventCount; eventIndex++) {
                                            event = events[eventIndex];
                                            categoryEventMap[event.CategoryId].push({
                                                id: event.Id,
                                                societyID: event.SocietyId,
                                                title: event.Name,
                                                description: event.Description,
                                                image: event.Image,
                                                venue: event.Venue,
                                                startTime: new Date(event.Start),
                                                endTime: new Date(event.End),
                                                currentRound: event.CurrentRound,
                                                totalRounds: event.TotalRounds,
                                                maxParticipants: event.MaxContestants,
                                                status: event.Status,
                                                pdf: event.Pdf,
                                                rules: event.Rules,
                                                coordinators: event.Coordinators
                                            });
                                        }
                                        /*
                                         The bellow statement is much faster, but since we need to maintain the
                                         reference of the original array intact we have no choice.
                                         Well let's hope we do not have to call Initialize() more than once, :P.
                                         w.Categories = Globals.Categories = [];
                                         */
                                        Globals.Categories.length = 0;
                                        // This will be populated by the constructor of the Category Object.
                                        Globals.EventIDToIndexMap = {};
                                        for (categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                                            category = categories[categoryIndex];
                                            Globals.Categories.push(new Category(categoryIndex, {
                                                id: category.Id,
                                                title: category.Name.toLowerCase().capitalize()
                                            }, categoryEventMap[category.Id]));
                                        }
                                        $(d).trigger('initialized');
                                    }
                                },
                                error: function () {
                                    console.log('Error Events [Retrying in 2 seconds...] :: ' + arguments);
                                    setTimeout(Functions.Initialize, 2000);
                                },
                                complete: function () {

                                }
                            });
                        }
                    },
                    error: function () {
                        console.log('Error Categories [Retrying in 2 seconds...] :: ' + arguments);
                        setTimeout(Functions.Initialize, 2000);
                    },
                    complete: function () {

                    }
                });
            },
            /**
             * Fetches the Category Object of the Category based on the Category ID given by the Site's API.
             * @param {Number} categoryID - Category ID of the Category to be fetched.
             * @return Category
             */
            GetCategoryFromID: function (categoryID) {
                return Globals.Categories[Globals.CategoryIDToIndexMap[categoryID]];
            },
            /**
             * Fetches the Event Object of the Event based on the Category ID and the Event ID given by the Site's API.
             * @param {Number} categoryID - Category ID of the Category to be fetched.
             * @param {Number} eventID - Event ID of the Event to be fetched.
             * @return Event
             */
            GetEventFromID: function (categoryID, eventID) {
                return Functions.GetCategoryFromID(categoryID).events[Globals.EventIDToIndexMap[eventID]];
            },
            HeaderCloseButtonOnClick: function () {
                if (Globals.MenuSectionShowing) {
                    Functions.HideMenuSection();
                } else if (Globals.EventSectionShowing) {
                    Functions.HideEventSection();
                    Functions.ShowGalaxyContainer();
                }
            }
        };

    // Give truly global references to Globals and Functions.
    w.Globals = Globals;
    w.Functions = Functions;

    /**
     * Category entity.
     * @param {Number} index - Index of the Category, uniquely identifying the Category.
     * @param {Object} properties - Category property object.
     * @param {Object[]} eventPropertiesArray - An array of event property as received by the server-side scripts.
     * @constructor
     */
    var Category = function (index, properties, eventPropertiesArray) {
        this.index = index;
        this.properties = $.extend({}, Globals.CategoryDefaultProperties, properties);
        this.position = Globals.CategoriesPosition[index];
        /** @type Event[] */
        this.events = [];
        this.setEvents(eventPropertiesArray);
        this.initialize();
    };
    Category.prototype = {
        initialize: function () {
            var position = this.position,
                $category = this.$category = Functions.$CreateCategory(this.properties.title, {
                    x: position.x,
                    y: position.y,
                    transformOrigin: '50% 50% 0'
                }).appendTo($Objects.GalaxyContainer);
            $.data($category.get(0), 'Category', this);
            this.$title = $category.find('text');
            this.appendEvents(this.show);
            // TODO: Add HTML element to the Menu bar.
            return this;
        },
        clearEvents: function () {
            var events = this.events,
                eventCount = events.length,
                eventIndex = 0;
            while (eventIndex < eventCount) {
                events[eventIndex].$event.remove();
                events[eventIndex] = null;
                eventIndex++;
            }
            return this;
        },
        /**
         * Creates new Event objects corresponding to the event property array passed.
         * @param {Object[]} eventPropertiesArray - An array of event property as received by the server-side scripts.
         */
        setEvents: function (eventPropertiesArray) {
            this.clearEvents();
            var events = this.events,
                eventCount = eventPropertiesArray.length,
                eventIndex = 0,
                eventProperty;
            for (; eventIndex < eventCount; eventIndex++) {
                eventProperty = eventPropertiesArray[eventIndex];
                // Will be need later to get Event object from EventID and CategoryID in O(1) time.
                // Note : Different Events will have the same index, and hence it cannot be used alone to identify
                // an event. Instead the combination of Category ID and Event ID is used.
                Globals.EventIDToIndexMap[eventProperty.id] = eventIndex;
                events.push(new Event(this, eventIndex, eventProperty));
            }
            return this;
        },
        /**
         * Appends all the events in the category to the .Category element of this category.
         * @param {Function} [callback] - A callback function to be called after all of the Events have been appended.
         * Note: Category is passed as this to the callback function.
         * @return {Category}
         */
        appendEvents: function (callback) {
            if (!$.isFunction(callback)) {
                callback = $.noop;
            }
            var category = this,
                $category = category.$category,
                events = category.events,
                eventCount = events.length,
                eventIndex = 0,
                appendedCount = 0;

            /**
             * Appends the passed event after a given timeout (in milliseconds).
             * @param {jQuery} $event
             * @param {Number} timeout
             */
            function appendEvent($event, timeout) {
                setTimeout(function () {
                    $event.appendTo($category);
                    if (++appendedCount === eventCount) {
                        callback.apply(category);
                    }
                }, timeout);
            }

            while (eventIndex < eventCount) {
                appendEvent(events[eventIndex].$event, Math.random() * 1000);
                eventIndex++;
            }
            return this;
        },
        /**
         * Animates the .Category and .Category text elements in.
         * @param {Boolean} [doNotShowEvents] - If true events are animated in after the animation is complete
         * otherwise vice-versa. Default is true.
         */
        show: function (doNotShowEvents) {
            var category = this;
            t.fromTo(category.$category, 1, {
                opacity: 0
            }, {
                opacity: 1,
                ease: Power4.easeInOut,
                onComplete: (doNotShowEvents || false) ? undefined : function () {
                    category.showEvents();
                }
            });
            t.fromTo(category.$title, 1, {
                y: -32
            }, {
                y: 0,
                ease: Power4.easeOut
            });
        },
        showEvents: function () {
            var events = this.events,
                eventCount = events.length,
                eventIndex = 0;
            while (eventIndex < eventCount) {
                events[eventIndex].show();
                eventIndex++;
            }
        }
    };
    // Give global reference to the Category Object.
    w.Category = Category;

    /**
     * Event entity.
     * @param {Category} category - Category entity which the event belongs to.
     * @param {Number} index - Index of the Event, uniquely identifying the Event.
     * @param {Object} properties - Event property object.
     * @constructor
     */
    var Event = function (category, index, properties) {
        this.category = category;
        this.index = index;
        this.properties = $.extend({}, Globals.EventDefaultProperties, properties);
        this.initialize();
    };
    Event.prototype = {
        initialize: function () {
            var properties = this.properties,
                position = this.position = new Point(
                    Globals.CategoryDiameter * (Math.random() - 0.5),
                    Globals.CategoryDiameter * (Math.random() - 0.5)),
                $event = this.$event = Functions.$CreateEvent(
                    properties.title,
                    (properties.color = Functions.GenerateRandomColor(
                        160, 255,
                        160, 255,
                        160, 255)),
                    {
                        x: position.x,
                        y: position.y,
                        transformOrigin: '50% 50% 0',
                        display: 'none'
                    });
            $.data($event.get(0), 'Event', this);
            this.$title = $event.find('text');
            return this;
        },
        /**
         * Transits the event star in.
         * @return {Event}
         */
        show: function () {
            var $title = this.$title;
            t.fromTo(this.$event.css('display', 'block'), 2, {
                opacity: 0,
                scale: 0.5,
                transformOrigin: '50% 50% 0'
            }, {
                opacity: 1,
                scale: 1,
                transformOrigin: '50% 50% 0',
                ease: Power4.easeInOut,
                onComplete: function () {
                    t.fromTo($title, 1, {
                        opacity: 0,
                        y: -8
                    }, {
                        opacity: 1,
                        y: 0,
                        ease: Power4.easeInOut
                    });
                }
            });
            return this;
        },
        /**
         * Transits the event details in.
         * @return {Event}
         */
        showDetails: function () {
            var properties = this.properties;
            $Objects.EventSVGStar.css('fill', properties.color);
            $Objects.EventContentTitle.text(properties.title);
            $Objects.EventContentCategory.text(this.category.properties.title);
            $Objects.EventContentDescription.text(properties.description);
            $Objects.EventContentRules.text(properties.rules);
            Functions.ShowEventSection();
            Functions.HideGalaxyContainer();
            return this;
        }
    };
    // Give global reference to the Event Object.
    w.Event = Event;

    $(function () {

        $Objects.LoadingFrame = $('#LoadingFrame', d);

        $Objects.Logo = $('#Logo', d);
        $Objects.HeaderCloseButton = $('#HeaderCloseButton', d).on('click', Functions.HeaderCloseButtonOnClick);

        $Objects.GalaxySVG = $('#GalaxySVG', d);
        $Objects.GalaxyContainer = $('#GalaxyContainer', $Objects.GalaxySVG);
        if ($Objects.GalaxyContainer.length > 0) {
            $Cache.Event = $Objects.GalaxyContainer.find('.Event').clone();
            $Objects.GalaxyContainer.find('.Event').remove();
            $Cache.Category = $Objects.GalaxyContainer.find('.Category').clone();
            $Objects.GalaxyContainer.find('.Category').remove();
        }

        $Objects.EventSection = $('#EventSection', d);
        if ($Objects.EventSection.length > 0) {
            $Objects.EventSVG = $('#EventSVG', $Objects.EventSection);
            if ($Objects.EventSVG.length > 0) {
                $Objects.EventSVGStar = $('.Star', $Objects.EventSVG);
                $Objects.EventSVGStarShells = $('.Shell', $Objects.EventSVGStar);
            }
            $Objects.EventContentContainer = $('#EventContentContainer', $Objects.EventSection);
            if ($Objects.EventContentContainer.length > 0) {
                $Objects.EventContentContainerElements = $('> div > div', $Objects.EventContentContainer).children();
                $Objects.EventContentTitle = $('#EventContentTitle', $Objects.EventContentContainer);
                $Objects.EventContentCategory = $('#EventContentCategory', $Objects.EventContentContainer);
                $Objects.EventContentDescription = $('#EventContentDescription', $Objects.EventContentContainer);
                $Objects.EventContentRules = $('#EventContentRules', $Objects.EventContentContainer);
                $Objects.EventClockSVG = $('#EventClockSVG', $Objects.EventContentContainer);
                if ($Objects.EventClockSVG.length > 0) {
                    $Objects.EventClockOuter = $('#EventClockOuter', $Objects.EventClockSVG);
                    $Objects.EventClockTick = $('#EventClockTick', $Objects.EventClockSVG);
                    $Objects.EventClockInner = $('#EventClockInner', $Objects.EventClockSVG);
                    $Objects.EventClockMinute = $('#EventClockMinute', $Objects.EventClockSVG);
                    $Objects.EventClockSecond = $('#EventClockSecond', $Objects.EventClockSVG);
                }
            }
        }

        Functions.WindowOnResize();
        Functions.RequestGalaxyMovementAnimationLoop();

        Functions.Initialize();

    });

    $(d)
        .on('click', '.Event', Functions.EventOnClick)
        .on('initialized', Functions.HideLoading);

    $(w)
        .on('resize', Functions.WindowOnResize)
        .on('mouseout', Functions.WindowOnMouseOut)
        .on('mousemove', Functions.WindowOnMouseMove)
        .on('keydown', Functions.WindowOnKeyDown);

})(jQuery, window, document, TweenMax);

// @include ./Menu.js

// @include ./AboutUs.js