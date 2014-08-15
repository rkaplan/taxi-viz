var map, svg, g;

function setupMapbox() {
  map = L.mapbox.map("map", "rkaplan.j3k8g195").setView([40.757369, -73.960791], 13);
  svg = d3.select(map.getPanes().overlayPane).append("svg");
  g = svg.append("g").attr("class", "leaflet-zoom-hide");
}

var transform = d3.geo.transform({point: projectPoint});
var path = d3.geo.path().projection(transform);
var startLocs;
var globalBounds;

allPointsFeatColl = {
  "type": "FeatureCollection",
  "features": []
};

function updateGlobalBounds(curBounds) {
  if (globalBounds) {
    if (curBounds[0][0] < globalBounds[0][0]) globalBounds[0][0] = curBounds[0][0];
    if (curBounds[0][1] < globalBounds[0][1]) globalBounds[0][1] = curBounds[0][1];
    if (curBounds[1][0] > globalBounds[1][0]) globalBounds[1][0] = curBounds[1][0];
    if (curBounds[1][1] > globalBounds[1][1]) globalBounds[1][1] = curBounds[1][1];
  } else {
    globalBounds = curBounds;
  }
}

function resetView(userDidZoom) {
  console.log("resetview!")

  var bounds = path.bounds(allPointsFeatColl);

  console.log("globalBounds:")
  console.log(globalBounds);
  console.log("bounds:")
  console.log(bounds)

  updateGlobalBounds(bounds);
  var topLeft = globalBounds[0],
  bottomRight = globalBounds[1];

  console.log("topLeft: ", topLeft, " bottomRight: ", bottomRight)

  svg.attr("width", bottomRight[0] - topLeft[0])
   .attr("height", bottomRight[1] - topLeft[1])
   .style("left", topLeft[0] + "px")
   .style("top", topLeft[1] + "px");

   g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

   // initialize the path data

   if (userDidZoom) {
      d3_features = g.selectAll("path.unknown")
      .data(_.map(allPointsFeatColl.features, function(feature) { return feature.geometry }))
      .enter()
      .append("path")

      path.pointRadius(3)
      d3_features.attr("d", path)
      .style("fill-opacity", .5)
      .attr("fill", "yellow")
      .transition().duration(10000).style("fill-opacity", ".1")

      cleanTripsStuckToPixels();
   } else {
     path.pointRadius(3)
     d3_features.attr("d", path)
      .style("fill-opacity", .1)
      .attr("fill", "red")
      .transition().duration(200).style("fill-opacity", .8)
      .transition().duration(5000).style("fill", "yellow")
      .transition().duration(10000).style("fill-opacity", ".1")

     path.pointRadius(8)
     d3_centerpoint.attr("d", path)
      .style("fill-opacity", .8)
      .attr("fill", "green")
      .transition().duration(500).style("fill-opacity", 0)
   }
}

function getDuplicateElementIndex(paths) {
  for (var i = paths.length - 2; i >= 0; i--) { // -2 to skip very last element; we know it's green
    if (paths[i].getAttribute("fill") === "green")
      return i;
  }
  return -1;
}

function cleanTripsStuckToPixels() {
  var paths = $("g.leaflet-zoom-hide").children();
  var dupElementEnd = getDuplicateElementIndex(paths);
  for (var i = dupElementEnd; i >= 0; i--) {
    paths[i].remove();
  }
}

function processTripData(trips) {
  var centerPoint = trips.pop();
  console.log(centerPoint);

  startLocs = _.map(trips, function(trip){ return trip.start_loc });
  updateFeatures(startLocs);

  // create path elements for each of the features
  d3_features = g.selectAll("path.unknown")
    .data(startLocs)
    // .data(_.map(allPointsFeatColl.features, function(feature) { return feature.geometry }))
    .enter()
    .append("path")

  d3_centerpoint = g.selectAll("path.unknown")
    .data([centerPoint])
    .enter()
    .append("path")

  resetView();
  // cleanTripsStuckToPixels();

  var pickupDate = new Date(Date.parse(trips[0].pickup_datetime["$date"]));
  $("#latestTripDateTime").html(pickupDate.toUTCString());

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
  // for (var i = 0; i < 10; i++) {
    d3.json("geo", function(error, trips) {
      if (trips === undefined || trips.length === 0) {
        clearInterval(intervalId);
      } else {
        processTripData(trips);
      }
    });
  // }
  }, 200);

  map.on("viewreset", function() { resetView(true); });
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

function updateFeatures(geojsonArr) {
  for (var i = 0; i < geojsonArr.length; i++) {
    allPointsFeatColl.features.push({
      "type": "Feature",
      "geometry": geojsonArr[i]
    });
  }
}

function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

setupMapbox();
// renderBackground();
renderTrips();
// $('.leaflet-control-zoom').hide();