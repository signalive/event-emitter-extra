var EventEmitterExtra=function(e){function t(r){if(n[r])return n[r].exports;var i=n[r]={exports:{},id:r,loaded:!1};return e[r].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){return"object"===("undefined"==typeof e?"undefined":u(e))&&"object"===("undefined"==typeof t?"undefined":u(t))&&e.toString()===t.toString()}function s(e,t){var n=[];return(0,v.default)(t)?n=e.filter(t):e.indexOf(t)>-1&&n.push(t),n.forEach(function(t){var n=e.indexOf(t);e.splice(n,1)}),n}var u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),f=n(5),c=r(f),l=n(6),v=r(l),h=n(7),d=r(h),x=n(8),p=r(x),m=n(9),y=r(m),g=n(10),L=r(g),b=function(){function e(){i(this,e),this.maxListeners_=e.defaultMaxListeners,this.maxRegexListeners_=e.defaultMaxRegexListeners,this.listeners_=[],this.regexListeners_=[],this.eventListeners_={}}return a(e,[{key:"addListener",value:function(e,t,n){var r=this;if((0,c.default)(e)||(0,c.default)(t)){var i=function(){var i=(0,c.default)(e)?e:[e],o=(0,c.default)(t)?t:[t];return i.forEach(function(e){o.forEach(function(t){r.addListener(e,t,n)})}),{v:void 0}}();if("object"===("undefined"==typeof i?"undefined":u(i)))return i.v}var o=new L.default(e,t,n);if(o.eventName){if(this.eventListeners_[o.eventName]||(this.eventListeners_[o.eventName]=[]),this.eventListeners_[o.eventName].length>=this.maxListeners_)throw new Error("Max listener count reached for event: "+e);this.emit("newListener",e,t),this.eventListeners_[o.eventName].push(o)}else if(o.eventNameRegex){if(this.regexListeners_.length>=this.maxRegexListeners_)throw new Error("Max regex listener count reached");this.emit("newListener",e,t),this.regexListeners_.push(o)}o.onExpire=this.removeListener_.bind(this),this.listeners_.push(o)}},{key:"removeListener_",value:function(e){s(this.listeners_,e),e.eventName&&(0,c.default)(this.eventListeners_[e.eventName])?(s(this.eventListeners_[e.eventName],e),0==this.eventListeners_[e.eventName].length&&delete this.eventListeners_[e.eventName]):e.eventNameRegex&&s(this.regexListeners_,e),this.emit("removeListener",e.eventName||e.eventNameRegex,e.handler)}},{key:"removeAllListeners",value:function(e){var t=this;if((0,c.default)(e))e.forEach(function(e){return t.removeAllListeners(e)});else if((0,y.default)(e)&&(0,c.default)(this.eventListeners_[e])){var n=this.eventListeners_[e].slice();n.forEach(function(e){t.removeListener_(e)})}else{if(!(0,p.default)(e))throw new Error("Event name should be string or regex.");!function(){var n=e,r=t.regexListeners_.filter(function(e){return o(e.eventNameRegex,n)});r.forEach(function(e){return t.removeListener_(e)})}()}}},{key:"removeListener",value:function(e,t){var n=this;if((0,c.default)(e)||(0,c.default)(t))!function(){var r=(0,c.default)(e)?e:[e],i=(0,c.default)(t)?t:[t];r.forEach(function(e){i.forEach(function(t){n.removeListener(e,t)})})}();else if((0,y.default)(e)&&(0,c.default)(this.eventListeners_[e])){var r=this.eventListeners_[e].filter(function(e){return e.handler==t});r.forEach(function(e){return n.removeListener_(e)})}else{if(!(0,p.default)(e))throw new Error("Event name should be string or regex.");!function(){var r=e,i=n.regexListeners_.filter(function(e){return o(e.eventNameRegex,r)&&e.handler==t});i.forEach(function(e){return n.removeListener_(e)})}()}}},{key:"eventNames",value:function(){return Object.keys(this.eventListeners_)}},{key:"regexes",value:function(){return this.regexListeners_.map(function(e){return e.eventNameRegex})}},{key:"getMaxListeners",value:function(){return this.maxListeners_}},{key:"setMaxListeners",value:function(e){if(!(0,d.default)(e)||parseInt(e,10)!=e)throw new Error("n must be integer");this.maxListeners_=e}},{key:"getMaxRegexListeners",value:function(){return this.maxRegexListeners_}},{key:"setMaxRegexListeners",value:function(e){if(!(0,d.default)(e)||parseInt(e,10)!=e)throw new Error("n must be integer");this.maxRegexListeners_=e}},{key:"listenerCount",value:function(e){if((0,y.default)(e))return this.eventListeners_[e]?this.eventListeners_[e].length:0;if((0,p.default)(e))return this.regexListeners_.filter(function(t){return o(e,t.eventNameRegex)}).length;throw new Error("Event name should be string or regex.")}},{key:"listeners",value:function(e){if((0,y.default)(e))return this.eventListeners_[e]?this.eventListeners_[e].map(function(e){return e.handler}):[];if((0,p.default)(e))return this.regexListeners_.filter(function(t){return o(e,t.eventNameRegex)}).map(function(e){return e.handler});throw new Error("Event name should be string or regex.")}},{key:"on",value:function(e,t){this.addListener(e,t)}},{key:"once",value:function(e,t){this.addListener(e,t,1)}},{key:"many",value:function(e,t,n){this.addListener(e,n,t)}},{key:"emit",value:function(e){for(var t=this,n=arguments.length,r=Array(n>1?n-1:0),i=1;i<n;i++)r[i-1]=arguments[i];if((0,c.default)(e)){var o=function(){var n=[];return e.forEach(function(e){var i=t.emit.apply(t,[e].concat(r));n=n.concat(i)}),{v:n}}();if("object"===("undefined"==typeof o?"undefined":u(o)))return o.v}else if(!(0,y.default)(e))throw new Error("Event name should be string");var s=[];if(this.eventListeners_[e]){var a=this.eventListeners_[e].map(function(e){return e.execute(null,r)});s=s.concat(a)}var f=this.regexListeners_.filter(function(t){return t.testRegexWith(e)}).map(function(e){return e.execute(null,r)});return s=s.concat(f)}},{key:"emitAsync",value:function(){return Promise.all(this.emit.apply(this,arguments))}}]),e}();b.defaultMaxListeners=10,b.defaultMaxRegexListeners=10,b.Listener=L.default,e.exports=b},function(e,t,n){function r(e){return null==e?void 0===e?a:u:(e=Object(e),f&&f in e?o(e):s(e))}var i=n(3),o=n(13),s=n(15),u="[object Null]",a="[object Undefined]",f=i?i.toStringTag:void 0;e.exports=r},function(e,t){function n(e){return null!=e&&"object"==typeof e}e.exports=n},function(e,t,n){var r=n(16),i=r.Symbol;e.exports=i},function(e,t){(function(t){var n="object"==typeof t&&t&&t.Object===Object&&t;e.exports=n}).call(t,function(){return this}())},function(e,t){var n=Array.isArray;e.exports=n},function(e,t,n){function r(e){if(!o(e))return!1;var t=i(e);return t==u||t==a||t==s||t==f}var i=n(1),o=n(17),s="[object AsyncFunction]",u="[object Function]",a="[object GeneratorFunction]",f="[object Proxy]";e.exports=r},function(e,t,n){function r(e){return"number"==typeof e||o(e)&&i(e)==s}var i=n(1),o=n(2),s="[object Number]";e.exports=r},function(e,t,n){var r=n(11),i=n(12),o=n(14),s=o&&o.isRegExp,u=s?i(s):r;e.exports=u},function(e,t,n){function r(e){return"string"==typeof e||!o(e)&&s(e)&&i(e)==u}var i=n(1),o=n(5),s=n(2),u="[object String]";e.exports=r},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(9),u=r(s),a=n(8),f=r(a),c=n(6),l=r(c),v=n(7),h=r(v),d=function(){function e(t,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;if(i(this,e),(0,u.default)(t))this.eventName=t;else{if(!(0,f.default)(t))throw new Error("Event name to be listened should be string or regex");this.eventNameRegex=t}if(!(0,l.default)(n))throw new Error("Handler should be a function");if(!(0,h.default)(r)||parseInt(r,10)!=r)throw new Error("Execute limit should be integer");this.handler=n,this.execCount=0,this.execLimit=r}return o(e,[{key:"execute",value:function(e,t){var n=this.handler.apply(e,t);return this.execCount++,this.execLimit&&this.execCount>=this.execLimit&&this.onExpire(this),n}},{key:"testRegexWith",value:function(e){if(!(0,u.default)(e))throw new Error("Event name should be string");var t=this.eventNameRegex;if(!t)throw new Error("This listener is not regex");return t.test(e)}},{key:"onExpire",value:function(){}}]),e}();t.default=d},function(e,t,n){function r(e){return o(e)&&i(e)==s}var i=n(1),o=n(2),s="[object RegExp]";e.exports=r},function(e,t){function n(e){return function(t){return e(t)}}e.exports=n},function(e,t,n){function r(e){var t=s.call(e,a),n=e[a];try{e[a]=void 0;var r=!0}catch(e){}var i=u.call(e);return r&&(t?e[a]=n:delete e[a]),i}var i=n(3),o=Object.prototype,s=o.hasOwnProperty,u=o.toString,a=i?i.toStringTag:void 0;e.exports=r},function(e,t,n){(function(e){var r=n(4),i="object"==typeof t&&t&&!t.nodeType&&t,o=i&&"object"==typeof e&&e&&!e.nodeType&&e,s=o&&o.exports===i,u=s&&r.process,a=function(){try{return u&&u.binding("util")}catch(e){}}();e.exports=a}).call(t,n(18)(e))},function(e,t){function n(e){return i.call(e)}var r=Object.prototype,i=r.toString;e.exports=n},function(e,t,n){var r=n(4),i="object"==typeof self&&self&&self.Object===Object&&self,o=r||i||Function("return this")();e.exports=o},function(e,t){function n(e){var t=typeof e;return null!=e&&("object"==t||"function"==t)}e.exports=n},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children=[],e.webpackPolyfill=1),e}}]);
//# sourceMappingURL=globals.js.map