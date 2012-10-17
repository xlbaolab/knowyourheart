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

var ARCHIMEDES_URL = "https://demo-indigo4health.archimedesmodel.com/IndiGO4Health/IndiGO4Health";
// callback indicates JSONP, which seems necessary
var SURESCRIPTS_URL = "https://millionhearts.surescripts.net/test/Provider/Find?callback=?";
var SURESCRIPTS_API_KEY = "3a0a572b-4f5d-47a2-9a75-819888576454";
// vars: dataTheme, pageId, name, distance
var LOC_LI_TEMPLATE = _.template('<li class="provider" data-theme="<%= dataTheme %>"><a href="#<%= pageId %>" data-transition="slide"><%= name %><div class="locationData"><span><%= distance %> miles</span><span class="coupon">$10 coupon</span></div></a></li>');

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
        "select_height_feet" : "height_ft",
        "select_height_inches" : "height_in"
    },
    "page12" : {
        "weight_slider" : "weight"
    },
    "page13" : {
        "smoker_toggle" : "smoker"
    },
    "history" : {
        "mi_toggle" : "ami",
        "stroke_toggle" : "stroke",
        "diabetes_toggle" : "diabetes",
        "hba1c_field" : "hba1c"
    },
    "knows_bp" : {
        "knows_bp_radio_t" : "knows_bp",
        "knows_bp_radio_f" : "knows_bp"
    },
    "blood_pressure" : {
        "systolic_bp_slider" : "systolic",
        "diastolic_bp_slider" : "diastolic"
    },
    "knows_chol" : {
        "knows_chol_radio_t" : "knows_chol",
        "knows_chol_radio_f" : "knows_chol"
    },
    "cholesterol" : {
        "total_chol_slider" : "cholesterol",
        "hdl_slider" : "hdl",
        "ldl_slider" : "ldl"
    },
    "page38" : {
        "toggleswitch13" : "bloodpressuremeds"
    },
    "page36" : {
        "bp_meds_slider" : "bloodpressuremedcount"
    },
    "page39" : {
        "toggleswitch14" : "cholesterolmeds"
    },
    "page40" : {
        "toggleswitch17" : "aspirin"
    },
    "page42" : {
        "slider18" : "vigorousexercise"
    },
    "page41" : {
        "slider17" : "moderateexercise"
    },
    "page43" : {
        "toggleswitch19" : "familymihistory"
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
};
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
};
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
};
var USER_DEFAULTS = {
    smoker : "false",
    ami : "false",
    stroke : "false",
    diabetes : "false",
    cholesterolmeds : "false",
    bloodpressuremeds : "false",
    aspirin : "false",
    familymihistory : "false",
    knows_bp : "false",
    knows_chol : "false",
    last_survey_page : ""
};
var RISK_IMAGES = {
    1 : {
        background : "url(images/heartmeter_sprite.png) no-repeat 0 0"
    },
    2 : {
        background : "url(images/heartmeter_sprite.png) no-repeat -231px 0"
    },
    3 : {
        background : "url(images/heartmeter_sprite.png) no-repeat -462px 0"
    },
    4 : {
        background : "url(images/heartmeter_sprite.png) no-repeat -693px 0"
    },
    5 : {
        background : "url(images/heartmeter_sprite.png) no-repeat -924px 0"
    }
}

/*
 * Globals
 */
var gCurrentUser = null;
var gIsFirstPageInit = true;

/*
 * Utility Functions
 */
function generateRandomString() {
    return Math.random().toString(36).substring(2);
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

/*
 * Functions
 */
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
        var attr;
        var attrs = {
            username : generateRandomString(),
            password : generateRandomString()
        };
        for (attr in ARCHIMEDES_ATTRS) {
            attrs[ARCHIMEDES_ATTRS[attr]] = "";
        }
        for (attr in USER_DEFAULTS) {
            attrs[attr] = USER_DEFAULTS[attr];
        }
        user = new StackMob.User(attrs);
    }

    user.create(callbacks);
    return user;
}

