/**
 * @preserve
 *
 * Trail.js
 * A jQuery and TimelineMax plugin to give powerful SVG Path animation tools.
 *
 * @licence MIT
 * @author Divya Mamgai <divyamamgai21@gmail.com>
 *
 */

// Wrap Source - https://github.com/umdjs/umd/blob/master/templates/jqueryPlugin.js
// Added window and document support. Made undefined alter-secured (not need in ES6).
;(function (factory, undefined) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function ($) {
            factory($, window, document, undefined);
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = function (root, jQuery) {
            if (jQuery === undefined) {
                if (typeof window !== 'undefined') {
                    jQuery = require('jquery');
                }
                else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery, window, document, undefined);
            return jQuery;
        };
    } else {
        factory(jQuery, window, document, undefined);
    }
}(function ($, w, d, undefined) {
    'use strict';
    var defaults = {
            // Keep plugin default options here.
            // Also keep the on-the-fly DOM elements which will be created by the plugin here. For eg. if you plugin uses
            // a container element - <div class="TrailContainer"><!--[More internal elements]--></div>
            // Then should keep it as an object of the defaults if you want to give end user the ability to
            // alter them (Note: It might be dangerous to do so, and documentation should include a warning regarding
            // the consequences of altering the DOM Cache Elements (DOMCE :P).). With this your plugin won't have to
            // create a jQuery DOM element again and again which might costlier, you can use $.fn.clone() method to clone
            // these caches for you plugin instance.
            precision: 0,
            divisions: 2,
            pathLengths: undefined,
            startOffsets: undefined,
            strokeDashes: undefined,
            inverse: false,
            stagger: false,
            staggerDelay: 0,
            duration: 1,
            ease: Linear.easeNone,
            onComplete: $.noop
        },
        /**
         * Constructor function for the Trail plugin.
         * @param element - SVG Path element.
         * @param {Object} [options] - Trail options object.
         * @param {Object} [timeLineOptions] - Timeline options object.
         * @param {Function} [compareFunction] - Compare function to sort the paths in the svg element. If not given
         * no sorting is done.
         * @constructor
         */
        Trail = function (element, options, timeLineOptions, compareFunction) {
            var paths = [];
            switch (element.tagName.toLowerCase()) {
                case 'path':
                    paths.push(element);
                    break;
                case 'svg':
                    paths = $(element).find('path').toArray();
                    if (compareFunction !== undefined) {
                        paths = paths.sort(compareFunction);
                    }
                    break;
                default:
                    console.warn('Trail() :: Element (' + element.tagName + ') given is not of compatible type.');
                    return;
            }
            this.paths = paths;
            this.timeLineOptions = $.extend({}, timeLineOptions);
            // Note: We don't do -
            // this.properties = defaults;
            // Because we don't want to alter our defaults every time new options are passed and hence we will
            // loose our default options. That's why we take an empty object as target. For every $.extend on
            // this.properties from now on we already have a fresh javascript object to work on.
            // All of the options are available in this.properties and different properties that we might need which are
            // local to this instance are extended in the this.properties object. This encapsulates everything into one
            // manageable javascript object.
            this.properties = $.extend({}, defaults);
            this.setOptions(options);
        },
        privates = {
            // All of our plugin's private methods go here.
            // Note: They will not have this as an instance of Trail, as a workaround we can do -
            // privates.METHOD_NAME.apply(this);
            // Where this should be an instance of Trail from public methods.
            // Alternatively you can append '_' in front of your methods in Trail.prototype to mark them as private.
            // Note: They will still be available to the End User, it's just a convention.

            // Sanitizes the options set by the user. This function is automatically called in
            // privates.applyHTMLOptions() and this.setOptions() functions.
            sanitizeOptions: function () {
                var properties = this.properties,
                    paths = this.paths,
                    divisions = properties.divisions,
                    pathLengths = properties.pathLengths = new Float32Array(properties.pathLengths),
                    pathLength = 0,
                    startOffsets = properties.startOffsets = new Float32Array(properties.startOffsets),
                    startOffset = 0,
                    strokeDashes = properties.strokeDashes = [],
                    pathCount = paths.length,
                    precision,
                    pathIndex = 0;

                properties.precision = parseInt(properties.precision);
                if (isNaN(properties.precision)) {
                    properties.precision = defaults.precision;
                }
                precision = properties.precision;

                properties.divisions = parseInt(properties.divisions);
                if (isNaN(properties.divisions)) {
                    properties.divisions = defaults.divisions;
                }

                if (pathLengths.length !== pathCount) {
                    pathLengths = new Uint32Array(pathCount);
                }
                if (startOffsets.length !== pathCount) {
                    startOffsets = new Uint32Array(pathCount);
                }
                while (pathIndex < pathCount) {
                    pathLength = pathLengths[pathIndex];
                    startOffset = startOffsets[pathIndex];
                    if (isNaN(pathLength) || (pathLength === 0)) {
                        pathLength = paths[pathIndex].getTotalLength() * 2;
                    }
                    if (isNaN(startOffset) || (startOffset === 0)) {
                        startOffset = pathLength / divisions;
                    }
                    strokeDashes.push((startOffsets[pathIndex] = startOffset.toFixed(precision)) + ' ' +
                        (pathLengths[pathIndex] = pathLength.toFixed(precision)));
                    pathIndex++;
                }
                properties.pathLengths = pathLengths;
                properties.startOffsets = startOffsets;
                properties.duration = parseFloat(properties.duration);
                if (isNaN(properties.duration)) {
                    properties.duration = defaults.duration;
                }
                properties.staggerDelay = parseFloat(properties.staggerDelay);
                if (isNaN(properties.staggerDelay)) {
                    properties.staggerDelay = defaults.staggerDelay;
                }
                if (!$.isFunction(properties.onComplete)) {
                    properties.onComplete = $.noop;
                }
            }
        };
    // All of our plugin's public methods go here.
    // End user can access these methods as - $element.data('Trail').METHOD_NAME();
    // Note: $.data(element, 'Trail'); is much faster than $element.data('Trail');
    Trail.prototype = {
        /**
         * Creates a new Object from the defaults and extends it with the options Object provided and automatically
         * calls initialize() function to apply new options.
         * @param {Object} options - Object of the options to be extended from the defaults.
         * @return {Trail} - Returns the Trail object to maintain chaining.
         */
        setOptions: function (options) {
            var properties = this.properties;
            properties = $.extend(properties, options);
            privates.sanitizeOptions.apply(this);
            // Force our onComplete over Timeline options' one.
            this.timeLineOptions.onComplete = properties.onComplete;
            return this.initialize();
        },
        /**
         * Source - https://greensock.com/docs/#/HTML5/GSAP/TimelineLite/play/
         * Begins playing forward, optionally from a specific time (by default playback begins from wherever the
         * playhead currently is).
         * @param {*} [from] - The time (or label for TimelineLite/TimelineMax instances) from which the animation
         * should begin playing (if none is defined, it will begin playing from wherever the playhead currently is).
         * @param {boolean} [suppressEvents] - If true (the default), no events or callbacks will be triggered when
         * the playhead moves to the new position defined in the from parameter.
         * @return {Trail} - Returns the Trail object to maintain chaining.
         */
        play: function (from, suppressEvents) {
            this.timeLine.play(from, suppressEvents);
            return this;
        },
        /**
         * Source - https://greensock.com/docs/#/HTML5/GSAP/TimelineLite/pause/
         * Pauses the instance, optionally jumping to a specific time.
         * @param {*} [atTime] - The time (or label for TimelineLite/TimelineMax instances) that the instance
         * should jump to before pausing (if none is defined, it will pause wherever the playhead is currently located).
         * @param {boolean} [suppressEvents] - If true (the default), no events or callbacks will be triggered when
         * the playhead moves to the new position defined in the atTime parameter.
         * @return {Trail} - Returns the Trail object to maintain chaining.
         */
        pause: function (atTime, suppressEvents) {
            this.timeLine.pause(atTime, suppressEvents);
            return this;
        },
        /**
         * Source - https://greensock.com/docs/#/HTML5/GSAP/TimelineLite/resume/
         * Resumes playing without altering direction (forward or inverse), optionally jumping to a specific time
         * first.
         * @param {*} [from] - The time (or label for TimelineLite/TimelineMax instances) that the instance
         * should jump to before resuming playback (if none is defined, it will resume wherever the playhead
         * is currently located).
         * @param {boolean} [suppressEvents] - If true (the default), no events or callbacks will be triggered when
         * the playhead moves to the new position defined in the from parameter.
         * @return {Trail} - Returns the Trail object to maintain chaining.
         */
        resume: function (from, suppressEvents) {
            this.timeLine.resume(from, suppressEvents);
            return this;
        },
        /**
         * Source - https://greensock.com/docs/#/HTML5/GSAP/TimelineLite/reverse/
         * @param {*} [from] - The time (or label for TimelineLite/TimelineMax instances) from which the animation
         * should begin playing in reverse (if none is defined, it will begin playing from wherever the playhead
         * currently is). To begin at the very end of the animation, use 0. Negative numbers are relative to the
         * end of the animation, so -1 would be 1 second from the end.
         * @param {boolean} [suppressEvents] - If true (the default), no events or callbacks will be triggered when
         * the playhead moves to the new position defined in the from parameter.
         * @return {Trail} - Returns the Trail object to maintain chaining.
         */
        reverse: function (from, suppressEvents) {
            this.timeLine.reverse(from, suppressEvents);
            return this;
        },
        /**
         * Source - https://greensock.com/docs/#/HTML5/GSAP/TimelineLite/seek/
         * Jumps to a specific time (or label) without affecting whether or not the instance is paused or inverse.
         * @param {*} position - The position to go to, described in any of the following ways: a numeric value
         * indicates an absolute position, like 3 would be exactly 3 seconds from the beginning of the timeline.
         * A string value can be either a label (i.e. "myLabel") or a relative value using the "+=" or "-=" prefixes
         * like "-=2" (2 seconds before the end of the timeline) or a combination like "myLabel+=2" to
         * indicate 2 seconds after "myLabel".
         * @param {boolean} [suppressEvents] - If true (the default), no events or callbacks will be triggered
         * when the playhead moves to the new position defined in the timeparameter.
         * @return {Trail} - Returns the Trail object to maintain chaining.
         */
        seek: function (position, suppressEvents) {
            this.timeLine.seek(position, suppressEvents);
            return this;
        },
        /**
         * Initializer function for the plugin.
         * @return {Trail} - Returns the TimelineMax object for the Trail.
         */
        initialize: function () {
            var properties = this.properties,
                paths = this.paths,
                strokeDashes = properties.strokeDashes,
                startOffsets = properties.startOffsets,
                strokeDash,
                startOffset,
                duration = properties.duration,
                ease = properties.ease,
                pathCount = paths.length,
                pathIndex = 0,
                position = properties.stagger ? '0' : '+=0',
                staggerDelay = properties.stagger ? properties.staggerDelay : 0;
            var timeLine = this.timeLine = new TimelineMax(this.timeLineOptions);
            if (properties.inverse) {
                while (pathIndex < pathCount) {
                    strokeDash = strokeDashes[pathIndex];
                    startOffset = startOffsets[pathIndex];
                    timeLine.fromTo(paths[pathIndex], duration, {
                        strokeDasharray: strokeDash,
                        strokeDashoffset: -startOffset
                    }, {
                        strokeDashoffset: 0,
                        ease: ease,
                        delay: staggerDelay * pathIndex
                    }, position);
                    pathIndex++;
                }
            } else {
                while (pathIndex < pathCount) {
                    strokeDash = strokeDashes[pathIndex];
                    startOffset = startOffsets[pathIndex];
                    timeLine.fromTo(paths[pathIndex], duration, {
                        strokeDasharray: strokeDash,
                        strokeDashoffset: startOffset
                    }, {
                        strokeDashoffset: 0,
                        ease: ease,
                        delay: staggerDelay * pathIndex
                    }, position);
                    pathIndex++;
                }
            }
            return this;
        }
    };
    // Global plugin to alter the defaults, inspiration from here -
    // https://github.com/jquery-boilerplate/jquery-boilerplate/wiki/Handling-plugin-defaults-and-predefinitions
    $.Trail = function (defaultOptions) {
        return $.extend(defaultOptions, defaults);
    };
    // Attach our plugin to jQuery
    /**
     * jQuery plugin for the Trail.
     * @param {Object} [options] - Trail options object.
     * @param {Object} [timeLineOptions] - Timeline options object.
     * @return {*|JQuery}
     */
    $.fn.Trail = function (options, timeLineOptions) {
        return this.each(function () {
            // Check if the plugin is already attached to this element and whether it is an instance of plugin or not.
            if (!($.data(this, 'Trail') instanceof Trail)) {
                $.data(this, 'Trail', new Trail(this, options, timeLineOptions));
            }
        });
    };
    /**
     * A plugin extension to retrieve the Trail object attached with the given jQuery object or array of objects.
     * @return {undefined|Trail|jQuery}
     */
    $.fn.GetTrail = function () {
        var trail;
        if (this.length > 1) {
            var trailArray = [];
            this.each(function () {
                trail = $.data(this, 'Trail');
                if ((trail !== undefined) && (trail instanceof Trail)) {
                    trailArray.push(trail);
                }
            });
            return $(trailArray);
        } else if (this.length === 1) {
            trail = $.data(this[0], 'Trail');
            if ((trail !== undefined) && (trail instanceof Trail)) {
                return trail;
            }
        }
    };
    // Make our plugin global by attaching it to the window object.
    w.Trail = Trail;
}));


