(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Rellax = factory();
    }
}(typeof window !== "undefined" ? window : global, function() {
    var Rellax = function(el, options) {
        "use strict";
        var self = Object.create(Rellax.prototype);
        var posY = 0;
        var screenY = 0;
        var posX = 0;
        var screenX = 0;
        var blocks = [];
        var pause = true;
        var loop = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback) {
            return setTimeout(callback, 1000 / 60);
        }
        ;
        var loopId = null;
        var clearLoop = window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout;
        var transformProp = window.transformProp || (function() {
            var testEl = document.createElement('div');
            if (testEl.style.transform === null) {
                var vendors = ['Webkit', 'Moz', 'ms'];
                for (var vendor in vendors) {
                    if (testEl.style[vendors[vendor] + 'Transform'] !== undefined) {
                        return vendors[vendor] + 'Transform';
                    }
                }
            }
            return 'transform';
        }
        )();
        self.options = {
            speed: -2,
            center: false,
            wrapper: null,
            relativeToWrapper: false,
            round: true,
            vertical: true,
            horizontal: false,
            callback: function() {},
        };
        if (options) {
            Object.keys(options).forEach(function(key) {
                self.options[key] = options[key];
            });
        }
        if (!el) {
            el = '.rellax';
        }
        var elements = typeof el === 'string' ? document.querySelectorAll(el) : [el];
        if (elements.length > 0) {
            self.elems = elements;
        } else {
            console.warn("Rellax: The elements you're trying to select don't exist.");
            return;
        }
        if (self.options.wrapper) {
            if (!self.options.wrapper.nodeType) {
                var wrapper = document.querySelector(self.options.wrapper);
                if (wrapper) {
                    self.options.wrapper = wrapper;
                } else {
                    console.warn("Rellax: The wrapper you're trying to use doesn't exist.");
                    return;
                }
            }
        }
        var cacheBlocks = function() {
            for (var i = 0; i < self.elems.length; i++) {
                var block = createBlock(self.elems[i]);
                blocks.push(block);
            }
        };
        var init = function() {
            for (var i = 0; i < blocks.length; i++) {
                self.elems[i].style.cssText = blocks[i].style;
            }
            blocks = [];
            screenY = window.innerHeight;
            screenX = window.innerWidth;
            setPosition();
            cacheBlocks();
            animate();
            if (pause) {
                window.addEventListener('resize', init);
                pause = false;
                update();
            }
        };
        var createBlock = function(el) {
            var dataPercentage = el.getAttribute('data-rellax-percentage');
            var dataSpeed = el.getAttribute('data-rellax-speed');
            var dataZindex = el.getAttribute('data-rellax-zindex') || 0;
            var dataMin = el.getAttribute('data-rellax-min');
            var dataMax = el.getAttribute('data-rellax-max');
            var wrapperPosY = self.options.wrapper ? self.options.wrapper.scrollTop : (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
            if (self.options.relativeToWrapper) {
                var scrollPosY = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
                wrapperPosY = scrollPosY - self.options.wrapper.offsetTop;
            }
            var posY = self.options.vertical ? (dataPercentage || self.options.center ? wrapperPosY : 0) : 0;
            var posX = self.options.horizontal ? (dataPercentage || self.options.center ? self.options.wrapper ? self.options.wrapper.scrollLeft : (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft) : 0) : 0;
            var blockTop = posY + el.getBoundingClientRect().top;
            var blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;
            var blockLeft = posX + el.getBoundingClientRect().left;
            var blockWidth = el.clientWidth || el.offsetWidth || el.scrollWidth;
            var percentageY = dataPercentage ? dataPercentage : (posY - blockTop + screenY) / (blockHeight + screenY);
            var percentageX = dataPercentage ? dataPercentage : (posX - blockLeft + screenX) / (blockWidth + screenX);
            if (self.options.center) {
                percentageX = 0.5;
                percentageY = 0.5;
            }
            var speed = dataSpeed ? dataSpeed : self.options.speed;
            var bases = updatePosition(percentageX, percentageY, speed);
            var style = el.style.cssText;
            var transform = '';
            var searchResult = /transform\s*:/i.exec(style);
            if (searchResult) {
                var index = searchResult.index;
                var trimmedStyle = style.slice(index);
                var delimiter = trimmedStyle.indexOf(';');
                if (delimiter) {
                    transform = " " + trimmedStyle.slice(11, delimiter).replace(/\s/g, '');
                } else {
                    transform = " " + trimmedStyle.slice(11).replace(/\s/g, '');
                }
            }
            return {
                baseX: bases.x,
                baseY: bases.y,
                top: blockTop,
                left: blockLeft,
                height: blockHeight,
                width: blockWidth,
                speed: speed,
                style: style,
                transform: transform,
                zindex: dataZindex,
                min: dataMin,
                max: dataMax
            };
        };
        var setPosition = function() {
            var oldY = posY;
            var oldX = posX;
            posY = self.options.wrapper ? self.options.wrapper.scrollTop : (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
            posX = self.options.wrapper ? self.options.wrapper.scrollLeft : (document.documentElement || document.body.parentNode || document.body).scrollLeft || window.pageXOffset;
            if (self.options.relativeToWrapper) {
                var scrollPosY = (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
                posY = scrollPosY - self.options.wrapper.offsetTop;
            }
            if (oldY != posY && self.options.vertical) {
                return true;
            }
            if (oldX != posX && self.options.horizontal) {
                return true;
            }
            return false;
        };
        var updatePosition = function(percentageX, percentageY, speed) {
            var result = {};
            var valueX = (speed * (100 * (1 - percentageX)));
            var valueY = (speed * (100 * (1 - percentageY)));
            result.x = self.options.round ? Math.round(valueX) : Math.round(valueX * 100) / 100;
            result.y = self.options.round ? Math.round(valueY) : Math.round(valueY * 100) / 100;
            return result;
        };
        var update = function() {
            if (setPosition() && pause === false) {
                animate();
            }
            loopId = loop(update);
        };
        var animate = function() {
            var positions;
            for (var i = 0; i < self.elems.length; i++) {
                var percentageY = ((posY - blocks[i].top + screenY) / (blocks[i].height + screenY));
                var percentageX = ((posX - blocks[i].left + screenX) / (blocks[i].width + screenX));
                positions = updatePosition(percentageX, percentageY, blocks[i].speed);
                var positionY = positions.y - blocks[i].baseY;
                var positionX = positions.x - blocks[i].baseX;
                if (blocks[i].min !== null) {
                    if (self.options.vertical && !self.options.horizontal) {
                        positionY = positionY <= blocks[i].min ? blocks[i].min : positionY;
                    }
                    if (self.options.horizontal && !self.options.vertical) {
                        positionX = positionX <= blocks[i].min ? blocks[i].min : positionX;
                    }
                }
                if (blocks[i].max !== null) {
                    if (self.options.vertical && !self.options.horizontal) {
                        positionY = positionY >= blocks[i].max ? blocks[i].max : positionY;
                    }
                    if (self.options.horizontal && !self.options.vertical) {
                        positionX = positionX >= blocks[i].max ? blocks[i].max : positionX;
                    }
                }
                var zindex = blocks[i].zindex;
                var translate = 'translate3d(' + (self.options.horizontal ? positionX : '0') + 'px,' + (self.options.vertical ? positionY : '0') + 'px,' + zindex + 'px) ' + blocks[i].transform;
                self.elems[i].style[transformProp] = translate;
            }
            self.options.callback(positions);
        };
        self.destroy = function() {
            for (var i = 0; i < self.elems.length; i++) {
                self.elems[i].style.cssText = blocks[i].style;
            }
            if (!pause) {
                window.removeEventListener('resize', init);
                pause = true;
            }
            clearLoop(loopId);
            loopId = null;
        }
        ;
        init();
        self.refresh = init;
        return self;
    };
    return Rellax;
}));
