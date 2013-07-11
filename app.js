$(function() {
  var data = {
    cantons : [
        { name : "a" },
        { name : "b" },
        { name : "c" },
        { name : "d" }
    ],
    
    matrix : [
        [ 0, 1, 1, 1 ],
        [ 1, 0, 1, 1 ],
        [ 1, 1, 0, 1 ],
        [ 1, 1, 1, 0 ]
    ]
};

var width = 500,
    height = 500,
    outerRadius = Math.min(width, height) / 2 - 10,
    innerRadius = outerRadius - 24;

var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var layout = d3.layout.chord()
    .padding(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);

var path = d3.svg.chord()
    .radius(innerRadius);

var colors = d3.scale.category20c();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("circle")
    .attr("r", outerRadius);

// the rest in ajax req when data!

// Compute the chord layout.
layout.matrix(data.matrix);

 // Add a group per neighborhood.
var group = svg.selectAll(".group")
    .data(layout.groups)
    .enter().append("g")
        .attr("class", "group");
        // ADD MOUSEOVER HERE. .on("mouseover...");

// Add the group arc.
var groupPath = group.append("path")
    .attr("id", function(d, i) { return "group" + i; })
    .attr("d", arc)
    .style("fill", function(d, i) { return colors(i); });

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
        .style("fill", function(d) { return colors(d.source.index); })
        .attr("d", path);
// Add an elaborate mouseover title for each chord.
chord.append("title").text(function(d) {
      return data.cantons[d.source.index].name
          + " → " + data.cantons[d.target.index].name
          + ": " + formatPercent(d.source.value)
          + "\n" + data.cantons[d.target.index].name
          + " → " + data.cantons[d.source.index].name
          + ": " + formatPercent(d.target.value);
    });
}());