(function ($, w, d, t, undefined) {
    'use strict';

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
            SiteAddress: 'http://anshulmalik.me/api',
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
                /** @type Number */
                delay: 0
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
             * Creates a new Event jQuery object with given attributes and returns it.
             * @param {String} title - Title for the Event element.
             * @param {Object} [attributes] - Attributes to be given to the new Event jQuery object which are
             * applied using TweenMax.set().
             * @return {jQuery}
             */
            $CreateEvent: function (title, attributes) {
                var $clone = $Cache.Event.clone();
                $clone.find('text').html(title);
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
                    url: Globals.SiteAddress + '/categories',
                    type: 'GET',
                    beforeSend: function () {

                    },
                    success: function (response) {
                        response = Functions.ExtendResponse(response);
                        if (response.status.code === 200) {
                            var categories = response.data,
                                categoryCount = categories.length;
                            $.ajax({
                                url: Globals.SiteAddress + '/events',
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
                                                title: event.Name
                                            });
                                        }
                                        Globals.Categories = [];
                                        // This will be populated by the constructor of the Category Object.
                                        Globals.EventIDToIndexMap = {};
                                        for (categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                                            category = categories[categoryIndex];
                                            Globals.Categories.push(new Category(categoryIndex, {
                                                title: category.Name
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
                $event = this.$event = Functions.$CreateEvent(properties.title, {
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
            $Objects.EventContentTitle.text(this.properties.title);
            $Objects.EventContentCategory.text(this.category.properties.title);
            $Objects.EventContentDescription.text(this.properties.description);
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

/**
 * Created by Kaushik on 11/2/2016.
 */

(function (d, dO, w, $, t) {
    var Var = {
            // Public variables and properties inherited from Main.js
            /** @type Category[] */
            Categories: w.Categories,
            Events: w.Events,
            // Menu variables
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
        $Object = {
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
                    t.set($Object.MainMenuCloseButton, {
                        display: 'block'
                    });

                    TweenLite.fromTo($Object.MainMenuButton, 0.5, {
                        scale: 0.5
                    }, {
                        scale: 0.88,
                        ease: Back.easeOut
                    });
                    t.to($Object.MainMenu, 0.2, {
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
                            Var.isCollapsed = false;
                            $searchBox.focus();
                            Functions.DisplayPrimaryOption();
                        }
                    });
                }
            },
            CloseMenu: function () {
                if (Var.isCollapsed === false) {
                    var SearchBorders = $('#searchBoxBorder').children();
                    Var.isCollapsing = true;
                    var glass = $('#magnifying').PathAnimation();
                    glass.data('PathAnimation').ReverseDraw(1, {
                        ease: Back.easeOut,
                        clearOpacity: true,
                        onComplete: function () {
                            t.set($Object.MainMenuCloseButton, {
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
                                    t.fromTo($Object.MainMenuButton, 0.2, {
                                        scale: 0.88
                                    }, {
                                        scale: 0.5,
                                        onComplete: function () {
                                            Var.isCollapsed = true;
                                            Var.isCollapsing = false;
                                        }
                                    });
                                    $Object.PrimaryMenuContainer.html('');
                                }
                            });
                            t.to($Object.MainMenu, 0.2, {
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
                $Object.categoryTab.addClass('activeTab');
                $Object.searchTab.removeClass('activeTab');
                $Object.categoryTab.html('Categories<div class="tabLine"></div>');
                $Object.PrimaryMenuContainer.html('');
                Var.primaryMenuData = Var.Categories;
                for (var i = 0; i < Var.primaryMenuData.length; i++){
                    var option = $("<div id=\"category" + Var.primaryMenuData[i].Id + "\" class=\"menuOption\"><span class=\"category\">" + Var.primaryMenuData[i].Name + "</div>")
                        .bind('click', Functions.DisplayEvents);
                    $Object.PrimaryMenuContainer.append(option);
                }
                Functions.RevealMenuOptions();
            },
            DisplayEvents: function (target) {
                var category = $('span.category', target.currentTarget).html(),
                    id = $(target.currentTarget).attr('id').substr(8);
                console.log(id);
                if (category !== '') {
                    $Object.PrimaryMenuContainer.html('');
                    $Object.categoryTab.html('<span class="glyphicon glyphicon-chevron-left"></span>' + category + '<div class="tabLine"></div>');
                    var isEmpty = true;
                    for (var i = 0; i < Var.Events.length; i++) {
                        if (Var.Events[i].CategoryId == id) {
                            $Object.PrimaryMenuContainer.append(
                                '<div class="menuEventOption">' + Var.Events[i].Name + '<span class="eventCorner"></span></div>'
                            );
                            isEmpty = false;
                        }
                    }
                    if (isEmpty) {
                        $Object.PrimaryMenuContainer.append('<h3 style="opacity: 0.5; font-size: 20px;">Events coming soon</h3>');
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
                $Object.PrimaryMenuContainer.html('');
                $Object.searchTab.addClass('activeTab');
                $Object.categoryTab.removeClass('activeTab');
                if (searchString.length === 0) {
                    Var.searchResult = [];
                    Functions.RenderSearchResults(Var.searchResult);
                }
                else {
                    $.ajax({
                        url: Var.primaryUrl + '/events?query=' + searchString,
                        type: 'GET',
                        success: function (data) {
                            Var.searchResult = data.data;
                            Functions.RenderSearchResults(Var.searchResult);
                        }
                    });
                }
            },
            RenderSearchResults: function (data) {
                Var.primaryMenuData = data;
                $Object.categoryTab.html('Categories<div class="tabLine"></div>');

                if (data.length === 0) {
                    $Object.PrimaryMenuContainer.append('<h3 style="opacity: 0.5; font-size: 20px;">No Results to Display</h3>');
                } else {
                    // DOM.searchAnimation not defined, verify this.
                    // $Object.PrimaryMenuContainer.append(DOM.searchAnimation);
                    // Try not to use $.each() as it is very slow, convert the logic to for () {...} loop.
                    for(var i = 0; i < Var.primaryMenuData; i++){
                        var $this = Var.primaryMenuData[i],
                            hour = parseInt($this.Start.substr(11, 2)),
                            date = {
                                day: $this.Start.substr(8, 2),
                                month: $this.Start.substr(5, 2),
                                hour: hour > 12 ? (hour - 12) : hour,
                                min: $this.Start.substr(14, 2) + ' ' + (hour >= 12 ? 'pm' : 'am')
                            };
                        var searchResult = $("<div class=\"searchOption\">\n    <div class=\"row\">\n        <div class=\"searchNameInfo\">\n            <div class=\"searchName\">" + $this.Name + "<span class=\"searchDate\"><span>" + date.day + '</span> ' + Functions.toMonth(date.month) + ", <span>" + date.hour + ':' + date.min + "</span></span></div>\n        </div>\n        <div class=\"searchDesc\">" + $this.Description + "</div>\n        <div class=\"grad\"></div>\n    </div>\n</div>");
                        $Object.PrimaryMenuContainer.append(searchResult);
                    }
                    Functions.RevealMenuOptions();
                }
            },
            RevealMenuOptions: function () {
                t.fromTo($Object.PrimaryMenuContainer.children(), 1, {
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
                /*// Why are you doing a AJAX call? It has already been done Main.js.
                 $.ajax({
                 url: Var.primaryUrl + '/categories',
                 type: 'GET',
                 beforeSend: function () {

                 },
                 success: function (response) {
                 response = Functions.ExtendResponse(response);
                 if (response.status.code === 200) {
                 Var.Categories = response.data;
                 $.ajax({
                 url: Var.primaryUrl + '/events',
                 type: 'GET',
                 beforeSend: function () {

                 },
                 success: function (response) {
                 response = Functions.ExtendResponse(response);
                 if (response.status.code === 200) {
                 Var.Events = response.data;
                 }
                 },
                 complete: function () {

                 }
                 });
                 }
                 },
                 complete: function () {

                 }
                 });*/

                console.log(Var.Categories);
            },
            // Public methods inherited from the Main.js
            GetCategoryFromID: w.GetCategoryFromID,
            GetEventFromID: w.GetEventFromID
        };
    dO.ready(function () {
        Functions.Initialize();
        $Object.SearchSVG = $('svg#searchBarSVG');
        $Object.MainMenu = $('aside#searchMenu');
        $Object.MainMenuButton = $('#MenuIcon');
        $Object.MainMenuButtonOverlay = $('#menuButtonOverlay')
            .bind('click', function () {
                if (Var.isCollapsed && !Var.isCollapsing)
                    Functions.OpenMenu();
            });
        $Object.MainMenuCloseButton = $('#menuClose')
            .bind('click', function () {
                if (!Var.isCollapsed && !Var.isCollapsing)
                    Functions.CloseMenu();
            });
        $Object.PrimaryMenuContainer = $('div#primaryMenuOptions');
        $Object.searchInput = $('#searchBox')
            .bind('keyup', function (e) {
                if (e.keyCode == 13) {
                    var s = $Object.searchInput.val();
                    Functions.GetSearchResults(s);
                }
            });
        $Object.categoryTab = $('#categoryTabButton')
            .bind('click', function () {
                Functions.DisplayPrimaryOption();
            });
        $Object.searchTab = $('#resultTabButton')
            .bind('click', function () {
                Functions.GetSearchResults($Object.searchInput.val());
            });
        dO.on("keyup", function (e) {
            if (e.keyCode == 27 && !Var.isCollapsed && !Var.isCollapsing) {
                Functions.CloseMenu();
            }
        });
        t.set($Object.MainMenuButton, {
            transformOrigin: '50% 50%',
            scale: 0.5
        });
    });
})(document, jQuery(document), window, jQuery, TweenMax);