function calculateRisk(page, user) {
    var $error = $("#risk_error", page);
    var $loader = $("#circularG", page);
    var $risk = $("#heart_meter", page);

    $error.hide();
    $risk.hide();
    $loader.show();

    var requestData = {};
    for (attr in ARCHIMEDES_ATTRS) {
        var val = user.attributes[ARCHIMEDES_ATTRS[attr]];
        if (val != "") {
            requestData[attr] = val;
        } else if (ARCHIMEDES_REQUIRED[attr]) {
            requestData[attr] = ARCHIMEDES_DEFAULTS[attr];
        }
    }

    $.post(ARCHIMEDES_URL, requestData, function(data) {
        console.dir(data);

        var risk = data.Risk[0];
        if (!$.isNumeric(risk.rating)) {
            // only risk range is available
            risk = data.Risk[1];
        }

        // update risk content
        $risk.css(RISK_IMAGES[risk.rating]);
        $("#5_year_risk", page).html(risk.risk);
        $loader.fadeOut("slow", function() {
            $risk.fadeIn("slow");
        });
    }, "json").fail(function(data) {
        console.error("Error calling Archimedes API: " + data.statusText + " (code " + data.status + ")");
        $loader.fadeOut("slow", function() {
            $error.fadeIn("slow");
        });
    });
}

function doFirstPageInit() {
    // create a view for each survey page to handle user input
    for (var pageId in UI_MAP) {
        var viewArgs = {
            el : $("#" + pageId),
            inputMap : UI_MAP[pageId],
            model : gCurrentUser
        };
        if (pageId === "history") {
            new SurveyHistoryView(viewArgs);
        } else if (pageId === "knows_bp") {
            new SurveyKnowsBpView(viewArgs);
        } else if (pageId === "knows_chol") {
            new SurveyKnowsCholView(viewArgs);
        } else {
            new SurveyView(viewArgs);
        }
    }

    var locationsModel = new LocationsModel();

    new LocListView({
        el : $("#locationsList"),
        model : locationsModel
    });

    new LocMapView({
        el : $("#locationsMap"),
        model : locationsModel
    });

    new ProfileView({
        el : $("#basic_profile"),
        model : gCurrentUser
    });

    new ResultView({
        el : $("#assessment"),
        model : gCurrentUser
    });
}

var LocationsModel = Backbone.Model.extend({
    initialize : function() {
        this.geocoder = new google.maps.Geocoder();
        this.providers = null;
        this.location = null;

        _.extend(this, Backbone.Events);
    },
    geocode : function(address) {
        this.geocoder.geocode({
            "address" : address
        }, _.bind(this.handleGeocode, this));
    },
    geolocate : function() {
        // Try HTML5 geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(_.bind(this.handleGeolocate, this), function(error) {
                // interface PositionError {
                // const unsigned short PERMISSION_DENIED = 1;
                // const unsigned short POSITION_UNAVAILABLE = 2;
                // const unsigned short TIMEOUT = 3;
                // readonly attribute unsigned short code;
                // readonly attribute DOMString message;
                // };
                console.dir(error);
            });
        } else {
            // Browser doesn't support Geolocation
        }
    },
    handleGeocode : function(result, status) {
        console.debug("geocode returned with status " + status);
        console.dir(result);

        if (status != google.maps.GeocoderStatus.OK) {
            // TODO
            console.error("Geocoding failed: " + status);
            return;
        }

        this.location = result[0].geometry.location;
        this.trigger(LocationsModel.LOCATION_CHANGE_EVENT, this.location);

        $.getJSON(SURESCRIPTS_URL, {
            apikey : SURESCRIPTS_API_KEY,
            lat : this.location.lat(),
            lon : this.location.lng(),
            radius : 50, // TODO - options
            maxResults : 20
        }, _.bind(this.handleSurescripts, this)).fail(function(data) {
            console.error("Error calling Surescripts API: " + data.statusText + " (code " + data.status + ")");
        });
    },
    handleGeolocate : function(position) {
        this.location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        this.trigger(LocationsModel.LOCATION_CHANGE_EVENT, this.location);
    },
    handleSurescripts : function(result) {
        console.dir(result);

        this.providers = result.providers;
        this.trigger(LocationsModel.PROVIDERS_CHANGE_EVENT, this.providers);
    }
}, {
    LOCATION_CHANGE_EVENT : "location:change",
    PROVIDERS_CHANGE_EVENT : "providers:change"
});

