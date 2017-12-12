var HOST = "http://178.62.74.44:80";

var URLS = {
    getParties: "/parties/"
};

var map;
var posMarker;

var curIcon = L.ExtraMarkers.icon({
    icon: 'fa-crosshairs',
    iconColor: 'white',
    markerColor: 'blue',
    shape: 'square',
    prefix: 'fa'
});

var partyIcon = L.ExtraMarkers.icon({
    icon: 'fa-music',
    iconColor: 'white',
    markerColor: 'green',
    shape: 'circle',
    prefix: 'fa'
});

function onLoad() {
    console.log("In onLoad.");
    document.addEventListener('deviceready', onDeviceReady, false);
}

function onDeviceReady() {
    makeBasicMap();
    getCurrentlocation();

    watchID = navigator.geolocation.watchPosition(
        function (pos) {
            console.log("Watch ID: " + watchID + ": Got position -> " + JSON.stringify(pos));
        },
        function (err) {
            console.log("Watch ID: " + watchID + ": Location error: " + JSON.stringify(err));
        },
        {
            timeout: 10000
        }
    );
}

function showOkAlert(message) {
    navigator.notification.alert(message, null, "WMAP 2018", "OK");
}

function getCurrentlocation() {
    console.log("In getCurrentlocation.");
    var myLatLon;
    var myPos;



    navigator.geolocation.getCurrentPosition(
        function (pos) {
            console.log("Got location")
            // myLatLon = L.latLng(pos.coords.latitude, pos.coords.longitude);
            myPos = new myGeoPosition(pos);
            console.log(myPos);

            sendPositionToApi(myPos);
            setMapToCurrentLocation();
        },
        function (err) {
            console.log("Location error: " + err.message);
        },
        {
            enableHighAccuracy: true,
            // maximumAge: 60000,
            timeout: 30000
        }
    );
}

function sendPositionToApi(pos) {
    $.ajax({
        type: "GET",
        url: HOST + URLS["getParties"],
        data: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
        },
        success: function(result) {
            console.log(result);
            addPartiesToMap(result);
        }
    });
}

function addPartiesToMap(parties) {
    for(var i = 0; i < parties.length; i++){
        var party = parties[i];
        var pos = L.latLng(party.location.coordinates[1],party.location.coordinates[0]);

        posMarker = L.marker(pos,{icon: partyIcon});
        posMarker.addTo(map);
        posMarker.bindPopup("<b>" + party.name + "</b><br> Genre: " + party.genre.name)

    }
}

function setMapToCurrentLocation() {
    console.log("In setMapToCurrentLocation.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        var myLatLon = L.latLng(myPos.coords.latitude, myPos.coords.longitude);

        if (map.hasLayer(posMarker)) {
            posMarker.remove();
        }

        posMarker = L.marker(myLatLon, {icon: curIcon});
        posMarker.addTo(map);
        map.flyTo(myLatLon, 15);
    }
}

function makeBasicMap() {
    console.log("In makeBasicMap.");
    map = L.map("map-var", {
        zoomControl: false,
        attributionControl: false
    }).fitWorld();
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        useCache: true
    }).addTo(map);

    map.on("click", function (evt) {
        if (localStorage.lastKnownCurrentPosition) {
            var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
            var myStartPoint = L.latLng(myPos.coords.latitude, myPos.coords.longitude);
        }

        var container = L.DomUtil.create('div'),
            destBtn = createButton('Directions to Here', container);

        L.popup()
            .setContent(container)
            .setLatLng(evt.latlng)
            .openOn(map);

        L.DomEvent.on(destBtn, 'click', function () {
            routingContol.setWaypoints([myStartPoint, evt.latlng]);
            map.closePopup();
        });

    });

    $("#leaflet-copyright").html("Leaflet | Map Tiles &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors");
}

function myGeoPosition(p) {
    this.coords = {};
    this.coords.latitude = p.coords.latitude;
    this.coords.longitude = p.coords.longitude;
    this.coords.accuracy = (p.coords.accuracy) ? p.coords.accuracy : 0;
    this.timestamp = (p.timestamp) ? p.timestamp : new Date().getTime();
}
