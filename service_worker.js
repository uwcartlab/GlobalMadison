/*self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                './audio/',
                './audio/intro_1.mp3',
                './audio/intro_2.mp3',
                './audio/site1.mp3',
                './audio/site2.mp3',
                './audio/site3.mp3',
                './audio/site4.mp3',
                './audio/site5.mp3',
                './audio/intro_1.base64',
                './audio/intro_2.base64',
                './audio/site1.base64',
                './audio/site2.base64',
                './audio/site3.base64',
                './audio/site4.base64',
                './audio/site5.base64',
                './img/',
                './img/site1_1_cl.jpg',
                './img/site1_1_cs.jpg',
                './img/site1_1_cs.png',
                './img/site1_1_hl.jpg',
                './img/site1_1_hs.jpg',
                './img/site1_2_cl.jpg',
                './img/site1_2_cs.jpg',
                './img/site1_2_hl.jpg',
                './img/site1_2_hs.jpg',
                './img/site1_3_cl.jpg',
                './img/site1_3_cs.jpg',
                './img/site1_3_hl.jpg',
                './img/site1_3_hs.jpg',
                './img/site2_1_cl.jpg',
                './img/site2_1_cs.png',
                './img/site2_1_cs.jpg',
                './img/site2_1_hl.jpg',
                './img/site2_1_hs.jpg',
                './img/site2_2_cl.jpg',
                './img/site2_2_cs.jpg',
                './img/site2_2_hl.jpg',
                './img/site2_2_hs.jpg',
                './img/site2_3_cl.jpg',
                './img/site2_3_cs.jpg',
                './img/site2_3_hl.jpg',
                './img/site2_3_hs.jpg',
                './img/site3_1_cl.jpg',
                './img/site3_1_cs.jpg',
                './img/site3_1_hl.jpg',
                './img/site3_1_hs.jpg',
                './img/site3_2_cl.jpg',
                './img/site3_2_cs.jpg',
                './img/site3_2_hl.jpg',
                './img/site3_2_hs.jpg',
                './img/site3_3_cl.jpg',
                './img/site3_3_cs.jpg',
                './img/site3_3_hl.jpg',
                './img/site3_3_hs.jpg',
                './img/site3_3_hs.png',
                './img/site4_1_cl.jpg',
                './img/site4_1_cs.jpg',
                './img/site4_1_cs.png',
                './img/site4_1_hl.jpg',
                './img/site4_1_hs.jpg',
                './img/site4_2_cl.jpg',
                './img/site4_2_cs.jpg',
                './img/site4_2_hl.jpg',
                './img/site4_2_hs.jpg',
                './img/site4_3_cl.jpg',
                './img/site4_3_cs.jpg',
                './img/site4_3_hl.jpg',
                './img/site4_3_hs.jpg',
                './img/site5_1_cl.jpg',
                './img/site5_1_cs.jpg',
                './img/site5_1_cs.png',
                './img/site5_1_hl.jpg',
                './img/site5_1_hs.jpg',
                './img/site5_2_cl.jpg',
                './img/site5_2_cs.jpg',
                './img/site5_2_hl.jpg',
                './img/site5_2_hs.jpg',
                './img/site5_3_cl.jpg',
                './img/site5_3_cs.jpg',
                './img/site5_3_hl.jpg',
                './img/site5_3_hs.jpg',
                './img/splashbackground_desktop.jpg',
                './img/splashbackground.jpg',
                './img/loading.gif',
                './img/icons/alert40_red.png',
                './img/icons/assignment.png',
                './img/icons/coffee24_red.png',
                './img/icons/coffee24.png',
                './img/icons/coffee36.png',
                './img/icons/coffee40_red.png',
                './img/icons/energy24_red.png',
                './img/icons/energy24.png',
                './img/icons/energy36.png',
                './img/icons/energy40_red.png',
                './img/icons/findme.png',
                './img/icons/globe.png',
                './img/icons/globeerror.png',
                './img/icons/headphones.png',
                './img/icons/help.png',
                './img/icons/housing24_red.png',
                './img/icons/housing24.png',
                './img/icons/housing36.png',
                './img/icons/housing40_red.png',
                './img/icons/information.png',
                './img/icons/labor24_red.png',
                './img/icons/labor24.png',
                './img/icons/labor36.png',
                './img/icons/labor40_red.png',
                './img/icons/landmarks.png',
                './img/icons/menu-gray.png',
                './img/icons/menu-white.png',
                './img/icons/text.png',
                './img/icons/transportation24_red.png',
                './img/icons/transportation24.png',
                './img/icons/transportation36.png',
                './img/icons/transportation40_red.png',
                './img/points/point1_1.jpg',
                './img/points/point2_1.jpg',
                './img/points/point3_1.jpg',
                './img/points/point3_2.jpg',
                './img/points/point4_1.jpg',
                './img/points/point5_1.jpg',
                './img/points/point5_2.jpg',
                './img/points/point6_1.jpg',
                './img/points/point6_2.jpg',
                './img/points/point7_1.jpg',
                './img/points/point7_2.jpg',
                './img/points/point8_1.jpg',
                './img/points/point8_2.jpg',
                './img/points/point9_1.jpg',
                './img/points/point10_1.jpg',
                './img/points/point10_2.jpg',
                './img/points/point11_1.jpg',
                './img/points/point12_1.jpg',
                './img/points/point12_2.jpg',
                './img/points/point13_1.jpg',
                './img/points/point14_1.jpg',
                './img/points/point14_2.jpg',
                './img/points/point15_1.jpg',
                './img/points/point16_1.jpg',
                './img/points/point17_1.jpg',
                './img/points/point17_2.jpg',
                './img/points/point18_1.jpg',
                './img/points/point18_2.jpg',
                './img/points/point19_1.jpg',
                './img/points/point19_1.jpg',
                './img/points/point20_1.jpg',
                './img/points/point21_1.jpg',
                './img/points/point21_2.jpg',
                './img/points/point22_1.jpg',
                './img/points/point23_1.jpg',
                './img/points/point23_2.jpg',
                './img/points/point24_1.jpg',
                './img/points/point24_2.jpg',
                './img/points/point25_1.jpg',
                './img/points/point25_2.jpg',
                './img/points/point26_1.jpg',
                './img/points/point27_1.jpg',
                './img/points/point28_1.jpg',
                './img/points/point29_1.jpg',
                './img/points/point30_1.jpg',
                './img/points/point31_1.jpg',
                './img/points/point31_2.jpg',
                './img/points/point32_1.jpg',
                './img/points/point33_1.jpg',
                './img/points/point34_1.jpg',
                './img/points/point35_1.jpg',
                './img/points/point35_2.jpg',
                './img/points/point36_1.jpg',
                './img/points/point37_1.jpg',
                './img/points/point37_2.jpg',
                './img/points/point38_1.jpg',
                './img/points/point38_2.jpg',
                './img/points/point39_1.jpg',
                './img/points/point39_2.jpg',
                './img/points/point40_1.jpg',
                './img/points/point40_2.jpg',
                './css/',
                './css/style.css',
                './data/',
                './data/alerts.geojson',
                './data/PointsofInterest.geojson',
                './data/routes.geojson',
                './js/',
                './js/findMeButton.js',
                './js/main.js',
                './lib/',
                './lib/bootstrap.css',
                './lib/bootstrap.js',
                './lib/d3.js',
                './lib/jquery-3.6.0.min.js',
                './lib/juxtapose.css',
                './lib/juxtapose.js',
                './lib/leaflet/leaflet-src.esm.js',
                './lib/leaflet/leaflet-src.esm.js.map',
                './lib/leaflet/leaflet-src.js',
                './lib/leaflet/leaflet-src.js.map',
                './lib/leaflet/leaflet.js',
                './lib/leaflet/leaflet.css',
                './lib/leaflet/leaflet.js.map',
                './lib/leaflet/images/layers-2x.png',
                './lib/leaflet/images/layers.png',
                './lib/leaflet/images/marker-icon-2x.png',
                './lib/leaflet/images/marker-icon.png',
                './lib/leaflet/images/marker-shadow.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});*/