"use strict";

var mathUtils = require("../core/utils/math"),
    iteratorUtils = require("../core/utils/iterator"),
    errors = require("../core/errors"),
    eventUtils = require("./utils"),
    Emitter = require("./core/emitter"),
    registerEmitter = require("./core/emitter_registrator");


var DX_PREFIX = "dx",

    TRANSFORM = "transform",
    TRANSLATE = "translate",
    ZOOM = "zoom",
    PINCH = "pinch",
    ROTATE = "rotate",

    START_POSTFIX = "start",
    UPDATE_POSTFIX = "",
    END_POSTFIX = "end";


var eventAliases = [];
var addAlias = function(eventName, eventArgs) {
    eventAliases.push({
        name: eventName,
        args: eventArgs
    });
};

addAlias(TRANSFORM, {
    scale: true,
    deltaScale: true,
    rotation: true,
    deltaRotation: true,
    translation: true,
    deltaTranslation: true
});

addAlias(TRANSLATE, {
    translation: true,
    deltaTranslation: true
});

addAlias(ZOOM, {
    scale: true,
    deltaScale: true
});

addAlias(PINCH, {
    scale: true,
    deltaScale: true
});

addAlias(ROTATE, {
    rotation: true,
    deltaRotation: true
});


var getVector = function(first, second) {
    return {
        x: second.pageX - first.pageX,
        y: -second.pageY + first.pageY,
        centerX: (second.pageX + first.pageX) * 0.5,
        centerY: (second.pageY + first.pageY) * 0.5
    };
};

var getEventVector = function(e) {
    var pointers = e.pointers;

    return getVector(pointers[0], pointers[1]);
};

var getDistance = function(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};

var getScale = function(firstVector, secondVector) {
    return getDistance(firstVector) / getDistance(secondVector);
};

var getRotation = function(firstVector, secondVector) {
    var scalarProduct = firstVector.x * secondVector.x + firstVector.y * secondVector.y;
    var distanceProduct = getDistance(firstVector) * getDistance(secondVector);

    if(distanceProduct === 0) {
        return 0;
    }

    var sign = mathUtils.sign(firstVector.x * secondVector.y - secondVector.x * firstVector.y);
    var angle = Math.acos(mathUtils.fitIntoRange(scalarProduct / distanceProduct, -1, 1));

    return sign * angle;
};

var getTranslation = function(firstVector, secondVector) {
    return {
        x: firstVector.centerX - secondVector.centerX,
        y: firstVector.centerY - secondVector.centerY
    };
};

var TransformEmitter = Emitter.inherit({

    configure: function(data, eventName) {
        if(eventName.indexOf(ZOOM) > -1) {
            errors.log("W0005", eventName, "15.1", "Use '" + eventName.replace(ZOOM, PINCH) + "' event instead");
        }

        this.callBase(data);
    },

    validatePointers: function(e) {
        return eventUtils.hasTouches(e) > 1;
    },

    start: function(e) {
        this._accept(e);

        var startVector = getEventVector(e);
        this._startVector = startVector;
        this._prevVector = startVector;

        this._fireEventAliases(START_POSTFIX, e);
    },

    move: function(e) {
        var currentVector = getEventVector(e),
            eventArgs = this._getEventArgs(currentVector);

        this._fireEventAliases(UPDATE_POSTFIX, e, eventArgs);
        this._prevVector = currentVector;
    },

    end: function(e) {
        var eventArgs = this._getEventArgs(this._prevVector);
        this._fireEventAliases(END_POSTFIX, e, eventArgs);
    },

    _getEventArgs: function(vector) {
        return {
            scale: getScale(vector, this._startVector),
            deltaScale: getScale(vector, this._prevVector),
            rotation: getRotation(vector, this._startVector),
            deltaRotation: getRotation(vector, this._prevVector),
            translation: getTranslation(vector, this._startVector),
            deltaTranslation: getTranslation(vector, this._prevVector)
        };
    },

    _fireEventAliases: function(eventPostfix, originalEvent, eventArgs) {
        eventArgs = eventArgs || {};

        iteratorUtils.each(eventAliases, (function(_, eventAlias) {
            var args = {};
            iteratorUtils.each(eventAlias.args, function(name) {
                if(name in eventArgs) {
                    args[name] = eventArgs[name];
                }
            });

            this._fireEvent(DX_PREFIX + eventAlias.name + eventPostfix, originalEvent, args);
        }).bind(this));
    }

});


/**
 * @name ui events_dxtransformstart
 * @publicName dxtransformstart
 * @type eventType
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name ui events_dxtransform
  * @publicName dxtransform
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 rotation:number
  * @type_function_param1_field4 deltaRotation:number
  * @type_function_param1_field5 translation:object
  * @type_function_param1_field6 deltaTranslation:object
  * @type_function_param1_field7 cancel:boolean
  * @module events/transform
*/
/**
  * @name ui events_dxtransformend
  * @publicName dxtransformend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 rotation:number
  * @type_function_param1_field4 deltaRotation:number
  * @type_function_param1_field5 translation:object
  * @type_function_param1_field6 deltaTranslation:object
  * @type_function_param1_field7 cancel:boolean
  * @module events/transform
*/

/**
 * @name ui events_dxtranslatestart
 * @publicName dxtranslatestart
 * @type eventType
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name ui events_dxtranslate
  * @publicName dxtranslate
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 translation:object
  * @type_function_param1_field2 deltaTranslation:object
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name ui events_dxtranslateend
  * @publicName dxtranslateend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 translation:object
  * @type_function_param1_field2 deltaTranslation:object
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

/**
 * @name ui events_dxzoomstart
 * @publicName dxzoomstart
 * @type eventType
 * @deprecated ui events_dxpinchstart
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name ui events_dxzoom
  * @publicName dxzoom
  * @type eventType
  * @deprecated ui events_dxpinch
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name ui events_dxzoomend
  * @publicName dxzoomend
  * @type eventType
  * @deprecated ui events_dxpinchend
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

/**
* @name ui events_dxpinchstart
* @publicName dxpinchstart
* @type eventType
* @type_function_param1 event:event
* @type_function_param1_field1 cancel:boolean
* @module events/transform
   */
/**
  * @name ui events_dxpinch
  * @publicName dxpinch
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name ui events_dxpinchend
  * @publicName dxpinchend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

/**
 * @name ui events_dxrotatestart
 * @publicName dxrotatestart
 * @type eventType
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name ui events_dxrotate
  * @publicName dxrotate
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 rotation:number
  * @type_function_param1_field2 deltaRotation:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name ui events_dxrotateend
  * @publicName dxrotateend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 rotation:number
  * @type_function_param1_field2 deltaRotation:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

var eventNames = iteratorUtils.map(eventAliases, function(eventAlias) {
    var eventNames = [];
    iteratorUtils.each([START_POSTFIX, UPDATE_POSTFIX, END_POSTFIX], function(_, eventPostfix) {
        eventNames.push(DX_PREFIX + eventAlias.name + eventPostfix);
    });
    return eventNames;
});

registerEmitter({
    emitter: TransformEmitter,
    events: eventNames
});

iteratorUtils.each(eventNames, function(_, eventName) {
    exports[eventName.substring(DX_PREFIX.length)] = eventName;
});