/*
 * Views
 */
var LocListView = Backbone.View.extend({
    initialize : function() {
        this.$list = this.$("#locList");
        this.options.model.on(LocationsModel.PROVIDERS_CHANGE_EVENT, this.handleProvidersChange, this);
    },
    events : {
        "click .loc-search-btn" : "handleFind",
        "pageshow" : "refreshView"
    },
    handleFind : function() {
        this.options.model.geocode($(".loc-search-field", this.el).val());
    },
    handleProvidersChange : function(providers) {
        // clear list
        $("li.provider", this.$list).remove();

        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];

            this.$list.append(LOC_LI_TEMPLATE({
                dataTheme : i % 2 ? "e" : "f",
                pageId : "page35",
                name : provider.name,
                distance : provider.distance.toPrecision(1)
            }));
        }

        this.refreshView();
    },
    refreshView : function() {
        if ($.mobile.activePage.attr("id") === this.el.id) {
            this.$list.listview("refresh");
        }

        if (!this.model.location) {
            this.model.geolocate();
        }
    }
});

var LocMapView = Backbone.View.extend({
    initialize : function() {
        var mapEl = document.getElementById("locMap");
        var options = {
            center : new google.maps.LatLng(37.7652065, -122.24163550000003),
            mapTypeId : google.maps.MapTypeId.ROADMAP,
            zoom : 13
        };
        this.map = new google.maps.Map(mapEl, options);
        google.maps.event.addListener(this.map, "click", _.bind(this.handleMapClick, this));

        this.options.model.on(LocationsModel.LOCATION_CHANGE_EVENT, this.handleLocationChange, this);
        this.options.model.on(LocationsModel.PROVIDERS_CHANGE_EVENT, this.handleProvidersChange, this);
    },
    events : {
        "click .loc-search-btn" : "handleFind",
        "pageshow" : "refreshView"
    },
    handleFind : function() {
        this.options.model.geocode($(".loc-search-field", this.el).val());
    },
    handleLocationChange : function(location) {
        this.map.panTo(location);
    },
    handleMapClick : function() {
        if (this.infoWindow) {
            this.infoWindow.close();
        }
    },
    handleMarkerClick : function(marker, provider) {
        if (this.infoWindow) {
            this.infoWindow.close();
        }
        this.infoWindow = new google.maps.InfoWindow({
            map : this.map,
            position : marker.position,
            content : provider.description // TODO
        });
    },
    handleProvidersChange : function(providers) {
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];

            var marker = new google.maps.Marker({
                position : new google.maps.LatLng(provider.lat, provider.lon),
                map : this.map,
                title : provider.name
            });
            google.maps.event.addListener(marker, "click", _.bind(this.handleMarkerClick, this, marker, provider));
        }
    },
    refreshView : function() {
        var windowHeight = $(window).height();
        var headerHeight = $(".ui-header", this.el).height();
        var footerHeight = $(".ui-footer", this.el).height();
        var contentHeight = windowHeight - headerHeight - footerHeight;
        var searchHeight = $(".ui-bar", this.el).outerHeight();
        $(".ui-content", this.el).height(contentHeight);
        $(this.map.getDiv()).height(contentHeight - searchHeight);

        // needed to make sure map renders correctly on page change
        google.maps.event.trigger(this.map, "resize");

        if (this.model.location) {
            this.map.panTo(this.model.location);
        } else {
            this.model.geolocate();
        }
    }
});

