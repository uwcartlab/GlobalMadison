/***CLASS-LEVEL VARIABLES***/
var map;

function initialize(){
    navMenu();
    showSplash();
}

window.onload = initialize();
$(window).resize(navMenu);

function showSplash(){
    var splash = new bootstrap.Modal(document.getElementById('splash'), {
        keyboard: false
    })
    splash.show();
}

function navMenu(){
    var w = $(window).width();
    
    if (w < 768){
        $("#dropdownMenuLink").click(function(){
            $(".nav-link").css("display","none");
        })
        $(".back-button, .menu-toggler").click(function(){
            $(".nav-link").css("display","block");
            $(".dropdown-menu").removeClass("show");
        })
    }
    else{
        $(".back-button, .menu-toggler, #dropdownMenuLink").off();
    }
}

//function to instantiate the Leaflet map
/*function createMap(){
    
    //create the map
    map = L.map('map', {
        center: [0, 0],
        zoom: 1
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};*/

