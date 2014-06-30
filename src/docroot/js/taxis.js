var width = 960,
   height = 600;

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);
var g = svg.append("g");
var projection = d3.geo.mercator()
        .center([-73.94, 40.70])
        .scale(80000)
        .translate([(width) / 2, (height)/2]);

function renderBackground() {

  d3.json("nyc.json", function(error, nyb) {

    var path = d3.geo.path()
        .projection(projection);

    g.append("g")
      .attr("id", "boroughs")
      .selectAll(".state")
      .data(nyb.features)
      .enter().append("path")
      .attr("class", function(d){ return d.properties.name; })
      .attr("d", path);

  });
}

function renderTrips() {
  var intervalId = setInterval(function() {
    d3.json("geo", function(error, trips) {

      if (trips === undefined || trips.length === 0) {
        clearInterval(intervalId);
      } else {
        var pickupDate = new Date(Date.parse(trips[0].pickup_datetime["$date"]));
        $("#latestTripDateTime").html(pickupDate.toUTCString());

        svg.selectAll("circle.unknown")
          .data(_.map(trips, function(trip){ return trip.start_loc }))
          .enter()
          .append("circle")
          .attr("cx", function(d) { return projection(d.coordinates)[0] })
          .attr("cy", function(d) { return projection(d.coordinates)[1] })
          .attr("r", 1)
          .style("fill", "orange")
          .style("opacity", 0.15)
      }

    });
  }, 100);

  // setTimeout(function(){ clearInterval(intervalId); }, 2000);
}

renderBackground();
renderTrips();