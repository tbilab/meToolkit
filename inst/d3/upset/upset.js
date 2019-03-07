// !preview r2d3 data = data_for_upset$data, options = data_for_upset$options, dependencies = c("d3-jetpack",here('inst/d3/upset/helpers.js')), css=here('inst/d3/upset/upset.css')
// r2d3: https://rstudio.github.io/r2d3
//

// Constants
const highlightColor = '#fdcdac'; // Color of the highlight bars
const margin = {right: 25, left: 25, top: 20, bottom: 50}; // margins on side of chart

// matrix settings
const matrixPadding = 5;              // How far in from sides the dots start
const matrixSize = 7;                  // radius of dots
const matrixPresentColor = 'black';
const matrixMissingColor = 'lightgrey';

// proportion plot settings
const ciThickness = 4;   // how thick is the CI?

// new layout grid
const set_size_bars_units = 3;
const rr_plot_units = 3;
const matrix_plot_units = 3;
const total_width_units = set_size_bars_units + rr_plot_units + matrix_plot_units;
const marginal_count_prop = 0.3;


// Function to filter data down to the minimum desired set size
function filter_set_size(data, marginal_data, min_set_size = 100){
  // Filter the main dataset down
  const filtered_data = data.filter(d => d.count >= min_set_size);

  // Get the remaining codes present after filtering
  const distinct_codes = unique(filtered_data.map(d => d.pattern).join('-').split('-'));

  // Filter the marginal data down to just the remaining codes
  const filtered_marginals = marginal_data.filter(d => distinct_codes.includes(d.code) );

  return {
    patterns: filtered_data,
    marginals: filtered_marginals,
  };
}

// Function to generate all scales from data and a given size plot
function setup_scales(patterns, marginal, sizes){

  const {set_size_bars_w,
         rr_plot_w,
         matrix_plot_w,
         matrix_plot_h,
         margin_count_h,
         matrix_padding,
         padding } = sizes;

  // Place codes on x-axis of matrix
  const matrix_width_scale = d3.scaleBand()
    .domain(marginal.map(d => d.code))
    .range([matrix_padding, matrix_plot_w - matrix_padding])
    .round(true)
    .padding(0.05); // goes from right to left into left margin.

  // Make the top margin bars a tiny bit narrower than the columns of our matrix for breathing room
  const matrix_column_width = matrix_width_scale.bandwidth();

  // Setup the x-scale for counts of the patterns
  const set_size_x = d3.scaleLinear()
    .range([set_size_bars_w, 0])
    .domain([0, d3.max(patterns, d=> d.count)]);

  // X scale for the relative risk intervals
  const rr_x = d3.scaleLinear()
    .range([0,rr_plot_w])
    .domain([0,d3.max(patterns, d => d.upper)]);

  // Y scale for patterns in all lower charts, domain is index of pattern
  const pattern_y = d3.scaleLinear()
    .range([0, matrix_plot_h])
    .domain([0, patterns.length]);

  // How thick each pattern's count bar is
  const matrix_row_height = pattern_y(1) - pattern_y(0);
  const set_size_bar_height = matrix_row_height*0.9;

  // Continuous y count scale for the code marginals
  const marginal_y = d3.scaleLinear()
    .range([0, margin_count_h])
    .domain([0, d3.max(marginal, d => d.count)]);

  // How big should the dots be in matrix?
  const matrix_dot_size = (Math.min(matrix_column_width, matrix_row_height)*0.9)/2;

  return {
    matrix_width_scale,
    set_size_x,
    set_size_bar_height,
    rr_x,
    pattern_y,
    marginal_y,
    matrix_dot_size,
    matrix_row_height,
    matrix_column_width,
  };
}

function setup_chart_sizes(width, height, margin){
  const min_set_size = 100;
  const h = height - margin.top - margin.bottom;
  const w = width - margin.left - margin.right;

  return {
    set_size_bars_w: w*(set_size_bars_units/total_width_units),
    rr_plot_w: w*(rr_plot_units/total_width_units),
    matrix_plot_w: w*(matrix_plot_units/total_width_units),
    margin_count_h: h*marginal_count_prop,
    matrix_plot_h: h*(1 - marginal_count_prop),
    matrix_padding: 5,
    padding: 10,
    w,
    h,
    margin,
  };
}

function get_pattern_info(d, scales) {
  const positions_of_codes = d.pattern
    .split('-')
    .map(p => scales.matrix_width_scale(p) + scales.matrix_width_scale.bandwidth()/2);

  const range_of_pattern = d3.extent(positions_of_codes);

  return {
    positions: positions_of_codes,
    range: range_of_pattern,
  };
}

