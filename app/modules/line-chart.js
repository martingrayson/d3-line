// External imports
var $ = require('d3');
var $ = require('jquery');

function LineChart(configItems, dataObject, chartPlaceholder, initCompleteCallback) {

    var width, height, seriesColourArray;
    var chartConfig = configItems;
    var dataArray = dataObject;

    initialise(initCompleteCallback);

    function initialise(initialiseCompleteCallback) {
        width = chartConfig.chartSize.width - chartConfig.chartMargins.left - chartConfig.chartMargins.right;
        height = chartConfig.chartSize.height - chartConfig.chartMargins.top - chartConfig.chartMargins.bottom;
        seriesColourArray = d3.scale.ordinal().range(chartConfig.seriesColours);

        initialiseCompleteCallback();
    }

    this.drawChart = function() {
        var standardisedData = this.processSeriesData(dataArray);

        var axisObject = this.getAxis(standardisedData);
        var lineGen = this.getLine(axisObject.scale);

        var svgElement = this.drawAxis(axisObject.axis);
        this.drawSeries(svgElement, standardisedData, lineGen, chartConfig.chartTransition.enabled);
        this.drawLegend(svgElement, standardisedData);
    }

    this.drawLegend = function(svgElement, standardisedData) {
        var legend = svgElement.selectAll(".legend")
            .data(seriesColourArray.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });

        // Draw legend colored rectangles
        legend.append("rect")
            .attr("x", width + (chartConfig.chartMargins.right - 18 - 10))
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", seriesColourArray);

        // Draw legend text
        legend.append("text")
            .attr("x", width + (chartConfig.chartMargins.right) - 18 - 10 - 10)
            .attr("y", 8)
            .attr("dy", ".55em")
            .style("text-anchor", "end")
            .attr("class", function(d, i) {
                return 'legend-label ' + standardisedData[i].class;
            })
            .text(function(d, i) {
                return (standardisedData[i].class == 'genre' ? standardisedData[i].name + ' (avg)' : standardisedData[i].name);
            })
    }

    this.drawSeries = function(svgElement, seriesData, lineGenerator, useCurtainFlag) {
        svgElement.selectAll('.line')
            .data(seriesData)
            .enter()
            .append('path')
            .attr('class', function(d) {
                return d.class + ' line'
            })
            .style('stroke', function(d) {
                return seriesColourArray(Math.random() * 50);
            })
            .attr('clip-path', 'url(#clip)')
            .attr('d', function(d) {
                return lineGenerator(d.data);
            })

        if (useCurtainFlag) {
            var curtain = svgElement.append('rect')
                .attr('x', -1 * (width + 1))
                .attr('y', -1 * (height - 1))
                .attr('height', height)
                .attr('width', width)
                .attr('class', 'curtain')
                .attr('transform', 'rotate(180)')
                .style('fill', '#ffffff');

            var curtainTransition = svgElement.transition()
                .delay(chartConfig.chartTransition.delay)
                .duration(chartConfig.chartTransition.duration)
                .ease('linear')
                .each('end', function() {
                    d3.select('line.guide')
                        .transition()
                        .style('opacity', 0)
                        .remove()
                });

            curtainTransition.select('rect.curtain')
                .attr('width', 0);
        }
    }

    this.drawAxis = function(axisObject) {

        var svg = d3.select(chartConfig.chartPlaceholder)
            .append("svg")
            .attr("width", width + chartConfig.chartMargins.left + chartConfig.chartMargins.right)
            .attr("height", height + chartConfig.chartMargins.top + chartConfig.chartMargins.bottom)
            .append("g")
            .attr("transform", "translate(" + chartConfig.chartMargins.left + "," + chartConfig.chartMargins.top + ")");

        // Add the clip path.
        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        // Add the x-axis.
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(axisObject.x);

        // Add x-axis label
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + (chartConfig.chartMargins.bottom / 2) + 10) //why +10
            .text(chartConfig.chartAxisLabels.x);

        // Add the y-axis.
        svg.append("g")
            .attr("class", "y axis")
            .call(axisObject.y);

        // Y-axis label
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", -(width / 4))
            .attr("y", -(chartConfig.chartMargins.left / 2) - 10)
            .attr("transform", "rotate(-90)")
            .text(chartConfig.chartAxisLabels.y);

        return svg;
    }

    this.getLine = function(scaleObject) {
        return d3.svg.line()
            .interpolate("monotone")
            .x(function(d) {
                return scaleObject.x(d[0]);
            })
            .y(function(d) {
                return scaleObject.y(d[1]);
            });
    }

    this.getAxis = function(standardisedData) {
        var xScale = d3.scale.linear().range([0, width]),
            yScale = d3.scale.linear().range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .ticks(11);

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .ticks(5)
            .orient("left");

        // Set the scale values.
        xScale.domain([0, 100]);
        yScale.domain(
            [
                d3.min(standardisedData, function(series) {
                    return 0; //return series.range.y[0]
                }),
                d3.max(standardisedData, function(series) {
                    return (
                        Math.round(d3.max(standardisedData, function(series) {
                            return series.range.y[1];
                        }) / 10)) * 10;
                })
            ]);

        return {
            "axis": {
                "x": xAxis,
                "y": yAxis
            },
            "scale": {
                "x": xScale,
                "y": yScale
            }
        };
    }

    this.processSeriesData = function(inputDataArray) {
        // Read our data
        var seriesArray = [];
        inputDataArray.forEach(function(dataSeries) {

            var currentSeriesName = dataSeries.name;
            var currentSeriesData = dataSeries.data;
            var currentSeriesClass = dataSeries.class;
            var standardSeriesData = [];

            for (var i = 0; i < currentSeriesData.length; i++) {
                var currentDataItem = currentSeriesData[i];

                // scale it here too.
                var currentDataCoord = [currentDataItem.salesWindowPercentage, currentDataItem.value];
                standardSeriesData.push(currentDataCoord);
            }

            var rangeXCoords = d3.extent(standardSeriesData, function(d) {
                return d[0];
            });
            var rangeYCoords = d3.extent(standardSeriesData, function(d) {
                return d[1];
            });

            var series = {
                "name": currentSeriesName,
                "class": currentSeriesClass,
                "range": {
                    "x": rangeXCoords,
                    "y": rangeYCoords
                },
                "data": standardSeriesData
            };
            seriesArray.push(series);
        });

        return seriesArray;
    }
}

module.exports = LineChart;