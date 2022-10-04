var yall = (function() {
    'use strict';
    function yall(options) {
        options = options || {};
        var lazyClass = options.lazyClass || "lazy";
        var lazyBackgroundClass = options.lazyBackgroundClass || "lazy-bg";
        var idleLoadTimeout = "idleLoadTimeout"in options ? options.idleLoadTimeout : 200;
        var observeChanges = options.observeChanges || false;
        var events = options.events || {};
        var win = window;
        var ric = "requestIdleCallback";
        var io = "IntersectionObserver";
        var dataAttrs = ["srcset", "src", "poster"];
        var arr = [];
        var queryDOM = function queryDOM(selector, root) {
            return arr.slice.call((root || document).querySelectorAll(selector || "img." + lazyClass + ",video." + lazyClass + ",iframe." + lazyClass + ",." + lazyBackgroundClass));
        };
        var yallLoad = function yallLoad(element) {
            var parentNode = element.parentNode;
            var elements = [];
            var sourceNode;
            if (parentNode.nodeName == "PICTURE") {
                sourceNode = parentNode;
            }
            if (element.nodeName == "VIDEO") {
                sourceNode = element;
            }
            elements = queryDOM("source", sourceNode);
            for (var elementIndex in elements) {
                yallFlipDataAttrs(elements[elementIndex]);
            }
            yallFlipDataAttrs(element);
            if (element.autoplay) {
                setTimeout(function() {
                    element.load();
                }, 100);
            }
            var classList = element.classList;
            if (classList.contains(lazyBackgroundClass)) {
                classList.remove(lazyBackgroundClass);
                classList.add(options.lazyBackgroundLoaded || "lazy-bg-loaded");
            }
        };
        var yallBind = function yallBind(element) {
            for (var eventIndex in events) {
                element.addEventListener(eventIndex, events[eventIndex].listener || events[eventIndex], events[eventIndex].options || undefined);
            }
            intersectionListener.observe(element);
        };
        var yallFlipDataAttrs = function yallFlipDataAttrs(element) {
            dataAttrs.forEach(function(dataAttr) {
                if (dataAttr in element.dataset) {
                    win["requestAnimationFrame"](function() {
                        element[dataAttr] = element.dataset[dataAttr];
                    });
                }
            });
        };
        var lazyElements = queryDOM();
        if (/baidu|(?:google|bing|yandex|duckduck)bot/i.test(navigator.userAgent)) {
            for (var lazyElementIndex in lazyElements) {
                yallLoad(lazyElements[lazyElementIndex]);
            }
            return;
        }
        if (io in win && io + "Entry"in win) {
            var intersectionListener = new win[io](function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.intersectionRatio) {
                        var element = entry.target;
                        if (ric in win && idleLoadTimeout) {
                            win[ric](function() {
                                yallLoad(element);
                            }, {
                                timeout: idleLoadTimeout
                            });
                        } else {
                            yallLoad(element);
                        }
                        setTimeout(function() {
                            element.classList.remove(lazyClass);
                        }, 200);
                        observer.unobserve(element);
                        lazyElements = lazyElements.filter(function(lazyElement) {
                            return lazyElement != element;
                        });
                        if (!lazyElements.length && !observeChanges) {
                            intersectionListener.disconnect();
                        }
                    }
                });
            }
            ,{
                rootMargin: ("threshold"in options ? options.threshold : 200) + "px 0%"
            });
            for (var _lazyElementIndex in lazyElements) {
                yallBind(lazyElements[_lazyElementIndex]);
            }
            if (observeChanges) {
                new MutationObserver(function() {
                    queryDOM().forEach(function(newElement) {
                        if (lazyElements.indexOf(newElement) < 0) {
                            lazyElements.push(newElement);
                            yallBind(newElement);
                        }
                    });
                }
                ).observe(queryDOM(options.observeRootSelector || "body")[0], options.mutationObserverOptions || {
                    childList: true,
                    subtree: true
                });
            }
        }
    }
    return yall;
}());
