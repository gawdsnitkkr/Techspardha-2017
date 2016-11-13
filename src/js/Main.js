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

    var $Cache = {},
        $Objects = {},
        Globals = {
            StarDefaultAttributes: {
                scale: 1
            },
            EventDefaultProperties: {
                title: 'Event'
            },
            CategoryDiameter: 512,
            /** @type Point[] */
            CategoriesPosition: [
                new Point(640, 360)
            ],
            /** @type Category[] */
            Categories: []
        },
        Functions = {
            /**
             * Creates a new Event jQuery object with given attributes and returns it.
             * @param {Object} [attributes] - Attributes to be given to the new Event jQuery object which are
             * applied using TweenMax.set().
             * @return {jQuery}
             */
            $CreateEvent: function (attributes) {
                var $clone = $Cache.Event.clone();
                t.set($clone, $.extend({}, Globals.StarDefaultAttributes, attributes));
                return $clone;
            }
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
        this.position = Globals.CategoriesPosition[index];
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
            var categoryPosition = this.category.position,
                index = this.index,
                properties = this.properties,
                position = this.position = new Point(
                    categoryPosition.x + Globals.CategoryDiameter * (Math.random() - 0.5),
                    categoryPosition.y + Globals.CategoryDiameter * (Math.random() - 0.5));
            this.$Event = Functions.$CreateEvent({
                x: position.x,
                y: position.y
            }).appendTo($Objects.Galaxy);
        }
    };

    $(function () {
        $Objects.Galaxy = $('#Galaxy', d);
        // Cache Event
        $Cache.Event = $Objects.Galaxy.find('.Event').clone();
        $Objects.Galaxy.find('.Event').remove();
        Globals.Categories.push(new Category(0, 'Category', [
            {
                title: 'Event'
            }
        ]));
    });

})(jQuery, window, document, TweenMax);