function draw_pattern_matrix(g, patterns, scales, sizes){

  const matrix_rows = g.selectAll('.matrix_row')
    .data(patterns)
    .enter().append('g.matrix_row')
    .translate((d,i) => [0, scales.pattern_y(i) + scales.matrix_row_height/2] );

  // Light grey dots in the background to show possible codes
  matrix_rows.selectAll('.background_dots')
    .data(marginals.map(d => d.code))
    .enter().append('circle')
    .attr('class', 'allCodes')
    .at({
      cx: d => scales.matrix_width_scale(d) + scales.matrix_width_scale.bandwidth()/2,
      r: scales.matrix_dot_size,
      fill: matrixMissingColor,
      fillOpacity: 0.5,
    });

  // Thin lines that span code range
  matrix_rows.selectAppend('line.pattern_extent')
    .at({
      x1: d => get_pattern_info(d, scales).range[0],
      x2: d => get_pattern_info(d, scales).range[1],
      stroke: matrixPresentColor,
      strokeWidth: scales.matrix_dot_size/2
    });

  // Shaded present-codes dots
  matrix_rows.selectAll('.present_code_dots')
    .data(d => get_pattern_info(d, scales).positions)
    .enter().append('circle')
    .at({
      class: 'presentCodes',
      cx: d => d,
      r: scales.matrix_dot_size,
      fill: matrixPresentColor,
    });


  //// Axis
  const matrix_axis = g.selectAppend("g.matrix_axis")
    .call(d3.axisBottom().scale(scales.matrix_width_scale))
    .translate([0, sizes.matrix_plot_h]);

  // Shift text for legibility
  matrix_axis
    .selectAll("text")
    .at({
      x: -7,
      y: -1,
      textAnchor: 'end',
      transform: 'rotate(-60)',
      fontSize:12
    });
  // remove horizontal bar
  matrix_axis.select('.domain').remove();


}

function draw_pattern_count_bars(g, patterns, scales, sizes){

  const pattern_count_bars = g
    .selectAll('.pattern_count_bars')
      .data(patterns)
      .enter().append('g.pattern_count_bars')
      .translate((d,i) => [0, scales.pattern_y(i) + scales.matrix_row_height/2]);

  pattern_count_bars
    .selectAppend('rect')
    .at({
      fill: 'steelblue',
      height: scales.set_size_bar_height,
      y: -scales.set_size_bar_height/2,
      x: d => scales.set_size_x(d.count),
      width: d => scales.set_size_x(0) - scales.set_size_x(d.count),
    });

  //// Pattern count bars axis
  const pattern_size_axis = g.selectAppend("g.pattern_size_axis")
    .call(d3.axisTop()
            .scale(scales.set_size_x)
            .ticks(5)
            .tickSizeOuter(0) );

  pattern_size_axis.selectAll("text")
    .at({
      x: -2, y: -4,
      textAnchor: 'end',
      opacity: 0.5
    });

  pattern_size_axis.selectAll(".tick line")
    .at({
      opacity: 0.5,
    })
}

function draw_rr_intervals(g, patterns, scales, sizes){
  // Axis
  const axis_drawing_func = d3.axisTop()
    .scale(scales.rr_x)
    .ticks(5)
    .tickSizeOuter(0);

  const rr_axis = g.selectAppend("g.rr_intervals_axis")
    .call(axis_drawing_func);

  rr_axis.selectAll("text")
    .at({
      x: 2, y: -4,
      textAnchor: 'start',
      opacity: 0.5,
    });

  // Guide line at RR = 1 for reference of 'null'
  rr_axis.selectAll('.tick line')
    .at({
      y1: d => d === 1 ? sizes.matrix_plot_h: 0,
      opacity: 0.5,
    });

  // Now draw the intervals
  const rr_intervals = g.selectAll('.rr_intervals')
    .data(patterns)
    .enter().append('g.rr_intervals')
    .translate((d,i) => [0, scales.pattern_y(i) + scales.matrix_row_height/2]);

  rr_intervals
    .selectAppend('line')
    .at({
      x1: d => scales.rr_x(d.lower),
      x2: d => scales.rr_x(d.upper),
      stroke: d => d.pointEst === 0 ? 'darkgrey': 'orangered',
      strokeWidth: ciThickness,
    });

  rr_intervals
    .selectAppend('circle')
    .at({
      cx: d => scales.rr_x(d.pointEst),
      r: ciThickness*1.5,
      fill: d => d.pointEst === 0 ? 'darkgrey': 'orangered',
    });



}

