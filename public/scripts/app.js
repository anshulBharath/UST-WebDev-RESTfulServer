
let app;
let map;
let neighborhood_markers = 
[
    {location: [44.942068, -93.020521], marker: null},
    {location: [44.977413, -93.025156], marker: null},
    {location: [44.931244, -93.079578], marker: null},
    {location: [44.956192, -93.060189], marker: null},
    {location: [44.978883, -93.068163], marker: null},
    {location: [44.975766, -93.113887], marker: null},
    {location: [44.959639, -93.121271], marker: null},
    {location: [44.947700, -93.128505], marker: null},
    {location: [44.930276, -93.119911], marker: null},
    {location: [44.982752, -93.147910], marker: null},
    {location: [44.963631, -93.167548], marker: null},
    {location: [44.973971, -93.197965], marker: null},
    {location: [44.949043, -93.178261], marker: null},
    {location: [44.934848, -93.176736], marker: null},
    {location: [44.913106, -93.170779], marker: null},
    {location: [44.937705, -93.136997], marker: null},
    {location: [44.949203, -93.093739], marker: null}
];

function init() {
    let crime_url = 'http://localhost:8000';

    app = new Vue({
        el: '#app',
        data: {
            info: [],
            map: {
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: {lat: 45.008206, lng: -93.217977},
                    se: {lat: 44.883658, lng: -92.993787}
                }
            },
            streetNumber: '',
            streetName: '',
            longitude: '',
            latitude:'',
            centerLat:'Enter a Latitude',
            centerLng:'Enter a Longitude',
            query: { //Data that will be used to query our RESTful server
                incident_type: [], //Will have to change this to codes, because can't really query incidents by name. Also putting dummy values to test for now
                neighborhood_name: [], //Dummy data for testing
                start_date: '',
                end_date: '',
                start_time: '',
                end_time: '',
                limit: ''
            }
        }, 
        methods: {
            setTableRowColor(incident_type) {
                if(incident_type == "Theft" || incident_type == "Auto Theft" || incident_type == "Burglary" || incident_type == "Vandalism" || incident_type == "Robbery" || incident_type == "Graffiti" || incident_type == "Arson") {
                    return 'propertyCrimesBGColor';
                }
                else if(incident_type == "Simple Asasult Dom." || incident_type == "Discharge" || incident_type == "Agg. Assault Dom." || incident_type == "Agg. Assault" || incident_type == "Rape") {
                    return 'violentCrimesBGColor'
                }
                else {
                    return 'otherCrimesBGColor'
                }
            }
        }
        //mounted () {
            //axios
              //.get('http://localhost:8000/incidents')
              //.then(response => (this.info = response.data))
              //.then(response => (console.log(response.data)))
        //}
    });

    let initialDate = getJSON(crime_url + '/incidents');
    initialDate.then((data) => {
            app.info = data;
    }).catch((error) => {
        console.log('Error:', error);
    });

    map = L.map('leafletmap').setView([app.map.center.lat, app.map.center.lng], app.map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map);
    map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);
    
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map);

    getJSON('data/StPaulDistrictCouncil.geojson').then((result) => {
        // St. Paul GeoJSON
        $(result.features).each(function(key, value) {
            district_boundary.addData(value);
        });
    }).catch((error) => {
        console.log('Error:', error);
    });
}

function getJSON(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                resolve(data);
            },
            error: function(status, message) {
                reject({status: status.status, message: status.statusText});
            }
        });
    });
}

/** 
 * Function for putting a marker on the map with the given search. Hooked to 'GO' button in Search By Address
 */
function searchAddress(){
    console.log(app.streetNumber + " " + app.streetName);
    let streetNum = app.streetNumber;
    let streetAddress = app.streetName;
    

    app.streetNumber = ''; //Makes sure these are reset
    app.streetName = ''; 

    var url = "https://nominatim.openstreetmap.org/search?street=" + streetNum + " " + streetAddress + "&format=json&accept-language=en";

    let promise = getJSON(url);

    promise.then((data) => {
        let lon = data[0].lon;
        let lat = data[0].lat;

        console.log(lat +", "+ lon);
        L.marker([lat, lon]).addTo(map)
        .bindPopup('' + streetNum + " " + streetAddress)
        .openPopup();

    }).catch((error) => {
        console.log(error);
    }); 
}

