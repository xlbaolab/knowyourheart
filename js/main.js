$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

// disable slideshow
$("#survey_carousel").carousel({
    interval : false
});

// handle user typing "enter"
$("#survey_carousel input").on("keypress", function(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
        $("#survey_carousel").carousel("next");
    }
});

// handle carousel changes
$("#survey_carousel").on("slid", function(e) {
    var $active, activePos, $navItems;

    // update nav selection
    $active = $(this).find(".active");
    activePos = $active.parent().children().index($active);
    $navItems = $("#carouselNav li");
    $navItems.removeClass("active");
    $navItems.eq(activePos).addClass("active");

    // keyboard focus on first input
    // TODO handle "select" element
    $("#survey_carousel input:visible").filter(":first").focus();
});

// update carousel when nav is clicked
$("#carouselNav li").click(function(e) {
    e.preventDefault();
    $("#survey_carousel").carousel($(this).parent().children().index(this));
});

$("#archimedesTest").click(function(e) {
    e.preventDefault();

    // Send the data using post and put the results in a div
    // age:35
    // gender:M
    // height:70
    // weight:160
    // smoker:F
    // mi:F
    // stroke:T
    // diabetes:T
    // systolic:
    // diastolic:
    // cholesterol:
    // hdl:
    // ldl:
    // triglycerides:
    // hba1c:
    // cholesterolmeds:
    // bloodpressuremeds:
    // bloodpressuremedcount:
    // aspirin:
    // moderateexercise:
    // vigorousexercise:
    // familymihistory:

    var $form = $("#survey_form");
    var formData = $form.serializeObject();

    var radioAndCheckboxes = ["gender", "smoker", "mi", "stroke", "diabetes"];
    for (var i = 0; i < radioAndCheckboxes.length; i++) {
        if (formData[radioAndCheckboxes[i]] === undefined) {
            formData[radioAndCheckboxes[i]] = 'F';
        }
    }
    // TODO
    formData["height"] = 70;
    delete formData.height_feet;
    delete formData.height_inches;

    for (var key in formData) {
        if (formData[key] !== "") {
            continue;
        }

        if (key === "age") {
            formData[key] = 35;
        } else if (key === "gender" && formData[key] === 'F') {
            formData[key] = 'M';
        } else if (key === "height") {
            formData[key] = 70;
        } else if (key === "weight") {
            formData[key] = 180;
        } else {
            console.log(key);
            delete formData[key];
        }
    }

    console.log(formData);

    $.post("https://demo-indigo4health.archimedesmodel.com/IndiGO4Health/IndiGO4Health", formData, function(data) {
        // var content = $(data).find('#content');
        $("#result").empty().append(data);
    });
});