function draw_code_marginal_bars(g, marginals, scales, sizes){
  // Now draw the intervals
  const code_marginal_bars = g.selectAll('.code_marginal_bar')
    .data(marginals)
    .enter().append('g.marginal_bar')
    .translate((d,i) => [scales.matrix_width_scale(d.code), sizes.margin_count_h - scales.marginal_y(d.count)]);

  code_marginal_bars.selectAppend('rect')
    .at({
      height: d => scales.marginal_y(d.count),
      fill: 'orangered',
      width: scales.matrix_column_width,
    });

  code_marginal_bars.selectAppend('text')
    .text(d => countFormat(d.count))
    .at({
      x: scales.matrix_column_width/2,
      textAnchor: 'middle',
      alignmentBaseline: 'hanging',
      fill: 'white',
      y: 2,
    })

}

function create_pattern_interaction_layer(g, patterns, scales, sizes, onMouseover){
  // Draws invisible selection rectangles over the horizontal patterns
  // That enable various interaction popups etc.
  const pattern_rows = g.selectAll('.pattern_row')
    .data(patterns)
    .enter().append('g.pattern_row')
    .translate((d,i) => [-sizes.padding, scales.pattern_y(i)] )
    .selectAppend('rect')
      .at({
        width: sizes.w + 2*sizes.padding,
        height: scales.matrix_row_height,
        fill: 'green',
        opacity: 0,
        rx: 5,
        stroke: 'grey',
        strokeWidth: 1,
      });

  pattern_rows.on('mouseover', onMouseover);
}

function create_code_interaction_layer(g, marginals, scales, sizes, onMouseover){
  // Draws invisible selection rectangles over the vertical patterns
  const code_cols = g.selectAll('.code_col')
    .data(marginals)
    .enter().append('g.code_col')
    .translate((d,i) => [scales.matrix_width_scale(d.code), -sizes.padding])
    .selectAppend('rect')
      .at({
        width: scales.matrix_column_width,
        height: sizes.h + sizes.margin.bottom + sizes.padding,
        fill: 'purple',
        opacity: 0,
        rx: 5,
        stroke: 'grey',
        strokeWidth: 1,
      });

  code_cols.on('mouseover', onMouseover);
}

function pattern_moused_over(d){
  console.log('moused over a pattern!');
}

function code_moused_over(d){
  console.log('moused over a code!');
}

// Function to draw upset plot given filtered data and scales
function render_plot(patterns, marginals, sizes, have_snps = true){

  // Setup the scales
  const scales = setup_scales(patterns, marginals, sizes);

  // Add a g to pad chart
  const g = svg.selectAppend('g.padding')
    .translate([sizes.margin.left, sizes.margin.top]);

  // ----------------------------------------------------------------------
  // Chart Components
  // ----------------------------------------------------------------------
  const matrix_chart = g.selectAppend('g.matrix_chart')
    .translate([sizes.set_size_bars_w,sizes.margin_count_h])
    .call(draw_pattern_matrix, patterns, scales, sizes);

  const pattern_size_bars = g.selectAppend('g.pattern_size_bars')
    .translate([0, sizes.margin_count_h])
    .call(draw_pattern_count_bars, patterns, scales, sizes);

  const rr_intervals = g.selectAppend('g.rr_intervals')
    .translate([sizes.set_size_bars_w + sizes.matrix_plot_w, sizes.margin_count_h])
    .call(draw_rr_intervals, patterns, scales, sizes);

  const code_marginal_bars = g.selectAppend('g.code_marginal_bars')
    .translate([sizes.set_size_bars_w,0])
    .call(draw_code_marginal_bars, marginals, scales, sizes);

  const code_interaction_layer = g.selectAppend('g.code_interaction_layer')
    .translate([sizes.set_size_bars_w,0])
    .call(create_code_interaction_layer, marginals, scales, sizes, code_moused_over);

  const pattern_interaction_layer = g.selectAppend('g.pattern_interaction_layer')
    .translate([0, sizes.margin_count_h])
    .call(create_pattern_interaction_layer, patterns, scales, sizes, pattern_moused_over);

}


const min_set_size = 100;
const {patterns, marginals} = filter_set_size(data, options.marginalData, min_set_size);
const chart_sizes = setup_chart_sizes(width, height, margin);


if(data.length < 2){

  const lead_message = data.length === 1 ? "Only one group meets" : "No groups meet";
  svg.append('text')
    .attr('text-anchor', 'middle')
    .tspans([`${lead_message} filter size threshold`, 'Adjust threshold down to see groups.'])
    .attr('x', width/2)
    .attr('y', height/2);

} else {
  render_plot(patterns, marginals, chart_sizes);
}
