
let app;
let map;
let neighborhood_markers = 
[
    {location: [44.942068, -93.020521], marker: null, number: 1, name: 'Conway/Battlecreek/Highwood'},
    {location: [44.977413, -93.025156], marker: null, number: 2, name: 'Greater East Side'},
    {location: [44.931244, -93.079578], marker: null, number: 3, name: 'West Side'},
    {location: [44.956192, -93.060189], marker: null, number: 4, name: 'Dayton\'s Bluff'},
    {location: [44.978883, -93.068163], marker: null, number: 5, name: 'Payne/Phalen'},
    {location: [44.975766, -93.113887], marker: null, number: 6, name: 'North End'},
    {location: [44.959639, -93.121271], marker: null, number: 7, name: 'Thomas/Dale'},
    {location: [44.947700, -93.128505], marker: null, number: 8, name: 'Summit/University'},
    {location: [44.930276, -93.119911], marker: null, number: 9, name: 'West Seventh'},
    {location: [44.982752, -93.147910], marker: null, number: 10, name: 'Como'},
    {location: [44.963631, -93.167548], marker: null, number: 11, name: 'Hamline/Midway'},
    {location: [44.973971, -93.197965], marker: null, number: 12, name: 'St. Anthony'},
    {location: [44.949043, -93.178261], marker: null, number: 13, name: 'Union Park'},
    {location: [44.934848, -93.176736], marker: null, number: 14, name: 'Macalester-Groveland'},
    {location: [44.913106, -93.170779], marker: null, number: 15, name: 'Highland'},
    {location: [44.937705, -93.136997], marker: null, number: 16, name: 'Summit Hill'},
    {location: [44.949203, -93.093739], marker: null, number: 17, name: 'Capital River'}
];

var myIcon = L.icon({
    iconUrl: '/imgs/crime_icon.png',
    iconAnchor: [15, 0]
});

