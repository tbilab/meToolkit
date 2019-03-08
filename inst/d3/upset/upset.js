// !preview r2d3 data = data_for_upset$data, options = options, dependencies = c("d3-jetpack",here('inst/d3/upset/helpers.js')), css=here('inst/d3/upset/upset.css')
// r2d3: https://rstudio.github.io/r2d3
//

// Constants
const margin = {right: 25, left: 25, top: 20, bottom: 70}; // margins on side of chart

const colors = {
  marginal_count_bars: 'orangered',
  pattern_count_bars: 'steelblue',
  rr_interval: 'orangered',
  null_rr_interval: 'grey',
  highlight: '#fdcdac',
  code_present: 'black',
  code_missing: 'lightgrey',
  interaction_box_border: 'grey',
  silder_handle: 'green',
};

const interaction_box_styles = {
  opacity: 0,
  fillOpacity:0,
  rx: 5,
  stroke: 'grey',
  strokeWidth: 1
};

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
  const filtered_data = data
    .filter(d => d.count >= min_set_size)
    .sort((a,b) => b.count - a.count);

  // Get the remaining codes present after filtering
  const distinct_codes = unique(filtered_data.map(d => d.pattern).join('-').split('-'));

  // Filter the marginal data down to just the remaining codes
  const filtered_marginals = marginal_data
    .filter(d => distinct_codes.includes(d.code));

  return {
    patterns: filtered_data,
    marginals: filtered_marginals,
  };
}

function setup_set_size_x_scale(patterns, sizes){
  // Setup the x-scale for counts of the patterns
  return d3.scaleLinear()
    .range([sizes.set_size_bars_w, 0])
    .domain([0, d3.max(patterns, d=> d.count)]);
}

// Function to generate all scales from data and a given size plot
function setup_scales(patterns, marginal, sizes, set_size_x){

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
  //const set_size_x = setup_set_size_x_scale(patterns,sizes);

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
    .range([margin_count_h, 0])
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

function draw_pattern_matrix(g, patterns, marginals, scales, sizes){
  g.html('');

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
      fill: colors.code_missing,
      fillOpacity: 0.5,
    });

  // Thin lines that span code range
  matrix_rows.selectAppend('line.pattern_extent')
    .at({
      x1: d => get_pattern_info(d, scales).range[0],
      x2: d => get_pattern_info(d, scales).range[1],
      stroke: colors.code_present,
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
      fill: colors.code_present,
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
      transform: 'rotate(-75)',
      fontSize:12
    });
  // remove horizontal bar
  matrix_axis.select('.domain').remove();


}

function draw_pattern_count_bars(g, patterns, scales, sizes){
  const t = d3.transition().duration(500);

  const pattern_count_bars = g.selectAll('.pattern_count_bars')
    .data(patterns);

  // Exit
  pattern_count_bars.exit().remove();

  // Append-Update
  pattern_count_bars.enter()
    .append('rect.pattern_count_bars')
    .at({
      y: (d,i) => scales.pattern_y(i) + scales.matrix_row_height/2 - scales.set_size_bar_height/2,
      fill: colors.pattern_count_bars,
      x: sizes.set_size_bars_w,
    })
    .merge(pattern_count_bars)
    .transition(t)
    .at({
      y: (d,i) => scales.pattern_y(i) + scales.matrix_row_height/2 - scales.set_size_bar_height/2,
      height: scales.set_size_bar_height,
      x: d => scales.set_size_x(d.count),
      width: d => scales.set_size_x(0) - scales.set_size_x(d.count),
    });

  //// Pattern count bars axis
  const axis = g.selectAppend("g.axis")
    .call(d3.axisTop()
            .scale(scales.set_size_x)
            .ticks(5)
            .tickSizeOuter(0) );

  axis.selectAll("text")
    .at({
      x: -2, y: -4,
      textAnchor: 'end',
    });

  // Get rid of the zero tick value for cleanliness
  remove_zero_tick(axis);

   // Title subplot
  g.selectAppend('text.title')
    .at({
      textAnchor: 'middle',
      y: sizes.matrix_plot_h + sizes.margin.bottom - sizes.padding*2.5,
    })
    .html(`<tspan>Size of pattern</tspan>
           <tspan font-size='13px' dy='15'>(drag bar to change)</tspan>`)
    .selectAll('tspan')
      .attr('x', sizes.set_size_bars_w/2)
;
}

