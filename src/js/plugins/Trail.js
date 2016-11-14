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
            pathLength: undefined,
            divisions: 2,
            startOffset: undefined,
            inverse: false,
            clearOpacity: false,
            duration: 1,
            ease: Linear.easeNone,
            onComplete: $.noop
        },
        /**
         * Constructor function for the Trail plugin.
         * @param element - SVG Path element.
         * @param {Object} [options] - Trail options object.
         * @param {Object} [timeLineOptions] - Timeline options object.
         * @constructor
         */
        Trail = function (element, options, timeLineOptions) {
            this.element = element;
            /** @type jQuery */
            this.$element = $(element);
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
                var properties = this.properties;
                properties.precision = parseInt(properties.precision);
                if (isNaN(properties.precision)) {
                    properties.precision = defaults.precision;
                }
                properties.pathLength = parseFloat(properties.pathLength);
                if (isNaN(properties.pathLength)) {
                    properties.pathLength = parseFloat(this.element.getTotalLength() * 2)
                        .toFixed(properties.precision);
                } else {
                    properties.pathLength = properties.pathLength.toFixed(properties.precision);
                }
                properties.divisions = parseInt(properties.divisions);
                if (isNaN(properties.divisions)) {
                    properties.divisions = defaults.divisions;
                }
                properties.startOffset = parseFloat(properties.startOffset);
                if (isNaN(properties.startOffset)) {
                    properties.startOffset = parseFloat(properties.pathLength / properties.divisions)
                        .toFixed(properties.precision);
                } else {
                    properties.startOffset = properties.startOffset.toFixed(properties.precision);
                }
                properties.duration = parseFloat(properties.duration);
                if (isNaN(properties.duration)) {
                    properties.duration = defaults.duration;
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
                element = this.element;
            if (properties.clearOpacity) {
                element.style.opacity = 1;
            }
            var timeLine = this.timeLine = new TimelineMax(this.timeLineOptions);
            timeLine.fromTo(element, properties.duration, {
                strokeDasharray: properties.startOffset + ' ' + properties.pathLength,
                strokeDashoffset: properties.inverse ? -properties.startOffset : properties.startOffset
            }, {
                strokeDashoffset: 0,
                ease: properties.ease
            });
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
