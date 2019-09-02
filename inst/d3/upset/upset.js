// !preview r2d3 data = readr::read_rds(here::here('data/fake_upset_main.rds')), options = readr::read_rds(here::here('data/fake_upset_options.rds')), dependencies = c("d3-jetpack", here::here('inst/d3/helpers.js'), here::here('inst/d3/upset/helpers.js')), css=here::here('inst/d3/upset/upset.css')

let viz_data = data,
    viz_svg = svg,
    viz_options = options,
    viz_width = width,
    viz_height = height;

// Constants
const margin = {right: 50, left: 50, top: 20, bottom: 70}; // margins on side of chart

const colors = {
  pattern_count_bars: viz_options.colors.light_blue,
  rr_interval: viz_options.colors.dark_red,
  null_rr_interval: 'black',
  code_missing: viz_options.colors.dark_grey,
  pattern_bar: "#252525",
  interaction_box_border: viz_options.colors.med_grey,
  silder_handle: viz_options.colors.green,
};

const interaction_box_styles = {
  opacity: 0,
  fillOpacity:0,
  rx: 5,
  stroke: 'grey',
  strokeWidth: 1
};


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
    code_to_color: viz_options.code_to_color, // attach color information to scales for each code
  };
}

function setup_chart_sizes(width, height, margin, only_snps){
  const set_size_bars_units = 1;
  const rr_plot_units = only_snps ? 0 : 1;
  const matrix_plot_units = 0.7;
  const marginal_count_prop = 0.3;
  const total_width_units = set_size_bars_units + rr_plot_units + matrix_plot_units;

  const h = height - margin.top - margin.bottom;
  const w = width - margin.left - margin.right;

  return {
    set_size_bars_w: w*(set_size_bars_units/total_width_units),
    rr_plot_w: w*(rr_plot_units/total_width_units),
    matrix_plot_w: w*(matrix_plot_units/total_width_units),
    margin_count_h: h*marginal_count_prop,
    matrix_plot_h: h*(1 - marginal_count_prop),
    matrix_padding: 10,
    padding: 10,
    w,
    h,
    margin,
  };
}