function draw_rr_intervals(g, patterns, scales, sizes){
  g.html('');

  // Axis
  const axis_drawing_func = d3.axisTop()
    .scale(scales.rr_x)
    .ticks(5)
    .tickSizeOuter(0);

  const axis = g.selectAppend("g.rr_intervals_axis")
    .call(axis_drawing_func);

  axis.selectAll("text")
    .at({
      x: 2, y: -4,
      textAnchor: 'start',
    });

  // Guide line at RR = 1 for reference of 'null'
  axis.selectAll('.tick line')
    .at({
      y1: d => d === 1 ? sizes.matrix_plot_h: 0,
    });

  // Get rid of the zero tick value for cleanliness
  remove_zero_tick(axis);

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
      stroke: d => d.pointEst === 0 ? colors.null_rr_interval: colors.rr_interval,
      strokeWidth: ciThickness,
    });

  rr_intervals
    .selectAppend('circle')
    .at({
      cx: d => scales.rr_x(d.pointEst),
      r: ciThickness*1.5,
      fill: d => d.pointEst === 0 ? colors.null_rr_interval: colors.rr_interval,
    });

  // Title subplot
  g.selectAppend('text.title')
    .text("Relative risk")
    .at({
      textAnchor: 'middle',
      y: sizes.matrix_plot_h + sizes.margin.bottom - sizes.padding*2.5,
      x: sizes.rr_plot_w/2,
    });
}

function draw_code_marginal_bars(g, marginals, scales, sizes){
  const t = d3.transition().duration(500);

  // Now draw the intervals
  const code_marginal_bars = g.selectAll('.code_marginal_bar')
    .data(marginals, d => d.code);

  // Exit
  code_marginal_bars.exit()
    .transition(t)
    .at({
      y: sizes.margin_count_h,
      height: 0,
    })
    .remove();

  // Append
  code_marginal_bars.enter()
    .append('rect.code_marginal_bar')
    .at({
       y: sizes.margin_count_h,
       x: d => scales.matrix_width_scale(d.code),
       fill: colors.marginal_count_bars,
    })
    .merge(code_marginal_bars)
    .transition(t)
    .at({
      x: d => scales.matrix_width_scale(d.code),
      y: d => scales.marginal_y(d.count),
      width: scales.matrix_column_width,
      height: d => sizes.margin_count_h - scales.marginal_y(d.count),
    });

   // Axis
  const axis = g.selectAppend("g.code_marginal_bars_axis")
    .call(
      d3.axisLeft()
        .scale(scales.marginal_y)
        .ticks(5)
        .tickSizeOuter(0)
    );

  // Get rid of the zero tick value for cleanliness
  remove_zero_tick(axis);

  axis.selectAll("text")
    .at({
      y: -5,
      x: -4,
    });

}

function create_pattern_interaction_layer(g, patterns, scales, sizes, callbacks){
  g.html('');

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
      })
      .at(interaction_box_styles);

  // Apply desired callbacks
  Object.keys(callbacks).forEach(name => {
    pattern_rows.on(name, callbacks[name]);
  });
}

function create_code_interaction_layer(g, marginals, scales, sizes, callbacks){
  g.html('');

  // Draws invisible selection rectangles over the vertical patterns
  const code_cols = g.selectAll('.code_col')
    .data(marginals)
    .enter().append('g.code_col')
    .translate((d,i) => [scales.matrix_width_scale(d.code), -sizes.padding])
    .selectAppend('rect')
      .at({
        width: scales.matrix_column_width,
        height: sizes.h + sizes.margin.bottom + sizes.padding
      })
      .at(interaction_box_styles);

  // Apply desired callbacks
  Object.keys(callbacks).forEach(name => {
    code_cols.on(name, callbacks[name]);
  });
}

