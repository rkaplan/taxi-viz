var map, svg, g;

function setupMapbox() {
  map = L.mapbox.map("map", "rkaplan.j3k8g195").setView([40.757369, -73.960791], 12);
  svg = d3.select(map.getPanes().overlayPane).append("svg");
  g = svg.append("g").attr("class", "leaflet-zoom-hide");
}


// var projection = d3.geo.mercator()
//         .center([-73.94, 40.70])
//         .scale(80000)
//         .translate([(width) / 2, (height)/2]);

// function renderBackground() {

//   d3.json("nyc.json", function(error, nyb) {

//     var path = d3.geo.path()
//         .projection(projection);

//     g.append("g")
//       .attr("id", "boroughs")
//       .selectAll(".state")
//       .data(nyb.features)
//       .enter().append("path")
//       .attr("class", function(d){ return d.properties.name; })
//       .attr("d", path);

//   });
// }

var transform = d3.geo.transform({point: projectPoint});
var path = d3.geo.path().projection(transform);
var startLocs;
var globalBounds;

function resetView() {
  var bounds = path.bounds(toFeatureCollection(startLocs));
  if (globalBounds) {
    if (bounds[0][0] < globalBounds[0][0]) globalBounds[0][0] = bounds[0][0];
    if (bounds[0][1] < globalBounds[0][1]) globalBounds[0][1] = bounds[0][1];
    if (bounds[1][0] > globalBounds[1][0]) globalBounds[1][0] = bounds[1][0];
    if (bounds[1][1] > globalBounds[1][1]) globalBounds[1][1] = bounds[1][1];
  } else {
    globalBounds = bounds;
  }

  var topLeft = globalBounds[0],
  bottomRight = globalBounds[1];

  svg.attr("width", bottomRight[0] - topLeft[0])
   .attr("height", bottomRight[1] - topLeft[1])
   .style("left", topLeft[0] + "px")
   .style("top", topLeft[1] + "px");

   g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

   // initialize the path data
   d3_features.attr("d", path)
    .style("fill-opacity", .1)
    .attr("fill", "red")
    .transition().duration(200).style("fill-opacity", .8)
    .transition().duration(5000).style("fill", "yellow")
    .transition().duration(10000).style("fill-opacity", ".1")
}

function processTripData(trips) {
  startLocs = _.map(trips, function(trip){ return trip.start_loc });

  // create path elements for each of the features
  d3_features = g.selectAll("path.unknown")
    .data(startLocs)
    .enter()
    .append("path")
    .attr("stroke-width", "1");

  resetView();

  // var pickupDate = new Date(Date.parse(trips[0].pickup_datetime["$date"]));
  // $("#latestTripDateTime").html(pickupDate.toUTCString());

  // svg.selectAll("circle.unknown")
  //   .data(_.map(trips, function(trip){ return trip.start_loc }))
  //   .enter()
  //   .append("circle")
  //   .attr("cx", function(d) { return projection(d.coordinates)[0] })
  //   .attr("cy", function(d) { return projection(d.coordinates)[1] })
  //   .attr("r", 1)
  //   .style("fill", "orange")
  //   .style("opacity", 0.15)

  // svg.selectAll("circle.unknown")
  //   .data(_.map(trips, function(trip){ return trip.end_loc }))
  //   .enter()
  //   .append("circle")
  //   .attr("cx", function(d) { return projection(d.coordinates)[0] })
  //   .attr("cy", function(d) { return projection(d.coordinates)[1] })
  //   .attr("r", 1)
  //   .style("fill", "blue")
  //   .style("opacity", 0.15)
}

function renderTrips() {
  var intervalId = setInterval(function() {
    d3.json("geo", function(error, trips) {


      if (trips === undefined || trips.length === 0) {
        clearInterval(intervalId);
      } else {
        processTripData(trips);
      }

    });
  }, 200);

  map.on("viewreset", resetView);
}

function toFeatureCollection(geojsonArr) {
  var features = [];

  for (var i = 0; i < geojsonArr.length; i++) {
    features.push({
      "type": "Feature",
      "geometry": geojsonArr[i]
    });
  }

  return {
    "type": "FeatureCollection",
    "features": features
  }
}

function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

setupMapbox();
// renderBackground();
renderTrips();