(function(d, w) {
    /**
    * @author: Varun Kumar
    * varunon9@gmail.com
    * References: https://www.oculusconnect.com/, https://codepen.io/rfabester/pen/JIjwk?editors=1010
    */
    
    //global variables
    var height, canvas, width, ctx, points = [], row = 0, col = 0, targetHeight, targetWidth;
    var params = {
        length: 125,
        radius: 2,
        color: '#5d5d5d',
        lineOpacity: 0.5
    };
    //background layer of points- no animation
    var fixedCanvas, fixedPoints = [], fixedCtx;

    var getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;       
    };

    var Circle = function(pos, radius, color) {
        this.draw = function() {
            ctx.beginPath();
            ctx.arc(pos.targetX, pos.targetY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
        };
    };

    var drawLines = function(point, neighbours, context) {
        var l = neighbours.length;
        if (!neighbours[l - 1]) {
            return;
        }
        for(var i = 0; i < l; i++) {
            context.beginPath();
            context.moveTo(point.targetX, point.targetY);
            context.lineTo(neighbours[i].targetX, neighbours[i].targetY);
            context.strokeStyle = params.color;
            context.strokeOpacity = params.lineOpacity;
            context.stroke();
        }
    };

    var shiftPoint = function(p) {
        var amount = getRandomInt(0, 5);
        TweenLite.to(p, 1 + 1 * Math.random(), {
            targetX: p.originX + Math.random() * amount,
            targetY: p.originY + Math.random() * amount, 
            ease: Power4.easeInOut,
            onComplete: function() {
                shiftPoint(p);
            }
        });
    };

    var shiftOnce = function(p, amount, time, repeat) {
        var flag = 1;
        if (Math.random() > .5) {
            flag = -1;
        }
        TweenLite.to(p, time + 1 * Math.random(), {
            targetX: p.originX + flag * Math.random() * amount,
            targetY: p.originY + flag * Math.random() * amount, 
            ease: Power4.easeOut,
            onComplete: function() {
                if (repeat == 1) {
                    shiftOnce(p, 5, 1, 1);
                }
            }
        });
    };

    var paintCanvas = function(points, context) {
        for(var i = 0; i < 2 * row - 2; i++) {
            for (var j = 0; j < col - 2; j++) {
                points[i][j].circle.draw();
                if (i % 2 == 0) {
                    drawLines(points[i][j], 
                        new Array(points[i + 2][j], points[i + 1][j], points[i][j + 1]), context);
                } else {
                    drawLines(points[i][j], 
                        new Array(points[i - 1][j + 1], points[i + 1][j + 1], points[i + 1][j]), context);
                }
            }
        }
    };

    var startAnimation = function() {
        ctx.clearRect(0, 0, width, height);
        paintCanvas(points, ctx);
        requestAnimationFrame(startAnimation);
    };

    var mouseMove = function(e) {
        var posX = posY = 0;
        if (e.pageX || e.pageY) {
            posX = e.pageX;
            posY = e.pageY;
        } else if (e.clientX || e.clientY)    {
            posX = e.clientX;
            posY = e.clientY;
        }
        var i = parseInt(posY / params.length);
        var j = parseInt(posX / params.length);
        for (var a = i; a < i + 5; a++) {
            for (var b = j; b < j + 2; b++) {
                shiftOnce(points[a][b], 30, 1, 1);
            }
        }
    };

    var resize = function() {
        width = w.innerWidth;
        height = w.innerHeight;
        canvas.width = fixedCanvas.width = width;
        canvas.height = fixedCanvas.height = height;
    };

    var addListeners = function() {
        w.addEventListener('mousemove', mouseMove);
        w.addEventListener('resize', resize);
    };

    var createPoints = function() {
        var length = params.length;
        var y = -length / 2;
        for (var i = 0; i < 2 * row; i++) {
            points[i] = [];
            fixedPoints[i] = [];
            var x = -length / 2;
            if (i % 2 == 1) {
                x = 0;
            }
            for (var j = 0; j < col; j++) {
                var point = {
                    targetX: x,
                    targetY: y,
                    originX: x,
                    originY: y
                };
                var c = new Circle(point, params.radius, params.color);
                point.circle = c;
                points[i].push(point);
                fixedPoints[i].push(point);
                x += length;
            }
            y += length / 2;
        }
    };

    var init = function() {
        width = w.innerWidth;
        height = w.innerHeight;
        canvas = d.getElementById('background');
        fixedCanvas = d.getElementById('fixed-background');
        canvas.width = fixedCanvas.width = width;
        canvas.height = fixedCanvas.height = height;
        ctx = canvas.getContext('2d');
        fixedCtx = fixedCanvas.getContext('2d');
        targetWidth = width * 1.5;
        targetHeight = height * 1.5;
        row = parseInt(targetHeight / params.length);
        col = parseInt(targetWidth / (params.length / 2));
        createPoints();
    };  

    var initAnimation = function() {
        init();
        addListeners();
        //painting fixed points
        //paintCanvas(fixedPoints, fixedCtx);
        startAnimation();
        for (var i = 0; i < 2 * row - 2; i++) {
            for (var j = 0; j < col - 2; j++) {
                shiftPoint(points[i][j]);
            }
        }
    };

    w.addEventListener('load', function() {
        initAnimation();
    });

}(document, window));