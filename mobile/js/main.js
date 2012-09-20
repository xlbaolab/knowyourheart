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
                console.debug("created user " + model.get("username"));
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

/*
 * Views
 */
var SurveyAgeView = Backbone.View.extend({
    events : {
        "change input" : "handleAgeChange"
    },
    handleAgeChange : function(event) {
        gCurrentUser.save({
            age : $(event.currentTarget).val()
        });
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

if (localStorage["currentUsername"] == null) {
    console.debug("user not found in localStorage - creating one");

    createUser();
} else {
    console.debug("found user in localStorage: " + localStorage["currentUsername"]);

    gCurrentUser = new StackMob.User({
        username : localStorage["currentUsername"]
    });
    gCurrentUser.fetch({
        success : function(model) {
            console.debug("fetched user " + model.get("username"));
        },
        error : function(model, response) {
            console.debug("failed to fetch user: " + response.error);

            if (response.error.indexOf("does not exist")) {
                createUser(model);
            }
        }
    });
}

/*
 * onload
 */
window.onload = function() {
    new SurveyAgeView({
        el : $("#page2")
    });
}
