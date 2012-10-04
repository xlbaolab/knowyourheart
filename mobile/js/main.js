/**
 * Protect console logging calls, e.g. F12 dev tools must be open on IE for
 * console to be defined.
 */
if ( typeof console === "undefined" || !console.log) {
    window.console = {
        debug : function() {
        },
        trace : function() {
        },
        log : function() {
        },
        info : function() {
        },
        warn : function() {
        },
        error : function() {
        }
    };
}

console.debug("loading main.js")

/*
* Constants
*/

// survey pages and their inputs, mapped to user attrs
var UI_MAP = {
    "page2" : {
        "textinput2" : "age"
    },
    "page9" : {
        "radio3" : "gender",
        "radio4" : "gender"
    },
    "page10" : {
        "selectmenu3" : "height_ft",
        "selectmenu4" : "height_in"
    },
    "page12" : {
        "slider4" : "weight"
    },
    "page13" : {
        "toggleswitch5" : "smoker"
    },
    "page15" : {
        "toggleswitch1" : "ami",
        "toggleswitch2" : "stroke",
        "toggleswitch10" : "diabetes",
        "textinput6" : "hba1c"
    },
    "page16" : {
        "slider5" : "systolic",
        "slider6" : "diastolic"
    },
    "page17" : {
        "slider7" : "cholesterol",
        "slider8" : "hdl",
        "slider9" : "ldl"
    }
};

// archimedes attrs mapped to user attrs
var ARCHIMEDES_ATTRS = {
    "age" : "age",
    "gender" : "gender",
    "height" : "height",
    "weight" : "weight",
    "smoker" : "smoker",
    "mi" : "ami",
    "stroke" : "stroke",
    "diabetes" : "diabetes",
    "systolic" : "systolic",
    "diastolic" : "diastolic",
    "cholesterol" : "cholesterol",
    "hdl" : "hdl",
    "ldl" : "ldl",
    "hba1c" : "hba1c",
    "cholesterolmeds" : "cholesterolmeds",
    "bloodpressuremeds" : "bloodpressuremeds",
    "bloodpressuremedcount" : "bloodpressuremedcount",
    "aspirin" : "aspirin",
    "moderateexercise" : "moderateexercise",
    "vigorousexercise" : "vigorousexercise",
    "familymihistory" : "familymihistory"
}
var ARCHIMEDES_DEFAULTS = {
    age : 18, // 18 to 130 years
    gender : "M", // M/F
    height : 70, // 44 to 87 inches
    weight : 160, // 80 to 600 pounds
    smoker : false,
    mi : false,
    stroke : false,
    diabetes : false,
    systolic : 120, // 80 to 200 mm/Hg
    diastolic : 80, // 40 to 130 mm/Hg
    cholesterol : 200, // 70 to 500 mg/dL
    hdl : 60, // 20 to 130 mg/dL
    ldl : 100, // 40 to 400 mg/dL
    hba1c : 4.8, // %
    cholesterolmeds : false,
    bloodpressuremeds : false,
    bloodpressuremedcount : 0, // 0 to 4
    aspirin : false,
    moderateexercise : 4, // 0 to 60 hours
    vigorousexercise : 2, // 0 to 30 hours
    familymihistory : false
}
var ARCHIMEDES_REQUIRED = {
    age : true,
    gender : true,
    height : true,
    weight : true,
    smoker : true,
    mi : true,
    stroke : true,
    diabetes : true,
    systolic : false,
    diastolic : false,
    cholesterol : false,
    hdl : false,
    ldl : false,
    hba1c : false,
    cholesterolmeds : false,
    bloodpressuremeds : false,
    bloodpressuremedcount : false,
    aspirin : false,
    moderateexercise : false,
    vigorousexercise : false,
    familymihistory : false
}

/*
 * Globals
 */
var gCurrentUser = null;

/*
 * Functions
 */
function generateRandomString() {
    return Math.random().toString(36).substring(2);
}

function createUser(user, callbacks) {
    if (_.isUndefined(callbacks)) {
        callbacks = {
            success : function(model) {
                console.info("created user " + model.get("username"));
                gCurrentUser = model;
                localStorage["currentUsername"] = model.get("username");
            },
            error : function(model, response) {
                console.error("failed to create user: " + response.error);
                gCurrentUser = model;
                localStorage["currentUsername"] = model.get("username");
            }
        }
    }
    if (_.isUndefined(user)) {
        var attrs = {
            username : generateRandomString(),
            password : generateRandomString()
        };
        for (var attr in ARCHIMEDES_ATTRS) {
            attrs[ARCHIMEDES_ATTRS[attr]] = "";
        }
        user = new StackMob.User(attrs);
    }

    user.create(callbacks);
    return user;
}

function calculateRisk(user) {
    var requestData = {};
    for (attr in ARCHIMEDES_ATTRS) {
        var val = user.attributes[ARCHIMEDES_ATTRS[attr]];
        if (val != "") {
            requestData[attr] = val;
        } else if (ARCHIMEDES_REQUIRED[attr]) {
            requestData[attr] = ARCHIMEDES_DEFAULTS[attr];
        }
    }
    $.post("https://demo-indigo4health.archimedesmodel.com/IndiGO4Health/IndiGO4Health", requestData, function(data) {
        console.dir(data);
    });
}

