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
var NEXT_STEP_TEMPLATES = {
  actions : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#page27" data-transition="slide">Take action to lower your risk<div class="nextsteps">You could lower your risk by <span class="risk-reduction"><%= reduction %></span>%</div></a></li>'),
  enterBp : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#blood_pressure" data-transition="slide">Enter your blood pressure<div class="nextsteps_assessment">INCOMPLETE</div></a></li>'),
  enterChol : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#cholesterol" data-transition="slide">Enter your cholesterol<div class="nextsteps_assessment">INCOMPLETE</div></a></li>'),
  findLocation : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#locationsMap" data-transition="slide">Find a health screening clinic<span class="warning-icon"></span><div class="nextsteps_assessment">Your blood pressure and cholesterol values are needed to calculate your true risk</div></a></li>'),
  getRewards : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#rewards" data-transition="slide">Get Rewards<div class="nextsteps">Enter to win an Apple iPad</div></a></li>'),
  moreQuestions : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#page38" data-transition="slide">Assess further<div class="nextsteps">Answer a few more questions for a more accurate assessment</div></a></li>'),
  share : _.template('<li class="next-step" data-theme="<%= dataTheme %>"><a href="#share" data-transition="slide">Share<div class="nextsteps">Your friends and family need to know their risk</div></a></li>')
};

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
// user attrs mapped to archimedes attrs
var USER_ATTRS = {
  "age" : "age",
  "gender" : "gender",
  "height" : "height",
  "weight" : "weight",
  "smoker" : "smoker",
  "ami" : "mi",
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
    user = new User();
  }

  user.create(callbacks);
  return user;
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

  new HomeView({
    el : $("#home"),
    model : gCurrentUser
  });

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

  new WelcomeView({
    el : $("#welcome"),
    model : gCurrentUser
  });
}

/*
 * StackMob
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

var User = StackMob.User.extend({
  initialize : function(attrs) {
    StackMob.User.prototype.initialize.apply(this, arguments);

    if (_.isUndefined(attrs)) {
      attrs = {
        username : generateRandomString(),
        password : generateRandomString(),
      };

      var attr;
      for (attr in ARCHIMEDES_ATTRS) {
        attrs[ARCHIMEDES_ATTRS[attr]] = "";
      }
      for (attr in USER_DEFAULTS) {
        attrs[attr] = USER_DEFAULTS[attr];
      }

      attrs.archimedes_result = "";
      attrs.state = User.RISK_STATE.CHANGED;

      this.set(attrs);
    }

    _.extend(this, Backbone.Events);
    this.on("change", this.handleChange, this);
  },
  calculateRisk : function() {
    this.set("risk_state", User.RISK_STATE.CALCULATING);

    // build request
    var request = {};
    for (attr in ARCHIMEDES_ATTRS) {
      var val = this.get(ARCHIMEDES_ATTRS[attr]);
      if (val !== undefined && val !== "") {
        request[attr] = val;
      } else if (ARCHIMEDES_REQUIRED[attr]) {
        request[attr] = ARCHIMEDES_DEFAULTS[attr];
      }
    }

    console.debug("Requesting risk calculations from Archimedes...");
    $.post(ARCHIMEDES_URL, request, _.bind(this.calculateRiskSuccess, this), "text").fail(_.bind(this.calculateRiskError, this));
  },
  calculateRiskError : function(data) {
    console.error("Error calling Archimedes API: " + data.statusText + " (code " + data.status + ")");
    this.set("risk_state", User.RISK_STATE.ERROR);
  },
  calculateRiskSuccess : function(data) {
    console.dir(data);
    this.set("archimedes_result", data);
    this.archimedes_result = $.parseJSON(data);
    this.save();
    this.set("risk_state", User.RISK_STATE.UP_TO_DATE);
  },
  handleChange : function(fn, data) {
    for (var attr in data.changes) {
      if (USER_ATTRS[attr]) {
        console.debug("User's " + attr + " changed to " + this.get(attr));
        this.set("risk_state", User.RISK_STATE.CHANGED);
      } else if (attr === "risk_state") {
        console.debug("User triggering " + User.RISK_STATE_CHANGE_EVENT + ": " + this.get("risk_state"));
        this.trigger(User.RISK_STATE_CHANGE_EVENT, this.get("risk_state"), this);
      } else if (attr === "archimedes_result") {
        this.archimedes_result = $.parseJSON(this.get("archimedes_result"));
      }
    }
  },
  hasCompletedBp : function() {
    return this.get("systolic") && this.get("diastolic");
  },
  hasCompletedChol : function() {
    return this.get("hdl") && this.get("ldl") && this.get("cholesterol");
  },
  hasCompletedExtra : function() {
    // TODO
    return false;
  },
  hasCompletedRequired : function() {
    return this.get("progress") === "assessment";
  }
}, {
  RISK_STATE_CHANGE_EVENT : "risk-state:change",
  RISK_STATE : {
    CALCULATING : "calculating",
    CHANGED : "changed", // needs to be updated
    ERROR : "error",
    UP_TO_DATE : "up-to-date"
  }
});

/*
 * Model
 */
