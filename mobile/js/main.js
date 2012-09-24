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
 * Globals
 */

var gCurrentUser = null;
var gUiMap = {
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
        user = new StackMob.User({
            username : generateRandomString(),
            password : generateRandomString(),
            name : "",
            age : "",
            gender : "",
            height : "",
            height_ft : "",
            height_in : "",
            weight : "",
            smoker : "",
            ami : "",
            stroke : "",
            diabetes : "",
            systolic : "",
            diastolic : "",
            cholesterol : "",
            hdl : "",
            ldl : "",
            hba1c : "",
            cholesterolmeds : "",
            bloodpressuremeds : "",
            bloodpressuremedcount : "",
            aspirin : "",
            moderateexercise : "",
            vigorousexercise : "",
            familymihistory : ""
        });
    }
    user.create(callbacks);
    return user;
}

function calculateRisk(user) {
    var attr = user.attributes;
    var requestData = {
        age : attr.age,
        gender : attr.gender,
        height : attr.height,
        weight : attr.weight,
        smoker : attr.smoker,
        mi : attr.ami,
        stroke : attr.stroke,
        diabetes : attr.diabetes,
        systolic : attr.systolic,
        diastolic : attr.diastolic,
        cholesterol : attr.cholesterol,
        hdl : attr.hdl,
        ldl : attr.ldl,
        hba1c : attr.hba1c,
        cholesterolmeds : attr.cholesterolmeds,
        bloodpressuremeds : attr.bloodpressuremeds,
        bloodpressuremedcount : attr.bloodpressuremedcount,
        aspirin : attr.aspirin,
        moderateexercise : attr.moderateexercise,
        vigorousexercise : attr.vigorousexercise,
        familymihistory : attr.familymihistory
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
    for (var pageId in gUiMap) {
        new SurveyView({
            el : $("#" + pageId),
            inputMap : gUiMap[pageId],
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
    var inputMap = gUiMap[page.id];
    for (var input in inputMap) {
        if (gCurrentUser.get(inputMap[input]) !== $(page).find("#" + input).prop("loadedValue")) {
            console.info("saving user");
            gCurrentUser.save();
            break;
        }
    }
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

    loadSurveyPage(event.target, gCurrentUser, gUiMap);
});
$(document).on("pageremove", function(event) {
    console.debug("pageremove - " + event.target.id);
});
