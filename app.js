/* global $,d3,_ */
$(function() {
//   var data = {
//     cantons : [
//         { name : "a" },
//         { name : "b" },
//         { name : "c" },
//         { name : "d" }
//     ],
//     matrix : [
//         [ 0, 1, 1, 1 ],
//         [ 1, 0, 1, 1 ],
//         [ 1, 1, 0, 1 ],
//         [ 1, 1, 1, 0 ]
//     ]
// };


function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var width = 800,
    height = 800,
    outerRadius = Math.min(width, height) / 2 - 10,
    innerRadius = outerRadius - 24;

var metadata = $("#metadata"),
    metadataTemplate = _.template($("#cityMetadata").html());

var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var layout = d3.layout.chord()
    .padding(0.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);

var path = d3.svg.chord()
    .radius(innerRadius);

var svg = d3.select("#chord").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("circle")
    .attr("r", outerRadius);

var locationDetails = d3.select("#chord svg").append("g")
  .attr("id", "locationData")
  .attr("transform", "translate("+(width/2)+","+(height/2)+")");

locationDetails.append("text")
  .attr("id", "location");

locationDetails.append("text")
  .attr("id", "locationSubtext")
  .attr("y", 50);

var currentScale = "province", colorScales, getColor, fetchedData;

var provinces = [], migrants = [], residents = [];

function initControls() {
  $("#controls li a").click(function(e) {
    e.preventDefault();

    var $el = $(e.target);
    var coloring = $el.attr("id");

    // if it"s a different scale
    if (currentScale !== coloring) {

      // remove all selected
      $("#controls li.selected").removeClass("selected");

      // mark current as selected
      $el.parent().addClass("selected");

      currentScale = coloring;

      var scale = updateColor();
      makeLegend(scale);
    }

    return false;
  });
}


function updateColor() {

  var group = d3.selectAll("path.group");
  var chordSelection = d3.selectAll("path.chord");

  group.style("fill", function(d, i) { return getColor(d, i); });
  chordSelection.style("fill", function(d) { return getColor(d, d.source.index); });

  return colorScales[currentScale].scale;
}

function makeLegend(scale) {
  var range = scale.range(), domain = scale.domain();

  if (isNumber(domain[0])) {
    domain = d3.range(domain[0], domain[1], (domain[1]-domain[0])/range.length);
  }

  var legend = $("<ul>");

  for(var i = 0; i < range.length; i++) {
    var legendItem = $("<li>");

    $("<div>", {
      "class": "legendColor"
    }).css({
      "background-color" : range[i]
    }).appendTo(legendItem);

    $("<div>", {
      "class":"legendItem",
      text: isNumber(domain[i]) ?
        (domain[i] <= 1 ?
          d3.format("0%")(domain[i]) :
          d3.format(",0")) :
        domain[i]
    }).appendTo(legendItem);

    legend.append(legendItem);
  }

  $("#legend").empty().append(legend);
}

function render(data) {

  // resent content
  // $("#chord").empty();
  $("#metadata").empty();

  fetchedData = data;

  // Compute the chord layout.
  layout.matrix(data.matrix);

  // Add a group per neighborhood.
  var group = svg.selectAll(".group")
    .data(layout.groups)
    .enter().append("g")
      .attr("class", "group")
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

  // Add the group arc.
  var groupPath = group.append("path")
    .classed("group", true)
    .attr("id", function(d, i) { return "group" + i; })
    .attr("d", arc);

  // Add the chords.
  var chordSelection = svg.selectAll(".chord")
    .data(layout.chords)
    .enter().append("path");
  var chord = chordSelection.attr("class", "chord")
        //.style("fill", function(d) { return getColor(d, d.source.index); })
        .attr("d", path);

  // Add an elaborate mouseover title for each chord.
  chord.append("title").text(function(d) {
      return data.cantons[d.source.index].name +
          " → " + data.cantons[d.target.index].name +
          ": " + d.source.value +
          "\n" + data.cantons[d.target.index].name +
          " → " + data.cantons[d.source.index].name +
          ": " + d.target.value;
    });

  var scale = updateColor();
  makeLegend(scale);

  function mouseover(d, i) {
    chord.classed("fade", function(p) {
      return p.source.index != i && p.target.index != i;
    });

    $("#location").show().text(data.cantons[d.index].name);
    $("#locationSubtext").show().text(colorScales[currentScale].subtext(d, i));

    // create city/data blend
    var citydata = [];

    for(var j = 0; j < data.matrix[d.index].length; j++) {
      citydata.push({ name : data.cantons[j].name, value : data.matrix[d.index][j] });
    }

    citydata = _.sortBy(citydata, function(c) {
      return -c.value;
    });

    citydata.total = data.cantons[d.index].total;
    citydata.local = data.cantons[d.index].local;

    // also show city metadata
    var content = metadataTemplate({
      citydata : citydata,
      canton: data.cantons[d.index]
    });

    metadata.html(content);
  }

  function mouseout() {
    $("#location").hide();
    $("#locationSubtext").hide();
  }
}

  // the rest in ajax req when data!
  d3.json("data/chord.json", function(data) {

    // make a scale for province colors
    for( var i = 0; i < data.cantons.length; i ++ ){
      if (provinces.indexOf(data.cantons[i].province) === -1) {
        provinces.push(data.cantons[i].province);
      }
      if (migrants.indexOf(data.cantons[i].migrants) === -1) {
        migrants.push(+data.cantons[i].migrants);
      }
      if (residents.indexOf(data.cantons[i]["19A"]) === -1) {
        if (!isNaN(+data.cantons[i]["19A"])) {
          residents.push(+data.cantons[i]["19A"]);
        } else {
          residents.push(0);
        }
      }

      // add up total for the canton
      var total = 0;
      for(var j = 0; j < data.matrix[i].length; j++) {
        total += data.matrix[i][j];
      }

      data.cantons[i].total = total;
    }

    migrants.sort();
    residents.sort();

    var commutingDomain = d3.extent(_.map(data.cantons, function(d) {
      return d.total / (d.local + d.total);
    }));

    colorScales = {
      residency : {
        scale : d3.scale.quantize()
          .domain(residents)
          .range(["#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#a63603","#7f2704"] ),
        f : function(d, i) {
          return data.cantons[i]["19A"];
        },
        subtext: function(d, i) {
          return d3.format("0%")(data.cantons[d.index]["19A"]) + " are non long-term residents";
        }
      },
      migrants : {
        scale : d3.scale.quantize()
          .domain(migrants)
          .range(["#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"]),
        f : function(d, i) {
          return data.cantons[i].migrants;
        },
        subtext: function(d, i) {
          return d3.format("0%")(data.cantons[d.index]["migrants"]) + " are migrants";
        }
      },
      commuting : {
        scale : d3.scale.quantize()
          .domain(commutingDomain)
          .range(["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#54278f","#3f007d"]),
        f : function(d, i) {
          return data.cantons[i].total / (data.cantons[i].total + data.cantons[i].local);
        },
        subtext: function(d, i) {
          var dt = data.cantons[d.index];
          return d3.format("0%")(dt.total / (dt.total+dt.local)) + " commute outside their canton";
        }
      },
      gam : {
        scale : d3.scale.ordinal()
          .domain(["noGAM", "GAM"])
          .range(["#bbb", "#222"]),
        f : function(d, i) {
          return data.cantons[i].category;
        },
        subtext: function(d, i) {
          return data.cantons[d.index].category === "GAM" ? "An urban canton" : "A rural canton";
        }
      },
      province : {
        scale : d3.scale.ordinal()
          .domain(provinces)
          .range(["#377eb8","#4daf4a","#984ea3","#ff7f00","#f781bf","#a65628"]),
        f : function(d, i) {
          return data.cantons[i].province;
        },
        subtext: function(d, i) {
          return data.cantons[d.index].province + " province";
        }
      }
    };

    getColor = function(d, i) {
      return colorScales[currentScale].scale(colorScales[currentScale].f(d,i));
    };

    initControls();

    render(data);
  });

}());