(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

/*! preflight - v1.3.2-build50 - 2020-03-19
 * Copyright (c) 2020 Nathan Woulfe;
 * Licensed MIT
 */

(function () {

    angular.module('preflight.components', []);
    angular.module('preflight.services', []);

    angular.module('preflight', ['preflight.components', 'preflight.services']);

    //        .config(['$provide', $provide => {
    //    $provide.decorator("$rootScope", function ($delegate) {
    //        var Scope = $delegate.constructor;
    //        var origBroadcast = Scope.prototype.$broadcast;
    //        var origEmit = Scope.prototype.$emit;

    //        Scope.prototype.$broadcast = function () {
    //            console.log("$broadcast was called on $scope " + Scope.$id + " with arguments:", arguments);
    //            return origBroadcast.apply(this, arguments);
    //        };
    //        Scope.prototype.$emit = function () {
    //            console.log("$emit was called on $scope " + Scope.$id + " with arguments:", arguments);
    //            return origEmit.apply(this, arguments);
    //        };
    //        return $delegate;
    //    });
    //}]);

    angular.module('umbraco').requires.push('preflight');
})();
(function () {

    function ctrl($scope, $rootScope, $element, $timeout, editorState, preflightService, preflightHub) {
        var _this = this;

        var dirtyHashes = {};
        var validPropTypes = Umbraco.Sys.ServerVariables.Preflight.PropertyTypesToCheck;
        var propsBeingChecked = [];
        var dirtyProps = [];

        this.results = {
            properties: []
        };

        this.noTests = false;
        this.percentageDone = 20;
        this.progressStep = 0;

        $scope.model.badge = {
            type: 'info'
        };

        /**
         * 
         * @param {any} arr
         */
        var joinList = function joinList(arr) {
            var outStr = void 0;
            if (arr.length === 1) {
                outStr = arr[0];
            } else if (arr.length === 2) {
                outStr = arr.join(' and ');
            } else if (arr.length > 2) {
                outStr = arr.slice(0, -1).join(', ') + ', and ' + arr.slice(-1);
            }

            return outStr;
        };

        /**
         * Convert a string to a hash for storage and comparison.
         * @param {string} s - the string to hashify
         * @returns {int} the generated hash
         */
        var getHash = function getHash(s) {
            return s ? s.split('').reduce(function (a, b) {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
            }, 0) : 1;
        };

        /**
         * Get property by alias from the current variant
         * @param {any} alias
         */
        var getProperty = function getProperty(alias) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = editorState.current.variants.find(function (x) {
                    return x.active;
                }).tabs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var tab = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = tab.properties[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var prop = _step2.value;

                            if (prop.alias === alias) {
                                return prop;
                            }
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        };

        /**
         * 
         * @param {any} editor
         */
        var onComplete = function onComplete() {
            // it's possible no tests ran, in which case results won't exist
            _this.noTests = _this.results.properties.every(function (x) {
                return !x.plugins.length;
            });
            if (_this.noTests) {
                $scope.model.badge = undefined;
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _this.results.properties[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var p = _step3.value;

                    p.disabled = p.failedCount === -1;
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            _this.showSuccessMessage = !_this.results.failed && !_this.noTests;
            _this.done = true;
        };

        /**
         * Is the editor param Umbraco.Grid or Umbraco.NestedContent?
         * @param {any} editor
         */
        var isJsonProperty = function isJsonProperty(editor) {
            return editor === 'Umbraco.Grid' || editor === 'Umbraco.NestedContent';
        };

        /**
         * Updates the badge in the header with the number of failed tests
         */
        var setBadgeCount = function setBadgeCount(pending) {
            if (pending) {
                $scope.model.badge = {
                    type: 'warning'
                };
                return;
            }

            if (_this.results && _this.results.failedCount > 0) {
                $scope.model.badge = {
                    count: _this.results.failedCount,
                    type: 'alert'
                };
            } else {
                $scope.model.badge = {
                    type: 'success icon-'
                };
            }
        };

        /**
         * Updates the property set with the new value, and removes any temporary property from that set
         * @param {object} data - a response model item returned via the signalr hub
         */
        var rebindResult = function rebindResult(data) {

            var newProp = true;
            var totalTestsRun = 0;
            var existingProp = _this.results.properties.find(function (x) {
                return x.label === data.label;
            });

            if (existingProp) {
                existingProp = Object.assign(existingProp, data);
                existingProp.loading = false;
                newProp = false;
            }

            // a new property will have a temporary placeholder - remove it
            // _temp ensures grid with multiple editors only removes the correct temp entry
            if (newProp && !data.remove && data.failedCount !== -1) {
                var tempIndex = _this.results.properties.findIndex(function (p) {
                    return p.name === data.name + '_temp';
                });
                if (tempIndex !== -1) {
                    _this.results.properties.splice(tempIndex, 1);
                }
                _this.results.properties.push(data);
            }

            _this.results.properties = _this.results.properties.filter(function (x) {
                return x.remove === false;
            });
            _this.results.properties = _this.results.properties.filter(function (x) {
                return x.failedCount > -1;
            });

            _this.results.failedCount = _this.results.properties.reduce(function (prev, cur) {
                totalTestsRun += cur.totalTests;
                return prev + cur.failedCount;
            }, 0);

            _this.results.failed = _this.results.failedCount > 0;
            _this.propsBeingCheckedStr = joinList(propsBeingChecked.splice(propsBeingChecked.indexOf(data.name), 1));
            _this.percentageFailed = (totalTestsRun - _this.results.failedCount) / totalTestsRun * 100;
        };

        /**
         * Finds dirty content properties, checks the type and builds a collection of simple models for posting to the preflight checkdirty endpoint
         * Also generates and stores a hash of the property value for comparison on subsequent calls, to prevent re-fetching unchanged data
         */
        var checkDirty = function checkDirty() {

            dirtyProps = [];
            var hasDirty = false;

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = propertiesToTrack[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var prop = _step4.value;

                    var currentValue = getProperty(prop.alias).value;
                    currentValue = isJsonProperty(prop.editor) ? JSON.stringify(currentValue) : currentValue;

                    var hash = getHash(currentValue);

                    if (dirtyHashes[prop.label] && dirtyHashes[prop.label] !== hash) {

                        dirtyProps.push({
                            name: prop.label,
                            value: currentValue,
                            editor: prop.editor
                        });

                        dirtyHashes[prop.label] = hash;
                        hasDirty = true;
                    } else if (!dirtyHashes[prop.label]) {
                        dirtyHashes[prop.label] = hash;
                    }
                }

                // if dirty properties exist, create a simple model for each and send the lot off for checking
                // response comes via the signalr hub so is not handled here
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            if (hasDirty) {
                $timeout(function () {

                    dirtyProps.forEach(function (prop) {
                        var _iteratorNormalCompletion5 = true;
                        var _didIteratorError5 = false;
                        var _iteratorError5 = undefined;

                        try {
                            for (var _iterator5 = _this.results.properties.filter(function (p) {
                                return p.name === prop.name;
                            })[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                var existing = _step5.value;

                                if (existing) {
                                    existing.open = false;
                                    existing.failedCount = -1;
                                } else {
                                    // generate new placeholder for pending results - this is removed when the response is returned
                                    _this.results.properties.push({
                                        label: prop.name,
                                        open: false,
                                        failed: false,
                                        failedCount: -1,
                                        name: prop.name + '_temp'
                                    });
                                }
                            }
                        } catch (err) {
                            _didIteratorError5 = true;
                            _iteratorError5 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                    _iterator5.return();
                                }
                            } finally {
                                if (_didIteratorError5) {
                                    throw _iteratorError5;
                                }
                            }
                        }

                        propsBeingChecked.push(prop.name);
                    });

                    _this.propsBeingCheckedStr = joinList(propsBeingChecked);

                    var payload = {
                        properties: dirtyProps,
                        nodeId: editorState.current.id
                    };

                    setBadgeCount(true);
                    _this.done = false;

                    preflightService.checkDirty(payload);
                });
            }
        };

        /*
         * 
         */
        $rootScope.$on('app.tabChange', function (e, data) {
            if (data.alias === 'preflight') {
                var _loop = function _loop(openNc) {
                    $timeout(function () {
                        return openNc.click();
                    });
                };

                // collapse open nc controls, timeouts prevent $apply errors
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = document.querySelectorAll('.umb-nested-content__item--active .umb-nested-content__header-bar')[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var openNc = _step6.value;

                        _loop(openNc);
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                $timeout(function () {
                    checkDirty();
                    setBadgeCount();
                });
            }
        });

        /*
         * 
         */
        $rootScope.$on('showPreflight', function (event, data) {
            if (data.nodeId === $scope.content.id) {
                // needs to find app closest to current scope
                var appLink = $element.closest('form').find('[data-element="sub-view-preflight"]');

                if (appLink) {
                    appLink.click();
                }
            }
        });

        /**
         * Initiates the signalr hub for returning test results
         */
        var initSignarlR = function initSignarlR() {

            preflightHub.initHub(function (hub) {

                hub.on('preflightTest', function (e) {
                    rebindResult(e);
                    setBadgeCount();
                });

                hub.on('preflightComplete', function () {
                    return onComplete();
                });

                hub.start(function (e) {
                    /**
                     * Check all properties when the controller loads. Won't re-run when changing between apps
                     * but needs to happen after the hub loads
                     */
                    $timeout(function () {
                        setBadgeCount(true);
                        checkDirty(); // builds initial hash array, but won't run anything
                        preflightService.check(editorState.current.id);
                    });
                });
            });
        };

        /**
         * Stores a reference collection of tracked properties
         */
        var activeVariant = editorState.current.variants.find(function (x) {
            return x.active;
        });
        var propertiesToTrack = [];

        if (activeVariant) {
            activeVariant.tabs.forEach(function (x) {
                propertiesToTrack = propertiesToTrack.concat(x.properties.map(function (x) {
                    if (validPropTypes.includes(x.editor)) {
                        return {
                            editor: x.editor,
                            alias: x.alias,
                            label: x.label
                        };
                    }
                })).filter(function (x) {
                    return x;
                });
            });

            // array will have length, as app is only sent on types with testable properties
            if (propertiesToTrack.length) {
                initSignarlR();
            }
        }
    }

    angular.module('preflight').controller('preflight.controller', ['$scope', '$rootScope', '$element', '$timeout', 'editorState', 'preflightService', 'preflightHub', ctrl]);
})();
(function () {

    function notificationController($rootScope, notificationsService, editorState) {
        var _this2 = this;

        this.saveCancelled = +notificationsService.current[0].args.saveCancelled === 1;

        this.switch = function (n) {
            $rootScope.$emit('showPreflight', { nodeId: editorState.current.id });
            _this2.discard(n);
        };

        this.discard = function (n) {
            notificationsService.remove(n);
        };
    }

    // register controller 
    angular.module('preflight').controller('preflight.notification.controller', ['$rootScope', 'notificationsService', 'editorState', notificationController]);
})();
(function () {

    function ctrl($scope, notificationsService, preflightService) {
        var _this3 = this;

        var watchTestableProperties = function watchTestableProperties() {
            var propertiesToModify = _this3.settings.filter(function (x) {
                return x.alias.indexOf('PropertiesToTest') !== -1 && x.alias !== 'propertiesToTest';
            });
            $scope.$watch(function () {
                return _this3.settings.find(function (x) {
                    return x.alias === 'propertiesToTest';
                }).value;
            }, function (newVal) {
                if (newVal) {
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                        for (var _iterator7 = propertiesToModify[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                            var prop = _step7.value;

                            // use the prop alias to find the checkbox set
                            var _iteratorNormalCompletion8 = true;
                            var _didIteratorError8 = false;
                            var _iteratorError8 = undefined;

                            try {
                                for (var _iterator8 = document.querySelectorAll('umb-checkbox[name*="' + prop.alias + '"]')[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                    var checkbox = _step8.value;

                                    checkbox.querySelector('.umb-form-check').classList[newVal.indexOf(checkbox.getAttribute('value')) === -1 ? 'add' : 'remove']('pf-disabled');
                                }
                            } catch (err) {
                                _didIteratorError8 = true;
                                _iteratorError8 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                                        _iterator8.return();
                                    }
                                } finally {
                                    if (_didIteratorError8) {
                                        throw _iteratorError8;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError7 = true;
                        _iteratorError7 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                _iterator7.return();
                            }
                        } finally {
                            if (_didIteratorError7) {
                                throw _iteratorError7;
                            }
                        }
                    }
                }
            }, true);
        };

        preflightService.getSettings().then(function (resp) {
            _this3.settings = resp.data.settings;
            _this3.tabs = resp.data.tabs;

            _this3.settings.forEach(function (v) {
                if (v.view.indexOf('slider') !== -1) {
                    v.config = {
                        handle: 'round',
                        initVal1: v.alias === 'longWordSyllables' ? 5 : 65,
                        maxVal: v.alias === 'longWordSyllables' ? 10 : 100,
                        minVal: 0,
                        orientation: 'horizontal',
                        step: 1,
                        tooltip: 'always',
                        tooltipPosition: 'bottom'
                    };
                } else if (v.view.indexOf('multipletextbox') !== -1) {

                    v.value = v.value.split(',').map(function (val) {
                        return { value: val };
                    }).sort(function (a, b) {
                        return a < b;
                    });

                    v.config = {
                        min: 0,
                        max: 0
                    };

                    v.validation = {};
                } else if (v.view.indexOf('checkboxlist') !== -1) {

                    v.value = v.value.split(',');

                    v.config = {
                        items: v.prevalues
                    };
                }
            });

            watchTestableProperties();
        });

        /**
         * 
         */
        this.saveSettings = function () {

            var min = parseInt(_this3.settings.filter(function (x) {
                return x.alias === 'readabilityTargetMinimum';
            })[0].value);
            var max = parseInt(_this3.settings.filter(function (x) {
                return x.alias === 'readabilityTargetMaximum';
            })[0].value);

            if (min < max) {

                if (min + 10 > max) {
                    notificationsService.warning('WARNING', 'Readability range is narrow');
                }

                // need to transform multitextbox values without digest
                // so must be a new object, not a reference
                var settingsToSave = JSON.parse(JSON.stringify(_this3.settings));

                settingsToSave.forEach(function (v) {
                    if (v.view.indexOf('multipletextbox') !== -1) {
                        v.value = v.value.map(function (o) {
                            return o.value;
                        }).join(',');
                    } else if (v.view.indexOf('checkboxlist') !== -1) {
                        v.value = v.value.join(',');
                    }
                });

                preflightService.saveSettings(settingsToSave, _this3.tabs).then(function (resp) {
                    resp.data ? notificationsService.success('SUCCESS', 'Settings updated') : notificationsService.error('ERROR', 'Unable to save settings');

                    // reset dashboard form state
                    var formScope = angular.element(document.querySelector('[name="dashboardForm"]')).scope();
                    formScope.dashboardForm.$setPristine();
                });
            } else {
                notificationsService.error('ERROR', 'Unable to save settings - readability minimum cannot be greater than readability maximum');
            }
        };
    }

    angular.module('preflight').controller('preflight.settings.controller', ['$scope', 'notificationsService', 'preflightService', ctrl]);
})();
(function () {

    var template = '\n        <div class="card {{ ::$ctrl.cardClass }}">\n            <span class="card-score {{ ::$ctrl.cardScoreClass }}" ng-bind="::$ctrl.score"></span>\n            <span class="card-title">\n                {{ ::$ctrl.title }}<br />\n                {{ ::$ctrl.subtitle }}\n            </span>\n        </div>';

    function controller(localizationService) {
        var _this4 = this;

        this.cardClass = 'pass';
        this.cardScoreClass = 'pass-color';

        var init = function init() {

            if (_this4.failed) {
                _this4.cardClass = 'fail';
                _this4.cardScoreClass = 'fail-color';
            }

            if (_this4.title[0] === '@') {
                localizationService.localize(_this4.title, _this4.tokens).then(function (localizedTitle) {
                    _this4.title = localizedTitle;
                });
            }

            if (_this4.subtitle[0] === '@') {
                localizationService.localize(_this4.subtitle, _this4.tokens).then(function (localizedSubtitle) {
                    _this4.subtitle = localizedSubtitle;
                });
            }
        };

        this.$onInit = function () {
            init();
        };
    }

    var component = {
        transclude: true,
        bindings: {
            title: '@?',
            subtitle: '@?',
            failed: '<',
            score: '<',
            tokens: '<'
        },
        template: template,
        controller: controller
    };

    controller.$inject = ['localizationService'];

    angular.module('preflight.components').component('preflightCard', component);
})();
(function () {
    function ProgressCircleDirective() {

        function link(scope, element) {
            function onInit() {

                // making sure we get the right numbers
                var percent = Math.round(scope.percentage);
                percent = percent > 100 ? 100 : percent || 0;

                // calculating the circle's highlight
                var r = element.find('.umb-progress-circle__highlight').attr('r');
                var pathLength = r * Math.PI * 2 * percent / 100;

                // Full circle length
                scope.dashArray = pathLength + ',100';

                // set font size
                scope.percentageSize = scope.size * 0.3 + 'px';

                // use rounded percentage
                scope.label = percent + '%';
            }

            scope.$watch('percentage', onInit);
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: '\n                <div class="umb-progress-circle preflight-progress" ng-style="{\'width\': size, \'height\': size }"> {{ percent }}\n                    <svg class="umb-progress-circle__view-box" viewBox="0 0 33.83098862 33.83098862"> \n                        <circle class="umb-progress-circle__highlight--{{ background }}" cx="16.91549431" cy="16.91549431" r="15.91549431" fill="none" stroke-width=".5"></circle>\n                        <circle class="umb-progress-circle__highlight umb-progress-circle__highlight--{{ foreground }}" \n                            cx="16.91549431" cy="16.91549431" r="15.91549431" stroke-linecap="round" fill="none" stroke-width="2" stroke-dasharray="{{ dashArray }}"></circle> \n                    </svg> \n                    <div ng-style="{\'font-size\': percentageSize}" class="umb-progress-circle__percentage">\n                        {{ label }}\n                        <small>pass rate</small>                \n                    </div>\n                </div>',
            scope: {
                size: '@?',
                percentage: '=',
                done: '@',
                foreground: '@',
                background: '@'
            },
            link: link
        };

        return directive;
    }

    angular.module('preflight.components').directive('progressCircle', ProgressCircleDirective);
})();
(function () {

    /**
     * Directive used to render the heading for a plugin in the results view
     * Send a stringified array as the tokens attribute to replace %0%, %1% .. %n% in the localized string
     */

    var template = '\n           <h5 ng-bind="::$ctrl.heading"></h5>\n           <span ng-if="$ctrl.pass" ng-bind="::$ctrl.passText"></span>';

    function controller(localizationService) {
        var _this5 = this;

        var init = function init() {
            if (_this5.passText[0] === '@') {
                localizationService.localize(_this5.passText, _this5.tokens).then(function (localizedPassText) {
                    _this5.passText = localizedPassText;
                });
            }

            if (_this5.heading[0] === '@') {
                localizationService.localize(_this5.heading, _this5.tokens).then(function (localizedHeading) {
                    _this5.heading = localizedHeading;
                });
            }
        };

        this.$onInit = function () {
            init();
        };
    }

    var component = {
        transclude: true,
        bindings: {
            tokens: '<',
            passText: '@?',
            heading: '@?',
            pass: '<'
        },
        template: template,
        controller: controller
    };

    controller.$inject = ['localizationService'];

    angular.module('preflight.components').component('preflightResultIntro', component);
})();
(function () {

    var template = '\n        <div class="state-icon {{ ::$ctrl.className }}">\n            <i class="icon icon-{{ ::$ctrl.icon }}"></i>\n        </div>';

    function controller() {
        var _this6 = this;

        this.icon = 'power';
        this.className = 'disabled';

        this.$onInit = function () {
            if (!_this6.disabled) {
                _this6.icon = _this6.failed ? 'delete' : 'check';
                _this6.className = _this6.failed ? 'fail' : 'pass';
            }
        };
    }

    var component = {
        transclude: true,
        bindings: {
            failed: '<',
            disabled: '<'
        },
        template: template,
        controller: controller
    };

    angular.module('preflight.components').component('preflightStateIcon', component);
})();
(function () {

    var postSaveUrl = '/umbracoapi/content/postsave';

    function interceptor(notificationsService, $q, $injector) {

        var checkGroup = function checkGroup(userGroupOptInOut) {
            // use the stored value to get the corresponding key from the setting's prevalues (which is value,key paring of all groups)
            var enabledGroups = userGroupOptInOut.prevalues.filter(function (x) {
                return userGroupOptInOut.value.includes(x.value);
            }).map(function (x) {
                return x.key;
            });

            $injector.invoke(['authResource', function (authResource) {
                authResource.getCurrentUser().then(function (currentUser) {
                    if (enabledGroups.some(function (x) {
                        return currentUser.userGroups.includes(x);
                    })) {
                        notificationsService.add({
                            key: 'preflight_notice',
                            view: Umbraco.Sys.ServerVariables.Preflight.PluginPath + '/views/warning.notification.html'
                        });
                    }
                });
            }]);
        };

        return {
            request: function request(_request) {
                if (_request.url.toLowerCase().indexOf(postSaveUrl) !== -1) {
                    $injector.invoke(['preflightService', function (s) {
                        s.getSettings().then(function (resp) {
                            var settings = resp.data.settings;
                            var runOnSave = settings.find(function (x) {
                                return x.alias === 'runPreflightOnSave';
                            });
                            if (runOnSave && runOnSave.value === '1') {
                                var userGroupOptInOut = settings.find(function (x) {
                                    return x.alias === 'userGroupOptInOut';
                                });
                                checkGroup(userGroupOptInOut);
                            }
                        });
                    }]);
                }

                return _request || $q.when(_request);
            },
            response: function response(_response) {
                try {
                    if (_response.config.url.toLowerCase().indexOf(postSaveUrl) !== -1) {

                        var index = notificationsService.current.map(function (c) {
                            return c.key === 'preflight_notice';
                        }).indexOf(true);

                        if (index !== -1) {
                            notificationsService.remove(index);
                        }

                        if (_response.data.notifications) {

                            var notification = _response.data.notifications.filter(function (f) {
                                return f.header === Umbraco.Sys.ServerVariables.Preflight.ContentFailedChecks;
                            })[0];

                            if (notification) {
                                _response.data.notifications = [];

                                notificationsService.add({
                                    view: Umbraco.Sys.ServerVariables.Preflight.PluginPath + '/views/failed.notification.html',
                                    args: { saveCancelled: notification.message.indexOf('_true') !== -1 }
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.log(err.message);
                }

                return _response || $q.when(_response);
            }
        };
    }

    angular.module('preflight').factory('preflight.save.interceptor', ['notificationsService', '$q', '$injector', interceptor]).config(function ($httpProvider) {
        return $httpProvider.interceptors.push('preflight.save.interceptor');
    });
})();
(function () {

    var component = {
        transclude: true,
        bindings: {
            results: '<'
        },
        template: '\n            <table class="linkhealth-result-table">\n                <thead>\n                    <tr><th>Link text</th> <th>Link target</th> <th>Link status</th></tr>\n                </thead>\n                <tr ng-repeat="link in $ctrl.results"><td ng-bind="link.text"></td><td ng-bind="link.href"></td><td ng-bind="link.status"></td></tr>\n            </table>'
    };

    angular.module('preflight.components').component('linkhealthResult', component);
})();
(function () {

    function overlay($scope) {
        // there's nothing here
    }

    angular.module('umbraco').controller('readability.overlay.controller', ['$scope', overlay]);

    function ctrl($scope, editorService) {
        /**
        * Displays an overlay explaining what the readability test actually does
         * @param {any} e click event
        */

        this.help = function (e) {
            e.preventDefault();
            var helpOverlay = {
                view: Umbraco.Sys.ServerVariables.Preflight.PluginPath + '/plugins/readability.overlay.html',
                title: 'Readability',
                description: 'Why should I care?',
                size: 'small',
                text: $scope.model.description,
                close: function close() {
                    return editorService.close();
                }
            };

            editorService.open(helpOverlay);
        };
    }

    angular.module('umbraco').controller('readability.plugin.controller', ['$scope', 'editorService', ctrl]);
})();

(function () {

    function preflightHub($rootScope, $q, assetsService) {

        var scripts = ['/umbraco/lib/signalr/jquery.signalr.js', '/umbraco/backoffice/signalr/hubs'];

        function initHub(callback) {
            if ($.connection === undefined) {
                var promises = [];
                scripts.forEach(function (script) {
                    return promises.push(assetsService.loadJs(script));
                });

                $q.all(promises).then(function () {
                    return hubSetup(callback);
                });
            } else {
                hubSetup(callback);
            }
        }

        function hubSetup(callback) {

            var proxy = $.connection.preflightHub;

            var hub = {
                start: function start(callback) {
                    $.connection.hub.start();
                    if (callback) {
                        callback();
                    }
                },
                on: function on(eventName, callback) {
                    proxy.on(eventName, function (result) {
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback(result);
                            }
                        });
                    });
                },
                invoke: function invoke(methodName, callback) {
                    proxy.invoke(methodName).done(function (result) {
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback(result);
                            }
                        });
                    });
                }
            };

            return callback(hub);
        }

        return {
            initHub: initHub
        };
    }

    angular.module('preflight.services').factory('preflightHub', ['$rootScope', '$q', 'assetsService', preflightHub]);
})();
(function () {

    function preflightService($http, umbRequestHelper) {

        var urlBase = Umbraco.Sys.ServerVariables.Preflight.ApiPath;

        var helpText = '\n            <p>If your content is too difficult for your visitors to read, you\'re all going to have a bad time.</p>\n            <p>The readability test runs your content through the Flesch reading ease algorithm to determine text complexity.</p>\n            <h5>The algorithm</h5>\n            <p><code>RE = 206.835 - (1.015 x ASL) - (84.6 x ASW)</code></p>\n            <p>Where <code>RE</code> is Readability Ease, <code>ASL</code> is Average Sentence Length, and <code>ASW</code> is Average Syllables per Word</p>\n            <p>The result is a number between 0 and 100, where a higher score means better readability, with a score between 60 and 69 largely considered acceptable.</p>\n            <h5>Readability test results</h5>\n            <p>As well as the Flesch score, the readability test returns sentence length; average syllables per word; and long or complex words;</p>';

        var request = function request(method, url, data) {
            return umbRequestHelper.resourcePromise(method === 'GET' ? $http.get(url) : $http.post(url, data), 'Something broke');
        };

        var service = {
            check: function check(id) {
                return request('GET', urlBase + 'check/' + id);
            },

            checkDirty: function checkDirty(data) {
                return request('POST', urlBase + 'checkdirty/', data);
            },

            getSettings: function getSettings() {
                return request('GET', urlBase + 'getSettings');
            },

            getSettingValue: function getSettingValue(alias) {
                return request('GET', urlBase + 'getSettingValue/' + alias);
            },

            saveSettings: function saveSettings(settings, tabs) {
                return request('POST', urlBase + 'saveSettings', {
                    settings: settings,
                    tabs: tabs
                });
            },

            getHelpText: function getHelpText() {
                return helpText;
            }
        };

        return service;
    }

    angular.module('preflight.services').service('preflightService', ['$http', 'umbRequestHelper', preflightService]);
})();

},{}]},{},[1]);
