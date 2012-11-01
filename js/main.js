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

/*
 * Text
 */
var TXT_INCOMPLETE = "<span class='important'>INCOMPLETE</span>";

/*
 * Templates
 */
// vars: dataTheme, pageId, name, distance
var LOC_LI_TEMPLATE = _.template('\
  <li class="provider" data-theme="<%= dataTheme %>">\
    <a href="#screening-location?index=<%= index %>" data-transition="slide">\
      <div class="li-primary">\
        <%= name %>\
      </div>\
      <div class="li-secondary">\
        <%= address %> (<%= distance %> miles)\
      </div>\
    </a>\
  </li>\
');

var LOC_MARKER_TEMPLATE = _.template('\
  <div class="info-window">\
    <a href="#screening-location?index=<%= index %>" data-transition="pop">\
      <p>\
        <%= content %>\
        <span class="icon-right ui-icon-shadow ui-icon ui-icon-arrow-r"></span>\
      </p>\
    </a>\
  </div>\
');

var POPUP_LOCKED_HTML = '\
  <div data-role="popup" id="popupLocked" class="ui-content">\
    <a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"> Close </a>\
    <strong>THIS FEATURE IS LOCKED</strong>\
    <p>\
      Enter your HbA1c (if applicable), blood pressure, and cholesterol levels\
      to unlock.\
    </p>\
    <p>\
      More information is required to calculate which actions will be best for you.\
    </p>\
  </div>\
';

// vars: items, limit
var NEXT_STEPS_TEMPLATE = _.template('\
  <% var added=0; %>\
  <% for (var key in items) { %>\
  <% var item = items[key]; %>\
  <% if (item.hide) { continue; } %>\
  <li class="<%= item.clazz %> next-step" data-theme="<%= added++ % 2 ? "e" : "f" %>">\
    <a href="<%= item.href %>" <% if (item.popup) { print("data-rel=\'popup\'"); } else { print("data-transition=\'slide\'"); }%>>\
      <div class="li-primary">\
        <%= added + ". " + item.primary %>\
        <% if (item.warning) { print("<span class=\'icon-warning\'></span>"); } %>\
        <% if (item.lock) { print("<span class=\'icon-lock\'></span>"); } %>\
      </div>\
      <div class="li-secondary">\
        <%= item.secondary %>\
      </div>\
    </a>\
  </li>\
  <% if (added === limit) { break; } %>\
  <% } %>\
');

var gNextStepsItems = {
  locations : {
    clazz : "screening-locations-map",
    href : "#screening-locations-map",
    primary : "Find a health screening clinic",
    // Your [hba1c/bp/chol] levels are needed for a more accurate risk assessment
    secondary : "",
    hide : false,
    warning : true
  },
  enterMissing : {
    clazz : "missing",
    href : "", // history, bp, or chol
    primary : "", // Enter your [hba1c/bp/chol]
    secondary : TXT_INCOMPLETE,
    hide : false,
    warning : true
  },
  interventions : {
    clazz : "interventions",
    href : "#interventions",
    primary : "Take action to lower your risk",
    secondary : "By up to <span class='reduction'>&hellip;</span>%",
    popup : false,
    lock : false
  },
  extra : {
    clazz : "extra",
    href : "#bp-meds",
    primary : "Improve your risk estimate",
    secondary : "Answer a few more questions for a more accurate assessment",
    hide : false
  },
  rewards : {
    clazz : "rewards",
    href : "#rewards",
    primary : "Get Rewards",
    secondary : "Enter to win a $20 Target gift card",
  },
  share : {
    clazz : "share",
    href : "#share",
    primary : "Share",
    secondary : "Your friends and family need to know their risk",
  }
};

var gNextStepsItemsCompiled = null;
var gNextStepsItemsState = null;

function compileNextStepsItems(nextStepsItemsState) {
  if (nextStepsItemsState !== gNextStepsItemsState) {
    gNextStepsItemsState = nextStepsItemsState;
    gNextStepsItemsCompiled = NEXT_STEPS_TEMPLATE({
      items : gNextStepsItems,
      limit : 4
    });
  }
  return gNextStepsItemsCompiled;
}