// Creates a panel that can display text wherever it is placed
// Returns methods to update, show, and hide info
function create_info_panel(g, panel_size, panel_padding = 5){
  const panel = g.selectAppend('g.info');

  panel.selectAppend('rect')
    .at({
      width: panel_size[0],
      height: panel_size[1],
      fillOpacity: 0,
    });

  const panel_text = panel.selectAppend('text')
    .at({
      y:  panel_size[1]/2,
      x:  panel_size[0]/2,
    })
    .st({
      fontSize: panel_size[0] > 200 ? '22px': '18px', // make font size's mildly responsive to try and avoid overlapping axis
      alignmentBaseline: 'middle',
      textAnchor: 'middle',
    });

  function update(content_array){
    panel_text.html(content_array);

    // If we have tspans make sure they are centered where they should be
    panel_text.selectAll('tspan')
      .attr('x', panel_size[0]/2);

    return this;
  }
  function hide(){
    panel.attr('opacity', 0);
    return this;
  }
  function show(){
    panel.attr('opacity', 1);
    return this;
  }

  // Start with panel hidden
  hide();

  return {
    update,
    hide,
    show,
  };
}

// Appends a small slider the user can use to filter what the minimumn size of the cases they want is
function make_set_size_slider(g, set_size_x, sizes, starting_min_size, on_release){
  // How far we let the slider go in either direction
  const [range_min, range_max] = set_size_x.domain();

  // These are mutated to keep track of state of drag
  let desired_size = starting_min_size;
  let below_max = true;
  let above_min = true;

  const handle_w = 15;
  const handle_h = 28;
  const padding_top = 3;

  // Setup handle container
  const handle = g.selectAppend('g.handle')
    .style('cursor', 'grab'); // Make cursor a hand to emphasize grabability of handle

  // Add a rectangle background
  const handle_rect = handle.selectAppend('rect')
    .at({
      width: handle_w,
        height: handle_h,
        fill: colors.silder_handle,
        rx: 5,
        strokeWidth: 0,
        stroke: 'black',
      });

  // Add vertical line marking exact cutoff position
  handle.selectAppend('line')
    .at({
      x1: handle_w/2,
      x2: handle_w/2,
      y1: 0,
      y2: handle_h,
      stroke: 'white',
      strokeWidth: 2,
    });


  // Add text that shows value while dragging
  const handle_text = handle.selectAppend('text')
    .at({
      textAnchor: 'end',
      y: handle_h/2 + 2,
      x: -2,
      alignmentBaseline: 'middle',
      opacity: 0,
    });

  // Function to move handle in x-direction
  const move_handle = x => handle.translate([x - handle_w/2, padding_top]);

  handle.call(d3.drag()
        .on("start", dragstarted)
        .on("drag",dragged)
        .on("end", dragended));

  function dragstarted(d) {
    // Put a outline around handle to show it was selected
    handle_rect.attr('stroke-width', 2);
    // Show the min-size text for precision changing
    handle_text.attr('opacity', 1);
  }

  function dragged(d) {
    desired_size = set_size_x.invert(d3.event.x);
    below_max = desired_size < range_max;
    above_min = desired_size > range_min;

    if(below_max && above_min){
      move_handle(d3.event.x);
      handle_text.text(`size > ${countFormat(desired_size)}`);
    }else {
      desired_size = !above_min ? range_min : range_max;
    }
  }

  function dragended(d) {
    // Reset outline of handle
    handle_rect.attr('stroke-width', 0);
    // Hide text again
    handle_text.attr('opacity', 0);

    const new_desired_size = set_size_x.invert(d3.event.x);
    on_release(desired_size);
  }

  // Initialize handle position
  move_handle(set_size_x(starting_min_size));
}

