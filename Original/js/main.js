/***CLASS-LEVEL VARIABLES***/
var timeouts = [];
var map;
var siteID = 0; //latest landmark available to user
var visitedSites = []; //for determining whether to auto-open text modal
var currentFeature = 0; //feature currently highlighted
var imageSets = {};
var currentTiles = 'modern';
var siteCoords = [];
var mapTileLayer;
var firstLocate = true;
var iOS = false;
var mobileOS = false;
var openSlideshow = false;
var leafletTimeout;

window.onload = initialize();

function initialize(){
  cacheloading();
  loadmap(); //load the map

  $(document).foundation({
      orbit: {
          animation: 'slide',
          navigation_arrows: true,
          circular: true,
          timer: false,
          swipe: false, //twentytwenty slider conflicts with swipe
          next_class: 'orbit-next',
          prev_class: 'orbit-prev',
          timer_show_progress_bar: false
      }
  });

  //hacky fix for iOS automatic dropdown hover state on load
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)){
    iOS = true;
    $(".has-dropdown a").css("background-color", "#C41E3A");
    $(".has-dropdown a").mouseenter(function(){
      $(this).css("background-color", "#C41E3A");
    });
  };

  if (/iPhone|iPad|iPod|Android|BlackBerry/i.test(navigator.userAgent)){
    mobileOS = true;
  };

  //use queue.js to parallelize asynchronous data loading for cpu efficiency
  queue()
    .defer(d3.json, "data/routes.geojson")
    .defer(d3.json, "data/PointsofInterest.geojson")
    .defer(d3.json, "data/alerts.geojson")
    .defer(d3.json, "data/help.json")
    .await(callback);
};