var myIconHood = L.icon({
    iconUrl: '/imgs/neighborhood_icon.png',
    iconAnchor: [15, 0]
});

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
            centerLatNumeric: '',
            centerLngNumeric: '',
            query: { //Data that will be used to query our RESTful server
                incident_type: [], //Will have to change this to codes, because can't really query incidents by name. Also putting dummy values to test for now
                neighborhood_name: [], //Dummy data for testing
                start_date: '',
                end_date: '',
                start_time: '',
                end_time: '',
                limit: '',
                rows_returned: ''
            }
        }, 
        methods: {
            setTableRowColor(incident_type) {
                if(incident_type == "Theft" || incident_type == "Auto Theft" || incident_type == "Burglary" || incident_type == "Vandalism" || incident_type == "Robbery" || incident_type == "Graffiti" || incident_type == "Arson") {
                    return 'propertyCrimesBGColor';
                }
                else if(incident_type == "Murder" || incident_type == "Homicide" || incident_type == "Simple Asasult Dom." || incident_type == "Discharge" || incident_type == "Agg. Assault Dom." || incident_type == "Agg. Assault" || incident_type == "Rape") {
                    return 'violentCrimesBGColor'
                }
                else {
                    return 'otherCrimesBGColor'
                }
            },
            goToTableRowOnMap(incident_block, incident_date, incident_time, incident_type) {
                console.log(incident_block);
                incident_block_split = incident_block.split(" ");
                console.log(incident_block_split);
                incident_block_split[0] = incident_block_split[0].replaceAll('X', '0');
                console.log(incident_block_split);

                let streetNum = incident_block_split[0];
                let streetAddress = '';

                for(i=1; i<incident_block_split.length; i++) {
                    streetAddress = streetAddress + incident_block_split[i] + ' ';
                }
                
                console.log(streetAddress);
            
                var url = "https://nominatim.openstreetmap.org/search?street=" + streetNum + " " + streetAddress + "&city=St.Paul&State=Minnesota&format=json&accept-language=en";
            
                let promise = getJSON(url);
            
                promise.then((data) => {
                    if(data[0] === undefined){
                        alert("ERROR! This row is invalid");
                        return;
                    }
                    if(data[0].lon === undefined){
                        alert("ERROR! This row is invalid");
                        return;
                    }
                    if(data[0].lat === undefined){
                        alert("ERROR! This row is invalid");
                        return;
                    }
                    
                    let lon = data[0].lon;
                    let lat = data[0].lat;

                    if(lat < 44.8883383134382 || lat > 44.99159144730164){ 
                        alert("ERROR! This row is invalid");
                        return;
                    }
                
                    if(lon < -93.20744225904383 || lon > -93.0043790042584){
                        alert("ERROR! This row is invalid");
                        return;
                    }
            
                    console.log(lat +", "+ lon);
                    L.marker([lat, lon], {icon: myIcon}).addTo(map)
                    .bindPopup('' + streetNum + " " + streetAddress + "<br>" + incident_date + "<br>" + incident_time + "<br>" + incident_type)
                    .openPopup();
                    //scrollTo(0,0);
                    map.flyTo([lat, lon], 15);
            
                }).catch((error) => {
                    console.log(error);
                }); 
                
                
            }

        }
    });

    let initialDate = getJSON(crime_url + '/incidents');
    initialDate.then((data) => {
            app.info = data;
            app.query.rows_returned = data.length;
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

    initNeighborhoodTotalCrimes();
    getTotalCrimesPerHood();

    map.on('zoomend moveend', findVisibleNeighborHoods);
    map.on('zoomend moveend', updateCenterCoordinates);
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

function getTotalCrimesPerHood(){
    return new Promise((resolve, reject) => {
        let num = 0;
        neighborhood_markers.forEach(hood => {
            let url = "http://localhost:8000/incidents?neighborhood=" + hood.number + "&limit=400000";
            //console.log('URL: '+ url);
   
           let hoodIncidents = getJSON(url);

           hoodIncidents.then((Data) => {
               hood.marker = Data.length;
               num++;
               if(num >= 17){
                   resolve(num);
               }
           });
        });
    });
}

function initNeighborhoodTotalCrimes() {
    
    let initTotalCrimes = getTotalCrimesPerHood();

    initTotalCrimes.then((data) => {
        neighborhood_markers.forEach(hood => {
            L.marker(hood.location, {icon: myIconHood}).addTo(map)
            .bindPopup("Neighborhood: " + hood.name + "<br> Neighborhood #: " + hood.number + '<br> Total Crimes: ' + hood.marker);
            //.openPopup();
        });
    });
}

function findVisibleNeighborHoods(){
    let bounds = map.getBounds();
    let maxLat = bounds._northEast.lat;
    let minLat = bounds._southWest.lat;
    let maxLng = bounds._northEast.lng;
    let minLng = bounds._southWest.lng;

    let visibleNeighborHoods = [];

    console.log('MaxLat: ' + maxLat + ' MinLat: ' + minLat + ' MaxLng: ' + maxLng + ' MinLng: ' + minLng);

    neighborhood_markers.forEach(hood => {
        let hoodLat = hood.location[0];
        let hoodLng = hood.location[1];

        if((hoodLat >= minLat && hoodLat<= maxLat) && (hoodLng >= minLng && hoodLng<= maxLng)){
            visibleNeighborHoods.push(hood.number);
        }
    });
    console.log(visibleNeighborHoods);
    
    let codes = getCodesArray(app.query.incident_type)
    console.log(codes);
    codes.then((codes_array) => {
        let url = creatUrlForQuery(codes_array, visibleNeighborHoods, app.query.limit, app.query.start_date, app.query.end_date, app.query.start_time, app.query.end_time)

        let filterdNeighborhoods = getJSON(url);
    filterdNeighborhoods.then((data) => {
        app.info = data;
        app.query.rows_returned = data.length;
    }).catch((error) => {
        console.log('Error:', error);
    });

    });
    
    //console.log(url);

    
}

/** 
 * Function for putting a marker on the map with the given search. Hooked to 'GO' button in Search By Address
 */
function searchAddress(){
    let streetNum = app.streetNumber;
    let streetAddress = app.streetName;
    
    streetNum = streetNum.replaceAll('X', 0);

    console.log(streetNum + " " + streetAddress);

    var url = "https://nominatim.openstreetmap.org/search?street=" + streetNum + " " + streetAddress + "&city=St.Paul&State=Minnesota&format=json&accept-language=en";

    let promise = getJSON(url);

    promise.then((data) => {
        let lon = data[0].lon;
        let lat = data[0].lat;

        console.log(lat +", "+ lon);

        if(lat < 44.8883383134382 || lat > 44.99159144730164){ //Have to change to error out if out of bounds, have to do this in searchAddress() as well
            alert("ERROR! This Location is outside of St. Paul");
            return;
        }
    
        if(lon < -93.20744225904383 || lon > -93.0043790042584){
            alert("ERROR! This Location is outside of St. Paul");
            return;
        }

        app.streetNumber = ''; //Makes sure these are reset
        app.streetName = '';

        
        L.marker([lat, lon]).addTo(map)
        .bindPopup('' + streetNum + " " + streetAddress)
        .openPopup();

        map.flyTo([lat, lon], 15);

    }).catch((error) => {
        alert("ERROR! This Location is outside of St. Paul or Invalid");
        console.log(error);
    }); 
}

/** 
 * Function for putting a marker on the map with the given longitude/latitude search. 
 * Hooked to 'GO' button in Search By Longitude & Latitude
 */
function searchLonLat(){
    let lon = app.longitude;
    let lat = app.latitude;
    
    lon = parseFloat(lon);
    lat = parseFloat(lat)

    if(lat < 44.8883383134382 || lat > 44.99159144730164){ //Have to change to error out if out of bounds, have to do this in searchAddress() as well
        alert("ERROR! Invalid Latitude: " + lat + "\nPlease enter a latitude between 44.888338 and 44.991591");
        return;
    }

    if(lon < -93.20744225904383 || lon > -93.0043790042584){
        alert("ERROR! Invalid Longitude: " + lon + "\nPlease enter a latitude between -93.207442 and -93.004379");
        return;
    }


    app.longitude = ''; //Makes sure these are reset
    app.latitude = '';

    console.log(lat +", "+ lon);

    L.marker([lat, lon]).addTo(map)
    .bindPopup('Latitude: ' + lat + ", Longitude" + lon)
    .openPopup();

    map.flyTo([lat, lon], 15);

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
    app.centerLatNumeric = Number((lat).toFixed(6));
    app.centerLngNumeric = Number((lon).toFixed(6));
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

    let codesArrayPromise = getCodesArray(incidentType);
    codesArrayPromise.then((codesArray) => {
        let url = creatUrlForQuery(codesArray, neighborhood, limit, startDate, endDate, startTime, endTime);
         console.log('URL: '+ url);

        let initialDate = getJSON(url);
        initialDate.then((data) => {
            app.info = data;
            app.query.rows_returned = data.length;
        }).catch((error) => {
            console.log('Error:', error);
        });
    });  
}

function resetFilter(){
    let url = 'http://localhost:8000/incidents/'

    let resetData = getJSON(url);
    resetData.then((data) => {
            app.info = data;
            app.query.rows_returned = data.length;
            //findVisibleNeighborHoods()
    }).catch((error) => {
        console.log('Error:', error);
    });
}

/**
 * Takes in a list of incident types and returns an array with all the codes associated with those incidents as an array.
 */
function getCodesArray(incidentTypes){
    let retCodes = [];
    let url = 'http://localhost:8000/codes?code_name='

    return new Promise((resolve, reject) => {
        incidentTypes.forEach(incident => {
            url += incident + ',';
        });

        if(incidentTypes.includes('Murder')){
            retCodes.push(100);  
        }
        
        url = url.slice(0,-1);

        let codesQuery = getJSON(url);
        
        codesQuery.then((query_rows) => {
            query_rows.forEach(row => {
                retCodes.push(row.code);
            });
            resolve(retCodes);
        }).catch((error) => {
            reject(error);
        });
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
