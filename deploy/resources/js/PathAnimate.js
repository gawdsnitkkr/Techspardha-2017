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
    var PathAnimationDefaults = {
            // Keep plugin default options here.
            // Also keep the on-the-fly DOM elements which will be created by the plugin here. For eg. if you plugin uses
            // a container element - <div class="PathAnimationContainer"><!--[More internal elements]--></div>
            // Then should keep it as an object of the PathAnimationDefaults if you want to give end user the ability to
            // alter them (Note: It might be dangerous to do so, and documentation should include a warning regarding
            // the consequences of altering the DOM Cache Elements (DOMCE :P).). With this your plugin won't have to
            // create a jQuery DOM element again and again which might costlier, you can use $.fn.clone() method to clone
            // these caches for you plugin instance.
            useHTMLOptions: true,
            pathLength: 0,
            divisions: 2,
            startOffset: undefined
        },
        PathAnimationAnimateDefaults = {
            invert: false,
            clearOpacity: false,
            delay: 0,
            ease: Linear.easeNone,
            onComplete: $.noop
        },
        // Our plugin's constructor function.
        PathAnimation = function (element, options, initialize) {
            initialize = initialize || true;
            this.element = element;
            this.$element = $(element);
            this.SetOptions(options);
            if (initialize) {
                this.Initialize();
            }
        },
        PathAnimationPrivate = {
            // All of our plugin's private methods go here.
            // Note: They will not have this as an instance of PathAnimation, as a workaround we can do -
            // PathAnimationPrivate.METHOD_NAME.apply(this);
            // Where this should be an instance of PathAnimation from public methods.
            // Alternatively you can append '_' in front of your methods in PathAnimation.prototype to mark them as private.
            // Note: They will still be available to the End User, it's just a convention.

            // This function extends the plugin instance options with the HTML data attribute based options as -
            // data-OPTION="VALUE" -> OPTION: "VALUE"
            ApplyHTMLOptions: function () {
                var property = this.property,
                    $element = this.$element,
                    htmlOptions = {};
                for (var option in PathAnimationDefaults) {
                    if (PathAnimationDefaults.hasOwnProperty(option)) {
                        htmlOptions[option] = $element.attr('data-' + option) || undefined;
                    }
                }
                $.extend(property, htmlOptions);
            }
        };
    // All of our plugin's public methods go here.
    // End user can access these methods as - $element.data('PathAnimation').METHOD_NAME();
    // Note: $.data(element, 'PathAnimation'); is much faster than $element.data('PathAnimation');
    PathAnimation.prototype = {
        Initialize: function () {
            var property = this.property;
            if (property.useHTMLOptions) {
                PathAnimationPrivate.ApplyHTMLOptions.apply(this);
            }
        },
        Animate: function (time, options) {
            time = time || 1;
            options = $.extend({}, PathAnimationAnimateDefaults, options);
            var property = this.property,
                pathLength = property.pathLength,
                startOffset = property.startOffset;
            if (options.clearOpacity) {
                this.element.style.opacity = 1;
            }
            TweenMax.fromTo(this.element, time, {
                strokeDasharray: startOffset + ' ' + pathLength,
                strokeDashoffset: (options.inverse ? -1 : 1) * startOffset
            }, {
                strokeDashoffset: 0,
                ease: options.ease,
                delay: options.delay,
                onComplete: options.onComplete
            });
        },
        ReverseDraw: function (time, options){
            time = time || 1;
            options = $.extend({}, PathAnimationAnimateDefaults, options);
            var property = this.property,
                pathLength = property.pathLength,
                startOffset = property.startOffset;
            if (options.clearOpacity) {
                this.element.style.opacity = 1;
            }
            TweenMax.fromTo(this.element, time, {
                strokeDashoffset: 0
            }, {
                strokeDasharray: startOffset + ' ' + pathLength,
                strokeDashoffset: (options.inverse ? -1 : 1) * startOffset,
                ease: options.ease,
                delay: options.delay,
                onComplete: options.onComplete
            });
        },
        SetOptions: function (options) {
            // Note: We don't do -
            // $.extend(PathAnimationDefaults, options);
            // Because we don't want to alter our PathAnimationDefaults every time new options are passed and
            // hence we will loose our default options. That's why we take an empty object as target.
            // For second $.extend we already have a fresh javascript object to work on.
            // All of the options are available in this.property and different properties that we might need which are
            // local to this instance are extended in the this.property object. This encapsulates everything into one
            // manageable javascript object.
            var pathLength = this.element.getTotalLength() * 2,
                property = this.property = $.extend($.extend({}, PathAnimationDefaults, {
                    pathLength: pathLength
                }), options);
            if (property.startOffset === undefined) {
                this.property.startOffset = pathLength / property.divisions;
            }
        }
    };
    // Global plugin to alter the defaults, inspiration from here -
    // https://github.com/jquery-boilerplate/jquery-boilerplate/wiki/Handling-plugin-defaults-and-predefinitions
    $.PathAnimation = function (defaultOptions) {
        return $.extend(defaultOptions, PathAnimationDefaults);
    };
    // Attach our plugin to jQuery
    $.fn.PathAnimation = function (options) {
        return this.each(function () {
            // Check if the plugin is already attached to this element and whether it is an instance of plugin or not.
            if (!($.data(this, 'PathAnimation') instanceof PathAnimation)) {
                $.data(this, 'PathAnimation', new PathAnimation(this, options));
            }
        });
    };
    // Make our plugin global by attaching it to the window object.
    w.PathAnimation = PathAnimation;
    // Auto apply plugin to the elements with attribute - data-PathAnimation present.
    $(function () {
        $('[data-PathAnimation]', d).PathAnimation();
    });
}));