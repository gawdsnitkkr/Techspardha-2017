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

    var $Cache = {},
        $Objects = {},
        Globals = {
            APIAddress: 'http://anshulmalik.me/api',
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
            EventSVGStarScale: 100,
            EventSVGStarHalfSize: 400, // ActualSize * EventSVGStarScale
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
                    x: Globals.WindowWidth - Globals.EventSVGStarHalfSize,
                    y: Globals.WindowHeight - Globals.EventSVGStarHalfSize,
                    scale: Globals.EventSVGStarScale
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
             * Galaxy movement animation loop.
             */
            GalaxyMovementAnimationLoop: function () {
                if (Globals.GalaxyContainerShowing && !Globals.GalaxyContainerTransiting) {
                    Functions.MoveGalaxyContainerBy(Globals.MouseDeltaX, Globals.MouseDeltaY);
                    Globals.GalaxyMovementAnimationFrameID = RequestAnimationFrame(Functions.GalaxyMovementAnimationLoop);
                } else {
                    CancelAnimationFrame(Globals.GalaxyMovementAnimationFrameID);
                    Globals.GalaxyMovementAnimationFrameID = undefined;
                }
            },
            WindowOnResize: function () {
                Globals.WindowHalfWidth = (Globals.WindowWidth = w.innerWidth) / 2;
                Globals.WindowHalfHeight = (Globals.WindowHeight = w.innerHeight) / 2;
                Functions.UpdateViewBoxSize();
                Functions.UpdateEventSVGStarPosition();
            },
            WindowOnMouseMove: function (e) {
                Globals.MouseDeltaX = ((Globals.WindowHalfWidth - e.pageX) / Globals.WindowHalfWidth) * Globals.GalaxyMovementSpeed;
                Globals.MouseDeltaY = ((Globals.WindowHalfHeight - e.pageY) / Globals.WindowHalfHeight) * Globals.GalaxyMovementSpeed;
                if (Globals.GalaxyMovementAnimationFrameID === undefined) {
                    Globals.GalaxyMovementAnimationFrameID = RequestAnimationFrame(Functions.GalaxyMovementAnimationLoop);
                }
            },
            WindowOnMouseOut: function (e) {
                var target = e.target;
                if (!target || ((target.nodeName.toLowerCase() === 'svg') && (target.id === 'GalaxySVG'))) {
                    CancelAnimationFrame(Globals.GalaxyMovementAnimationFrameID);
                    Globals.GalaxyMovementAnimationFrameID = undefined;
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
            EventOnClick: function () {
                /** @type Event */
                var event = $.data(this, 'Event');
                event.showDetails();
            },
            /**
             * Shows the #GalaxyContainer element in the given duration and calls the given callback function
             * on transition completion.
             * @param [duration]
             * @param [callback]
             */
            ShowGalaxyContainer: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                Globals.GalaxyContainerTransiting = true;
                t.fromTo($Objects.GalaxyContainer, duration, {
                    display: 'block',
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
            },
            /**
             * Hides the #GalaxyContainer element in the given duration and calls the given callback function
             * on transition completion.
             * @param [duration]
             * @param [callback]
             */
            HideGalaxyContainer: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                Globals.GalaxyContainerTransiting = true;
                t.fromTo($Objects.GalaxyContainer, duration, {
                    display: 'block',
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
            },
            /**
             * Shows the #EventSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param [duration]
             * @param [callback]
             */
            ShowEventSection: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                var halfDuration = duration / 2;
                $Objects.EventSVGStarShells.css('display', 'none');
                t.fromTo($Objects.EventSection, duration, {
                    display: 'block',
                    opacity: 0,
                    top: '100vh'
                }, {
                    opacity: 1,
                    top: 0,
                    ease: Power4.easeOut,
                    onComplete: function () {
                        $Objects.EventSVGStarShells.css('display', 'block');
                    }
                });
                t.fromTo($Objects.EventContentContainer, halfDuration, {
                    opacity: 0
                }, {
                    opacity: 1,
                    ease: Power4.easeOut,
                    delay: halfDuration,
                    onComplete: callback
                });
                t.staggerFromTo($Objects.EventContentContainerElements, halfDuration, {
                    opacity: 0,
                    top: 50
                }, {
                    opacity: 1,
                    top: 0,
                    ease: Power4.easeOut,
                    delay: halfDuration
                }, 0.2);
            },
            /**
             * Hides the #EventSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param [duration]
             * @param [callback]
             */
            HideEventSection: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                t.fromTo($Objects.EventSection, duration, {
                    display: 'block',
                    opacity: 1
                }, {
                    opacity: 0,
                    ease: Power4.easeOut,
                    onComplete: function () {
                        $Objects.EventSVGStarShells.css('display', 'none');
                        $Objects.EventSection.css('display', 'none');
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                });
            },
            EventCloseOnClick: function () {
                Functions.HideEventSection();
                Functions.ShowGalaxyContainer();
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
                                                startTime: event.Start,
                                                endTime: event.End,
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
            }
        };

    // Give global (outside the scope of this anonymous function) reference to the public methods.
    w.GetCategoryFromID = Functions.GetCategoryFromID;
    w.GetEventFromID = Functions.GetEventFromID;

    // Give global reference to the public variables and properties.
    w.APIAddress = Globals.APIAddress;
    w.Categories = Globals.Categories;

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
                    y: position.y
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
            t.fromTo(this.$event, 2, {
                display: 'block',
                opacity: 0,
                scale: 0.5,
                transformOrigin: '50% 50% 0'
            }, {
                opacity: 1,
                scale: 1,
                transformOrigin: '50% 50% 0',
                ease: Power4.easeInOut
            });
            t.fromTo(this.$title, 1, {
                opacity: 0,
                y: -8
            }, {
                opacity: 1,
                y: 0,
                ease: Power4.easeInOut,
                delay: 1.5
            });
            return this;
        },
        /**
         * Transits the event details in.
         * @return {Event}
         */
        showDetails: function () {
            $Objects.EventSVGStar.css('fill', this.properties.color);
            $Objects.EventContentTitle.text(this.properties.title);
            $Objects.EventContentCategory.text(this.category.properties.title);
            $Objects.EventContentDescription.text(this.properties.description);
            $Objects.EventContentRules.text(this.properties.rules);
            Functions.ShowEventSection();
            Functions.HideGalaxyContainer();
            return this;
        }
    };
    // Give global reference to the Event Object.
    w.Event = Event;

    $(function () {

        $Objects.GalaxySVG = $('#GalaxySVG', d);
        $Objects.GalaxyContainer = $('#GalaxyContainer', $Objects.GalaxySVG);
        // Cache .Event element and remove the original.
        $Cache.Event = $Objects.GalaxyContainer.find('.Event').clone();
        $Objects.GalaxyContainer.find('.Event').remove();
        // Cache .Category element and remove the original.
        $Cache.Category = $Objects.GalaxyContainer.find('.Category').clone();
        $Objects.GalaxyContainer.find('.Category').remove();

        $Objects.EventSection = $('#EventSection', d);
        $Objects.EventSVG = $('#EventSVG', $Objects.EventSection);
        $Objects.EventSVGStar = $('.Star', $Objects.EventSVG);
        $Objects.EventSVGStarShells = $('.Shell', $Objects.EventSVGStar);
        $Objects.EventContentContainer = $('#EventContentContainer', $Objects.EventSection);
        $Objects.EventContentContainerElements = $('> div > div', $Objects.EventContentContainer).children();
        $Objects.EventContentTitle = $('#EventContentTitle', $Objects.EventContentContainer);
        $Objects.EventContentCategory = $('#EventContentCategory', $Objects.EventContentContainer);
        $Objects.EventContentDescription = $('#EventContentDescription', $Objects.EventContentContainer);
        $Objects.EventContentRules = $('#EventContentRules', $Objects.EventContentContainer);

        Functions.WindowOnResize();
        Globals.GalaxyMovementAnimationFrameID = RequestAnimationFrame(Functions.GalaxyMovementAnimationLoop);
        /*
         Due to a bug with Chrome (possibly other browsers too :p), the transformation does not apply
         correctly to the #EventSVGStar in the Functions.UpdateEventSVGStarPosition(). This is also mentioned
         in the GreenSockJS documentation.
         */
        $Objects.EventSection.css('display', 'none');

        Functions.Initialize();

    });

    $(d)
        .on('click', '.Event', Functions.EventOnClick)
        .on('click', '#EventClose', Functions.EventCloseOnClick);

    $(w)
        .on('resize', Functions.WindowOnResize)
        .on('mouseout', Functions.WindowOnMouseOut)
        .on('mousemove', Functions.WindowOnMouseMove);

})(jQuery, window, document, TweenMax);

// @include ./Menu.js