/***CLASS-LEVEL VARIABLES***/
var map,
    siteID = 0,
    currentSite = 0,
    visitedSites = [];

window.onload = initialize();
$(window).resize(resonsiveNav);

function initialize(){
    resonsiveNav();
    showSplash();

    loadMap();

    Promise.all([
        d3.json("data/routes.geojson"),
        d3.json("data/PointsofInterest.geojson"),
        d3.json("data/alerts.geojson"),
        d3.json("data/help.json")
    ]).then(callback);
}

//data callback
function callback(data){
    //data variables
    var routes = data[0],
        pois = data[1],
        alerts = data[2],
        help = data[3];
    //style variables
    var routeStyle = {
        "color": "#CE3234",
        "weight": 5,
        "opacity": 0.6
      };
    var highlightStyle = {
        "color": "#CE3234",
        "weight": 5,
        "opacity": 1
    };
    //vector variables
    var highlightLayer, 
        alertlayer,
        POIlayer,
        POIlayers = [],
        POIlayerCurrent;
    //vector functions
    updateRoute();
    highlightRoute();
    updateMarkers();
    //slideshow function
    textSlideshow();

    //add routes
    function updateRoute(){
        //add current route
        if (siteID < 5){
            var newroute = L.geoJson(routes.features[siteID], routeStyle).addTo(map);
        }
        //add current alert layer
        alertlayer ? map.removeLayer(alertlayer) : null;
        alerts.features.forEach(function(d,i){
            if (alerts.features[i].properties.routeid === siteID){
                alertlayer = L.geoJson(alerts.features[i], {
                    pointToLayer: function(feature, latlng){
                        return L.marker(latlng, {
                            icon: L.icon({
                            iconUrl: "img/icons/alert40_red.png",
                            iconSize: [40, 40],
                            popupAnchor: [0, -12]
                            })
                        });
                    },
                    onEachFeature: function (feature, layer){
                        layer.bindPopup(feature.properties.alert);
                    }
                }).addTo(map);
            }
        })
    }
    //highlight current route
    function highlightRoute() {
        if (highlightLayer){
            map.removeLayer(highlightLayer);
        }
        if (siteID < 5){
          highlightLayer = L.geoJson(routes.features[siteID], {style: highlightStyle}).addTo(map);
        }
    };
    //update landmark markers
    function updateMarkers() {
        addMarkers(map, siteID, "gray"); //add marker for old feature
        addMarkers(map, siteID, "red"); //add red marker for the new feature
    };
    //add marker
    function addMarkers(map, i, itype){
        //select whether regular or highlighted marker
        itype = itype == "red" ? "icon_red_larger" : "icon_larger";
        //create marker
        POIlayer = L.geoJson(pois.features[i], {
            pointToLayer: function(feature, latlng){
                return L.marker(latlng, {icon: L.icon(feature.properties[itype])}); //gray icon
            },
            onEachFeature: function (feature, layer){
                var imageSet = feature.properties.imageSet;
                 /*// imageSet from PointsofIntest.js
                    imageSets[feature.properties.id] = imageSet;
                */
                layer.on("click", function() {
                    highlightMarkers(feature);
                    //if first site visit, auto-open text modal; otherwise open slideshow
                    if ($.inArray(siteID, visitedSites) == -1){
                        triggerTextModal();
                    } 
                    else {
                        openInfoScreen(feature, imageSet);
                    };
                    visitedSites.push(siteID);
                }); 
            }
        }); 
        
        if (itype === "icon_larger"){
            POIlayers.push(POIlayer);
        } 
        else {   
            if (POIlayerCurrent){
                map.removeLayer(POIlayerCurrent);
            }
            POIlayerCurrent = POIlayer;
        };

        map.addLayer(POIlayer);
    }
    //highlight marker selected marker
    function highlightMarkers(feature){
        if (currentFeature != feature.properties.id){
            currentFeature = feature.properties.id;
            //updateText('#textModal', 0, PointsofInterest.features[currentFeature]);
            //hideAudio();
            //readAloud();
            addMarkers(map, currentFeature, "red"); //add red highlighted marker
        }
    }
    function textSlideshow(){
        var slide = 0;
        //add title to slideshow
        var title = pois.features[siteID].properties.title + " - Landmark " + (pois.features[siteID].properties.id+1) + " of 5";
        $("#text-modal-label").html(title);
        //add image
        var image = $("<img src='" + pois.features[siteID].properties.textImage + "'>");
        $("#text-image").append(image);
        var script = $("<p>").html(pois.features[siteID].properties.Scripts[slide]);
        $("#text-script").append(script);

    }
    function landmarkSlideshow(){

    }
}

//load the map
function loadMap(){
    //map object
    map = L.map('map', { 
        zoomControl: false,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 14,
        maxBounds: [
          [43.0371,-89.452674],
          [43.129626,-89.306419]
        ],
        center: [43.076364, -89.384336],
        zoom: 14
    });
    //detach zoom control to move later
    var zoom = L.control.zoom({position: "topleft"}).addTo(map);
    
    //basemap
    mapTileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);
}

//activate splash screen
function showSplash(){
    var splash = new bootstrap.Modal(document.getElementById('splash'), {
        keyboard: false
    })
    splash.show();
}

//responsive design functions
function resonsiveNav(){
    var w = $(window).width();
    //add listeners for mobile
    if (w < 768){
        //hide full nav menu when landmarks button is selected
        $("#landmark-dropdown-link").click(function(){
            $(".nav-link").css("display","none");
        })
        //show full nav menu and hide dropdown when back button is selected or menu is closed
        $(".back-button, .menu-toggler").click(function(){
            $(".nav-link").css("display","block");
            $(".dropdown-menu").removeClass("show");
        })
    }
    //remove listeners for fullscreen
    else{
        $(".back-button, .menu-toggler, #landmark-dropdown-link").off();
    }
}