function draw_with_set_size(g, min_set_size, sizes, set_size_x, only_snp_data){
  const {patterns, marginals} = filter_set_size(viz_data, viz_options.marginalData, min_set_size);

  // Setup the scales
  const scales = setup_scales(patterns, marginals, sizes, set_size_x);

  // ----------------------------------------------------------------------
  // Chart Components
  // ----------------------------------------------------------------------
  const matrix_chart = g.selectAppend('g.matrix_chart')
    .translate([sizes.set_size_bars_w, sizes.margin_count_h])
    .call(draw_pattern_matrix, patterns, marginals, scales, sizes);

  const pattern_size_bars = g.selectAppend('g.pattern_size_bars')
    .translate([0, sizes.margin_count_h])
    .call(draw_pattern_count_bars, patterns, scales, sizes);

  if(only_snp_data){
    // Make sure to remove any lingering snp info
    g.select('g.rr_intervals').remove();
  } else {
     const rr_intervals = g.selectAppend('g.rr_intervals')
      .translate([sizes.set_size_bars_w + sizes.matrix_plot_w, sizes.margin_count_h])
      .call(draw_rr_intervals, patterns, scales, sizes);
  }

  const code_marginal_bars = g.selectAppend('g.code_marginal_bars')
    .translate([sizes.set_size_bars_w,0])
    .call(draw_code_marginal_bars, marginals, scales, sizes);

  // ----------------------------------------------------------------------
  // Interaction setup and logic
  // ----------------------------------------------------------------------
  const left_info_panel = create_info_panel(
    g.selectAppend('g.left_info_panel'),
    [sizes.set_size_bars_w, sizes.margin_count_h-sizes.padding*2],
    'left'
  );

  const right_info_panel = create_info_panel(
    g.selectAppend('g.right_info_panel')
      .translate([sizes.set_size_bars_w + sizes.matrix_plot_w, 0]),
    [sizes.set_size_bars_w, sizes.margin_count_h-sizes.padding*2],
    'right'
  );

  const pattern_callbacks = {
    mouseover: function(d){
      const line_height = 22;

      const rr_message = `
      <tspan>RR: ${CiFormat(d.pointEst)}</tspan>
      <tspan dy="${line_height}">(${CiFormat(d.lower)}, ${CiFormat(d.upper)})</tspan>`;

      const size_message = `
      <tspan>Appears</tspan>
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
  },
    click: function(d){
      // Flip highlighted status
      d.highlighted = (!d.highlighted || false);

      const codes_in_pattern = d.pattern.split('-');

      // Send message to shiny about the highlighted pattern
      if(d.highlighted){
        send_to_shiny('pattern_highlight', codes_in_pattern, viz_options.msg_loc || 'no_shiny');
      } else {
        send_to_shiny('pattern_highlight', [], viz_options.msg_loc || 'no_shiny');
      }

    }
  };

  const code_callbacks = {
    mouseover: function(d){
      const line_height = 22;

      left_info_panel.update(`Code: ${d.code}`).show();

      right_info_panel.update(`
        <tspan>Appears</tspan>
        <tspan dy="${line_height}">${countFormat(d.count)} times</tspan>`
      ).show();

      // highlight
      d3.select(this).attr('opacity', 0.7);
    },
    mouseout: function(d){
      left_info_panel.hide();
      right_info_panel.hide();
      d3.select(this).attr('opacity', 0);
    },
    click: function(d){
     // Flip highlighted status
     d.highlighted = (!d.highlighted || false);

   // Send message to shiny about the highlighted pattern
     if(d.highlighted){
       send_to_shiny('pattern_highlight', [d.code], viz_options.msg_loc || 'no_shiny');
     } else {
       send_to_shiny('pattern_highlight', [], viz_options.msg_loc || 'no_shiny');
     }
    }
  };

  const code_interaction_layer = g.selectAppend('g.code_interaction_layer')
    .translate([sizes.set_size_bars_w,0])
    .call(create_code_interaction_layer, marginals, scales, sizes, code_callbacks);

  const pattern_interaction_layer = g.selectAppend('g.pattern_interaction_layer')
    .translate([0, sizes.margin_count_h])
    .call(create_pattern_interaction_layer, patterns, scales, sizes, pattern_callbacks);
}

function draw_upset(){
  // ----------------------------------------------------------------------
  // Start main visualization drawing
  // ---------------------------------------------------------------------

  const filtered_on_snp = viz_data.filter(d => d.num_snp < d.count).length === 0;

  // Setup the sizes of chart components
  const sizes = setup_chart_sizes(viz_width, viz_height, margin, filtered_on_snp);

  // Get a set_size scale for use with slider
  const set_size_x = setup_set_size_x_scale(viz_data, sizes);

  // Add a g to pad chart
  const g = svg.selectAppend('g.padding')
    .translate([sizes.margin.left, sizes.margin.top]);

  // Check if we have enough data to make a meaningful upset chart
  if(viz_data.length < 2){
    const lead_message = viz_data.length === 1 ? "Only one group meets" : "No groups meet";
    svg.append('text')
      .attr('text-anchor', 'middle')
      .tspans([`${lead_message} filter size threshold`, 'Adjust threshold down to see groups.'])
      .attr('x', viz_width/2)
      .attr('y', viz_height/2);

  } else {
    // Figure out starting min_set_size.
    const sorted_sizes = viz_data.map(d => d.count).sort((a,b) => a - b);
    // How many patterns will be shown with default min size?
    const num_patterns_shown = sorted_sizes.findIndex(d => d > viz_options.min_set_size);

    // If the viz is only showing 2 or fewer patterns adjust min size to show at least 2.
    const starting_min_size = num_patterns_shown < 2 ? sorted_sizes[2]: viz_options.min_set_size;

    // Setup the size slider
    const set_size_slider =  g.selectAppend('g.set_size_slider')
      .translate([0, sizes.h])
      .call(make_set_size_slider,
        set_size_x,
        sizes,
        starting_min_size,
        (new_size) => draw_with_set_size(g, new_size, sizes, set_size_x, filtered_on_snp));

    // Initialize viz
    draw_with_set_size(g, starting_min_size, sizes, set_size_x, filtered_on_snp);
  }
};


r2d3.onRender((data, svg, width, height, options) => {
  viz_data = data;
  viz_svg = svg;
  viz_options = options;
  draw_upset();
});

r2d3.onResize((width,height) => {
  viz_width = width;
  viz_height = height;

  draw_upset(viz_data, viz_svg, viz_width, viz_height, viz_options);
});