var RISK_MESSAGE = _.template("Your risk is <%= comparisonRisk %> times what \
is healthy for your age.");
var RISK_MESSAGE_RANGE = _.template("Your risk could be up to <%= \
comparisonRisk %> times what is healthy for your age.");
var RISK_REC = {
  0 : _.template(""),
  1 : _.template("It is important for you to check your <%= missing %> \
  to understand your risk better, and keep track of it over time."),
  2 : _.template("You may be at high risk for your age. It is important for\
  you to check your <%= missing %> to determine your risk, and take action \
  if it is high."),
  3 : _.template("You are likely at very high risk for your age. It is urgent \
  for you to check your <%= missing %> to determine your risk, because \
  treatment could be critical.")
};
var RISK_REC_SHORT = {
  0 : _.template(""),
  1 : _.template("Getting your <%= missing %> checked will help you understand \
  your risk better."),
  2 : _.template("It is important to check your <%= missing %> \
  to understand your risk better."),
  3 : _.template("It is urgent to check your <%= missing %> because \
  treatment could be critical.")
};
var RISK_DOC_REC = {
  0 : _.template('Your heart risk is <%= risk %>. Good job!'),
  1 : _.template('Your heart risk is <%= risk %>. Discuss steps you can take \
  to reduce it with a doctor.'),
  2 : _.template('Your heart risk is <%= risk %>. It is important that you \
  see a doctor to discuss it.'),
  3 : _.template('Your heart risk is <%= risk %>. It is urgent that you see \
  a doctor soon to determine how you can reduce your risk.')
};
var RISK_DOC_REC_SHORT = {
  0 : "Good job! Keep doing what you are doing.",
  1 : "Discuss your heart risk and how to reduce it with a doctor.",
  2 : "It is important to see a doctor to discuss your heart risk.",
  3 : "It is urgent to see a doctor soon to determine how to reduce your risk."
};
var RISK_RATING = {
  1 : "low",
  2 : "moderately high",
  3 : "high",
  4 : "very high",
  5 : "extremely high"
};