function callback(error, routes, PointsofInterest, alerts, help){
  var POIlayer;
  var POIlayers = [];
  var POIlayer_red;
  var highlightLayer, alertlayer;
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
  var winDims = getWinDimensions();
  var aspectRatio = winDims[1]/winDims[0];
  var setting = winDims[1] > 640 ? "desktop" : "mobile";
  var adjustedBubble = false;
  var firstIcon;
  var sid = 4;
  var s=0;
  var audioIndex = 0;

  /***INITIALIZE LAYOUT & FIRST SITE***/
  updateText('#textModal', 0, PointsofInterest.features[currentFeature]);
  hideAudio();
  setHelp(help); //populate the help window
  setLayout(); //adjust UI to screen size
  updateRoute(); //add initial route
  highlightRoute(); //highlight initial route
  updateMarkers(); //create initial landmark markers
  updateLocationMenu(); //add first landmark to landmarks menu

  //UI changes after splash page link clicked
  $(".goToMap").click(goToMap);

  function goToMap(){
    $("#container").css("visibility", "visible");
    $(".ontop").css("visibility", "visible");
    $("nav").css("visibility", "visible");
    $("#splash, #splashContainer").hide(); //sets display property to none
    $("body").css("overflow", "hidden");
    $("body").css("position", "relative");
    setLayout();

    triggerIconBubble();
  };

  $(window).on("resize", setLayout); //respond to changes in window size

  /***USER PROMPTS***/

  $("#textModal").on('closed.fndtn.reveal', function (){
  	//if first viewing of site text, open slideshow on text modal close
  	if (openSlideshow){
  	  var feature = PointsofInterest.features[currentFeature];
  	  openInfoScreen(feature, feature.properties.imageSet);
  	};
  	openSlideshow = false;
  	//reset texts
  	s = 0;
  	updateText('#textModal', 0, PointsofInterest.features[currentFeature]);
  	$('#textModal #previous').addClass("inactive");
  });

  function triggerIconBubble(){
    if ($('#iconClickBubble span').html().length < 1){
      //if statement ensures all of this only happens once
      $('#iconClickBubble span').html("When you arrive here, click icon<br/>for landmark information");
      
      //find the right icon
      $(".leaflet-marker-icon").each(function(){
        if ($(this).attr("src") == "images/labor40_red.png"){ firstIcon = $(this); }
      });

      var iconOffset = firstIcon.offset();
      var bubbleWidth = $("#iconClickBubble").width();
      var bubbleHeight = $("#iconClickBubble").height();
      var topOffset = iconOffset.top-bubbleHeight-32;
      var leftOffset = iconOffset.left-bubbleWidth+28;
      $('#iconClickBubble').offset({top: 10, left: 10});
      $("#iconClickBubble").animate({opacity: 1, top: topOffset, left: leftOffset}, 1000);
      //events only get set once because of if statement
      $(window).click(function(){
        //next step direction bubble closed on next click after it is in place
        if (Math.round($('#iconClickBubble').offset().top) === Math.round(topOffset)){
          $('#iconClickBubble').fadeOut();
        };
      });
      $(".leaflet-clickable").click(function(){ $('#iconClickBubble').fadeOut() });
      map.on("move", function(){ adjustIconBubble() });
    };
  };

  function adjustIconBubble(){
    if ($('#iconClickBubble span').html().length > 1){
      var iconOffset = firstIcon.offset();
      var bubbleWidth = $("#iconClickBubble").width();
      var bubbleHeight = $("#iconClickBubble").height();
      var topOffset = iconOffset.top-bubbleHeight-32;
      var leftOffset = iconOffset.left-bubbleWidth+28;
      $('#iconClickBubble').offset({top: topOffset, left: leftOffset});

      if (adjustedBubble==false){ //only set event listener once
        $(window).click(function(){
            $('#iconClickBubble').fadeOut();
        });
      };
      adjustedBubble = true;
    };
  };

  /***NARRATION AUDIO***/

  function decodeAudioBase64Binary(sound, isdesktop, landmark){
    var myAudioContext, mySource, myBuffer;

    if ('AudioContext' in window) {
      myAudioContext = new AudioContext();
    } else if ('webkitAudioContext' in window) {
      myAudioContext = new webkitAudioContext();
    } else {
      alert('Your browser does not support yet Web Audio API');
    }

    var arrayBuff = Base64Binary.decodeArrayBuffer(sound);

    myAudioContext.decodeAudioData(arrayBuff, function(audioData) {
      myBuffer = audioData;

      mySource = myAudioContext.createBufferSource();
      mySource.buffer = myBuffer;
      mySource.connect(myAudioContext.destination);

      if ('AudioContext' in window) {
        mySource.start(0);
      } else if ('webkitAudioContext' in window) {
        mySource.noteOn(0);
      } 
    });
  };
  
  function decodeAudio(sound, isdesktop, landmark){
    $("audio").prop('autoplay', true);
    $("audio").attr('src', "data:audio/mp3;base64,"+sound);
    if (isdesktop){
      showAudio();
    };
    $("audio").get(0).play();
  };

  function playAudio(isdesktop, landmark){
    $.ajax(PointsofInterest.features[landmark].properties.audio[audioIndex], {
      dataType: "text",
      success: function(data){ decodeAudio(data, isdesktop, landmark) }
    });
  };

  function showAudio(){
    $("audio").show();
    if (iOS){
      $("audio").css({"width":"60px", "height":"10px", "margin-right": "20px", "margin-top": "10px"})
    };
  };

  function hideAudio(){
    $("audio").get(0).pause();
    $("audio").prop('autoplay', false);
    $("audio").hide();
    if (iOS){
      $("audio").css({"width":0, "height":0, "margin-right": 0})
    };
  };

  function readAloud(){
    var firstClick = true;
    $("#readAloud span").html("&nbsp;&nbsp;Read Text Aloud");
    $("#readAloud div").unbind("click");
    $("#readAloud div").click(function(){
      if (firstClick){
        var scripts = PointsofInterest.features[currentFeature].properties.Scripts;
        updateText('#textModal', 0, PointsofInterest.features[currentFeature]);

        var delay = 0;
        for (var t in timeouts){
          clearTimeout(timeouts[t]);
        };
        for (var i = 0; i < scripts.length-1; i++){                      
          delay = delay + (scripts[i].length * 68.2);
          timeouts[i] = window.setTimeout(function(){
            forwardText('#textModal', PointsofInterest.features[currentFeature]);
          }, delay);
        }
        audioIndex = 0;
        var audioListLength = PointsofInterest.features[currentFeature].properties.audio.length;
        playAudio(true, currentFeature);
        $("audio").on('ended', function(){
          audioIndex++;
          if (audioIndex < audioListLength){
            playAudio(true, currentFeature);
          }
        })
      };
      playPause(firstClick);
      firstClick = false;
    });
  };

  function playPause(firstPlay){
    if (!firstPlay && !$("audio").get(0).paused){
      $("audio").get(0).pause();
      clearTimeouts();
    } else {
      if (!firstPlay){ $("audio").get(0).play(); };
    };
  };

  //match play audio button to audio state
  $("audio").on("pause", function(){
    $("#readAloud span").html("&nbsp;&nbsp;Play Reading");
  });
  $("audio").on("play", function(){
    $("#readAloud span").html("&nbsp;&nbsp;Pause Reading");
  });

  /***NARRATION TEXT***/

  //add script and next/back buttons to textModal
  if (siteID===0){
    $('#textModal .script').html(PointsofInterest.features[0].properties.Scripts[0]);
    addTextButtons('#textModal', PointsofInterest.features[0].properties.Scripts);
  };

  function clearTimeouts(){
    for (var i in timeouts){
      window.clearTimeout(timeouts[i]);
    };
  };

  function addTextButtons(modal, texts){
    s = 0;
    $(modal + ' .title').before("<div class='redButtonContainer scriptButtonContainer'><div class='redButton scriptButtons inactive' id='previous'><a href='#'><div>< previous</div></a></div><div class='redButton scriptButtons' id='next'><a href='#'><div>next ></div></a></div><div id='readAloud' class='redButton'><a href='#'><div><img src='images/headphones.png' alt='Read Aloud'/><span></span></div></a></div></div>");
    readAloud();

    $(modal + ' #next').click(function(){
      if (modal == '#textModal'){ clearTimeouts() };
      forwardText(modal, PointsofInterest.features[currentFeature]);
    });

    $(modal + ' #previous').click(function(){
        s--;
        s = s == -1 ? 0 : s;
        updateText(modal, s, PointsofInterest.features[currentFeature]);
		if (s == 0){
			$(modal + ' #previous').addClass("inactive");
		};

        for (var i in timeouts){
          window.clearTimeout(timeouts[i]);
        };
    });
  };

  function forwardText(modal, feature){
  s++;
  var texts = feature.properties.Scripts;
	if (s == 1){
		$(modal + ' #previous').removeClass("inactive");
	};
	if (s == texts.length){
	  $(modal).foundation('reveal', 'close');
	} else {
	  updateText(modal, s, feature);
	};
  };

  function updateText(modal, scr, feature){
    $(modal + ' .title').text(feature.properties.title+" - Landmark "+(feature.properties.id+1)+" of 5");
    $(modal + ' .textImage').attr("src", feature.properties.textImage);
    $(modal + ' .script').html(feature.properties.Scripts[scr]);
  };

  /***ROUTES***/

  function updateRoute(){
    if (siteID < 5){
      var newroute = L.geoJson(routes.features[siteID], routeStyle).addTo(map); //visited style route underlays highlight

      //remove old alerts and add any new alerts to map
      alertlayer ? map.removeLayer(alertlayer) : null;
      for (var alert in alerts.features){
        if (alerts.features[alert].properties.routeid === siteID){
          alertlayer = L.geoJson(alerts.features[alert], {
            pointToLayer: function(feature, latlng){
              return L.marker(latlng, {
                icon: L.icon({
                  iconUrl: "images/alert40_red.png",
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
      }
    }
  };

  function highlightRoute() {
    if (highlightLayer){
        map.removeLayer(highlightLayer);
    }
    if (siteID < 5){
      highlightLayer = L.geoJson(routes.features[siteID], {style: highlightStyle}).addTo(map);
    }
  };

  function moveMap(){
    if (siteCoords.length > 1){
      var i = siteCoords.length-1;
      var coordLats = [siteCoords[i-1][0], siteCoords[i][0]], 
      coordLons = [siteCoords[i-1][1], siteCoords[i][1]];
    } else {
      var coordLats = [43.0749355058668, siteCoords[0][0]], 
      coordLons = [-89.39899991725407, siteCoords[0][1]];
    };

    coordLats.sort(function(a, b){return a-b});
    coordLons.sort(function(a, b){return a-b});

    var bounds = L.latLngBounds([coordLats[0], coordLons[0]], [coordLats[1], coordLons[1]]);
    map.fitBounds(bounds, {padding: [10, 10]});
  };

  /***LOCATION MENU***/

  function updateLocationMenu(){
    for (var i in PointsofInterest.features){
      var poi = PointsofInterest.features[i];
      if (siteID===poi.properties.id){
        $("#locationMenu").append(
          '<li class='+poi.properties.classname+
          '><a href="#"><img src="'+poi.properties.icon.iconUrl+
          '"/> '+poi.properties.title+
          '</a></li>'
        );
        var coords = [poi.geometry.coordinates[1],poi.geometry.coordinates[0]];
        $("#locationMenu li."+poi.properties.classname).click(function(){
          
        });

        siteCoords.push(coords);
        moveMap();
      };
    };

    if (siteID===4){
      $("#locationMenu").append(
        '<li class="all_locations"><a href="#"><img src="images/allLandmarks24.png"/> View All Landmarks</a></li>'
      );
      $("#locationMenu li.all_locations").click(function(){
        var boundslist = [];
        for (var lyr in POIlayers){
          boundslist.push(POIlayers[lyr].getBounds());
        };
        map.fitBounds(L.latLngBounds(boundslist));
      });
    };
  };

  /***MARKERS***/

  function addMarkers(map, i, itype) {
    //select whether regular or highlighted marker
    itype = itype == "red" ? "icon_red_larger" : "icon_larger";
    
    console.log(PointsofInterest.features)

    POIlayer = L.geoJson(PointsofInterest.features[i], {
      pointToLayer: function(feature, latlng){
        return L.marker(latlng, {icon: L.icon(feature.properties[itype])}); //gray icon
      },
      onEachFeature: function (feature, layer){
        var imageSet = feature.properties.imageSet; // imageSet from PointsofIntest.js
        imageSets[feature.properties.id] = imageSet;

        layer.on("click", function() {
          highlightMarkers(feature);
		  //if first site visit, auto-open text modal; otherwise open slideshow
		  if ($.inArray(siteID, visitedSites) == -1){
			triggerTextModal();
		  } else {
			openInfoScreen(feature, imageSet);
		  };
		  visitedSites.push(siteID);
        }); 
      }
    }); 
    
    if (itype==="icon_larger"){
      POIlayers.push(POIlayer);
    } else {   
      if (POIlayer_red){
        map.removeLayer(POIlayer_red);
      }
      POIlayer_red = POIlayer;
    };
    map.addLayer(POIlayer);
  };

  function updateMarkers() {
    addMarkers(map, siteID, "gray"); //add the gray marker to the last feature
    addMarkers(map, siteID, "red"); //add red marker for the new feature
  };

  function highlightMarkers(feature) {
    if (currentFeature != feature.properties.id){
      currentFeature = feature.properties.id;
      updateText('#textModal', 0, PointsofInterest.features[currentFeature]);
      hideAudio();
      readAloud();
      addMarkers(map, currentFeature, "red"); //add red highlighted marker
    }
  };

  /***SLIDESHOW***/

  function openInfoScreen(feature, imageSet){
    $("#show_title").html(feature.properties.title+
      " - Landmark "+
      (feature.properties.id+1)+
      " of 5");
    
    // set description texts for the first slide
    if ($("#slideshow_texts").html().length < 1){
      $("#slideshow_texts").html(imageSet[0].image_texts);
    };
    
    // clear existing contents
    $("#imagesList").html("");

    var showImagesList = document.getElementById("imagesList");
    
    // dynamically add images to imagesList
    for(var i = 0; i < imageSet.length; i++){
      //orbit slide container
      var li = document.createElement('li');
      li.setAttribute('data-orbit-slide','li_'+i);
      li.setAttribute('id','li_'+i);
      
      //twentytwenty container
      var div = document.createElement('div');
      div.setAttribute('class', 'twentytwenty-container');

      //historic image
      var imgHistorical = document.createElement('img');    
      var histImg = setting == "desktop" ? "historic_large" : "historic_small";
      imgHistorical.setAttribute('onerror', 'imgError(this, "'+imageSet[i]["historic_small"]+'")');
      imgHistorical.setAttribute('src', imageSet[i][histImg]);
      div.appendChild(imgHistorical);
      
      //current image
      var imgCurrent = document.createElement('img');
      var currentImg = setting == "desktop" ? "current_large" : "current_small";
      imgCurrent.setAttribute('onerror', 'imgError(this, "'+imageSet[i]["current_small"]+'")');
      imgCurrent.setAttribute('src', imageSet[i][currentImg]);
      div.appendChild(imgCurrent);

      li.appendChild(div);  
      showImagesList.appendChild(li);
    };
      
    //add the next feature button slide
    if (siteID < 4){
      var li = document.createElement('li');
      li.setAttribute('data-orbit-slide','li_3');
      
      var div = document.createElement('div');
      div.setAttribute('class', 'redButton');
      div.setAttribute('id', 'ready_next')
      div.innerHTML = "<a href='#'><div><span>Proceed to Next Landmark</span></div></a>";
      li.appendChild(div);
      showImagesList.appendChild(li); 
      
      //add button functionality
      div.addEventListener("click", function (){
        siteID++;
        currentFeature = siteID;
		    hideAudio();
        updateLocationMenu();
        updateMarkers();
        updateRoute();
        highlightRoute();
        updateText("#textModal", 0, PointsofInterest.features[siteID]);
        readAloud();
        
        //close the slideshow
        $("#slideshowModal").foundation('reveal', 'close');
      });
    } else {
      //final note for the last landmark
      var li = document.createElement('li');
      li.setAttribute('data-orbit-slide','li_2');

      var div = document.createElement('div');
      div.setAttribute('class', 'lastSlide');
      div.innerHTML = '<span>Congratulations&amp;You made it! The tour is now over. Click the "Assignment" button in the site menu to review your homework assignment. You may revisit any of the previous landmarks, or see all of their locations, using the "Landmarks" menu. Click on any of the site icons to reactivate that site and view its slideshow. Click on the "Text" button in the site menu to view the narrative text that goes with the active site.</span>'
      li.appendChild(div);
      showImagesList.appendChild(li);
    };
 
    $('#closeSlideshow').html("&#215;"); //close button 
    $("#slideshowModal").foundation("reveal", "open");
  }; //end openInfoScreen()

  function triggerTextModal(){
    $("#textModal").foundation("reveal","open");
	openSlideshow = true;
  };

  function orbitHeight(){
    var imageSize;

    //sets slideshow container dimensions on initiation or window resize
    if (setting == "desktop"){
      if (aspectRatio <= 1.5) {
        $(".orbit-container").height("38vw");
        $('#slideshowModal').data("css-top", 80); //sets correct animation end on open
        $('#slideshowModal').css("top", "80px"); //sets correct offset on window resize
      } else if (aspectRatio > 1.5 && aspectRatio <= 1.85){
        $(".orbit-container").height("32vw");
        $('#slideshowModal').data("css-top", 70);
        $('#slideshowModal').css("top", "70px");
      } else if (aspectRatio > 1.85){
        $(".orbit-container").height("26vw");
        $('#slideshowModal').data("css-top", 60);
        $('#slideshowModal').css("top", "60px");
      };
      imageSize = "large";
    } else {
      $(".orbit-container").height("44vw");
      imageSize = "small";
    };

    //change the image sizes if screen size jumps breakpoint
    if (imageSets[currentFeature]){
      var imageSet = imageSets[currentFeature];
      for (var i=0; i<imageSet.length; i++){
        if ($("#li_"+i+" .twentytwenty-before").attr("src")!=imageSet[i]["historic_"+imageSize]){
          $("#li_"+i+" .twentytwenty-before").attr("src", imageSet[i]["historic_"+imageSize]);
          $("#li_"+i+" .twentytwenty-after").attr("src", imageSet[i]["current_"+imageSize]);
        };
      };
    };
  };

  $('#slideshowModal').on('open.fndtn.reveal', function (){
    $(".leaflet-buttons-control-img").hide(); //hide findme button
    clearTimeout(leafletTimeout);
    var imageSet = imageSets[currentFeature];
    $("#slideshow_texts").html(imageSet[0].image_texts);
  });

  $('#slideshowModal').on('opened.fndtn.reveal', function (){
    //hack--requires manual activation to see first slide
    var firstSlide = $("#imagesList").find("li:first");
    firstSlide.attr("class","active");
    var ofSlides = $(".orbit-slide-number").find("span:last");
    var numberOfSlides = PointsofInterest.features[siteID].properties.imageSet.length + 1;
    ofSlides.text(numberOfSlides);

    orbitHeight();

    $(".twentytwenty-container").twentytwenty(); //still not sure this always fires at right time
  });

  $('#slideshowModal').on('close.fndtn.reveal', function (){
    //when last slideshow closes, remove highlighted route
    sid += siteID===4 ? 1 : 0;
    if (sid===6){ highlightLayer ? map.removeLayer(highlightLayer) : null };
  });

  //make changes after each slide transition
  $("#slideshow_images").on("after-slide-change.fndtn.orbit", function(event, orbit) {
    imageSet = imageSets[currentFeature];
    // description texts change as slide goes
    if (orbit.slide_number < orbit.total_slides-1){ //if we're not on the final slide of current window
      $("#slideshow_texts").html(imageSet[orbit.slide_number].image_texts);
      if (siteID === 4){ $(".orbit-slide-number").css("opacity",1); };
    } else if (orbit.slide_number === orbit.total_slides-1){ //if we are on the final slide
      if (siteID === 4){
        $("#slideshow_texts").html("");
        $(".orbit-slide-number").css("opacity",0);
      } else if (siteID < 4){ //if we're not on the final slideshow, show this message 
        $("#slideshow_texts").html("After closing this slide show window, you will be guided by the highted route to the next landmark. If you want to explore more on this landmark, take the chance to navigate through images using previous or next buttons.");
      }
    }
  });

  $("#infoModal, #helpModal, #assignmentModal").on("open.fndtn.reveal", function(){
    if (setting == "desktop"){ resizeModal($(this)); };
  });

  $(".reveal-modal").on('open.fndtn.reveal', function(){
    $(".leaflet-buttons-control-img").hide(); //hide findme button
    clearTimeout(leafletTimeout);
  });

  $(".reveal-modal").on('closed.fndtn.reveal', function(){
    if (setting == "mobile" || mobileOS == true){
      leafletTimeout = setTimeout(function(){ $(".leaflet-buttons-control-img").show() }, 1000);
    };
  });

  /***RESPONSIVE LAYOUT***/

  function getWinDimensions(){
    return [$(window).height(), $(window).width()];
  };

  function setLayout() {
    winDims = getWinDimensions();
    var cHeight = winDims[0], winWidth = winDims[1];
    setting = winWidth > 640 ? "desktop" : "mobile";
    aspectRatio = winWidth/cHeight;
    switchElements(winWidth, cHeight);
    adjustIconBubble();
  };

  function switchElements(width,height,screen,pos){
    $("#splashContainer").height($("body").height());
    if(setting == "desktop"){ 
      //@large screen
      $(".reveal-modal").removeClass("full");
      $(".reveal-modal").addClass("large");
      $('.leaflet-control-zoom').show();

      //prevent audio element overflow
      if (winDims[1]-$(".left").width() > 120 && !iOS){
        $("audio").css("width", winDims[1] - $(".left").width()-20);
      } else {
        $("audio").css("width",0);
      };

      if (!mobileOS){
        $(".leaflet-buttons-control-img").hide();
      } else {
        $(".leaflet-buttons-control-img").show();
      };
      $("html").scrollTop(0);

    } else { 
      // @small screen
      $(".reveal-modal").removeClass("large");
      $(".reveal-modal").addClass("full");
      $("#audioText").show();
      $('.leaflet-control-zoom').hide();
      var oheight = height-90;
      $("audio").css("width","");

      //show find me button only if no modal is open
      var showFindMe = true;
      $(".reveal-modal").each(function(){
        if ($(this).hasClass("open")){
          showFindMe = false;
        };
      });
      if (showFindMe){
        $(".leaflet-buttons-control-img").show();
      };
    };

    orbitHeight();
  };
}; //end of data callback

function cacheloading(){
  var loadingTimeout = setTimeout(cacheloaded, 30000);
  
  var i = 0;
  $(window.applicationCache).on("progress", function(){
	  console.log("progress");
    clearTimeout(loadingTimeout);
    if (i === 450){ cacheloaded() }; //i must equal number of files to be cached in manifest
    i++;
    loadingTimeout = setTimeout(cacheloaded, 30000 - (i * 66)); //reduce timespan on each progress event
  });
  
  $(window.applicationCache).on("cached", function(){
    console.log("cached");
    cacheloaded();
  });
  
  $(window.applicationCache).on("noupdate", function(){
    console.log("noupdate");
    cacheloaded();
  });
  
  $(window.applicationCache).on("error", function(){
    console.log("error");
    cacheerror();
  });
};

function cacheloaded(){
  $("#loading img").attr("src","images/globe.png");
  $("#loading span").attr("id","loaded");
  $("#loading span").text('You may now use this application offline. Without an internet connection, your map range will be more limited, but adequate for module use.');
};

function cacheerror(){
  $("#loading img").attr("src","images/globeerror.png");
  $("#loading span").attr("id","error");
  $("#loading span").text('There was a problem loading the offline cache. If you might lose internet connection while using this application, please hit your browser\'s "reload" button now.');
};

function loadmap(){
  map = L.map('map', { 
    zoomControl: false,
    attributionControl: false,
    maxZoom: 18,
    minZoom: 14,
    maxBounds: [
      [43.0371,-89.452674],
      [43.129626,-89.306419]
    ],
    //center: [43.076364, -89.384336], //this might be causing the Chrome freeze bug?
    zoom: 14
  });
  L.control.zoom({position: "topleft"}).addTo(map); //in case we want to switch its position

  //tiles from Mapbox; can alter in Mapbox Studio if desired  
  //OLDBASE mapTileLayer = L.tileLayer("http://a.tiles.mapbox.com/v3/northlandiguana.lni7i40a/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoibm9ydGhsYW5kaWd1YW5hIiwiYSI6IldJU1N4Y0UifQ.wpNgLPfnWQOBDWCgynJRiw").addTo(map);
  mapTileLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	});
  
  
  mapTileLayer.addTo(map);



  var findMeOptions = {
      'iconUrl': './images/findme.png',  // string
      'onClick': findme_button_onClick,  // callback function
      'maxWidth': 30,  // number
      'doToggle': false,  // bool
      'toggleStatus': false  // bool
  };  

  var findMeButton = new L.Control.Button(findMeOptions).addTo(map);
};

function findme_button_onClick() { //where is this accessed?
  getLocation(map);
};

function imgError(image, alturl){
  //fall back to small slideshow images if offline
  image.src = alturl;
};

function resizeModal(modal){
  var cHeight = $("#container").height();
  var rmTop = parseInt(modal.css("top"));
  var rmHeight = modal.height();
  if (rmHeight > cHeight){
    modal.height(cHeight - (rmTop * 2));
  };
};

function getLocation(map){
  map.locate({setView:false, watch:true, enableHighAccuracy: true} );

  function onLocationFound(e){
    var radius = e.accuracy / 2;

    // removes marker and circle before adding a new one
    if(firstLocate===false){
      map.removeLayer(circle);
      map.removeLayer(locationMarker);
    };

    //adds location and accuracy information to the map
    if(e.accuracy<90){
      circle = L.circle(e.latlng, radius).addTo(map);
      locationMarker = L.marker(e.latlng).addTo(map).bindPopup("You are within " + Math.round(radius) + " meters of this point");
      firstLocate = false;
    };

    //if accuracy is less than 60m then stop calling locate function
    if(e.accuracy<40){
      var count = 0;
      map.stopLocate();
      count++;
    };

    var cZoom = map.getZoom();
    map.setView(e.latlng, cZoom);
    removeFoundMarker(circle, locationMarker);
  };

  map.on('locationfound', onLocationFound);

};

function removeFoundMarker(circle, marker){
  setTimeout(function() {
    map.removeLayer(circle);
    map.removeLayer(marker);
  }, 10000);
};

function setHelp(help){

}