var ProfileView = Backbone.View.extend({
    initialize : function() {
    },
    events : {
        "pagebeforeshow" : "updateView"
    },
    updateView : function(event, data) {
        var page = this.el;
        var text;

        var age = this.model.get("age");
        $("#profile_age", page).text(isBlank(age) ? "" : age);

        var gender = this.model.get("gender");
        text = isBlank(gender) ? "" : (gender === "M" ? "Male" : "Female");
        $("#profile_gender", page).text(text);

        var height_ft = this.model.get("height_ft");
        var height_in = this.model.get("height_in");
        text = (isBlank(height_ft) || isBlank(height_in)) ? "" : height_ft + "' " + height_in + "\"";
        $("#profile_height", page).text(text);

        var weight = this.model.get("weight");
        $("#profile_weight", page).text(isBlank(weight) ? "" : weight + " lbs");

        var smoker = this.model.get("smoker");
        text = isBlank(smoker) ? "" : (smoker === "true" ? "Yes" : "No");
        $("#profile_smoker", page).text(text);

        text = "";
        if (this.model.get("ami") === "true") {
            text += "Heart Attack";
        }
        if (this.model.get("stroke") === "true") {
            text += text.length === 0 ? "" : ", ";
            text += "Stroke";
        }
        if (this.model.get("diabetes") === "true") {
            text += text.length === 0 ? "" : ", ";
            text += "Diabetes";
        }
        $("#profile_history", page).text(text);

        var systolic = this.model.get("systolic");
        var diastolic = this.model.get("diastolic");
        text = (isBlank(systolic) || isBlank(diastolic)) ? "" : systolic + "/" + diastolic;
        $("#profile_bp", page).text(text);

        var chol = this.model.get("cholesterol");
        var hdl = this.model.get("hdl");
        var ldl = this.model.get("ldl");
        text = (isBlank(chol) || isBlank(hdl) || isBlank(ldl)) ? "" : chol + " | " + hdl + " | " + ldl;
        $("#profile_chol", page).text(text);
    }
});

var ResultView = Backbone.View.extend({
    initialize : function() {
    },
    events : {
        "pagebeforeshow" : "updateView"
    },
    updateView : function(event, data) {
        calculateRisk(this.el, this.model);
    }
});

var SurveyView = Backbone.View.extend({
    initialize : function() {
        var valid = true;

        for (var input in this.options.inputMap) {
            var userFieldName = this.options.inputMap[input];
            var val = this.model.get(userFieldName) || "";
            var $input = $("#" + input, this.el);

            console.debug("loadeding " + userFieldName + "=" + val);

            // remember what we loaded so we know if it changes
            $input.prop("loadedValue", val);

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
                // if ($input.prop("nodeName").toLowerCase() === "select")
                $input.val(val);
            }

            valid &= this.validate(input);
        }

        this.setNextButtonEnabled(valid);
    },
    events : {
        "change input[type=radio]" : "handleChange",
        "change input[type=number]" : "handleChange",
        "change select" : "handleChange",
        "keyup input[type=text]" : "handleChange",
        "pagebeforehide" : "handlePageBeforeHide",
        "pageshow" : "handlePageShow"
    },
    handleChange : function(event, data) {
        var $input = $(event.currentTarget);
        // console.log($input.prop("nodeName") + " " + event.currentTarget.id);
        if ($input.prop("type") === "radio" && !$input.prop("checked")) {
            return;
        }
        var userField = this.options.inputMap[$input.attr("id")];
        var o = {};
        o[userField] = $input.val();
        this.model.set(o);

        var incompleteForm = false;
        for (var inputId in this.options.inputMap) {
            if (!this.validate(inputId)) {
                incompleteForm = true;
                break;
            }
        }

        this.setNextButtonEnabled(!incompleteForm);
    },
    handlePageBeforeHide : function(event, data) {
        // save if input changed
        var changed = false;
        for (var input in this.options.inputMap) {
            var $input = $("#" + input, this.el);
            var inputVal = this.model.get(this.options.inputMap[input]);
            if (inputVal !== $input.prop("loadedValue")) {
                changed = true;
                $input.prop("loadedValue", inputVal);
            }
        }
        if (changed) {
            console.info("saving user");
            this.model.save({
                last_survey_page : data.nextPage.attr("id")
            });
        }
    },
    handlePageShow : function(event, data) {
        var $nextPage;
        if (!event) {
            $nextPage = $(this.el);
        } else {
            $nextPage = $(event.target);
        }
        $nextPage.find("input[type=radio]").checkboxradio("refresh");
        $nextPage.find("input[type=number], select[data-role=slider]").slider("refresh");
        $nextPage.find("select[data-role!=slider]").selectmenu("refresh");
    },
    setNextButtonEnabled : function(enabled) {
        var $nextBtn = $(".nextbtn", this.el);

        if (enabled) {
            $nextBtn.removeClass("ui-disabled");
        } else {
            if (!$nextBtn.hasClass("ui-disabled")) {
                $nextBtn.addClass("ui-disabled");
            }
        }
    },
    validate : function(inputId) {
        return !isBlank(this.model.get(this.options.inputMap[inputId]));
    }
});