function loadSurveyPage(page, user, uiMap) {
    var inputMap = uiMap[page.id];
    for (var input in inputMap) {
        var userField = inputMap[input];
        var val = user.get(userField) || "";
        var $input = $("#" + input);
        console.debug("loaded " + userField + "=" + val);

        // remember what we loaded so we know if it changes
        $input.prop("loadedValue", val);

        if (val === "") {
            continue;
        }

        if ($input.prop("nodeName").toLowerCase() === "input") {
            if ($input.prop("type") === "radio") {
                if ($input.val() === val) {
                    $input.prop("checked", true)
                }
            } else {
                // type = text, number
                $input.val(val);
            }
        } else {
            // $input.prop("nodeName").toLowerCase() === "select"
            $input.val(val);
        }
    }
}

/*
 * Views
 */
var SurveyView = Backbone.View.extend({
    events : {
        "change input[type=radio]" : "handleChange",
        "change input[type=number]" : "handleChange",
        "change input[type=text]" : "handleChange",
        "change select" : "handleChange"
    },
    handleChange : function(event, data) {
        var $input = $(event.currentTarget);
        if ($input.prop("type") === "radio" && !$input.prop("checked")) {
            return;
        }
        var userField = this.options.inputMap[$input.attr("id")];
        var o = {};
        o[userField] = $input.val();
        this.model.set(o);
    },
    initialize : function() {
        // handle init outside because it's easier
        // this.$("#textinput2").val(this.model.get("age"));
    }
});

/*
 * Initialization
 */
StackMob.init({
    appName : "knowyourheart",
    clientSubdomain : "peterttsenggmailcom",
    publicKey : "ad81cf6c-4523-411c-a326-f63717789c07",
    apiVersion : 0
});

// add localStorage support to StackMob's user model
StackMob.Model.prototype.localStorage = new Backbone.LocalStorage("user");
StackMob.Model.prototype.sync = function(method, model, options) {
    Backbone.localSync.apply(this, arguments);
    StackMob.sync.call(this, method, this, options);
};

// init user
if (localStorage["currentUsername"] == null) {
    console.info("user not found in localStorage - creating one");

    createUser();
} else {
    console.info("found user in localStorage: " + localStorage["currentUsername"]);

    gCurrentUser = new StackMob.User({
        username : localStorage["currentUsername"]
    });
    gCurrentUser.fetch({
        success : function(model) {
            console.info("fetched user " + model.get("username"));
        },
        error : function(model, response) {
            console.error("failed to fetch user: " + response.error);

            if (!response.error || response.error.indexOf("does not exist")) {
                createUser(model);
            }
        }
    });
}

/*
 * onload
 */
$(document).ready(function() {
    console.debug("ready");

    // create a view for each survey page to handle user input
    for (var pageId in UI_MAP) {
        new SurveyView({
            el : $("#" + pageId),
            inputMap : UI_MAP[pageId],
            model : gCurrentUser
        });
    }
});

$(document).on("pagebeforeload", function(event, data) {
    console.debug("pagebeforeload");
});
$(document).on("pageload", function(event, data) {
    console.debug("pageload");
});
$(document).on("pageloadfailed", function(event, data) {
    console.debug("pageloadfailed");
});

$(document).on("pagebeforechange", function(event, data) {
    var page = data.toPage;
    console.debug("pagebeforechange - " + (_.isString(page) ? page : page.attr("id")));
});
$(document).on("pagechange", function(event, data) {
    var page = data.toPage;
    console.debug("pagechange - " + (_.isString(page) ? page : page.attr("id")));
});
$(document).on("pagechangefailed", function(event, data) {
    var page = data.toPage;
    console.debug("pagechangefailed - " + (_.isString(page) ? page : page.attr("id")));
});

$(document).on("pagebeforeshow", function(event, data) {
    var prevPage = data.prevPage.length === 0 ? "none" : data.prevPage.attr("id");
    console.debug("pagebeforeshow - " + prevPage + " to " + event.target.id);
});
$(document).on("pagebeforehide", function(event, data) {
    console.debug("pagebeforehide - " + event.target.id + " to " + data.nextPage.attr("id"));

    var page = event.target;
    var inputMap = UI_MAP[page.id];
    // save if input changed
    var changed = false;
    for (var input in inputMap) {
        var $input = $(page).find("#" + input);
        var inputVal = gCurrentUser.get(inputMap[input]);
        if (inputVal !== $input.prop("loadedValue")) {
            changed = true;
            $input.prop("loadedValue", inputVal);
        }
    }
    if (changed) {
        console.info("saving user");
        gCurrentUser.save();
    }

    calculateRisk(gCurrentUser);
});
$(document).on("pageshow", function(event, data) {
    var prevPage = data.prevPage.length === 0 ? "none" : data.prevPage.attr("id");
    console.debug("pageshow - " + prevPage + " to " + event.target.id);

    $(event.target).find("input[type=radio]").checkboxradio("refresh");
    $(event.target).find("input[type=number], select[data-role=slider]").slider("refresh");
    $(event.target).find("select[data-role!=slider]").selectmenu("refresh");
});
$(document).on("pagehide", function(event, data) {
    console.debug("pagehide - " + event.target.id + " to " + data.nextPage.attr("id"));
});

$(document).on("pagebeforecreate", function(event) {
    console.debug("pagebeforecreate - " + event.target.id);
});
$(document).on("pagecreate", function(event) {
    console.debug("pagecreate - " + event.target.id);
});
$(document).on("pageinit", function(event) {
    console.debug("pageinit - " + event.target.id);

    loadSurveyPage(event.target, gCurrentUser, UI_MAP);
});
$(document).on("pageremove", function(event) {
    console.debug("pageremove - " + event.target.id);
});