function draw_with_set_size(g, min_set_size, sizes, set_size_x){

  const {patterns, marginals} = filter_set_size(data, options.marginalData, min_set_size);

  // Setup the scales
  const scales = setup_scales(patterns, marginals, sizes, set_size_x);

  // ----------------------------------------------------------------------
  // Chart Components
  // ----------------------------------------------------------------------
  const matrix_chart = g.selectAppend('g.matrix_chart')
    .translate([sizes.set_size_bars_w,sizes.margin_count_h])
    .call(draw_pattern_matrix, patterns, marginals, scales, sizes);

  const pattern_size_bars = g.selectAppend('g.pattern_size_bars')
    .translate([0, sizes.margin_count_h])
    .call(draw_pattern_count_bars, patterns, scales, sizes);

  const rr_intervals = g.selectAppend('g.rr_intervals')
    .translate([sizes.set_size_bars_w + sizes.matrix_plot_w, sizes.margin_count_h])
    .call(draw_rr_intervals, patterns, scales, sizes);

  const code_marginal_bars = g.selectAppend('g.code_marginal_bars')
    .translate([sizes.set_size_bars_w,0])
    .call(draw_code_marginal_bars, marginals, scales, sizes);

  // ----------------------------------------------------------------------
  // Interaction setup and logic
  // ----------------------------------------------------------------------
  const left_info_panel = create_info_panel(
    g.selectAppend('g.left_info_panel'),
    [sizes.set_size_bars_w, sizes.margin_count_h-sizes.padding*2]
  );

  const right_info_panel = create_info_panel(
    g.selectAppend('g.right_info_panel').translate([sizes.set_size_bars_w + sizes.matrix_plot_w, 0]),
    [sizes.set_size_bars_w, sizes.margin_count_h-sizes.padding*2]
  );

  const pattern_callbacks = {
    mouseover: function(d){
      const line_height = 20;

      const rr_message = `
      <tspan>RR: ${CiFormat(d.pointEst)}</tspan>
      <tspan dy="${line_height}">(${CiFormat(d.lower)}, ${CiFormat(d.upper)})</tspan>`;

      const size_message = `
      <tspan>Pattern appears</tspan>
      <tspan dy="${line_height}">${countFormat(d.count)} times</tspan>`;
      const codes_in_pattern = d.pattern.split('-');

      // Update right panel with rr info
      right_info_panel.update(rr_message).show();
      left_info_panel.update(size_message).show();
      // highlight pattern
      d3.select(this).attr('opacity', 0.7);
    },
    mouseout: function(d){
      right_info_panel.hide();
      left_info_panel.hide();
      d3.select(this).attr('opacity', 0);
    }
  };

  const code_callbacks = {
    mouseover: function(d){
      left_info_panel.update(`Code: ${d.code}`).show();
      right_info_panel.update(`Appears ${countFormat(d.count)} times`).show();

      // highlight
      d3.select(this).attr('opacity', 0.7);
    },
    mouseout: function(d){
      left_info_panel.hide();
      right_info_panel.hide();
      d3.select(this).attr('opacity', 0);
    }
  };

  const code_interaction_layer = g.selectAppend('g.code_interaction_layer')
    .translate([sizes.set_size_bars_w,0])
    .call(create_code_interaction_layer, marginals, scales, sizes, code_callbacks);

  const pattern_interaction_layer = g.selectAppend('g.pattern_interaction_layer')
    .translate([0, sizes.margin_count_h])
    .call(create_pattern_interaction_layer, patterns, scales, sizes, pattern_callbacks);
}


// ----------------------------------------------------------------------
// Start main visualization drawing
// ----------------------------------------------------------------------

// Setup the sizes of chart components
const sizes = setup_chart_sizes(width, height, margin);

// Get a set_size scale for use with slider
const set_size_x = setup_set_size_x_scale(data, sizes);

// Add a g to pad chart
const g = svg.selectAppend('g.padding')
  .translate([sizes.margin.left, sizes.margin.top]);

// Check if we have enough data to make a meaningful upset chart
if(data.length < 2){

  const lead_message = data.length === 1 ? "Only one group meets" : "No groups meet";
  svg.append('text')
    .attr('text-anchor', 'middle')
    .tspans([`${lead_message} filter size threshold`, 'Adjust threshold down to see groups.'])
    .attr('x', width/2)
    .attr('y', height/2);

} else {
  const [min_count, max_count] = d3.extent(data, d => d.count);
  // Make sure desired min set size is within reason
  const starting_min_size = options.min_set_size < min_count ? min_count + 1 :
                            options.min_set_size > max_count ? max_count -1  :
                                                               options.min_set_size;
  // Setup the size slider
  const set_size_slider =  g.selectAppend('g.set_size_slider')
    .translate([0, sizes.h])
    .call(make_set_size_slider, set_size_x, sizes, starting_min_size, (new_size) => draw_with_set_size(g, new_size, sizes, set_size_x));

  // Initialize viz
  draw_with_set_size(g, starting_min_size, sizes, set_size_x);
}


