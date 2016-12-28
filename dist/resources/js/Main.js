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
                case 'g':
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
                    pathLengths = properties.pathLengths = new Float32Array(properties.pathLengths === undefined ? [] : properties.pathLengths),
                    pathLength = 0,
                    startOffsets = properties.startOffsets = new Float32Array(properties.startOffsets === undefined ? [] : properties.startOffsets),
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
                    pathLengths = new Float32Array(pathCount);
                }
                if (startOffsets.length !== pathCount) {
                    startOffsets = new Float32Array(pathCount);
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
            /*
             Overwrite the instance, since this deals with animations. Though it is not advised to instantiate again
             but if you really are that lazy I don't want you complaining, so here you go.
             */
            $.data(this, 'Trail', new Trail(this, options, timeLineOptions));
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
                    $Objects.EventSVGStarShells.css('display', 'none');
                    Functions.HideLogo();
                    Functions.ShowHeaderCloseButton();
                    t.killTweensOf($Objects.EventSection);
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
                        display: 'block',
                        opacity: 1
                    }, {
                        opacity: 0,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.EventSectionTransiting = false;
                            $Objects.EventSVGStarShells.css('display', 'none');
                            $Objects.EventSection.css('display', 'none');
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
            },
            LogoOnClick: function () {
                if (!Globals.GalaxyContainerShowing) {
                    Functions.HideEventSection();
                    Functions.ShowGalaxyContainer();
                }
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

        $Objects.Logo = $('#Logo', d).on('click', Functions.LogoOnClick);
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
        .on('initialized', Functions.HideLoading);

    $(w)
        .on('resize', Functions.WindowOnResize)
        .on('mouseout', Functions.WindowOnMouseOut)
        .on('mousemove', Functions.WindowOnMouseMove)
        .on('keydown', Functions.WindowOnKeyDown);

})(jQuery, window, document, TweenMax);

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
            MenuSectionTransiting: false
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
                        t.fromTo($Objects.SearchBarInput, twoThirdDuration, {
                            display: 'block',
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
                    t.fromTo($Objects.MenuSection, duration, {
                        display: 'block',
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
                var $MenuHeading = $('#' + headingID, $Objects.MenuHeadingFrame),
                    $ActiveMenuHeading = $('.MenuHeading.Active:not(#' + headingID + ')', $Objects.MenuHeadingFrame);
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
                var $ActiveMenuFrame = $('.MenuFrame.Active:not(' + $menuFrame.prop('id') + ')', $Objects.MenuSection);
                $Objects.MenuSection.css('overflow-y', 'hidden');
                t.killTweensOf($menuFrame);
                t.fromTo($menuFrame, duration, {
                    display: 'block',
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
                t.fromTo($ActiveMenuFrame, duration, {
                    display: 'block',
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
            },
            CategoryListFrameCategoryButtonOnClick: function (event) {
                event.stopPropagation();
                /** @type Category */
                var category = $.data(this, 'Category');
                $Objects.CategoryHeading.text(category.properties.title);
                Functions.GenerateEventListFrame(category);
                Functions.ShowMenuHeading('CategoryHeading', 1, Functions.ShowMenuBackButton);
                Functions.ShowMenuFrame($Objects.EventListFrame);
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
                Functions.HideMenuBackButton(0.5);
                Functions.ShowMenuFrame($Objects.CategoryListFrame);
                Functions.ShowMenuHeading('CategoriesHeading');
            },
            SearchBarInputOnKeyDown: function (event) {
                if (event.keyCode === 13) {
                    event.stopPropagation();
                    event.preventDefault();
                    var searchQuery = $Objects.SearchBarInput.val();
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
                var component = $(this).attr('data-for'),
                    $menuFrame = $('#' + component + 'Frame', $Objects.MenuSection);
                if (!$menuFrame.hasClass('Active')) {
                    Functions.HideMenuBackButton(0.5);
                    Functions.ShowMenuHeading(component + 'Heading', 1, Functions.ShowMenuBackButton);
                    Functions.ShowMenuFrame($('#' + component + 'Frame', $Objects.MenuSection));
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


(function (d, $d, $) {
    var $Objects = {},
        Functions = {
            fireIn: function (item, delay) {
                TweenMax.to(item, 0.1, {
                    scale: 1.5,
                    repeat: -1,
                    repeatDelay: delay,
                    yoyo: true
                });
            },
            fireOut: function (item, delay) {
                TweenMax.to(item, 0.1, {
                    scale: 0.8,
                    repeat: -1,
                    repeatDelay: delay,
                    yoyo: true
                });
            },
            upDown: function () {
                TweenMax.to($Objects.rocket, 2, {
                    y: -30,
                    repeat: -1,
                    yoyo: true,
                    repeatDelay: 0.2,
                    ease: Sine.easeInOut
                });
            }
        };
    $d.ready(function () {
        $Objects.fire1 = $('#path4142');
        $Objects.fire2 = $('#path4142-5');
        $Objects.fire3 = $('#path4142-2');
        $Objects.fire4 = $('#path4142-4');
        $Objects.fire5 = $('#path4142-0');
        $Objects.fire6 = $('#path4142-44');
        $Objects.fire7 = $('#path4142-49');
        $Objects.rocket = $('#rocket');
    });

    window.FireAboutUsRocket = function () {
        Functions.upDown();
        Functions.fireIn($Objects.fire1, 0.1);
        Functions.fireOut($Objects.fire2, 0.15);
        Functions.fireOut($Objects.fire3, 0.2);
        Functions.fireIn($Objects.fire4, 0.1);
        Functions.fireIn($Objects.fire5, 0.05);
        Functions.fireIn($Objects.fire6, 0.18);
        Functions.fireOut($Objects.fire7, 0.1);
    };

    window.StopAboutUsRocket = function () {
        TweenMax.killTweensOf($Objects.fire1);
        TweenMax.killTweensOf($Objects.fire2);
        TweenMax.killTweensOf($Objects.fire3);
        TweenMax.killTweensOf($Objects.fire4);
        TweenMax.killTweensOf($Objects.fire5);
        TweenMax.killTweensOf($Objects.fire6);
        TweenMax.killTweensOf($Objects.fire7);
        TweenMax.killTweensOf($Objects.rocket);
    };

})(document, jQuery(document), jQuery);
