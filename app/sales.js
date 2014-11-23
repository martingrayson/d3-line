var LineChart = require('./modules/line-chart.js');

var dataArray = require('../assets/data/test-data.json');
var chartConfig = {
    "chartPlaceholder": "#line-chart",
    "seriesColours": ["#0299A3", "#EA0087", "#FFD119", "#213975", "#EA8522"],
    "chartMargins": {
        top: 80,
        right: 150,
        bottom: 80,
        left: 80
    },
    "chartSize": {
        "width": 600,
        "height": 350
    },
    "chartAxisLabels": {
        "x": "Percentage through sales window",
        "y": "Percentage of total tickets sold"
    },
    "chartTransition": {
        "enabled": true,
        "delay": 500,
        "duration": 2000
    }
};

var salesLineChart = new LineChart(chartConfig, dataArray, chartConfig.chartPlaceholder, function() {});
salesLineChart.drawChart();