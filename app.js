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

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("circle")
    .attr("r", outerRadius);

function render(data) {

  // resent content
  $('#chart').empty();
  $('#metadata').empty();

  // make a scale for province colors
  var provinces = [];
  for( var i = 0; i < data.cantons.length; i ++ ){
    if (provinces.indexOf(data.cantons[i].province) === -1) {
      provinces.push(data.cantons[i].province);
    }
  }

  var colorScales = {
    gam : {
      scale : d3.scale.ordinal()
        .domain(['GAM', 'noGAM'])
        .range(['red', 'blue']),
      f: function(d, i) {
        return data.cantons[i].category;
      }
    },
    province : {
      scale : d3.scale.ordinal()
        .domain(provinces)
        .range(d3.scale.category10().range()),
      f : function(d, i) {
        return data.cantons[i].province;
      }
    }
  };

  var currentScale = 'gam';
  
  var getColor = function(d, i) {
    return colorScales[currentScale].scale(colorScales[currentScale].f(d,i));
  };

  // Compute the chord layout.
  layout.matrix(data.matrix);

  // Add a group per neighborhood.
  var group = svg.selectAll(".group")
    .data(layout.groups)
    .enter().append("g")
      .attr("class", "group")
      .on("mouseover", mouseover);

  // Add the group arc.
  var groupPath = group.append("path")
    .attr("id", function(d, i) { return "group" + i; })
    .attr("d", arc)
    .style("fill", function(d, i) { return getColor(d, i); });

  // Add a text label.
  var groupText = group.append("text")
    .attr("x", 6)
    .attr("dy", 15);

  groupText.append("textPath")
    .attr("xlink:href", function(d, i) { return "#group" + i; })
    .text(function(d, i) { return data.cantons[i].name; });

  // Remove the labels that don't fit. :(
  groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 16 < this.getComputedTextLength(); })
        .remove();

  // Add the chords.
  var chord = svg.selectAll(".chord")
    .data(layout.chords)
    .enter().append("path")
        .attr("class", "chord")
        .style("fill", function(d) { return getColor(d, d.source.index); })
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

  function mouseover(d, i) {
    chord.classed("fade", function(p) {
      return p.source.index != i && p.target.index != i;
    });

    // create city/data blend
    var citydata = [], total = 0;
    for(var i = 0; i < data.matrix[d.index].length; i++) {
      total += data.matrix[d.index][i];
      citydata.push({ name : data.cantons[i].name, value : data.matrix[d.index][i] });
    }

    citydata = _.sortBy(citydata, function(c) {
      return -c.value;
    });

    citydata.total = total;
    citydata.local = data.cantons[d.index].local;

    // also show city metadata
    var content = metadataTemplate({
      canton : data.cantons[d.index].name,
      citydata : citydata
    });

    metadata.html(content);
  }
}

  // the rest in ajax req when data!
  d3.json("data/chord.json", function(data) {
    render(data);
  });

}());