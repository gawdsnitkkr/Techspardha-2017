// @include ./plugins/Trail.js
// @include ./plugins/IsMobile.js

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
                    t.killTweensOf($Objects.GAWDSLink);
                    t.fromTo($Objects.GAWDSLink, duration, {
                        opacity: 0,
                        bottom: '-8rem'
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
                    t.killTweensOf($Objects.GAWDSLink);
                    t.fromTo($Objects.GAWDSLink, duration, {
                        opacity: 1,
                        bottom: '1rem'
                    }, {
                        opacity: 0,
                        bottom: '-8rem',
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
                padNumber(startTime.getDate()) + '/' +
                padNumber(startTime.getMonth() + 1) + '/' +
                startTime.getFullYear());
            $Objects.EventContentFromTime.text(
                padNumber(startTime.getHours()) + ':' +
                padNumber(startTime.getMinutes()) + ':' +
                padNumber(startTime.getSeconds()));
            $Objects.EventContentToDate.text(
                padNumber(endTime.getDate()) + '/' +
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
        $Objects.GAWDSLink = $('#GAWDSLink', d);

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

// @include ./Menu.js

// @include ./AboutUs.js