// survey pages and their inputs, mapped to user attrs
var UI_MAP = {
  "age" : {
    "age-field" : "age"
  },
  "gender" : {
    "gender-male-radio" : "gender",
    "gender-female-radio" : "gender"
  },
  "height" : {
    "height-ft-select" : "height_ft",
    "height-in-select" : "height_in"
  },
  "weight" : {
    "weight-field" : "weight"
  },
  "smoker" : {
    "smoker-toggle" : "smoker"
  },
  "history" : {
    "mi-toggle" : "ami",
    "stroke-toggle" : "stroke",
    "diabetes-toggle" : "diabetes",
    "hba1c-field" : "hba1c"
  },
  "knows-bp" : {
    "knows-bp-radio-t" : "knows_bp",
    "knows-bp-radio-f" : "knows_bp"
  },
  "blood-pressure" : {
    "systolic-bp-slider" : "systolic",
    "diastolic-bp-slider" : "diastolic"
  },
  "knows-chol" : {
    "knows-chol-radio-t" : "knows_chol",
    "knows-chol-radio-f" : "knows_chol"
  },
  "cholesterol" : {
    "total-chol-slider" : "cholesterol",
    "hdl-slider" : "hdl",
    "ldl-slider" : "ldl"
  },
  "bp-meds" : {
    "bp-meds-toggle" : "bloodpressuremeds",
    "bp-meds-slider" : "bloodpressuremedcount"
  },
  "chol-meds" : {
    "chol-meds-toggle" : "cholesterolmeds"
  },
  "aspirin" : {
    "aspirin-toggle" : "aspirin"
  },
  "moderate-exercise" : {
    "mod-ex-slider" : "moderateexercise"
  },
  "vigorous-exercise" : {
    "vig-ex-slider" : "vigorousexercise"
  },
  "family-history" : {
    "family-toggle" : "familymihistory"
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
  age : 18, // 18 to 85 years
  gender : "M", // M/F
  height : 70, // 44 to 87 inches
  weight : 160, // 80 to 600 pounds
  smoker : false,
  mi : false,
  stroke : false,
  diabetes : false,
  systolic : 120, // 80 to 220 mm/Hg
  diastolic : 80, // 40 to 130 mm/Hg
  cholesterol : 200, // 70 to 500 mg/dL
  hdl : 60, // 20 to 130 mg/dL
  ldl : 100, // 40 to 400 mg/dL
  hba1c : 4.8, // 2 to 16 % (typically 1 digit after decimal)
  cholesterolmeds : false,
  bloodpressuremeds : false,
  bloodpressuremedcount : 0, // 1, 2, 3, 4+
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
    background : "url(images/heartmeter_sprite1.png) no-repeat 0 0"
  },
  2 : {
    background : "url(images/heartmeter_sprite1.png) no-repeat -231px 0"
  },
  3 : {
    background : "url(images/heartmeter_sprite1.png) no-repeat -462px 0"
  },
  4 : {
    background : "url(images/heartmeter_sprite1.png) no-repeat -693px 0"
  },
  5 : {
    background : "url(images/heartmeter_sprite1.png) no-repeat -924px 0"
  }
};
var RISK_IMAGES_COMPLETE = {
  1 : {
    background : "url(images/heartmeter_sprite2.png) no-repeat 0 0"
  },
  2 : {
    background : "url(images/heartmeter_sprite2.png) no-repeat -231px 0"
  },
  3 : {
    background : "url(images/heartmeter_sprite2.png) no-repeat -462px 0"
  },
  4 : {
    background : "url(images/heartmeter_sprite2.png) no-repeat -693px 0"
  },
  5 : {
    background : "url(images/heartmeter_sprite2.png) no-repeat -924px 0"
  }
};

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
        // this gets called twice (once for local and once for StackMob)
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
    if (pageId === "bp-meds") {
      new SurveyBpMedsView(viewArgs);
    } else if (pageId === "history") {
      new SurveyHistoryView(viewArgs);
    } else if (pageId === "knows-bp") {
      new SurveyKnowsBpView(viewArgs);
    } else if (pageId === "knows-chol") {
      new SurveyKnowsCholView(viewArgs);
    } else {
      new SurveyView(viewArgs);
    }
  }

  new HomeView({
    el : $("#home"),
    model : gCurrentUser
  });

  new InterventionsView({
    el : $("#interventions"),
    model : gCurrentUser
  });

  var locationsModel = new LocationsModel();

  new LocDetailsView({
    el : $("#screening-location"),
    model : locationsModel
  });

  new LocListView({
    el : $("#screening-locations-list"),
    model : locationsModel
  });

  new LocMapView({
    el : $("#screening-locations-map"),
    model : locationsModel
  });

  new ProfileView({
    el : $("#basic_profile"),
    model : gCurrentUser
  });

  new ExtraProfileView({
    el : $("#extra_profile"),
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

// addArgs(fn, arg1, arg2, ...)
// function addArgs(fn) {
// var wrapperArgs = arguments;
// return function() {
// var args, i;
// // can't use map function - no IE support
// args = Array.prototype.slice.call(arguments);
// for ( i = 1; i < wrapperArgs.length; i++) {
// args.push(wrapperArgs[i]);
// }
// fn.apply(null, args);
// };
// }

function wrapError(fn, storageLocation) {
  return function(onError, originalModel, options) {
    if (storageLocation === "local") {
      originalModel.isFetchingLocal = false;
    } else {
      originalModel.isFetchingRemote = false;
    }
    fn.apply(null, arguments);
  }
}

function wrapSuccess(fn, storageLocation) {
  return function(resp, status, xhr) {
    if (gCurrentUser) {
      if (storageLocation === "local") {
        gCurrentUser.isFetchingLocal = false;
      } else {
        gCurrentUser.isFetchingRemote = false;
      }
    }
    fn.apply(null, arguments);
  }
}

// hack - add localStorage support to StackMob's user model
// note that a significant side effect is that callbacks get called twice
StackMob.Model.prototype.localStorage = new Backbone.LocalStorage("user");
StackMob.Model.prototype.sync = function(method, model, options) {
  var successFn = options.success;
  var errorFn = options.error;

  arguments[2].success = wrapSuccess(successFn, "local");
  arguments[2].error = wrapError(errorFn, "local");
  Backbone.localSync.apply(this, arguments);

  arguments[2].success = wrapSuccess(successFn, "remote");
  arguments[2].error = wrapError(errorFn, "remote");
  StackMob.sync.apply(this, arguments);
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

    this.on("change", this.handleChange, this);
  },
  calculateRisk : function() {
    switch(this.get("risk_state")) {
    case User.RISK_STATE.CALCULATING:
      return;
    case User.RISK_STATE.UP_TO_DATE:
      if (this.archimedes_result) {
        return;
      }
      break;
    }

    if (this.isFetching()) {
      // TODO replace with better solution
      this.calculateLater = true;
      return;
    }
    this.calculateLater = false;

    this.set("risk_state", User.RISK_STATE.CALCULATING);

    // build request
    var request = {};
    for (attr in ARCHIMEDES_ATTRS) {
      var val = this.get(ARCHIMEDES_ATTRS[attr]);
      if (val) {
        if ((attr === "systolic" || attr === "diastolic") && this.needBp()) {
          continue;
        }
        if ((attr === "cholesterol" || attr === "hdl" || attr === "ldl") && this.needChol()) {
          continue;   
        }
        if ((attr === "hba1c") && (this.get("diabetes") === "false")) {
          continue;
        }
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
    this.archimedes_result = $.parseJSON(data);
    this.set("archimedes_result", data);
    this.set("risk_state", User.RISK_STATE.UP_TO_DATE);
    this.save();
  },
  fetch : function() {
    // TODO use events:
    // http://tbranyen.com/post/how-to-indicate-backbone-fetch-progress
    this.isFetchingLocal = true;
    this.isFetchingRemote = true;
    StackMob.User.prototype.fetch.apply(this, arguments);
  },
  handleChange : function(obj, data) {
    for (var attr in data.changes) {
      // console.debug(attr);
      if (USER_ATTRS[attr]) {
        if (!this.isFetching()) {
          console.debug("User's " + attr + " changed to " + this.get(attr));
          this.set("risk_state", User.RISK_STATE.CHANGED);
        }
      } else if (attr === "risk_state") {
        console.debug("User triggering " + User.RISK_STATE_CHANGE_EVENT + ": " + this.get("risk_state"));
        this.trigger(User.RISK_STATE_CHANGE_EVENT, this.get("risk_state"), this);
      } else if (attr === "archimedes_result") {
        this.archimedes_result = $.parseJSON(this.get("archimedes_result"));
      }
    }
  },
  needBp : function() {
    return (this.get("knows_bp") === "false") || !$.isNumeric(this.get("systolic")) || !$.isNumeric(this.get("diastolic"));
  },
  needChol : function() {
    return (this.get("knows_chol") === "false") || !$.isNumeric(this.get("hdl")) || !$.isNumeric(this.get("ldl")) || !$.isNumeric(this.get("cholesterol"));
  },
  needHba1c : function() {
    return (this.get("diabetes") === "true") && !$.isNumeric(this.get("hba1c"));
  },
  hasCompletedExtra : function() {
    // TODO
    return false;
  },
  hasCompletedRequired : function() {
    return this.get("progress") === "assessment";
  },
  isFetching : function() {
    return this.isFetchingLocal || this.isFetchingRemote;
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

    if (status !== google.maps.GeocoderStatus.OK) {
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
var LocDetailsView = Backbone.View.extend({
  initialize : function(attrs) {
    this.$el.append(POPUP_LOCKED_HTML);
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    if (this.model.providers === null) {
      return;
    }
    var index = this.$el.data("url").split("=")[1];
    var provider = this.model.providers[index];
    var phone = provider.phone.slice(0, 3) + "-" + provider.phone.slice(3, 6) + "-" + provider.phone.slice(6);

    this.$(".name").html(provider.name);
    this.$(".address a").html(provider.address1 + "<br>" + provider.city + ", " + provider.state + " " + provider.zip.substring(0, 5));
    this.$(".phone a").html(phone);
    this.$(".phone a").attr("href", "tel:" + provider.phone);
    this.$(".url a").html(provider.urlCaption);
    this.$(".url a").attr("href", provider.url);
    this.$(".description").html(provider.description);
  }
});

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
    this.model.geocode(this.$(".loc-search-field").val());
  },
  handleProvidersChange : function(providers) {
    // clear list
    $("li.provider", this.$list).remove();

    for (var i = 0; i < providers.length; i++) {
      var provider = providers[i];

      this.$list.append(LOC_LI_TEMPLATE({
        dataTheme : i % 2 ? "e" : "f",
        index : i,
        name : provider.name,
        address : provider.address1,
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
    this.model.geocode(this.$(".loc-search-field").val());
  },
  handleLocationChange : function(location) {
    this.map.panTo(location);
  },
  handleMapClick : function() {
    if (this.infoWindow) {
      this.infoWindow.close();
    }
  },
  handleMarkerClick : function(marker, provider, index) {
    if (this.infoWindow) {
      this.infoWindow.close();
    }
    var content = LOC_MARKER_TEMPLATE({
      index : index,
      content : provider.name
    });
    this.infoWindow = new google.maps.InfoWindow({
      map : this.map,
      position : marker.position,
      content : content
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
      google.maps.event.addListener(marker, "click", _.bind(this.handleMarkerClick, this, marker, provider, i));
    }
  },
  refreshView : function() {
    var windowHeight = $(window).height();
    var headerHeight = this.$(".ui-header").height();
    var footerHeight = this.$(".ui-footer").height();
    var contentHeight = windowHeight - headerHeight - footerHeight;
    var searchHeight = this.$(".ui-bar").outerHeight();
    this.$(".ui-content").height(contentHeight);
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
      el : this.$(".nextStepsList"),
      model : this.model,
      page : this
    });
    this.$el.append(POPUP_LOCKED_HTML);
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    this.model.calculateRisk();
    this.listView.updateList();
    // might need to init popup since we inserted it (jqm generates the id)
    if (this.$("#popupLocked-popup").length === 0) {
      this.$el.trigger("create");
    }
  }
});

var InterventionsView = Backbone.View.extend({
  initialize : function(attrs) {
    this.model.on(User.RISK_STATE_CHANGE_EVENT, this.handleRiskChange, this);
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  handleRiskChange : function(state, user) {
    if (state === User.RISK_STATE.UP_TO_DATE) {
      this.updateView();
    }
  },
  updateView : function() {
    var result = this.model.archimedes_result;
    if (!result) {
      return;
    }

    var interventions = result.Interventions;
    var risk = result.Risk[0];

    this.$(".risk").html(risk.risk);
    this.$(".risk_reduction").html(interventions.PercentReductionWithAllInterventions);

    if (interventions.IncreaseInRisk === "0" && interventions.PercentReductionInRiskWithMedication === "0") {
      this.$(".meds").hide();
    } else {
      if (interventions.IncreaseInRisk === "0") {
        this.$(".stop_meds").hide();
      } else {
        this.$(".stop_meds_increase").html(interventions.IncreaseInRisk);
        this.$(".stop_meds").show();
      }
      if (interventions.PercentReductionInRiskWithMedication === "0") {
        this.$(".take_meds").hide();
      } else {
        this.$(".take_meds_reduction").html(interventions.PercentReductionInRiskWithMedication);
        this.$(".take_meds").show();
      }
      this.$(".meds").show();
    }

    this.$(".moderate_exercise_reduction").html(interventions.PercentReductionInRiskWithAdditionalModerateExercise);
    this.$(".vigorous_exercise_reduction").html(interventions.PercentReductionInRiskWithAdditionalVigorousExercise);

    if (interventions.PercentReductionInRiskWithWeightLoss === "") {
      this.$(".weight").hide();
    } else {
      this.$(".lose_pounds").html(interventions.PoundsOfWeightLossRequired);
      this.$(".lose_weight_reduction").html(interventions.PercentReductionInRiskWithWeightLoss);
      this.$(".weight").show();
    }

    if (interventions.PercentReductionWithSmokingCessation === "0") {
      this.$(".smoking").hide();
    } else {
      this.$(".quit_smoking_reduction").html(interventions.PercentReductionWithSmokingCessation);
      this.$(".smoking").hide();
    }
  }
});

var NextStepListView = Backbone.View.extend({
  initialize : function(attrs) {
    this.model.on(User.RISK_STATE_CHANGE_EVENT, this.handleRiskChange, this);
  },
  getRiskReduction : function() {
    if (!this.model.archimedes_result || !this.model.archimedes_result.Interventions.PercentReductionWithAllInterventions) {
      return "&hellip;";
    } else {
      return this.model.archimedes_result.Interventions.PercentReductionWithAllInterventions; 
    }
  },
  handleRiskChange : function(state, user) {
    var $risk = this.$("li .reduction");

    switch(state) {
    case User.RISK_STATE.UP_TO_DATE:
      $risk.html(this.getRiskReduction());
      break;
    }
  },
  refreshView : function() {
    if (this.options.page.el.id === $.mobile.activePage.attr("id")) {
      this.$el.listview("refresh");
    }
  },
  updateList : function() {
    var i = 0;

    var needBp = this.model.needBp();
    var needChol = this.model.needChol();
    var needHba1c = this.model.needHba1c();
    var completedExtra = this.model.hasCompletedExtra();
    var state = "" + needBp + needChol + needHba1c + completedExtra;

    if (state === this.nextStepsState) {
      // no change
      return;
    }
    this.nextStepsState = state;

    if (needBp || needChol || needHba1c) {
      var missingText;
      if (needHba1c) {
        gNextStepsItems.enterMissing.href = "#history";
        if (needBp && needChol) {
          missingText = "HbA1c, blood pressure, and cholesterol";
        } else if (needBp) {
          missingText = "HbA1c and blood pressure";
        } else if (needChol) {
          missingText = "HbA1c and cholesterol";
        } else {
          missingText = "HbA1c";
        }
      } else if (needBp) {
        gNextStepsItems.enterMissing.href = "#knows-bp";
        if (needChol) {
          missingText = "blood pressure and cholesterol";
        } else {
          missingText = "blood pressure";
        }
      } else if (needChol) {
        gNextStepsItems.enterMissing.href = "#knows-chol";
        missingText = "cholesterol";
      }
      gNextStepsItems.locations.secondary = "<span class='important'>Your " + missingText + " levels are needed for a more accurate risk assessment</span>";
      gNextStepsItems.locations.hide = false;
      gNextStepsItems.enterMissing.primary = "Enter your missing values";
      gNextStepsItems.enterMissing.secondary = "INCOMPLETE - " + missingText;
      gNextStepsItems.enterMissing.hide = false;
      gNextStepsItems.extra.hide = true;
      gNextStepsItems.interventions.href = "#popupLocked";
      gNextStepsItems.interventions.popup = true;
      gNextStepsItems.interventions.lock = true;
    } else {
      gNextStepsItems.locations.hide = true;
      gNextStepsItems.enterMissing.hide = true;
      gNextStepsItems.extra.hide = completedExtra;
      gNextStepsItems.interventions.href = "#interventions";
      gNextStepsItems.interventions.popup = false;
      gNextStepsItems.interventions.lock = false;
    }

    this.$("li.next-step").remove();
    this.$el.append(compileNextStepsItems(state));
    this.$("li .reduction").html(this.getRiskReduction());  
    this.refreshView();
  },
  updateListContent : function() {
    // TODO: when we need to update the list item contents, e.g. risk
    // value, but not add/remove list items  
  }
});

var ProfileView = Backbone.View.extend({
  initialize : function(attrs) {
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    var text;
    var user = this.model;

    text = user.get("age");
    this.$(".age").html(isBlank(text) ? "&nbsp;" : text);

    text = user.get("gender");
    text = !text ? "&nbsp;" : (text === "M" ? "Male" : "Female");
    this.$(".gender").html(text);

    var height_ft = user.get("height_ft");
    var height_in = user.get("height_in");
    text = (!height_ft || !height_in) ? "&nbsp;" : height_ft + "' " + height_in + "\"";
    this.$(".height").html(text);

    text = user.get("weight");
    this.$(".weight").html(isBlank(text) ? "&nbsp;" : text + " lbs");

    text = user.get("smoker");
    text = !text ? "&nbsp;" : (text === "true" ? "Yes" : "No");
    this.$(".smoker").html(text);

    this.$(".history .icon-warning").hide();
    text = "";
    if (user.get("ami") === "true") {
      text += "Heart Attack";
    }
    if (user.get("stroke") === "true") {
      text += text.length === 0 ? "" : ", ";
      text += "Stroke";
    }
    if (user.get("diabetes") === "true") {
      text += text.length === 0 ? "" : ", ";
      text += "Diabetes";
      if (isBlank(user.get("hba1c"))) {
        text += "<br>" + TXT_INCOMPLETE + " - HbA1c";
        // show() uses display : block
        this.$(".history .icon-warning").css("display", "inline-block");
      }
    }
    this.$(".history .profileData").html(!text ? "&nbsp;" : text);

    var systolic = user.get("systolic");
    var diastolic = user.get("diastolic");
    if (user.needBp()) {
      text = TXT_INCOMPLETE;
      this.$(".bp .icon-warning").css("display", "inline-block");
    } else {
      text = systolic + "/" + diastolic;
      this.$(".bp .icon-warning").hide();  
    }
    this.$(".bp .profileData").html(text);

    var chol = user.get("cholesterol");
    var hdl = user.get("hdl");
    var ldl = user.get("ldl");
    if (user.needChol()) {
      text = TXT_INCOMPLETE;
      this.$(".chol .icon-warning").css("display", "inline-block");
    } else {
      text = chol + " | " + hdl + " | " + ldl;
      this.$(".chol .icon-warning").hide();  
    }
    this.$(".chol .profileData").html(text);
  }
});

var ExtraProfileView = Backbone.View.extend({
  initialize : function(attrs) {
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    var text;
    var user = this.model;
    
    text = user.get("bloodpressuremeds");
    if (!text) {
      text = "&nbsp;";
    } else {
      if (text === "true") {
        text = "Yes - " + user.get("bloodpressuremedcount") + " kinds";
      } else {
        text = "No";
      }
    }
    this.$(".bloodpressuremeds").html(text);

    text = user.get("cholesterolmeds");
    text = !text ? "&nbsp;" : (text === "true" ? "Yes" : "No");
    this.$(".cholesterolmeds").html(text);

    text = user.get("aspirin");
    text = !text ? "&nbsp;" : (text === "true" ? "Yes" : "No");
    this.$(".aspirin").html(text);

    text = user.get("moderateexercise");
    this.$(".moderateexercise").html(isBlank(text) ? "&nbsp;" : text + " hours");

    text = user.get("vigorousexercise");
    this.$(".vigorousexercise").html(isBlank(text) ? "&nbsp;" : text + " hours");

    text = user.get("familymihistory");
    text = !text ? "&nbsp;" : (text === "true" ? "Yes" : "No");
    this.$(".familymihistory").html(text);
  }
});

var ResultView = Backbone.View.extend({
  initialize : function(attrs) {
    this.listView = new NextStepListView({
      el : this.$(".nextStepsList"),
      model : this.model,
      page : this
    });
    this.$el.append(POPUP_LOCKED_HTML);

    this.model.on(User.RISK_STATE_CHANGE_EVENT, this.updateRiskView, this);

    // do it at least once; pageinit doesn't work if this is the initial page
    this.riskViewRendered = false;
  },
  events : {
    "pagebeforeshow" : "handlePageBeforeShow",
  },
  handlePageBeforeShow : function(event, data) {
    this.model.calculateRisk();
    if (!this.riskViewRendered) {
      this.riskViewRendered = true;
      this.updateRiskView();
    }
    this.listView.updateList();
    // might need to init popup since we inserted it (jqm generates the id)
    if (this.$("#popupLocked-popup").length === 0) {
      this.$el.trigger("create");
    }
  },
  updateRiskView : function() {
    var user = this.model;
    var result = user.archimedes_result;
    var $error = this.$(".risk_error");
    var $loader = this.$("#circularG");
    var $img = this.$(".heart_meter");

    switch(user.get("risk_state")) {
    case User.RISK_STATE.CALCULATING:
      $error.hide();
      $img.hide();
      $loader.show();
      break;
    case User.RISK_STATE.ERROR:
      $img.hide();
      if (this.$el.is(":visible")) {
        $loader.fadeOut("slow", function() {
          $error.fadeIn("slow");
        });
      } else {
        $loader.hide();
        $error.show();
      }
      break;
    case User.RISK_STATE.CHANGED:
    case User.RISK_STATE.UP_TO_DATE:
      $error.hide();
      if (this.$el.is(":visible")) {
        $error.hide();
        $loader.fadeOut("slow", function() {
          $img.fadeIn("slow");
        });
      } else {
        $loader.hide();
        $img.show();
      }

      if (!result) {
        break;
      }

      // update risk image and message
      var range = result.Recommendation !== "";
      var risk = result.Risk[ range ? 1 : 0];
      var risk2 = result.Risk[ range ? 2 : 0];

      var rating = parseInt(risk.rating);
      var ratingForAge = parseInt(risk.ratingForAge);
      var highestRating = rating > ratingForAge ? rating : ratingForAge;
      
      if (range) {
      	$img.css(RISK_IMAGES[highestRating]);
      } else {
      	$img.css(RISK_IMAGES_COMPLETE[highestRating]);
      }

      var missingStr = "";
      if (user.needBp()) {
        missingStr = "blood pressure";
      }
      if (user.needChol()) {
        if (missingStr) {
          missingStr += " and ";  
        }
        missingStr += "cholesterol";
      }
      var msgArgs = {
        comparisonRisk : risk.comparisonRisk,
        missing : missingStr
      };
      var riskMsg;
      if (range) {
        riskMsg = RISK_MESSAGE_RANGE(msgArgs) + "<br><br>Recommendation: " + 
          RISK_REC_SHORT[result.Recommendation](msgArgs);
      } else {
        riskMsg = RISK_MESSAGE(msgArgs) + "<br><br>Recommendation: " +
          RISK_DOC_REC_SHORT[result.DoctorRecommendation];
      }
      this.$(".risk_message").html(riskMsg);

      // popup
      var riskStr = range ? (risk2.risk + "% to " + risk.risk + "%") : (risk.risk + "%");
      var ratioStr = range ? (risk2.comparisonRisk + " to " + risk.comparisonRisk) : risk.comparisonRisk;
      var percentileStr = range ? (risk2.riskPercentile + " to " + risk.riskPercentile) : risk.riskPercentile;
      this.$(".risk").html(riskStr);
      this.$(".ratio").html(ratioStr);
      this.$(".percentile").html(percentileStr);

      var rec = range ? RISK_REC[result.Recommendation](msgArgs) : RISK_DOC_REC[result.DoctorRecommendation]({
        risk : RISK_RATING[highestRating]
      });
      this.$(".recommendation").html(rec);

      if (range) {
        this.$(".accuracy").show();
      } else {
        this.$(".accuracy").hide();
      }
      break;
    }
  }
});

var SurveyView = Backbone.View.extend({
  initialize : function(attrs) {
    var valid = true;

    for (var input in this.options.inputMap) {
      var userFieldName = this.options.inputMap[input];
      var val = this.model.get(userFieldName) || "";
      var $input = this.$("#" + input);

      console.debug("loading " + userFieldName + "=" + val);

      // remember what we loaded so we know if it changes
      $input.data("loadedValue", val);

      if ($input.prop("nodeName").toLowerCase() === "input") {
        if ($input.prop("type") === "radio") {
          if ($input.val() === val) {
            $input.prop("checked", true)
          }
        } else {
          // type = text, number
          $input.attr("value", val);
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
      var $input = this.$("#" + input);
      var inputVal = this.model.get(this.options.inputMap[input]);
      if (inputVal !== $input.data("loadedValue")) {
        changed = true;
        $input.data("loadedValue", inputVal);
      }
    }

    var nextPageId = data.nextPage.attr("id");
    if (!this.model.hasCompletedRequired() && nextPageId !== "welcome") {
      this.model.set("progress", nextPageId);
      changed = true;
    }

    if (changed) {
      console.info("saving user");
      this.model.save({
        last_survey_page : nextPageId
      });
    }
  },
  handlePageShow : function(event, data) {
    var $nextPage;
    if (!event) {
      $nextPage = this.$el;
    } else {
      $nextPage = $(event.target);
    }
    $nextPage.find("input[type=radio]").checkboxradio("refresh");
    $nextPage.find("input.ui-slider-input").slider("refresh");
    $nextPage.find("select[data-role=slider]").slider("refresh");
    $nextPage.find("select[data-role!=slider]").selectmenu("refresh");
  },
  setNextButtonEnabled : function(enabled) {
    var $nextBtn = this.$(".nextbtn");

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

var SurveyBpMedsView = SurveyView.extend({
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    this.updateMedCountVis(this.getToggleButton());
  },
  events : _.extend({
    "change #bp-meds-toggle" : "handleMedCountToggle"
  }, SurveyView.prototype.events),
  getToggleButton : function() {
    return this.$("#bp-meds-toggle");
  },
  handleMedCountToggle : function(event, data) {
    this.updateMedCountVis($(event.currentTarget));
  },
  updateMedCountVis : function($toggle) {
    var $div = this.$("#bp-med-count");
    if ($toggle.val() === "true") {
      if (this.$el.is(":visible")) {
        $div.slideDown();
      } else {
        $div.show();
      }
    } else {
      if (this.$el.is(":visible")) {
        $div.slideUp();
      } else {
        $div.hide();
      }
    }
  }
});

var SurveyHistoryView = SurveyView.extend({
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    this.updateDiabetesVis(this.getToggleButton());
  },
  events : _.extend({
    "change #diabetes-toggle" : "handleDiabetesToggle"
  }, SurveyView.prototype.events),
  getToggleButton : function() {
    return this.$("#diabetes-toggle");
  },
  handleDiabetesToggle : function(event, data) {
    this.updateDiabetesVis($(event.currentTarget));
  },
  updateDiabetesVis : function($toggle) {
    if ($toggle.val() === "true") {
      if (this.$el.is(":visible")) {
        this.$(".hba1c").slideDown();
      } else {
        this.$(".hba1c").show();
      }
    } else {
      if (this.$el.is(":visible")) {
        this.$(".hba1c").slideUp();
      } else {
        this.$(".hba1c").hide();
      }
    }
  },
  validate : function(inputId) {
    if (inputId !== "hba1c-field") {
      return SurveyView.prototype.validate.call(this, inputId);
    }

    var valid = true;
    if (this.getToggleButton().val() === "true") {
      var hba1c = this.$("#hba1c-field").val();
      valid = hba1c === "" || $.isNumeric(hba1c);
    }
    return valid;
  }
});

var SurveyKnowsBpView = SurveyView.extend({
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    var $checked = this.$("input[name='knows-bp']:checked");
    this.updateNextTarget($checked);
    this.updateLocationsVis($checked);
  },
  events : _.extend({
    "change #knows-bp-radio-t" : "handleKnowsBpRadio",
    "change #knows-bp-radio-f" : "handleKnowsBpRadio"
  }, SurveyView.prototype.events),
  handleKnowsBpRadio : function(event, data) {
    var $input = $(event.currentTarget);
    if (!$input.prop("checked")) {
      return;
    }
    this.updateNextTarget($input);
    this.updateLocationsVis($input);
  },
  updateLocationsVis : function($selectedRadio) {
    if ($selectedRadio.val() === "false") {
      if (this.$el.is(":visible")) {
        this.$(".locations-pointer").slideDown();
      } else {
        this.$(".locations-pointer").show();
      }
    } else {
      if (!this.$el.is(":visible")) {
        this.$(".locations-pointer").slideUp();
      } else {
        this.$(".locations-pointer").hide();
      }
    }
  },
  updateNextTarget : function($selectedRadio) {
    var page = $selectedRadio.val() === "true" ? "#blood-pressure" : "#knows-chol";
    this.$(".dynamic-next").attr("href", page);
  }
});

var SurveyKnowsCholView = SurveyView.extend({
  initialize : function(attrs) {
    SurveyView.prototype.initialize.apply(this, arguments);
    var $checked = this.$("input[name='knows-chol']:checked");
    this.updateNextTarget($checked);
    this.updateLocationsVis($checked);
  },
  events : _.extend({
    "change #knows-chol-radio-t" : "handleKnowsCholRadio",
    "change #knows-chol-radio-f" : "handleKnowsCholRadio"
  }, SurveyView.prototype.events),
  handleKnowsCholRadio : function(event, data) {
    var $input = $(event.currentTarget);
    if (!$input.prop("checked")) {
      return;
    }
    this.updateNextTarget($input);
    this.updateLocationsVis($input);
  },
  updateLocationsVis : function($selectedRadio) {
    if ($selectedRadio.val() === "false") {
      if (this.$el.is(":visible")) {
        this.$(".locations-pointer").slideDown();
      } else {
        this.$(".locations-pointer").show();
      }
    } else {
      if (!this.$el.is(":visible")) {
        this.$(".locations-pointer").hide();
      } else {
      	this.$(".locations-pointer").slideUp();
      }
    }
  },
  updateNextTarget : function($selectedRadio) {
    var page = $selectedRadio.val() === "true" ? "#cholesterol" : "#assessment";
    this.$(".dynamic-next").attr("href", page);
  }
});

var WelcomeView = Backbone.View.extend({
  initialize : function(attrs) {
  },
  events : {
    "pagebeforeshow" : "updateView"
  },
  updateView : function(event, data) {
    var progressPage = this.model.get("progress");
    if (progressPage && !this.model.hasCompletedRequired()) {
      this.$(".startbtn").attr("href", "#" + progressPage);
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
    success : function(model, resp) {
      // this gets called twice (once for local and once for StackMob)
      console.info("fetched user " + model.get("username") + (model.isFetching() ? " (still fetching)" : " (done fetching)"));

      if (!model.isFetching()) {
        if (model.get("risk_state") !== User.RISK_STATE.UP_TO_DATE) {
          model.set("risk_state", User.RISK_STATE.CHANGED);
        }
        if (model.calculateLater) {
          model.calculateRisk();
        }
      }
    },
    error : function(model, resp, options) {
      console.error("failed to fetch user: " + resp.error + (model.isFetching() ? " (still fetching)" : " (done fetching)"));

      // TODO - this is a bit iffy, since it could be a local or remoteerror,
      // and uncertain order (though likely local first); assume remote error for
      // now
      if (!resp.error || resp.error.indexOf("does not exist")) {
        createUser(model);
      }

      if (!model.isFetching()) {
        if (model.calculateLater) {
          model.calculateRisk();
        }
      }
    }
  });
}
