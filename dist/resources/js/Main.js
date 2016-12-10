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
                /** @type String */
                title: 'Event',
                /** @type String */
                description: 'Description',
                /** @type Number */
                delay: 0
            },
            CategoryDefaultProperties: {
                /** @type String */
                title: 'Category'
            },
            CategoryDiameter: 512,
            /** @type Point[] */
            CategoriesPosition: [
                new Point(512, 360),
                new Point(128, 128),
                new Point(1024, 512)
            ],
            /** @type Category[] */
            Categories: []
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
                t.to($Objects.GalaxyContainer, 1, {
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
                    ease: Power4.easeIn,
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
                console.log($Objects.EventContentContainerElements);
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
                    opacity: 0,
                    top: '100vh'
                }, {
                    opacity: 1,
                    top: 0,
                    ease: Power4.easeIn,
                    onComplete: function () {
                        $Objects.EventSVGStarShells.css('display', 'none');
                        $Objects.EventSection.css('display', 'none');
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                });
            }
        };

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
                eventIndex = 0;
            for (; eventIndex < eventCount; eventIndex++) {
                events.push(new Event(this, eventIndex, eventPropertiesArray[eventIndex]));
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

        Globals.Categories.push(new Category(0, 'Category', [
            {
                title: 'Red'
            },
            {
                title: 'Blue'
            },
            {
                title: 'Green'
            },
            {
                title: 'Yellow'
            }
        ]));
        Globals.Categories.push(new Category(1, 'Category', [
            {
                title: 'Red'
            },
            {
                title: 'Blue'
            },
            {
                title: 'Green'
            },
            {
                title: 'Yellow'
            }
        ]));
        Globals.Categories.push(new Category(2, 'Category', [
            {
                title: 'Red'
            },
            {
                title: 'Blue'
            },
            {
                title: 'Green'
            },
            {
                title: 'Yellow'
            }
        ]));

        Functions.WindowOnResize();
        Globals.GalaxyMovementAnimationFrameID = RequestAnimationFrame(Functions.GalaxyMovementAnimationLoop);
        /*
         Due to a bug with Chrome (possibly other browsers too :p), the transformation does not apply
         correctly to the #EventSVGStar in the Functions.UpdateEventSVGStarPosition(). This is also mentioned
         in the GreenSockJS documentation.
         */
        $Objects.EventSection.css('display', 'none');
    });

    $(d)
        .on('click', '.Event', Functions.EventOnClick);

    $(w)
        .on('resize', Functions.WindowOnResize)
        .on('mouseout', Functions.WindowOnMouseOut)
        .on('mousemove', Functions.WindowOnMouseMove);

})(jQuery, window, document, TweenMax);