/** 
 * Function for putting a marker on the map with the given longitude/latitude search. 
 * Hooked to 'GO' button in Search By Longitude & Latitude
 */
function searchLonLat(){
    console.log(app.latitude + " " + app.longitude);
    let lon = app.longitude;
    let lat = app.latitude;
    

    app.longitude = ''; //Makes sure these are reset
    app.latitude = '';
    
    if(lon == 42){ //Have to change to error out if out of bounds, have to do this in searchAddress() as well
        alert("ERROR!");
    }

    console.log(lat +", "+ lon);

    L.marker([lat, lon]).addTo(map)
    .bindPopup('Latitude: ' + lat + ", Longitude" + lon)
    .openPopup();

    map.flyTo([lat, lon]);

}

/**
 * Updates the center coordinates. Bound to places holder of longitude and latitude text input
 */
function updateCenterCoordinates() {
    let center = map.getCenter() //Gets the center latlng once stop pane
    let lat = center.lat;
    let lon = center.lng;

    app.centerLat = 'Center Latitude: ' + lat;
    app.centerLng = 'Center Longitude: ' + lon;
}

/**
 * This run a query to our REST server.
 */
function filterIncidents(){
    let incidentType = app.query.incident_type; //Will be an array
    let neighborhood = app.query.neighborhood_name; //Will be an array
    let startDate = app.query.start_date;
    let endDate = app.query.end_date;
    let startTime = app.query.start_time;
    let endTime = app.query.end_time;
    let limit = app.query.limit;

    //May have to reset these values, not sure of behavior yet.

    console.log("Incidents: " + incidentType);
    console.log("Neighborhoods: " + neighborhood);
    console.log("limit: " + limit);
    console.log("Start Date: " + startDate);
    console.log("End Date: " + endDate);
    console.log("Start Time: " + startTime);
    console.log("End Time: " + endTime);

    let url = creatUrlForQuery(incidentType, neighborhood, limit, startDate, endDate, startTime, endTime);
    console.log(url);

    let initialDate = getJSON(url);
    initialDate.then((data) => {
            app.info = data;
    }).catch((error) => {
        console.log('Error:', error);
    });
}

/**
 * Returns a string of the url that we will use to query to our REST server 
 */
function creatUrlForQuery(codes, neighborhoods, limit, startDate, endDate, startTime, endTime) {
    let url = "http://localhost:8000/incidents?" //String length 32

    let tempString = '';

    if(codes.length > 0){
        tempString += 'code='
        for(let i in codes){
            tempString += codes[i] + ",";
        }
        tempString = tempString.slice(0,-1); //Removes extra comma

        url += tempString;
        url += '&';
    } 
    
    tempString = '';
    if(neighborhoods.length > 0){
        tempString += 'neighborhood='
        for(let i in neighborhoods){
            tempString += neighborhoods[i] + ",";
        }
        tempString = tempString.slice(0,-1); //Removes extra comma
          
        url += tempString;
        url += '&';
    }
    
    tempString = '';
    if(startDate.length > 0){
        tempString += 'start_date=' + startDate;
         
        url += tempString;
        url += '&';
    }

    tempString = '';
    if(endDate.length > 0){
        tempString += 'end_date=' + endDate;
         
        url += tempString;
        url += '&';
    }

    tempString = '';
    if(startTime.length > 0){
        tempString += 'start_time=' + startTime;
         
        url += tempString;
        url += '&';
    }

    tempString = '';
    if(endTime.length > 0){
        tempString += 'end_time=' + endTime;
         
        url += tempString;
        url += '&';
    }

    tempString = '';
    if(limit.length > 0){
        tempString += 'limit=' + limit;
         
        url += tempString;
        url += '&';
    }
    
    url = url.slice(0,-1); //removes the extra & at the end

    return url;     
}
