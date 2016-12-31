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

/*
 Original Author - http://stackoverflow.com/a/3540295
 Created By - Divya Mamgai
 */
/**
 * Tells whether the user's browser is a mobile device or a PC.
 * @return {boolean}
 */
function IsMobile() {
    var UserAgent = navigator.userAgent;
    return !!(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(UserAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(UserAgent.substr(0, 4)));
}

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
     * Pads the given number with 0 if less than 10.
     * @param {Number} number
     * @return String
     */
    function padNumber(number) {
        return number < 10 ? ('0' + number) : ('' + number);
    }

    /**
     * A point having x and y coordinates.
     * @param {Number} x - x coordinate of the point.
     * @param {Number} y - y coordinate of the point.
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
        round = Math.round,
        sin = Math.sin,
        cos = Math.cos;

    var GalaxyPosition = new Point(0, 0),
        Constants = {
            API_ADDRESS: 'http://techspardha.org/api',
            GALAXY_DIAMETER: 2048,
            GALAXY_RADIUS: undefined,
            GALAXY_VIEW_BOX_WIDTH: 1280,
            GALAXY_VIEW_BOX_HALF_WIDTH: undefined,
            GALAXY_VIEW_BOX_HEIGHT: 720,
            GALAXY_VIEW_BOX_HALF_HEIGHT: undefined,
            GALAXY_OUTER_RADIUS: undefined,
            GALAXY_OUTER_MINIMUM_X: undefined,
            GALAXY_OUTER_MINIMUM_Y: undefined,
            GALAXY_OUTER_MAXIMUM_X: undefined,
            GALAXY_OUTER_MAXIMUM_Y: undefined,
            GALAXY_MAP_VIEW_BOX_WIDTH: 100,
            GALAXY_MAP_VIEW_BOX_HALF_WIDTH: undefined,
            GALAXY_MAP_VIEW_BOX_HEIGHT: 100,
            GALAXY_MAP_VIEW_BOX_HALF_HEIGHT: undefined,
            GALAXY_MAP_WIDTH_NORMALIZE: undefined,
            GALAXY_MAP_HEIGHT_NORMALIZE: undefined,
            CATEGORY_DIAMETER_MULTIPLIER: 48,
            CATEGORY_DIAMETER_MINIMUM: 128,
            CATEGORY_DIAMETER_MAXIMUM: 640,
            MOUSE_DELTA_THRESHOLD: 5,
            GALAXY_MOVEMENT_SPEED: 25,
            PI: Math.PI,
            HALF_PI: Math.PI / 2,
            TWO_PI: Math.PI * 2,
            THREE_BY_TWO_PI: Math.PI * 3 / 2,
            LAUNCH_DATE: new Date('12/28/2016 05:30 AM'),
            ONE_DAY_IN_MILLISECONDS: 86400000,
            ONE_HOUR_IN_MILLISECONDS: 3600000
        },
        Globals = {
            WindowWidth: w.innerWidth,
            WindowHeight: w.innerHeight,
            WindowHalfWidth: w.innerWidth / 2,
            WindowHalfHeight: w.innerHeight / 2,
            GalaxyMovementDeltaX: 0,
            GalaxyMovementDeltaY: 0,
            FieldOfViewWidth: undefined,
            FieldOfViewHalfWidth: undefined,
            FieldOfViewHeight: undefined,
            FieldOfViewHalfHeight: undefined,
            GalaxySVGShowing: true,
            GalaxySVGTransiting: false,
            GalaxyMovementAnimationFrameID: undefined,
            EventSectionShowing: false,
            EventSectionTransiting: false,
            EventTimeTimeoutID: undefined,
            EventDefaultProperties: {
                /** @type Number */
                id: 0,
                /** @type Number */
                societyID: 0,
                /** @type String */
                title: 'Event',
                /** @type String */
                description: 'Description',
                /** @type String */
                image: 'IMAGE_URL',
                /** @type String */
                venue: 'Venue',
                /** @type Date */
                startTime: new Date(),
                /** @type Date */
                endTime: new Date(),
                /** @type Number */
                currentRound: 1,
                /** @type Number */
                totalRounds: 1,
                /** @type Number */
                maxParticipants: 1,
                /** @type String */
                status: 'Not Started',
                /** @type String */
                pdf: 'PDF_URL',
                /** @type String */
                rules: 'Rules',
                /**
                 * @typedef {Object} Coordinator
                 * @property {String} Name - Name of the Coordinator.
                 * @property {Number} PhoneNo - Phone Number of the Coordinator.
                 * @property {String} Email - Email of the Coordinator.
                 */
                /** @type Coordinator[] */
                coordinators: [],
                color: 'rgb(255, 255, 255)'
            },
            CategoryDefaultProperties: {
                /** @type Number */
                id: 0,
                /** @type String */
                title: 'Category'
            },
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
             * Sets the viewBox attribute of the #GalaxySVG to
             * 'GalaxyPosition.x GalaxyPosition.y Constants.GALAXY_VIEW_BOX_WIDTH Constants.GALAXY_VIEW_BOX_HEIGHT'.
             */
            UpdateGalaxyViewBox: function () {
                $Objects.GalaxySVG.attr('viewBox',
                    GalaxyPosition.x + ' ' + GalaxyPosition.y + ' ' +
                    Constants.GALAXY_VIEW_BOX_WIDTH + ' ' + Constants.GALAXY_VIEW_BOX_HEIGHT);
            },
            /**
             * Moves the #GalaxySVG by the desired delta in both dX and dY direction.
             * @param {Number} dX
             * @param {Number} dY
             */
            MoveGalaxyBy: function (dX, dY) {
                var x = GalaxyPosition.x - (Math.abs(dX) < Constants.MOUSE_DELTA_THRESHOLD ? 0 : dX),
                    y = GalaxyPosition.y - (Math.abs(dY) < Constants.MOUSE_DELTA_THRESHOLD ? 0 : dY);
                if (x < Constants.GALAXY_OUTER_MINIMUM_X) {
                    x = Constants.GALAXY_OUTER_MINIMUM_X;
                } else if ((x + Globals.WindowWidth) > Constants.GALAXY_OUTER_MAXIMUM_X) {
                    x = Constants.GALAXY_OUTER_MAXIMUM_X - Globals.WindowWidth;
                }
                if (y < Constants.GALAXY_OUTER_MINIMUM_Y) {
                    y = Constants.GALAXY_OUTER_MINIMUM_Y;
                } else if ((y + Globals.WindowHeight) > Constants.GALAXY_OUTER_MAXIMUM_Y) {
                    y = Constants.GALAXY_OUTER_MAXIMUM_Y - Globals.WindowHeight;
                }
                // For some reason it does not follow the official DOCs? XD
                //noinspection JSCheckFunctionSignatures
                t.to(GalaxyPosition, 2, {
                    x: x,
                    y: y,
                    ease: Power4.easeOut,
                    onUpdate: Functions.UpdateGalaxyViewBox
                });
                t.to($Objects.FieldOfView, 2, {
                    attr: {
                        /*
                         x: ((x - Constants.GALAXY_VIEW_BOX_HALF_WIDTH) / Constants.GALAXY_OUTER_RADIUS) *
                         Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH + Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH

                         The above expression is simplified so that less has to be processed by the CPU's ALU.
                         */
                        x: ((x / Constants.GALAXY_OUTER_RADIUS) + 1) * Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH - Constants.GALAXY_MAP_WIDTH_NORMALIZE,
                        /*
                         y: ((y - Constants.GALAXY_VIEW_BOX_HALF_HEIGHT) / Constants.GALAXY_OUTER_RADIUS) *
                         Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT + Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT
                         */
                        y: ((y / Constants.GALAXY_OUTER_RADIUS) + 1) * Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT - Constants.GALAXY_MAP_HEIGHT_NORMALIZE
                    },
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
                if (Globals.GalaxySVGShowing && !Globals.GalaxySVGTransiting) {
                    Functions.MoveGalaxyBy(Globals.GalaxyMovementDeltaX, Globals.GalaxyMovementDeltaY);
                    Functions.RequestGalaxyMovementAnimationLoop();
                } else {
                    Functions.CancelGalaxyMovementAnimationLoop();
                }
            },
            UpdateFieldOfViewSize: function () {
                $Objects.FieldOfView.attr({
                    width: (Globals.FieldOfViewWidth = (Globals.WindowWidth / Constants.GALAXY_OUTER_RADIUS) * Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH),
                    height: (Globals.FieldOfViewHeight = (Globals.WindowHeight / Constants.GALAXY_OUTER_RADIUS) * Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT)
                });
                Globals.FieldOfViewHalfWidth = Globals.FieldOfViewWidth / 2;
                Globals.FieldOfViewHalfHeight = Globals.FieldOfViewHeight / 2;
            },
            WindowOnResize: function () {
                Globals.WindowHalfWidth = (Globals.WindowWidth = w.innerWidth) / 2;
                Globals.WindowHalfHeight = (Globals.WindowHeight = w.innerHeight) / 2;
                Functions.UpdateFieldOfViewSize();
            },
            WindowOnMouseMove: function (event) {
                Globals.GalaxyMovementDeltaX = ((Globals.WindowHalfWidth - event.pageX) / Globals.WindowHalfWidth) * Constants.GALAXY_MOVEMENT_SPEED;
                Globals.GalaxyMovementDeltaY = ((Globals.WindowHalfHeight - event.pageY) / Globals.WindowHalfHeight) * Constants.GALAXY_MOVEMENT_SPEED;
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
            WindowOnTouchMove: function (event) {
                if (Globals.GalaxySVGShowing && !Globals.MenuSectionShowing && !Globals.EventSectionShowing) {
                    event.preventDefault();
                    var touch = event.touches[0];
                    if (touch !== undefined) {
                        Globals.GalaxyMovementDeltaX = ((Globals.WindowHalfWidth - touch.pageX) / Globals.WindowHalfWidth) * Constants.GALAXY_MOVEMENT_SPEED;
                        Globals.GalaxyMovementDeltaY = ((Globals.WindowHalfHeight - touch.pageY) / Globals.WindowHalfHeight) * Constants.GALAXY_MOVEMENT_SPEED;
                        if (Globals.GalaxyMovementAnimationFrameID === undefined) {
                            Functions.RequestGalaxyMovementAnimationLoop();
                        }
                    }
                }
            },
            WindowOnTouchEnd: function (event) {
                if (Globals.GalaxySVGShowing && !Globals.MenuSectionShowing && !Globals.EventSectionShowing) {
                    Functions.CancelGalaxyMovementAnimationLoop();
                }
            },
            WindowOnKeyUp: function (event) {
                var keyCode = event.keyCode;
                switch (keyCode) {
                    case 8:
                        Functions.MenuBackButtonOnClick();
                        break;
                    case 27:
                        Functions.HeaderCloseButtonOnClick();
                        break;
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
             * Set's the d attribute of the given .Tick path element of a .PieTicker element to reflect
             * the given ratio as an arc.
             * @param {jQuery} $pieTick - .Tick element of the .PieTicker element to update.
             * @param {Number} ratio - The ratio of completion [0, 1].
             */
            SetPieTick: function ($pieTick, ratio) {
                var angle = ratio * Constants.TWO_PI - Constants.HALF_PI,
                    x = 100 + cos(angle) * 90,
                    y = 100 + sin(angle) * 90;
                if ((angle >= -Constants.HALF_PI) && (angle < 0)) {
                    $pieTick.attr('d', 'M 100 10 A 90 90 0 0 1 ' + x + ' ' + y);
                } else if ((angle >= 0) && (angle < Constants.HALF_PI)) {
                    $pieTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 ' + x + ' ' + y);
                } else if ((angle >= Constants.HALF_PI) && (angle < Constants.PI)) {
                    $pieTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 100 190 A 90 90 0 0 1 ' + x + ' ' + y);
                } else if ((angle > Constants.PI) && (angle <= Constants.THREE_BY_TWO_PI)) {
                    $pieTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 100 190 A 90 90 0 0 1 10 100 A 90 90 0 0 1 ' + x + ' ' + y);
                }
            },
            /**
             * Sets the given .Tick element of a .PieTicker element to complete i.e., full arc.
             * @param {jQuery} $pieTick - .Tick element of the .PieTicker element to update.
             * @param {Boolean} atFull - Tells whether to set the .Tick element at full if true and empty is false.
             */
            StopPieTick: function ($pieTick, atFull) {
                if (atFull) {
                    $pieTick.attr('d', 'M 100 10 A 90 90 0 0 1 190 100 A 90 90 0 0 1 100 190 A 90 90 0 0 1 10 100 A 90 90 0 0 1 100 10');
                } else {
                    $pieTick.attr('d', 'M 100 10 A 90 90 0 0 1 100 10');
                }
            },
            /**
             * Sets the #EventRound element contents using the provided parameters by animating with or without delay.
             * @param {Number} currentRound
             * @param {Number} totalRounds
             * @param {Number} [delay] - Animation delay.
             */
            StartEventRoundTicker: function (currentRound, totalRounds, delay) {
                // Delay is in sync with the Function.ShowEventSection() function duration's default value.
                delay = delay || 2;
                var $EventRoundTick = $Objects.EventRoundTick,
                    $EventRoundCurrent = $Objects.EventRoundCurrent,
                    currentRoundTween = {
                        value: 0
                    };
                $EventRoundCurrent.html(round(currentRoundTween.value));
                $Objects.EventRoundTotal.html(padNumber(totalRounds));
                Functions.StopPieTick($EventRoundTick, false);
                t.to(currentRoundTween, 3, {
                    value: currentRound,
                    ease: Power4.easeOut,
                    delay: delay,
                    onUpdate: function () {
                        Functions.SetPieTick($EventRoundTick, currentRoundTween.value / totalRounds);
                        $EventRoundCurrent.html(round(currentRoundTween.value));
                    },
                    onComplete: function () {
                        if (currentRound === totalRounds) {
                            Functions.StopPieTick($EventRoundTick, true);
                            $EventRoundCurrent.html(currentRound);
                        }
                    }
                });
            }, /**
             * Sets the #EventTime element contents using the provided parameters by animating with or without delay.
             * @param {Date} startTime
             * @param {Date} endTime
             * @param {Number} [delay] - Animation delay.
             */
            StartEventTimeTicker: function (startTime, endTime, delay) {

                // Delay is in sync with the Function.ShowEventSection() function duration's default value.
                delay = delay || 2;

                var $EventStartTick = $Objects.EventTimeTick,
                    $EventStartDay = $Objects.EventTimeDay,
                    $EventStartHour = $Objects.EventTimeHour,
                    timeTween = {
                        value: 0
                    },
                    currentTime = (new Date()).getTime(),
                    startCurrentDifference = startTime.getTime() - currentTime,
                    startLaunchDifference = startTime.getTime() - Constants.LAUNCH_DATE.getTime(),
                    endCurrentDifference = endTime.getTime() - currentTime,
                    endStartDifference = endTime.getTime() - startTime.getTime();

                if (Globals.EventTimeTimeoutID !== undefined) {
                    clearInterval(Globals.EventTimeTimeoutID);
                }

                function startDifferenceOnUpdate() {
                    Functions.SetPieTick($EventStartTick, timeTween.value / startLaunchDifference);
                    $EventStartDay.html(floor(timeTween.value / Constants.ONE_DAY_IN_MILLISECONDS));
                    $EventStartHour.html(padNumber(floor((timeTween.value % Constants.ONE_DAY_IN_MILLISECONDS) / Constants.ONE_HOUR_IN_MILLISECONDS)));
                }

                function endDifferenceOnUpdate() {
                    Functions.SetPieTick($EventStartTick, timeTween.value / endStartDifference);
                    $EventStartDay.html(floor(timeTween.value / Constants.ONE_DAY_IN_MILLISECONDS));
                    $EventStartHour.html(padNumber(floor((timeTween.value % Constants.ONE_DAY_IN_MILLISECONDS) / Constants.ONE_HOUR_IN_MILLISECONDS)));
                }

                if (startCurrentDifference <= 0) {
                    if (endCurrentDifference <= 0) {

                        // Ended
                        $Objects.EventTime.css('display', 'none');
                        $Objects.EventTimeStatus.text('Ended');
                        $Objects.EventEndedMessage.css('display', 'block');

                    } else {

                        // Started
                        $Objects.EventTime
                            .css('display', 'block')
                            .attr('title', 'Time to go before the event ends.');
                        $Objects.EventTimeStatus.text('Started');
                        $Objects.EventTimeAddOn.text('to end.');
                        $Objects.EventEndedMessage.css('display', 'none');

                        timeTween.value = endStartDifference;
                        endDifferenceOnUpdate();

                        t.to(timeTween, 3, {
                            value: endCurrentDifference,
                            ease: Power4.easeOut,
                            delay: delay,
                            onUpdate: endDifferenceOnUpdate,
                            onComplete: function () {
                                Globals.EventTimeTimeoutID = setTimeout(function () {
                                    Functions.StartEventTimeTicker(startTime, endTime, 0);
                                }, Constants.ONE_HOUR_IN_MILLISECONDS);
                            }
                        });

                    }
                } else {

                    // Not Started
                    $Objects.EventTime
                        .css('display', 'block')
                        .attr('title', 'Time to go before event starts.');
                    $Objects.EventTimeStatus.text('Not Started');
                    $Objects.EventTimeAddOn.text('to start.');
                    $Objects.EventEndedMessage.css('display', 'none');

                    timeTween.value = startLaunchDifference;
                    startDifferenceOnUpdate();

                    t.to(timeTween, 3, {
                        value: startCurrentDifference,
                        ease: Power4.easeOut,
                        delay: delay,
                        onUpdate: startDifferenceOnUpdate,
                        onComplete: function () {
                            Globals.EventTimeTimeoutID = setTimeout(function () {
                                Functions.StartEventTimeTicker(startTime, endTime, 0);
                            }, Constants.ONE_HOUR_IN_MILLISECONDS);
                        }
                    });

                }
            },
            EventOnClick: function () {
                if (Globals.GalaxySVGShowing && !Globals.EventSectionShowing && !Globals.MenuSectionShowing) {
                    /** @type Event */
                    var event = $.data(this, 'Event');
                    event.showDetails();
                }
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
             * Shows the #GalaxySVG element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            ShowGalaxySVG: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                if (!Globals.GalaxySVGShowing && !Globals.GalaxySVGTransiting) {
                    Globals.GalaxySVGTransiting = true;
                    t.killTweensOf($Objects.GalaxySVG);
                    t.fromTo($Objects.GalaxySVG, duration, {
                        opacity: 0
                    }, {
                        opacity: 1,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.GalaxySVGTransiting = false;
                            Globals.GalaxySVGShowing = true;
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                    t.killTweensOf($Objects.GalaxyContainer);
                    t.fromTo($Objects.GalaxyContainer, duration, {
                        scale: 0.5,
                        transformOrigin: '50% 50% 0'
                    }, {
                        scale: 1,
                        transformOrigin: '50% 50% 0',
                        ease: Power4.easeOut
                    });
                    t.killTweensOf($Objects.GalaxyMapSVG);
                    t.fromTo($Objects.GalaxyMapSVG, duration, {
                        opacity: 0,
                        bottom: '-11rem'
                    }, {
                        opacity: 1,
                        bottom: '1rem',
                        ease: Power4.easeOut
                    });
                }
            },
            /**
             * Hides the #GalaxySVG element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideGalaxySVG: function (duration, callback) {
                duration = duration || 2;
                callback = callback || undefined;
                if (Globals.GalaxySVGShowing && !Globals.GalaxySVGTransiting) {
                    Globals.GalaxySVGTransiting = true;
                    t.killTweensOf($Objects.GalaxySVG);
                    t.fromTo($Objects.GalaxySVG, duration, {
                        opacity: 1
                    }, {
                        opacity: 0,
                        ease: Power4.easeOut,
                        onComplete: function () {
                            Globals.GalaxySVGTransiting = false;
                            Globals.GalaxySVGShowing = false;
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                    t.killTweensOf($Objects.GalaxyContainer);
                    t.fromTo($Objects.GalaxyContainer, duration, {
                        scale: 1,
                        transformOrigin: '50% 50% 0'
                    }, {
                        scale: 0.5,
                        transformOrigin: '50% 50% 0',
                        ease: Power4.easeOut
                    });
                    t.killTweensOf($Objects.GalaxyMapSVG);
                    t.fromTo($Objects.GalaxyMapSVG, duration, {
                        opacity: 1,
                        bottom: '1rem'
                    }, {
                        opacity: 0,
                        bottom: '-11rem',
                        ease: Power4.easeOut
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
                    t.fromTo($Objects.EventContentContainer.css('overflow-y', 'hidden'), halfDuration, {
                        opacity: 0
                    }, {
                        opacity: 1,
                        ease: Power4.easeOut,
                        delay: halfDuration,
                        onComplete: function () {
                            Globals.EventSectionTransiting = false;
                            Globals.EventSectionShowing = true;
                            $Objects.EventContentContainer.css('overflow-y', 'auto');
                            if ($.isFunction(callback)) {
                                callback();
                            }
                        }
                    });
                    t.killTweensOf($Objects.EventContentContainerElements);
                    t.staggerFromTo($Objects.EventContentContainerElements, halfDuration, {
                        opacity: 0,
                        top: '10rem'
                    }, {
                        opacity: 1,
                        top: 0,
                        ease: Power4.easeOut,
                        delay: halfDuration
                    }, 0.1);
                }
            },
            /**
             * Hides the #EventSection element in the given duration and calls the given callback function
             * on transition completion.
             * @param {Number} [duration]
             * @param {Function} [callback]
             */
            HideEventSection: function (duration, callback) {
                duration = duration || 0.5;
                callback = callback || undefined;
                if (Globals.EventSectionShowing && !Globals.EventSectionTransiting) {
                    Functions.ShowLogo();
                    Functions.HideHeaderCloseButton();
                    t.killTweensOf($Objects.EventSection);
                    t.fromTo($Objects.EventSection, duration, {
                        opacity: 1,
                        scale: 1,
                        transformOrigin: '50% 50% 0'
                    }, {
                        opacity: 0,
                        scale: 1.3,
                        transformOrigin: '50% 50% 0',
                        ease: Power4.easeIn,
                        clearProps: 'all',
                        onComplete: function () {
                            Globals.EventSectionTransiting = false;
                            $Objects.EventSection.css({
                                opacity: 0,
                                top: '100vh'
                            });
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
                    url: Constants.API_ADDRESS + '/categories',
                    type: 'GET',
                    success: function (response) {
                        response = Functions.ExtendResponse(response);
                        if (response.status.code === 200) {
                            var categories = response.data,
                                categoryCount = categories.length;
                            $.ajax({
                                url: Constants.API_ADDRESS + '/events',
                                type: 'GET',
                                success: function (response) {
                                    response = Functions.ExtendResponse(response);
                                    if (response.status.code === 200) {
                                        var events = response.data,
                                            eventCount = events.length,
                                            event,
                                            categoryEventMap = {},
                                            categoryIndex,
                                            category,
                                            categoryID,
                                            CategoriesPosition = Globals.CategoriesPosition = [],
                                            CategoryIDToIndexMap = Globals.CategoryIDToIndexMap = {};
                                        // Initialize the Category-Event Map.
                                        for (categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                                            categoryID = categories[categoryIndex].Id;
                                            categoryEventMap[categoryID] = [];
                                            // Will be needed later to get Category object from the Category ID
                                            // retrieved by the Site's API.
                                            CategoryIDToIndexMap[categoryID] = categoryIndex;
                                            CategoriesPosition.push(new Point(
                                                (Math.random() - 0.5) * Constants.GALAXY_DIAMETER + Constants.GALAXY_VIEW_BOX_HALF_WIDTH,
                                                (Math.random() - 0.5) * Constants.GALAXY_DIAMETER + Constants.GALAXY_VIEW_BOX_HALF_HEIGHT));
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
                                                venue: event.Venue.capitalize(),
                                                startTime: new Date(event.Start),
                                                endTime: new Date(event.End),
                                                currentRound: event.CurrentRound,
                                                totalRounds: event.TotalRounds,
                                                maxParticipants: event.MaxContestants,
                                                status: event.Status.toLowerCase(),
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
                                        var Categories = Globals.Categories;
                                        Categories.length = 0;
                                        // This will be populated by the constructor of the Category Object.
                                        Globals.EventIDToIndexMap = {};
                                        for (categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                                            category = categories[categoryIndex];
                                            Categories.push(new Category(categoryIndex, {
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
                                }
                            });
                        }
                    },
                    error: function () {
                        console.log('Error Categories [Retrying in 2 seconds...] :: ' + arguments);
                        setTimeout(Functions.Initialize, 2000);
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
                    Functions.ShowGalaxySVG();
                }
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
            $Cache.CategoryMarker.clone().attr({
                /*
                 cx: ((position.x - Constants.GALAXY_VIEW_BOX_HALF_WIDTH) / Constants.GALAXY_OUTER_RADIUS) *
                 Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH + Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH

                 The above expression is simplified so that less has to be processed by the CPU's ALU.
                 */
                cx: ((position.x / Constants.GALAXY_OUTER_RADIUS) + 1) * Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH - Constants.GALAXY_MAP_WIDTH_NORMALIZE,
                cy: ((position.y / Constants.GALAXY_OUTER_RADIUS) + 1) * Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT - Constants.GALAXY_MAP_HEIGHT_NORMALIZE
            }).appendTo($Objects.GalaxyMapSVG);
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
                eventProperty,
                diameter = this.diameter = Constants.CATEGORY_DIAMETER_MULTIPLIER * eventCount;
            if (diameter < Constants.CATEGORY_DIAMETER_MINIMUM) {
                this.diameter = Constants.CATEGORY_DIAMETER_MINIMUM;
            } else if (diameter > Constants.CATEGORY_DIAMETER_MAXIMUM) {
                this.diameter = Constants.CATEGORY_DIAMETER_MAXIMUM;
            }
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

            if (eventCount === 0) {
                callback.apply(category);
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
        this.properties = $.extend({}, Globals.EventDefaultProperties, properties);
        this.initialize();
    };
    Event.prototype = {
        initialize: function () {
            var properties = this.properties,
                diameter = this.category.diameter,
                position = this.position = new Point(
                    diameter * (Math.random() - 0.5),
                    diameter * (Math.random() - 0.5)),
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

            var properties = this.properties,
                startTime = properties.startTime,
                endTime = properties.endTime,
                coordinators = properties.coordinators,
                coordinatorCount = coordinators.length,
                $CoordinatorContainer = $Objects.CoordinatorContainer.empty();

            $Objects.EventSVGStar.css('fill', properties.color);
            $Objects.EventContentTitle.text(properties.title);
            $Objects.EventContentCategory.text(this.category.properties.title);
            $Objects.EventContentDescription.text(properties.description);
            $Objects.EventContentRules.text(properties.rules);
            $Objects.EventContentParticipant.text(
                properties.maxParticipants > 1 ? 'Team of up to ' + properties.maxParticipants : 'Solo');
            $Objects.EventContentFromDate.text(
                padNumber(startTime.getDay()) + '/' +
                padNumber(startTime.getMonth() + 1) + '/' +
                startTime.getFullYear());
            $Objects.EventContentFromTime.text(
                padNumber(startTime.getHours()) + ':' +
                padNumber(startTime.getMinutes()) + ':' +
                padNumber(startTime.getSeconds()));
            $Objects.EventContentToDate.text(
                padNumber(endTime.getDay()) + '/' +
                padNumber(endTime.getMonth() + 1) + '/' +
                endTime.getFullYear());
            $Objects.EventContentToTime.text(
                padNumber(endTime.getHours()) + ':' +
                padNumber(startTime.getMinutes()) + ':' +
                padNumber(endTime.getSeconds()));

            if (coordinatorCount > 0) {
                var $CoordinatorCache = $Cache.Coordinator,
                    $Coordinator,
                    coordinator;
                for (var coordinatorIndex = 0; coordinatorIndex < coordinatorCount; coordinatorIndex++) {
                    coordinator = coordinators[coordinatorIndex];
                    $Coordinator = $CoordinatorCache.clone();
                    $Coordinator.find('.Name').text(coordinator.Name);
                    $Coordinator.find('.Email')
                        .text(coordinator.Email)
                        .attr('href', 'mailto:' + coordinator.Email);
                    $Coordinator.find('.Phone').text(coordinator.PhoneNo);
                    $CoordinatorContainer.append($Coordinator);
                }
            }

            // undefined forces default delay value to be taken.
            Functions.StartEventRoundTicker(
                properties.currentRound,
                properties.totalRounds,
                Globals.EventSectionShowing ? 0 : undefined);
            Functions.StartEventTimeTicker(
                startTime,
                endTime,
                Globals.EventSectionShowing ? 0 : undefined);

            Functions.ShowEventSection();
            Functions.HideGalaxySVG();

            return this;

        }
    };

    // Define required constants using already defined constants.
    Constants.GALAXY_RADIUS = Constants.GALAXY_DIAMETER / 2;
    Constants.GALAXY_VIEW_BOX_HALF_WIDTH = Constants.GALAXY_VIEW_BOX_WIDTH / 2;
    Constants.GALAXY_VIEW_BOX_HALF_HEIGHT = Constants.GALAXY_VIEW_BOX_HEIGHT / 2;
    Constants.GALAXY_OUTER_RADIUS = Constants.GALAXY_RADIUS + Constants.CATEGORY_DIAMETER_MAXIMUM;
    Constants.GALAXY_OUTER_MINIMUM_X = Constants.GALAXY_VIEW_BOX_HALF_WIDTH - Constants.GALAXY_OUTER_RADIUS;
    Constants.GALAXY_OUTER_MINIMUM_Y = Constants.GALAXY_VIEW_BOX_HALF_HEIGHT - Constants.GALAXY_OUTER_RADIUS;
    Constants.GALAXY_OUTER_MAXIMUM_X = Constants.GALAXY_VIEW_BOX_HALF_WIDTH + Constants.GALAXY_OUTER_RADIUS;
    Constants.GALAXY_OUTER_MAXIMUM_Y = Constants.GALAXY_VIEW_BOX_HALF_HEIGHT + Constants.GALAXY_OUTER_RADIUS;
    Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH = Constants.GALAXY_MAP_VIEW_BOX_WIDTH / 2;
    Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT = Constants.GALAXY_MAP_VIEW_BOX_HEIGHT / 2;
    Constants.GALAXY_MAP_WIDTH_NORMALIZE = (Constants.GALAXY_VIEW_BOX_HALF_WIDTH / Constants.GALAXY_OUTER_RADIUS) * Constants.GALAXY_MAP_VIEW_BOX_HALF_WIDTH;
    Constants.GALAXY_MAP_HEIGHT_NORMALIZE = (Constants.GALAXY_VIEW_BOX_HALF_HEIGHT / Constants.GALAXY_OUTER_RADIUS) * Constants.GALAXY_MAP_VIEW_BOX_HALF_HEIGHT;

    // Give truly global references to required variables, objects, functions and classes.
    w.Constants = Constants;
    w.Globals = Globals;
    w.Functions = Functions;
    w.Category = Category;
    w.Event = Event;

    $(function () {

        $Objects.LoadingFrame = $('#LoadingFrame', d);

        $Objects.Logo = $('#Logo', d);
        $Objects.HeaderCloseButton = $('#HeaderCloseButton', d).on('click', Functions.HeaderCloseButtonOnClick);

        $Objects.GalaxySVG = $('#GalaxySVG', d);
        if ($Objects.GalaxySVG.length > 0) {
            $Objects.GalaxyContainer = $('#GalaxyContainer', $Objects.GalaxySVG);
            if ($Objects.GalaxyContainer.length > 0) {
                var $Event = $Objects.GalaxyContainer.find('.Event'),
                    $Category = $Objects.GalaxyContainer.find('.Category');
                $Cache.Event = $Event.clone();
                $Event.remove();
                $Cache.Category = $Category.clone();
                $Category.remove();
            }
        }
        $Objects.GalaxyMapSVG = $('#GalaxyMapSVG', d);
        if ($Objects.GalaxyMapSVG.length > 0) {
            var $CategoryMarker = $('.CategoryMarker', $Objects.GalaxyMapSVG);
            $Cache.CategoryMarker = $CategoryMarker.clone();
            $CategoryMarker.remove();
            $Objects.FieldOfView = $('#FieldOfView', $Objects.GalaxyMapSVG);
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
                $Objects.EventContentContainerElements = $('> div > div', $Objects.EventContentContainer).children().children();
                $Objects.EventContentTitle = $('#EventContentTitle', $Objects.EventContentContainer);
                $Objects.EventContentCategory = $('#EventContentCategory', $Objects.EventContentContainer);
                $Objects.EventContentDescription = $('#EventContentDescription', $Objects.EventContentContainer);
                $Objects.EventContentRules = $('#EventContentRules', $Objects.EventContentContainer);
                $Objects.EventRound = $('#EventRound', $Objects.EventContentContainer);
                if ($Objects.EventRound.length > 0) {
                    $Objects.EventRoundTick = $('.Tick', $Objects.EventRound);
                    $Objects.EventRoundCurrent = $('#EventRoundCurrent', $Objects.EventRound);
                    $Objects.EventRoundTotal = $('#EventRoundTotal', $Objects.EventRound);
                    $Objects.EventRoundStatus = $('.Status', $Objects.EventRound);
                }
                $Objects.EventTime = $('#EventTime', $Objects.EventContentContainer);
                if ($Objects.EventTime.length > 0) {
                    $Objects.EventTimeTick = $('.Tick', $Objects.EventTime);
                    $Objects.EventTimeDay = $('#EventTimeDay', $Objects.EventTime);
                    $Objects.EventTimeHour = $('#EventTimeHour', $Objects.EventTime);
                    $Objects.EventTimeStatus = $('.Status', $Objects.EventTime);
                    $Objects.EventTimeAddOn = $('#EventTimeAddOn', $Objects.EventTime);
                }
                $Objects.EventEndedMessage = $('#EventEndedMessage', $Objects.EventContentContainer);
                $Objects.EventContentParticipant = $('#EventContentParticipant', $Objects.EventContentContainer);
                $Objects.EventContentFromDate = $('#EventContentFromDateTimeContainer .Date', $Objects.EventContentContainer);
                $Objects.EventContentFromTime = $('#EventContentFromDateTimeContainer .Time', $Objects.EventContentContainer);
                $Objects.EventContentToDate = $('#EventContentToDateTimeContainer .Date', $Objects.EventContentContainer);
                $Objects.EventContentToTime = $('#EventContentToDateTimeContainer .Time', $Objects.EventContentContainer);
                $Objects.CoordinatorContainer = $('#CoordinatorContainer', $Objects.EventContentContainer);
                if ($Objects.CoordinatorContainer.length > 0) {
                    var $Coordinator = $Objects.CoordinatorContainer.find('.Coordinator');
                    $Cache.Coordinator = $Coordinator.clone();
                    $Coordinator.remove();
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
        .on('keyup', Functions.WindowOnKeyUp);

    if (IsMobile()) {
        $(w)
            .on('touchmove', Functions.WindowOnTouchMove)
            .on('touchend', Functions.WindowOnTouchEnd);
    } else {
        $(w)
            .on('mousemove', Functions.WindowOnMouseMove)
            .on('mouseout', Functions.WindowOnMouseOut);
    }

})(jQuery, window, document, TweenMax);

/**
 * @preserve
 *
 * Menu.js
 * Includes important functioning of the Menu component of the website.
 *
 * @licence MIT
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
    var Constants = $.extend(w.Constants, {}),
        Globals = $.extend(w.Globals, {
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
                var $CategoryListContainerParent = $Objects.CategoryListContainer.parent(),
                    $CategoryListContainer = $Objects.CategoryListContainer.detach().empty(),
                    categories = Globals.Categories,
                    categoryCount = categories.length,
                    $CategoryButtonCache = $Cache.CategoryButton,
                    $CategoryButton,
                    category;
                for (var categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                    category = categories[categoryIndex];
                    $.data(($CategoryButton = $CategoryButtonCache.clone()).get(0), 'Category', category);
                    $CategoryButton.find('text').text(category.properties.title);
                    $CategoryListContainer.append($CategoryButton);
                }
                $CategoryListContainerParent.prepend($CategoryListContainer);
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
                if (Globals.MenuSectionShowing && !Globals.MenuSectionTransiting && !Globals.MenuFrameTransiting) {
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
                            url: Constants.API_ADDRESS + '/events?query=' + encodeURI(searchQuery),
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
                $Objects.CategoryListContainer = $('#CategoryListContainer', $Objects.CategoryListFrame);
                if ($Objects.CategoryListContainer.length > 0) {
                    var $CategoryButton = $('.CategoryButton', $Objects.CategoryListContainer);
                    $Cache.CategoryButton = $CategoryButton.clone();
                    $CategoryButton.remove();
                }
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


/**
 * @preserve
 *
 * AboutUs.js
 * Houses the animation code of the Rocket in the About Us section of the website.
 *
 * @licence MIT
 * @author Rishabh Chanana <rishabhchanana97@gmail.com>
 * @author Divya Mamgai <divyamamgai21@gmail.com>
 *
 */

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