var SurveyHistoryView = SurveyView.extend({
    initialize : function() {
        SurveyView.prototype.initialize.call(this);
        this.events = _.extend({}, this.moreEvents, this.events);
        this.delegateEvents();
        this.updateDiabetesVis(this.getToggleButton());
    },
    moreEvents : {
        "change #diabetes_toggle" : "handleDiabetesToggle"
    },
    getToggleButton : function() {
        return $("#diabetes_toggle", this.el);
    },
    handleDiabetesToggle : function(event, data) {
        this.updateDiabetesVis($(event.currentTarget));
    },
    updateDiabetesVis : function($toggle) {
        $nextBtn = $(this.el).find(".nextbtn");

        if ($toggle.val() === "true") {
            $(".hba1c", this.el).show();
        } else {
            $(".hba1c", this.el).hide();
        }
    },
    validate : function(inputId) {
        if (inputId !== "hba1c_field") {
            return SurveyView.prototype.validate.call(this, inputId);
        }

        var valid = true;
        if (this.getToggleButton().val() === "true") {
            valid = $.isNumeric($("#hba1c_field", this.el).val())
        }
        return valid;
    }
});

var SurveyKnowsBpView = SurveyView.extend({
    initialize : function() {
        SurveyView.prototype.initialize.call(this);
        this.events = _.extend({}, this.moreEvents, this.events);
        this.delegateEvents();
        this.updateNextTarget($("input[name='knows_bp']:checked", this.el));
    },
    moreEvents : {
        "change #knows_bp_radio_t" : "handleKnowsBpRadio",
        "change #knows_bp_radio_f" : "handleKnowsBpRadio"
    },
    handleKnowsBpRadio : function(event, data) {
        var $input = $(event.currentTarget);
        if (!$input.prop("checked")) {
            return;
        }
        this.updateNextTarget($input);
    },
    updateNextTarget : function($selectedRadio) {
        var page = $selectedRadio.val() === "true" ? "#blood_pressure" : "#knows_chol";
        $(".nextbtn", this.el).attr("href", page);
    }
});

var SurveyKnowsCholView = SurveyView.extend({
    initialize : function() {
        SurveyView.prototype.initialize.call(this);
        this.events = _.extend({}, this.moreEvents, this.events);
        this.delegateEvents();
        this.updateNextTarget($("input[name='knows_chol']:checked", this.el));
    },
    moreEvents : {
        "change #knows_chol_radio_t" : "handleKnowsCholRadio",
        "change #knows_chol_radio_f" : "handleKnowsCholRadio"
    },
    handleKnowsCholRadio : function(event, data) {
        var $input = $(event.currentTarget);
        if (!$input.prop("checked")) {
            return;
        }
        this.updateNextTarget($input);
    },
    updateNextTarget : function($selectedRadio) {
        var page = $selectedRadio.val() === "true" ? "#cholesterol" : "#assessment";
        $(".nextbtn", this.el).attr("href", page);
    }
});

/*
 * Events
 */
$(document).ready(function() {
    console.debug("ready");
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
    console.debug((_.isString(page) ? "\n\n" : "") + "pagebeforechange - " + (_.isString(page) ? page : page.attr("id")));
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
});
$(document).on("pageshow", function(event, data) {
    var prevPage = data.prevPage.length === 0 ? "none" : data.prevPage.attr("id");
    console.debug("pageshow - " + prevPage + " to " + event.target.id);
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

    if (gIsFirstPageInit) {
        gIsFirstPageInit = false;
        doFirstPageInit();
    }
});
$(document).on("pageremove", function(event) {
    console.debug("pageremove - " + event.target.id);
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
if (!localStorage["currentUsername"]) {
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
