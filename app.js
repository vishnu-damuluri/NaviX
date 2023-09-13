mapboxgl.accessToken = 'pk.eyJ1IjoiYmx1ZWRmb3giLCJhIjoiY2xtZzU3aTBrMmQ4czNudGYxbXRzNGF5MiJ9.a0kVPn7QuqD5NGhw-DM9zw';

var map = new mapboxgl.Map({
    container: 'map-view',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.4194, 37.7749],
    zoom: 12
});

var coordinatesForm = document.getElementById("coordinates-form");

// Create a custom marker element for the bus icon
var busIcon = document.createElement('div');
busIcon.style.width = '50px'; // Adjust the width as needed
busIcon.style.height = '50px'; // Adjust the height as needed
busIcon.style.backgroundImage = 'url(bus-icon.png)'; // Set the bus icon image

var startMarker = new mapboxgl.Marker(busIcon, { color: 'red' });
var endMarker = new mapboxgl.Marker({ color: 'green' });

coordinatesForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var fromLatitude = parseFloat(document.getElementById("from-latitude").value);
    var fromLongitude = parseFloat(document.getElementById("from-longitude").value);
    var toLatitude = parseFloat(document.getElementById("to-latitude").value);
    var toLongitude = parseFloat(document.getElementById("to-longitude").value);

    var coordinates = [
        [fromLongitude, fromLatitude],
        [toLongitude, toLatitude]
    ];

    // Remove any existing route layer
    if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
    }

    // Calculate the route using Mapbox Directions API
    var directionsRequest = {
        coordinates: coordinates,
        profile: 'driving',
        alternatives: false,
        exclude: 'traffic' // Exclude traffic data
    };
    

    fetch('https://api.mapbox.com/directions/v5/mapbox/driving/' + coordinates.join(';') + '?geometries=geojson&access_token=' + mapboxgl.accessToken)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var routeGeoJSON = data.routes[0].geometry;
            var eta = data.routes[0].duration / 60; // ETA in minutes

            // Add a GeoJSON source for the route
            map.addSource('route', {
                'type': 'geojson',
                'data': routeGeoJSON
            });

            // Add a layer to display the route
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': 'blue',
                    'line-width': 4
                }
            });

            // Fit the map to the route
            var bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[1]);
            map.fitBounds(bounds, { padding: 50 });

            // Set markers for starting and ending locations
            startMarker.setLngLat([fromLongitude, fromLatitude]).addTo(map);
            endMarker.setLngLat([toLongitude, toLatitude]).addTo(map);

            // Display the ETA
            document.getElementById("eta-display").innerHTML = "Estimated Time of Arrival: " + eta.toFixed(2) + " minutes";
        })
        .catch(function (error) {
            console.error(error);
        });
});
