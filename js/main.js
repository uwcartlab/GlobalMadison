/***CLASS-LEVEL VARIABLES***/
var map,
    siteID = 0,
    currentSite = 0,
    visitedSites = [],
    siteCoords = [],
    shownRoutes = [],
    screenSize = "small",
    imageSet,
    slide = 0,
    modalWidth,
    slider,
    timeouts = [],
    firstLocate = true;

window.onload = initialize();
$(window).resize(setLayout);

function initialize(){
    setLayout();
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
    moveMap();
    hideAudio();
    readAloud();
    //slideshow variables
    var textModalEl = document.getElementById('text-modal'),
        textModal = new bootstrap.Modal(textModalEl),
        landmarkModalEl = document.getElementById('landmark-modal'),
        landmarkModal = new bootstrap.Modal(landmarkModalEl),
        showText = false;

    textModalEl.addEventListener('show.bs.modal', function(){
        resetSlide();
        startTextModal();
    });
    landmarkModalEl.addEventListener('shown.bs.modal', function(){
        resetSlide();
        startLandmarkModal();
    });
    //audio variables
    var audioIndex = 0;
/*UNIVERSAL MODAL FUNCTIONS*/
    //reset slides and gray back button
    resetSlide();
    function resetSlide(){
        slide = 0;
        inactiveButton();
    }    
    //clear text slideshow
    function clearModal(type){
        $("#" + type +"-modal-label").html();
        $("#" + type + "-script").html();
        $("#" + type + "-image").attr("src","");
        $(".next-button").off();
        $(".previous-button").off();
    }
    //add modal title
    function addModalTitle(type){
        var title = pois.features[currentSite].properties.title + " - Landmark " + (pois.features[currentSite].properties.id+1) + " of 5";
        $("#" + type +"-modal-label").html(title);
    }
    //check if first slide and deactivate previous button if so
    function inactiveButton(){
        if (slide == 0){
            $(".previous-button").addClass("inactive");
        }
        else{
            $(".inactive").removeClass("inactive");
        }
    }
/*AUDIO*/
    function decodeAudio(sound, size, landmark){
        $("audio").prop('autoplay', true);
        $("audio").attr('src', "data:audio/mp3;base64," + sound);
        if (size == 'large'){
            showAudio();
        }
        $("audio").get(0).play();
    }

    function playAudio(size, landmark){
        $.ajax(pois.features[landmark].properties.audio[audioIndex], {
            dataType: "text",
            success: function(data){ decodeAudio(data, size, landmark) }
        })
    }

    function showAudio(){
        $("audio").show();
        /*if (iOS){
          $("audio").css({"width":"60px", "height":"10px", "margin-right": "20px", "margin-top": "10px"})
        };*/
    }

    function hideAudio(){
        $("audio").get(0).pause();
        $("audio").prop('autoplay', false);
        $("audio").hide();
        /*if (iOS){
          $("audio").css({"width":0, "height":0, "margin-right": 0})
        };*/
    }

    function readAloud(){
        var firstClick = true;
        $("#read-button").html("Read Text Aloud");
        $("#read-button").off();
        $("#read-button").click(function(){
            if (firstClick){
                var scripts =  pois.features[currentSite].properties.Scripts;
                var delay = 0;

                for (var t in timeouts){
                    clearTimeout(timeouts[t]);
                }

                for (var i = 0; i < scripts.length - 1; i++){                      
                    delay = delay + (scripts[i].length * 68.2);
                    timeouts[i] = window.setTimeout(function(){
                        slide++;
                        nextTextModal(pois.features[currentSite]);
                    }, delay);
                }
                
                audioIndex = 0;
                var audioListLength = pois.features[currentSite].properties.audio.length;
                playAudio(screenSize, currentSite);
                $("audio").on('ended', function(){
                    audioIndex++;
                    if (audioIndex < audioListLength){
                        playAudio(screenSize, currentSite);
                    }
                })
            }
            playPause(firstClick);
            firstClick = false;
        })
    }

    function playPause(firstPlay){
        if (!firstPlay && !$("audio").get(0).paused){
            $("audio").get(0).pause();
            clearTimeouts();
        } 
        else {
            if (!firstPlay){ 
                $("audio").get(0).play(); 
            }
        }
    }

    function clearTimeouts(){
        for (var i in timeouts){
          window.clearTimeout(timeouts[i]);
        }
    }

    //match play audio button to audio state
    $("audio").on("pause", function(){
        $("#read-button").html("Play Reading");
    });
    $("audio").on("play", function(){
        $("#read-button").html("Pause Reading");
    });
/*TEXT MODAL*/
    //start text modal
    function startTextModal(){
        clearModal("text");
        addModalTitle("text");
        //add image
        $("#text-image").attr("src", pois.features[currentSite].properties.textImage);
        //add first page of script
        $("#text-script").html(pois.features[currentSite].properties.Scripts[slide]);
        //next button listener
        $('#next-button-text').click(function(){
            slide++;
            inactiveButton();
            nextTextModal(pois.features[currentSite]);
        })
        $('#previous-button-text').click(function(){
            if (slide > 0){
                slide--;
                inactiveButton();
                updateTextModal(pois.features[currentSite]);
            }
        })
    }
    //next text modal slide
    function nextTextModal(feature){
        //update slide text
        updateTextModal(feature);
        //if last slide, show landmark slideshow
        if (slide == (feature.properties.Scripts.length)){
            textModal.hide();
            if (showText == true){
                landmarkModal.show();
                showText = false;
            }
        }
    }
    //previous text modal slide
    function updateTextModal(feature){
        $("#text-script").html(feature.properties.Scripts[slide]);
    }
/*LANDMARK MODAL*/
    //start landmark modal
    function startLandmarkModal(){
        clearModal("landmark");
        addModalTitle("landmark");
        //create image set
        imageSet = pois.features[currentSite].properties.imageSet;
        //add landmark slides
        updateLandmarkModal();

        $('#next-button-landmark').click(function(){
            slide++;
            inactiveButton();
            nextLandmarkModal();
        })
        $('#previous-button-landmark').click(function(){
            if (slide > 0){
                slide--;
                inactiveButton();
                updateLandmarkModal();
            }
        })
    }
    //next landmark modal slide
    function nextLandmarkModal(){
        if (slide < imageSet.length){
            updateLandmarkModal();
        }
        //last slide
        else if (slide == imageSet.length){
            //hide slideshow and activate proceed button
            $("#img-comparison").hide()
            $("#proceed-button").show();
            $("#landmark-script").html("After closing this slide show window, you will be guided by the highted route to the next landmark. If you want to explore more on this landmark, take the chance to navigate through images using previous or next buttons.");
            $("#landmark-image").attr("src","");

            $("#proceed-button").click(function(){
                endSlideShow();
            });
        }
        //after last slide
        else{
            endSlideShow();
        }

        function endSlideShow(){
            landmarkModal.hide();
            currentSite++;
            changeLandmark();
            $("#proceed-button").hide();
            $("#proceed-button").off();
        }
    }
    //update landmark slideshow content
    function updateLandmarkModal(){
        $("#img-comparison").empty().show();
        //adjust width of image container
        $('#img-comparison').css("width", $('#landmark-content').width());
        //update text description
        $("#landmark-script").html(imageSet[slide].image_texts);

        createSlider();
    }
    //create image comparison slider
    function createSlider(){
        slider = new juxtapose.JXSlider('#img-comparison',
            [{
                    src: imageSet[slide]["historic_" + screenSize]
                },
                {
                    src: imageSet[slide]["current_" + screenSize]
            }],
            {
                animate: true,
                showLabels: false,
                showCredits: false,
                startingPosition: "50%",
                makeResponsive: true
            }
        );
    }
/*MOVE MAP*/
    //center map on current landmark
    function moveMap(){
        if (siteCoords.length > 1 && currentSite > 0){
            var bounds = L.latLngBounds([siteCoords[currentSite - 1].lat, siteCoords[currentSite - 1].lng], [siteCoords[currentSite].lat, siteCoords[currentSite].lng]);
        } 
        else {
            var bounds = L.latLngBounds([43.0749355058668,-89.39899991725407], [siteCoords[currentSite].lat, siteCoords[currentSite].lng]);
        };

        map.fitBounds(bounds, {padding: [10, 10]});
    }
/*ROUTES*/
    //add routes
    function updateRoute(){
        //add current route
        if (currentSite < 5 && $.inArray(currentSite, shownRoutes) == -1){
            shownRoutes.push(currentSite)
            var newroute = L.geoJson(routes.features[currentSite], routeStyle).addTo(map);
        }
        //add current alert layer
        alertlayer ? map.removeLayer(alertlayer) : null;
        alerts.features.forEach(function(d,i){
            if (alerts.features[i].properties.routeid === currentSite){
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
        if (currentSite < 5){
            highlightLayer = L.geoJson(routes.features[currentSite], {style: highlightStyle}).addTo(map);
        }
    };
/*MARKERS*/
    //update landmark markers
    function updateMarkers() {
        addMarkers(map, currentSite, "gray"); //add marker for old feature
        addMarkers(map, currentSite, "red"); //add red marker for the new feature
    };
    //add marker
    function addMarkers(map, i, itype){
        //select whether regular or highlighted marker
        itype = itype == "red" ? "icon_red_larger" : "icon_larger";
        //create marker
        POIlayer = L.geoJson(pois.features[i], {
            pointToLayer: function(feature, latlng){
                //create landmark dropdown list from feature attributes 
                if (!siteCoords[currentSite]){
                    siteCoords[currentSite] = latlng;
                    $("#landmark-dropdown").append("<li><a class='dropdown-item' id='landmark-menu-" + currentSite + "' value='" + currentSite + "'><img src='" + feature.properties.icon.iconUrl + "'> " + feature.properties.title + "</a></li>");
                    //click listener to change landmark from menu directly
                    $("#landmark-menu-" + currentSite).click(function(){
                        currentSite = Number($(this).attr("value"));
                        changeLandmark();
                    })
                }
                //create marker
                return L.marker(latlng, {icon: L.icon(feature.properties[itype])}); //gray icon
            },
            onEachFeature: function (feature, layer){
                layer.on("click", function() {
                    highlightMarkers(feature);
                    //if first site visit, auto-open text modal; otherwise open slideshow
                    if ($.inArray(currentSite, visitedSites) == -1){
                        showText = true;
                        textModal.show();
                    } 
                    else {
                        landmarkModal.show();
                    };
                    visitedSites.push(i);
                }); 
            }
        }); 
        //set icon size
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
        if (currentSite != feature.properties.id){
            currentSite = feature.properties.id;
            //updateText('#textModal', 0, PointsofInterest.features[currentFeature]);
            addMarkers(map, currentSite, "red"); //add red highlighted marker
        }
    }
/*CHANGE LANDMARK*/
    //go to next landmark
    function changeLandmark(){
        updateRoute();
        highlightRoute();
        updateMarkers();
        moveMap();
        hideAudio();
        readAloud();
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

    //find me
    var findMeOptions = {
        'iconUrl': 'img/icons/findme.png',  // string
        'onClick': findme_button_onClick,  // callback function
        'maxWidth': 30,  // number
        'doToggle': false,  // bool
        'toggleStatus': false  // bool
    }
  
    var findMeButton = new L.Control.Button(findMeOptions).addTo(map);

    function findme_button_onClick() { //where is this accessed?
        getLocation(map);
    }
}
//get location function
function getLocation(map){
    map.locate({setView:false, watch:true, enableHighAccuracy: true} );
  
    function onLocationFound(e){
        var radius = e.accuracy / 2;
  
        //removes marker and circle before adding a new one
        if (firstLocate===false){
            map.removeLayer(circle);
            map.removeLayer(locationMarker);
        }
      //adds location and accuracy information to the map
        if (e.accuracy < 90){
            circle = L.circle(e.latlng, radius).addTo(map);
            locationMarker = L.marker(e.latlng).addTo(map).bindPopup("You are within " + Math.round(radius) + " meters of this point");
            firstLocate = false;
        }
  
      //if accuracy is less than 60m then stop calling locate function
        if (e.accuracy < 40){
            var count = 0;
            map.stopLocate();
            count++;
        }
  
        var cZoom = map.getZoom();
        map.setView(e.latlng, cZoom);
        removeFoundMarker(circle, locationMarker);
    }
  
    map.on('locationfound', onLocationFound);
    map.on('locationerror', function(){
        console.log("sup")
    });
}

//activate splash screen
function showSplash(){
    var splash = new bootstrap.Modal(document.getElementById('splash'), {
        keyboard: false
    })
    splash.show();
}

//responsive design functions
function setLayout(){
    var w = $(window).width();

    if (w < 768){
        if (screenSize == "large"){
            screenSize = "small";
            imageResize();
        }
        //hide full nav menu when landmarks button is selected
        $("#landmark-dropdown-link").click(function(){
            if ($(".non-landmark").css("display") == "none"){
                $(".non-landmark").css("display","block");
                $("#landmark-menu-text").text("Landmarks");
                $("#landmark-list, #arrow").show();
            }
            else{
                $(".non-landmark").css("display","none");
                $("#landmark-menu-text").text("Back");
                $("#landmark-list, #arrow").hide();
            }
        })
        //show full nav menu and hide dropdown when back button is selected or menu is closed
        $(".menu-toggler").click(function(){
            $(".landmark").dropdown("hide");
            $(".non-landmark").css("display","block");
            $("#landmark-menu-text").text("Landmarks");
            $("#landmark-list, #arrow").show();
        })
    }
    //remove listeners for fullscreen
    else{
        if (screenSize == "small"){
            screenSize = "large";
            imageResize();
        }
        $(".back-button, .menu-toggler, #landmark-dropdown-link").off();
    }
    $('#img-comparison').css("width", $('#landmark-content').width());
    //if screen size jumps between desktop and mobile while slideshow is open, load appropariate image size
    function imageResize(){
        if (imageSet){
            $('#img-comparison').empty();
            slider = new juxtapose.JXSlider('#img-comparison',
                [{
                        src: imageSet[slide]["historic_" + screenSize]
                    },
                    {
                        src: imageSet[slide]["current_" + screenSize]
                }],
                {}
            );
        }
    }
 
}