var LocationsModel = Backbone.Model.extend({
  initialize : function(attrs) {
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
  initialize : function(attrs) {
    this.$list = this.$("#locList");
    this.model.on(LocationsModel.PROVIDERS_CHANGE_EVENT, this.handleProvidersChange, this);
  },
  events : {
    "click .loc-search-btn" : "handleFind",
    "pageshow" : "refreshView"
  },
  handleFind : function() {
    this.model.geocode($(".loc-search-field", this.el).val());
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
  initialize : function(attrs) {
    var mapEl = document.getElementById("locMap");
    var options = {
      center : new google.maps.LatLng(37.7652065, -122.24163550000003),
      mapTypeId : google.maps.MapTypeId.ROADMAP,
      zoom : 13
    };
    this.map = new google.maps.Map(mapEl, options);
    google.maps.event.addListener(this.map, "click", _.bind(this.handleMapClick, this));

    this.model.on(LocationsModel.LOCATION_CHANGE_EVENT, this.handleLocationChange, this);
    this.model.on(LocationsModel.PROVIDERS_CHANGE_EVENT, this.handleProvidersChange, this);
  },
  events : {
    "click .loc-search-btn" : "handleFind",
    "pageshow" : "refreshView"
  },
  handleFind : function() {
    this.model.geocode($(".loc-search-field", this.el).val());
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

var HomeView = Backbone.View.extend({
  initialize : function(attrs) {
    this.listView = new NextStepListView({
      el : this.$(".next-steps-list"),
      model : this.model
    });
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    this.listView.updateList();
  }
});

var NextStepListView = Backbone.View.extend({
  initialize : function(attrs) {
    this.model.on(User.RISK_STATE_CHANGE_EVENT, this.handleRiskChange, this);
  },
  getRiskReduction : function() {
    return this.model.archimedes_result ? this.model.archimedes_result.Interventions.PercentReductionWithAllInterventions : "...";
  },
  handleRiskChange : function(state, user) {
    var $risk = this.$("li .risk-reduction");

    switch(state) {
    case User.RISK_STATE.UP_TO_DATE:
      $risk.html(this.getRiskReduction());
      break;
    }
  },
  refreshView : function() {
    this.$el.listview("refresh");
  },
  updateList : function() {
    var i = 0;

    var completedBp = this.model.hasCompletedBp();
    var completedChol = this.model.hasCompletedChol();
    var completedExtra = this.model.hasCompletedExtra();

    if (completedBp === this.completedBp && completedChol === this.completedChol && completedExtra === this.completedExtr) {
      // no change
      return;
    }

    this.completedBp = completedBp;
    this.completedChol = completedChol;
    this.completedExtra = completedExtra;

    // clear list
    this.$("li.next-step").remove();

    if (!completedBp || !completedChol) {
      this.$el.append(NEXT_STEP_TEMPLATES.findLocation({
        dataTheme : i++ % 2 ? "e" : "f"
      }));
    }
    if (!completedBp) {
      this.$el.append(NEXT_STEP_TEMPLATES.enterBp({
        dataTheme : i++ % 2 ? "e" : "f"
      }));
    }
    if (!completedChol) {
      this.$el.append(NEXT_STEP_TEMPLATES.enterChol({
        dataTheme : i++ % 2 ? "e" : "f"
      }));
    }
    if (i < 3 && completedBp && completedChol) {
      this.$el.append(NEXT_STEP_TEMPLATES.actions({
        dataTheme : i++ % 2 ? "e" : "f",
        reduction : this.getRiskReduction()
      }));
    }
    if (i < 3 && !completedExtra) {
      this.$el.append(NEXT_STEP_TEMPLATES.moreQuestions({
        dataTheme : i++ % 2 ? "e" : "f"
      }));
    }
    this.$el.append(NEXT_STEP_TEMPLATES.getRewards({
      dataTheme : i++ % 2 ? "e" : "f"
    }));
    if (i < 4) {
      this.$el.append(NEXT_STEP_TEMPLATES.share({
        dataTheme : i++ % 2 ? "e" : "f"
      }));
    }

    this.refreshView();
  }
});

var ProfileView = Backbone.View.extend({
  initialize : function(attrs) {
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
  initialize : function(attrs) {
    this.listView = new NextStepListView({
      el : this.$(".next-steps-list"),
      model : this.model
    });

    this.model.on(User.RISK_STATE_CHANGE_EVENT, this.handleRiskChange, this);
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  handleRiskChange : function(state, user) {
    var result = this.model.archimedes_result;
    var $error = this.$(".risk_error");
    var $loader = this.$("#circularG");
    var $img = this.$(".heart_meter");

    switch(state) {
    case User.RISK_STATE.CALCULATING:
      $error.hide();
      $img.hide();
      $loader.show();
      break;
    case User.RISK_STATE.ERROR:
      // error
      $loader.fadeOut("slow", function() {
        $error.fadeIn("slow");
      });
      break;
    case User.RISK_STATE.UP_TO_DATE:
      // update risk content
      var risk = result.Risk[result.Recommendation ? 1 : 0];
      $img.css(RISK_IMAGES[risk.rating]);
      this.$(".5_year_risk").html(risk.risk);
      $loader.fadeOut("slow", function() {
        $img.fadeIn("slow");
      });
      break;
    }
  },
  updateView : function(event, data) {
    switch(this.model.get("risk_state")) {
    case User.RISK_STATE.CHANGED:
    case User.RISK_STATE.ERROR:
      this.model.calculateRisk();
      break;
    }
    this.listView.updateList();
  }
});

var SurveyView = Backbone.View.extend({
  initialize : function(attrs) {
    var valid = true;

    for (var input in this.options.inputMap) {
      var userFieldName = this.options.inputMap[input];
      var val = this.model.get(userFieldName) || "";
      var $input = $("#" + input, this.el);

      console.debug("loading " + userFieldName + "=" + val);

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

    if (!this.model.hasCompletedRequired()) {
      this.model.set("progress", data.nextPage.attr("id"));
      changed = true;
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
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    this.updateDiabetesVis(this.getToggleButton());
  },
  events : _.extend({
    "change #diabetes_toggle" : "handleDiabetesToggle"
  }, SurveyView.prototype.events),
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
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    this.updateNextTarget($("input[name='knows_bp']:checked", this.el));
  },
  events : _.extend({
    "change #knows_bp_radio_t" : "handleKnowsBpRadio",
    "change #knows_bp_radio_f" : "handleKnowsBpRadio"
  }, SurveyView.prototype.events),
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
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    this.updateNextTarget($("input[name='knows_chol']:checked", this.el));
  },
  events : _.extend({
    "change #knows_chol_radio_t" : "handleKnowsCholRadio",
    "change #knows_chol_radio_f" : "handleKnowsCholRadio"
  }, SurveyView.prototype.events),
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

var WelcomeView = Backbone.View.extend({
  initialize : function(attrs) {
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    var progress = this.model.get("progress");
    if (progress) {
      this.$(".startbtn").attr("href", "#" + progress);
    }
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

  if (event.target.id === "loading") {
    if (gCurrentUser.hasCompletedRequired()) {
      $.mobile.changePage("#home", {
        transition : "none"
      });
    } else {
      $.mobile.changePage("#welcome", {
        transition : "none"
      });
    }
  }
});
$(document).on("pageremove", function(event) {
  console.debug("pageremove - " + event.target.id);
});

/*
* Initialization
*/

// init user
if (!localStorage["currentUsername"]) {
  console.info("user not found in localStorage - creating one");

  createUser();
} else {
  console.info("found user in localStorage: " + localStorage["currentUsername"]);

  gCurrentUser = new User({
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
