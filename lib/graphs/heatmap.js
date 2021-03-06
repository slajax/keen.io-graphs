
var d3 = require('d3')
  , $ = require('jquery')
  , _ = require('underscore');

module.exports = function KeenGraph(k) {

  return function WeeklyTimelineGraph(el, metric, label, options) {

    var defaults = {
      analysisType: "count",
      timeframe: "this_7_days",
      interval: "hourly"
    };

    var o = require('object');
    var options = o.merge(defaults, options);

    $(el).html('<br/> <br/> Loading Heatmap...');
    this.series = new k.Series(metric, options);
    this.series.getResponse(function(data){
      stackedTimeline(data);
    });

      var stackedTimeline = function(data){

        // data.result.value
        // data.result.timeframe.start
        // data.result.timeframe.end

        var y_offset = 55;
        var x_offset = 55;
        var width = options.width || 500;
        height = options.height || (width * .5 + 60);
        unit = options.unit || (width - x_offset) / 26;

        var days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        var day = d3.time.format('%w')
          , hour = d3.time.format('%H')
          , time = d3.time.format('%I:%M')
          , format = d3.time.format.utc('%Y-%m-%dT%H:%M:%S.%LZ');

        // Scale activity for Opacity
        var heat = d3.scale.quantize()
          .domain([0, d3.max(data.result, function(d){ return d.value; })])
          .range(d3.range(100).map(function(d) { return d/100; }));

        // Convert dates and scale activity
        data.result.forEach(function(d){
          var now = new Date();
          var then = new Date(d.timeframe.start);
          var iso = then.toISOString();
          d.date = format.parse(iso);

          var activity = heat(d.value);
          if (activity > 0) {
            d.fill = '#49c5b1';
            d.stroke = '#d7d7d7';
            d.alpha = activity;
          } else if (now < then) {
            d.fill = '#fff';
            d.stroke = '#fbfbfb';
            d.alpha = 1;
          } else {
            d.fill = '#fff';
            d.stroke = '#f2f2f2';
            d.alpha = 1;
          }
        })

        var first_day = d3.min(data.result, function(d) { return d.date })
          , timeframe = _.rest(days, day(first_day))
          , offset = days.length - timeframe.length
          , remainder = days.slice(0,offset)
          , date_range = timeframe.concat(remainder);
          // console.log(date_range);

        $(el).html('');
        var svg = d3.select(el)
          .append("svg")
          .attr('width', width)
          .attr('height', height)

      var title = svg.append('g')
        .append('text')
          .attr('text-anchor', 'start')
          .attr('y', y_offset-15)
          .attr('x', x_offset)
          .attr('font-family', 'Arial')
          .attr('font-size', '12')
          .attr('font-weight', 'bold')
          .attr('stroke', 'none')
          .attr('fill', '#000')
          .text(label || 'Heatmap');

        var intervals = svg.append("g")
          .attr('class', 'intervals')
          .attr('transform', 'translate(' + (unit+x_offset) + ',' + (unit/2+y_offset) + ')')

        var date_label = intervals.selectAll('g.dates')
          .data(date_range)
          .enter().append('g')
          .attr('class', 'dates')
          .attr('transform', function(d,i){ return 'translate(' + -1*unit + ',' + (i*unit) + ')' })
          .append('text')
            .attr('dy', unit/2*1.3)
            .attr('dx', unit/2)
            .attr('font-size', unit/2*1.2)
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text(function(d){ return d })

        var time_label = intervals.selectAll('g.times')
          .data(['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'])
          .enter().append('g')
          .attr('class', 'times')
          .attr('transform', function(d,i){ return 'translate(' + (i*(unit*3)) + ',' + unit*7.5 + ')' })
          .append('text')
            .attr('dy', 0)
            .attr('dx', unit/2*.8)
            .attr('fill', '#808080')
            .attr('font-size', unit/2*1.1)
            .attr('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .text(function(d){ return d })

        var interval = intervals.selectAll('g.day')
          .data(data.result)
          .enter().append('g')
          .attr('class', 'day')
          .attr('transform', function(d) {
            var vertical_offset = day(d.date) - (offset);
            var y = 0;
            if (vertical_offset < 0){
              //y = timeframe.length-1 + Math.abs(vertical_offset);
              y = timeframe.length + parseInt(day(d.date));
            } else {
              y = vertical_offset
            }
            return 'translate(' + hour(d.date) * unit + ',' + (y * unit) + ')';
          })
          .append('rect')
            .attr('shape-rendering', 'crispEdges')
            .attr('fill', function(d){ return d.fill })
            .attr('fill-opacity', function(d){ return d.alpha })
            .attr('stroke', function(d){ return d.stroke })
            .attr('stroke-weight', 1)
            .attr('width', unit*.8)
            .attr('height', unit*.8);

        interval.append('svg:title').text(function(d){
          return time(d.date) + ' | ' + d.value;
        });
      }
  }
};
