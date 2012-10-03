
$(function(){

	/* Font definition when developing on local */
	var host = "local";
	//var host = "remote";
	
	var localfont = "proxima_nova_rgregular";
	var localslab = "MuseoSlab500Regular";
	var remotefont = "museo-slab";

	
	if (host == "local") {
		$('body').css("font-family", localslab);
		$('h2, h3').css("font-family", localslab);
		$('.header').css("font-family", localslab);
		$('.ui-btn-inner').css("font-family", localslab);
		$('fieldset').css("font-family", localslab);
		$('option').css("font-family", localslab);
		$('select').css("font-family", localslab);

		$('.ui-body-a, .ui-body-b, .ui-body-c').css("font-family", localslab);


	} else {
		$('body').css("font-family", remotefont);
		$('h2, h3').css("font-family", remotefont);
		$('.header').css("font-family", remotefont);
		$('.ui-btn-inner').css("font-family", remotefont);
		};

	/* Clear placeholder text upon focus */
    $('input').data('holder',$('input').attr('placeholder'));
    $('input').focusin(function(){
        $(this).attr('placeholder','');
    });
    $('input').focusout(function(){
        $(this).attr('placeholder',$(this).data('holder'));
    });
    
    /* Add header class to buttons */
    $('div.ui-header').addClass("header");
    
    /* Add nextbtn class to buttons */


    
})