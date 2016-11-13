(function ($, w, d, t, undefined) {
    'use strict';

    var $Cache = {},
        $Objects = {},
        Globals = {
            StarDefaultAttributes: {
                scale: 1
            },
            EventDefaultProperties: {
                name: 'Event'
            },
            CategoriesPositions: [],
            /** @type Category[] */
            Categories: []
        },
        Functions = {
            /**
             * Creates a new Star jQuery object with given attributes and returns it.
             * @param {Object} [attributes] - Attributes to be given to the new Star jQuery object.
             * @return {jQuery}
             */
            $CreateStar: function (attributes) {
                var $clone = $Cache.Star.clone();
                t.set($clone, $.extend({}, Globals.StarDefaultAttributes, attributes));
                return $clone;
            }
        };
    /**
     * A point having X and Y coordinates.
     * @param {Number} x - X coordinate of the point.
     * @param {Number} y - Y coordinate of the point.
     * @constructor
     */
    var Point = function (x, y) {
        
    };
    /**
     * Category entity.
     * @param {Number} index - Index of the Category, uniquely identifying the Category.
     * @param {String} title - Name of the category.
     * @param {Object[]} eventPropertiesArray - An array of event property as received by the server-side scripts.
     * @constructor
     */
    var Category = function (index, title, eventPropertiesArray) {
        this.index = index;
        this.title = title;
        this.setEvents(eventPropertiesArray);
        this.initialize();
    };
    Category.prototype = {
        initialize: function () {
            // TODO: Add HTML element to the Menu bar.
        },
        /**
         * Creates new Event objects corresponding to the event property array passed.
         * @param {Object[]} eventPropertiesArray - An array of event property as received by the server-side scripts.
         */
        setEvents: function (eventPropertiesArray) {
            /** @type Event[] */
            this.events = [];
            var events = this.events,
                eventCount = eventPropertiesArray.length,
                eventIndex = 0;
            for (; eventIndex < eventCount; eventIndex++) {
                events.push(new Event(this, eventIndex, eventPropertiesArray[eventIndex]));
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
            var categoryIndex = this.category.index,
                index = this.index,
                properties = this.properties;
            this.$Star = Functions.$CreateStar({
                x: 0,
                y: 0
            });
        }
    };
    $(function () {
        $Objects.Galaxy = $('#Galaxy', d);
        // Cache Star
        $Cache.Star = $Objects.Galaxy.find('.Star').clone();
        $Objects.Galaxy.find('.Star').remove();
    });
})(jQuery, window, document, TweenMax);