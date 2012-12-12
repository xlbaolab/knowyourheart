var SCHEMA = {
  0 : "name",
  1 : "address1",
  2 : "address2",
  3 : "city",
  4 : "state",
  5 : "zip",
  6 : "cross_street",
  7 : "url",
  8 : "url_caption",
  9 : "phone",
  10 : "description",
  11 : "latitude",
  12 : "longitude"
};

var CSV_SEPARATOR = "\t";
// don't call google too fast to avoid getting rejected
var sDelayCount = 0;

function csvToJson(csv) {
  var lines = csv.split(/\r\n|\r|\n/);
  var json = [lines.length];
  for (var i = 0; i < lines.length; i++) {
    json[i] = csvLineToJson(lines[i]);
  }
  return json;
}

function csvLineToJson(line) {
  var json = {
    location : {
      lat : NaN,
      lon : NaN
    }
  };
  var fields = line.split(CSV_SEPARATOR);
  for (var i = 0; i < fields.length; i++) {
    if (i == 11) {
      json.location.lat = parseFloat(fields[i]);
    } else if (i == 12) {
      json.location.lon = parseFloat(fields[i]);
    } else {
      json[SCHEMA[i]] = fields[i];
    }
  }

  if (isNaN(json.location.lat) || isNaN(json.location.lon)) {
    var address = json.address1 + ", " + json.city + ", " + json.state + ", " + json.zip;
    console.log("coordinates not found, calling geocode on address: " + address);
    setTimeout(function() {
      sGeocoder.geocode({
        address : address
      }, _.bind(handleGeocode, json));
    }, sDelayCount++ * 1000);
    return null;
  } else {
    return json;
  }
}

function addLoc(json) {
  if (!json)
    return;

  var loc = new Loc();
  loc.save(json, {
    success : function(model) {
      console.log(model);
    },
    error : function(model, response) {
      console.log(model);
      console.log(response);
    },
  });
}

function handleFormSubmit(e) {
  // convert CSV to JSON
  var json = csvToJson($("#csv-input").val());
  $("#json-output").html(syntaxHighlight(JSON.stringify(json, null, 4)));

  // post to StackMob
  // TODO one request
  for (var i = 0; i < json.length; i++) {
    addLoc(json[i]);
  }

  // $.post(
  // ARCHIMEDES_URL,
  // request,
  // _.bind(this.calculateRiskSuccess, this),
  // "text"
  // ).fail(_.bind(this.calculateRiskError, this));

  // $.ajax({
  // type: "POST",
  // url: "bin/process.php",
  // data: dataString,
  // success: function() {
  // $('#contact_form').html("<div id='message'></div>");
  // $('#message').html("<h2>Contact Form Submitted!</h2>")
  // .append("<p>We will be in touch soon.</p>")
  // .hide()
  // .fadeIn(1500, function() {
  // $('#message').append("<img id='checkmark' src='images/check.png' />");
  // });
  // }
  // });

  // You must return false to prevent the default form behavior
  return false;
}

// "this" is bound to the json
function handleGeocode(results, status) {
  console.log("geocode returned: " + status);
  console.log(results);
  
  if (status !== google.maps.GeocoderStatus.OK) {
    return;
  }
  this.location.lat = results[0].geometry.location.lat();
  this.location.lon = results[0].geometry.location.lng();
  addLoc(this);
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

window.onload = function() {
  $("form").on("submit", handleFormSubmit);
}

StackMob.init({
  appName : "knowyourheart",
  clientSubdomain : "peterttsenggmailcom",
  publicKey : "ad81cf6c-4523-411c-a326-f63717789c07",
  apiVersion : 0
});

var Loc = StackMob.Model.extend({
  schemaName : "screening_location"
});
var Locs = StackMob.Collection.extend({
  model : Loc
});
var sGeocoder = new google.maps.Geocoder();
