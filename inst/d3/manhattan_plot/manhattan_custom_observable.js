// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c('d3-jetpack', here::here('inst/d3/manhattan_plot/datatables.min.js')), css = here::here('inst/d3/manhattan_plot/datatables.min.css')
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================

const margin = {left: 65, right: 10, top: 10, bottom: 20};

const manhattan_unit = 3;
const hist_unit = 1;
const table_unit = 1;
const total_units = manhattan_unit + hist_unit + table_unit + 1;

const manhattan_prop = manhattan_unit/total_units;
const hist_prop = hist_unit/total_units;
const table_prop = table_unit/total_units;

const num_hist_bins = 100;

// Holds the histogram data for us. Needs to be
// modified every time we resize the plot.
let or_bins;

// ================================================================
// Setup DOM elements
// ================================================================
div.style('overflow', 'scroll');

const main_svg = div.append('svg')
  .attr('id', 'main_viz');

const or_svg = div.append('svg')
  .attr('id', 'or_hist');

const code_table_div = div.append('div')
  .style('height', '20%')
  .append('table')
  .attr('class', 'display compact');

// Then we append a g element that has padding added to it to those svgs
const main_viz = main_svg
  .append('g')
  .attr("transform", `translate(${margin.left},${margin.top})`);

const or_hist = or_svg
  .append('g')
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Next we append some gs within those gs to house our brushes for filtering data
// attach the brush to the chart
const manhattan_brush_g = main_viz.append('g')
  .attr('class', 'brush');

const hist_brush_g = or_hist.append('g')
  .attr('class', 'brush');

// Reset button that shows up when there is something selected
// allowing the user to back out to default.
const reset_button = main_viz.selectAppend('text#clear_button')
  .attr('x', 5)
  .attr('y', 0)
  .attr('text-anchor', 'start')
  .text('Reset')
  .on('click', () => app_state.pass_action('reset_button', null));


// ================================================================
// Global variables that get accessed in state functions
// ================================================================

// Scales
// ================================================================
const manhattan_scales = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};

const histogram_scales = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};

// Quadtree
// ================================================================
const main_quadtree = d3.quadtree();


// ================================================================
// Initalize State
// ================================================================

class App_State{

  constructor(initial_state, on_new_state){
    this.state = initial_state;
    // keep track of what elements have changed
    this.changes = {};
    for(let prop in initial_state){
      this.changes[prop] = true;
    }

    this.on_new_state = on_new_state;

    this.on_new_state(this);
  }

  // Change a state value and mark it fresh
  modify_property(prop, new_value){
    this.state[prop] = new_value;
    this.changes[prop] = true;
  }

  has_changed(prop){
    return this.changes[prop];
  }

  // Record that a given state property has been dealt with.
  mark_completed(prop){
    this.changes[prop] = false;
  }

  // What propeties have changed and need to be updated
  fresh_properties(){
    const fresh_props = [];
    for(let prop in initial_state){
      if(this.changes[prop]) fresh_props.push(prop);
    }
    return fresh_props;
  }

  get(prop){
    return this.state[prop];
  }

  // Individual app components pass info to this
  // which then modifies the internal state accordingly
  pass_action(type, payload){
    //debugger;
    switch(type){
      case 'initialize':
        break;
      case 'new_data':
        this.modify_property('data', payload);
        break;
      case 'new_sizes':
        this.modify_property('sizes', payload);
        break;
      case 'manhattan_brush':
        const newly_selected = manhattan_filter(this.get('or_bounds'), payload);
        this.modify_property('selected_codes', newly_selected);
        break;
      case 'hist_brush':
        // Update OR bounds
        this.modify_property('or_bounds', payload);
        // Calculate and update the newly selected codes
        const currently_selected = this.get('selected_codes');
        this.modify_property(
          'selected_codes',
          this.get('data')
            .filter(d => currently_selected.includes(d.code) ) // filter to codes that are selected
            .filter(d => (d.log_or > payload[0]) && (d.log_or < payload[1])) // filter out codes now outside boundaries
            .map(d => d.code)
        );
        break;
      case 'table_selection':
        this.modify_property('selected_codes', payload);
        break;
      case 'reset_button':
        // Clear the filters to default values
        this.modify_property('selected_codes', []);
        this.modify_property('or_bounds', [-Infinity, Infinity]);
        break;
      default:
        console.log('unknown input');
    }

    this.on_new_state(this);
  }
}

let manhattan_plot, hist_brush, table_select_codes;

function new_state(state){
  const changed_props = state.fresh_properties();

  // The flow of drawing the whole viz. Only refreshing components if they need to be.

  // Set the sizes of the various dom elements
  if(state.has_changed('sizes')) size_viz(state.get('sizes'));

  // From here on out we need data so let's check if we have data before proceeding
  const data = state.get('data');
  if(!data) return;

  // add log odds ratios to data
  if(state.has_changed('data')) process_new_data(data);


  // Update scales and the quadtree for selecting points
  if(state.has_changed('sizes') || state.has_changed('data')){
    reset_scales(data, state.get('sizes'));
    setup_quadtree(data, manhattan_scales);
  }

  // Draw plots
  if(state.has_changed('sizes') || state.has_changed('data')){

    manhattan_plot = draw_manhattan(data);
    initialize_manhattan_brush(data);

    draw_histogram(data);
    hist_brush = initialize_histogram_brush(data);

    table_select_codes = draw_table(data);
  }

  if(state.has_changed('selected_codes') || state.has_changed('or_bounds')){
    const default_bounds = tuples_equal(state.get('or_bounds'), [-Infinity, Infinity]);
    const no_codes_selected = state.get('selected_codes').length === 0;

    if(default_bounds && no_codes_selected){
      hide_reset();
    } else {
      show_reset();
    }
  }

  if(state.has_changed('selected_codes')){
    manhattan_plot.highlight(state.get('selected_codes'));
  }


  if(state.has_changed('or_bounds')){
    console.log('User has changed or_bounds!');
    manhattan_plot.disable(this.get('or_bounds'));

    // Check if the vis was just reset.
    if(tuples_equal(state.get('or_bounds'), [-Infinity, Infinity])){
      hist_brush.reset();
    }

  }

  // Check if viz has been reset
  if(state.has_changed('or_bounds')){
    console.log('User has changed or_bounds!');
    manhattan_plot.disable(this.get('or_bounds'));
  }

  // Make all the props completed.
  changed_props.forEach(p => state.mark_completed(p));

  //debugger;
}

const initial_state = {
  data: data,
  or_bounds: [-Infinity, Infinity],
  selected_codes: [],
  sizes: [height, width],
};

const app_state = new App_State(initial_state, new_state);


// ===============================================================
// Rendering
// This code runs whenever data changes
// ===============================================================
r2d3.onRender(function(data, svg, width, height, options) {
  app_state.pass_action('new_data', data);
  app_state.pass_action('new_sizes', [width, height]);
});

// ===============================================================
// Resizing
// This is called by r2d3 runs whenever the plot is resized
// ===============================================================
r2d3.onResize(function(width, height){
  app_state.pass_action('new_sizes', [width, height]);
});

// ================================================================
// Main drawing functions.
// ================================================================

function draw_manhattan(data){
  // Make sure that the neccesary info is provided before drawing.
  if(data === null) return;

  let currently_selected_points;

  const default_point = {
    r: 2,
    fillOpacity: 1,
    fill: d => d.unselected_color,
  };

  const disabled_point = {
    r: 1,
    fillOpacity: 0.4,
    fill: 'grey',
  };

  const highlighted_point = {
    r: 3,
    fillOpacity: 1,
    fill: d => d.color,
  };

  const code_selected = d => selected_codes.includes(d.code);

  let manhattan_points = main_viz.selectAll('circle')
    .data(data, d => d.code);

  manhattan_points = manhattan_points.enter()
    .append('circle')
    .merge(manhattan_points)
    .attr('cx', d => manhattan_scales.x(d.index))
    .attr('cy', d => manhattan_scales.y(d.log_pval))
    .at(default_point);
    //.on('mouseover', d => {});


  // Draw the axes
  main_viz.selectAppend("g#y-axis")
    .call(function(g){
      g.attr("transform", `translate(${-5},0)`)
      .call(d3.axisLeft(manhattan_scales.y).tickSizeOuter(0))
      .call(add_axis_label('-Log10 P'));
    });

  main_viz.selectAppend("g.x-axis")
    .call(g =>
      g.attr("transform", `translate(0,${manhattan_scales.y.range()[0]})`)
        .call(d3.axisBottom(histogram_scales.x).ticks(1).tickSizeOuter(0))
        .call(add_axis_label('PheCode', false))
        .call(g => g.select(".tick:first-of-type").remove())
    );

  const disable_codes = or_bounds => {

    //debugger;
    const is_disable = d =>  (d.log_or < or_bounds[0]) || (d.log_or > or_bounds[1]);

    manhattan_points
      .filter(d => is_disable(d))
      .at(disabled_point)
      .each(d => d.disabled = true);

    const non_disabled_points = manhattan_points
      .filter(d => !is_disable(d) && !currently_selected_points.includes(d.code))
      .at(default_point)
      .raise()
      .each(d => d.disabled = false);
  };

  const highlight_codes = selected_codes => {
    currently_selected_points = selected_codes;
    manhattan_points
      .filter(d => selected_codes.includes(d.code))
      .raise()
      .at(highlighted_point);

    // Make sure points that are not disabled but not highlighted are back at default settings
    manhattan_points
      .filter(d => !selected_codes.includes(d.code) && !d.disabled)
      .at(default_point);
  };

  highlight_codes([]);

  return {
    highlight: highlight_codes,
    disable: disable_codes
  };
}


function show_reset(){
  reset_button.attr('font-size', 15);
}


function hide_reset(){
  reset_button.attr('font-size', 0);
}


function draw_histogram(data){

  let hist_bars = or_hist
    .attr("fill", "steelblue")
    .selectAll("rect.histogram_bar")
    .data(or_bins);

  hist_bars = hist_bars.enter().append('rect')
    .attr('class', 'histogram_bar')
    .merge(hist_bars)
    .attr("x", d =>  histogram_scales.x(d.x0) + 1)
    .attr("width", d => Math.max(0,  histogram_scales.x(d.x1) -  histogram_scales.x(d.x0) - 1))
    .attr("y", d =>  histogram_scales.y(d.length))
    .attr("height", d =>  histogram_scales.y(0) -  histogram_scales.y(d.length));

  or_hist.selectAppend("g.x-axis")
    .call(g =>
      g.attr("transform", `translate(0,${histogram_scales.y.range()[0]})`)
        .call(d3.axisBottom(histogram_scales.x).tickSizeOuter(0))
        .call(add_axis_label('Log Odds-Ratio', false))
    );

  or_hist.selectAppend("g.y-axis")
    .call(
      g => g.attr("transform", `translate(${-5},0)`)
        .call(d3.axisLeft(histogram_scales.y).tickSizeOuter(0))
        .call(add_axis_label('# of Codes'))
    );
}


function draw_table(data){
  data.forEach(d => d.selected = 0);

  let selected_codes = [];

  function Code_Row(d){

    this.code = d.code;
    this.OR = d.OR;
    this.p_val = d.p_val;
    this.Description = d.description;
    this.Category = d.category;
    this.Selected = false;

    //this.Selected = function(){
    //  return selected_codes.includes(this.Code) ? 1: 0;
    //};
  }

  const table_data = data.map(d => new Code_Row(d));

  // Initialize table.
  const code_table = $(code_table_div.node()).DataTable({
    data: table_data,
    columns: [
      {title: 'Code',        data: 'code'        },
      {title: 'OR',          data: 'OR',         searchable: false, render: format_val},
      {title: 'P-Value',     data: 'p_val',      searchable: false, render: format_val},
      {title: 'Description', data: 'Description'},
      {title: 'Category',    data: 'Category' },
      {title: 'Selected',    data: 'Selected',   render: d => d ? 'Yes': 'No'}
    ],
    scrollY: `${height*table_prop}px`,
    retrieve: true
  });


  // START HERE
  // Currently figuring out how to speed up the selection of codes and sorting of the table
  // I think there should be a way of defining a seperate sort function outside the data.


  // Function for updating table with selected codes
  const update_table_selection = (codes_to_select, sort_table = false) => {

     code_table
      .rows()
      .invalidate()
      .draw()
      .every(function(row_index) {

        // Test if the current node is selected
        if(codes_to_select.includes(this.data().code)) {
          // Invalidate the row to let datatables know that it needs to reead the selected property again.
          this.invalidate();

        }
        const curr_node = $(this.nodes());
        const selected_cell = code_table.cell(row_index, 5);

        // Reset all nodes to unselected
        selected_cell.data(0);
        curr_node.removeClass('selected');

        // Test if the current node is selected
        if(codes_to_select.includes(this.data().code)) {

          // If it is, change data to reflect that
          selected_cell.data(1);
          curr_node.addClass('selected');
        }
      });

      if(sort_table){
        // Sort table on selected to bring selections to top.
        code_table
          .order( [ 5, 'desc' ] )
          .draw();
      }
  };

  function sort_table(){
     code_table
      .order( [ 5, 'desc' ] )
      .draw();
  }


  // Bind listeners to click events on a row, for selection from within table.
  $(code_table_div.select('tbody').node())
    .on('click', 'tr', function(){
      // Add the selected class to the code's row for highlighting
      $(this).toggleClass('selected');

      // Get up-to-date list of selected codes;
      const codes_to_select = Array.from(code_table.rows('.selected').data()).map(d => d.code);

      // Send this selection to the state
      app_state.pass_action('table_selection', codes_to_select);

      // Grab current row object
      const current_row = code_table.row(this);

      // Get reference to row data and toggle selectedness
      const row_data = current_row.data();
      row_data.Selected = !row_data.Selected;

      // Tell table to update with new selection choice
      current_row.invalidate().draw();
    });


  return update_table_selection;
}


// ================================================================
// On load functions for resizing and processing raw data
// ================================================================

function size_viz([width, height]){
  const manhattan_height = height*manhattan_prop;
  const or_height = height*hist_prop;
  //const table_height = height*table_prop;

  // Adjust the sizes of the svgs
  main_svg
    .attr('height', manhattan_height)
    .attr('width', width);

  or_svg
    .attr('height', or_height)
    .attr('width', width);
}


function process_new_data(data){
  // Add a log_pval and log_or field to all points and keep track of extents
  data.forEach((d,i) => {
    d.log_pval = -Math.log10(d.p_val);
    d.log_or = Math.log(d.OR);
    d.unselected_color = d3.interpolateLab(d.color, "white")(0.66);
    d.index = i;
  });
}


// ================================================================
// Brush setup functions.
// ================================================================

function initialize_manhattan_brush(data){
  // Initialize a quadtree to help us filter through the manhattan points much faster
  const main_quadtree = d3.quadtree()
    .x(d => manhattan_scales.x(d.index))
    .y(d => manhattan_scales.y(d.log_pval))
    .addAll(data);

  const manhattan_brush = d3.brush().on('end', on_manhattan_brush);

  // Add a g element and call the brush on it.
  const manhattan_brush_g = main_viz
    .selectAppend('g#manhattan_brush')
    .attr('class', 'brush');

  manhattan_brush_g.call(manhattan_brush);


  function on_manhattan_brush(){
    const { selection } = d3.event;

    // if we have no selection, just reset the brush highlight to no nodes
    if(!selection) return;

    manhattan_brush_g.call(manhattan_brush.move, null);

    // Send result of brush event to the app state
    app_state.pass_action('manhattan_brush', selection);
}
}


function initialize_histogram_brush(data){

  const [x_min, x_max] = histogram_scales.x.range();
  const [y_min, y_max] = histogram_scales.y.range();

  const selection_range = [
    [x_min - 1, y_max],
    [x_max + 1, y_min]
  ];

  const hist_brush = d3.brushX()
    .extent(selection_range)
    .on('end', on_hist_brush);

  // Add a g element and call the brush on it.
  const hist_brush_g = or_hist
    .selectAppend('g#hist_brush')
    .attr('class', 'brush');

  hist_brush_g.call(hist_brush);
  set_brush_pos(histogram_scales.x.range());

  hist_brush_g.select('.selection')
    .attr('fill-opacity', 0.1);

  hist_brush_g.selectAll('.handle')
    .at({
      //width: 15,
      strokeWidth: 2,
      fill: 'darkgrey',
    });

  function set_brush_pos([min, max]){
    hist_brush_g.call(hist_brush.move, [min, max]);
  }

  function on_hist_brush(){

    const { selection } = d3.event;
    // if we have no selection, just reset the brush highlight to no nodes
    if(!selection) return;

    // Is this move just a result of a reset? If so ignore it.
    const is_reset_pos = tuples_equal(selection, histogram_scales.x.range()) ;
    if(is_reset_pos) return;

    const or_min = histogram_scales.x.invert(selection[0]);
    const or_max = histogram_scales.x.invert(selection[1]);

    app_state.pass_action('hist_brush', [or_min, or_max]);
  }

  return {
    set: set_brush_pos,
    reset: () => set_brush_pos(histogram_scales.x.range()),
  };
}


function setup_quadtree(tree_data){
  if(tree_data === null) return;
  // generate a quadtree for faster lookups for brushing
  // Rebuild the quadtree with new positions
  main_quadtree.removeAll(main_quadtree.data());

  main_quadtree
    .x(d => manhattan_scales.x(d.index))
    .y(d => manhattan_scales.y(d.log_pval))
    .addAll(tree_data);
}


function manhattan_filter(or_bounds, selection){
  //const {or_bounds} = state;

  // begin an array to collect the brushed nodes
  const selected_codes = [];

  // traverse all branches of the quad tree
  main_quadtree.visit((node, x1, y1, x2, y2) => {

    const overlaps_selection = selection_contains(
      selection, x1, y1, x2, y2
    );

     // skip if it doesn't overlap the brush
    if(!overlaps_selection){
      return true;
    }

    // If we have overlap and we're a leaf node, investigate
    if (!node.length) {
      const d = node.data;
      const dx = manhattan_scales.x(d.index);
      const dy = manhattan_scales.y(d.log_pval);
      if (selection_contains(selection, dx, dy)) {

        const in_or_bounds = (d.log_or > or_bounds[0]) && (d.log_or < or_bounds[1]);
        if(in_or_bounds){
          selected_codes.push(d.code);
        }
      }
    }

    // return false so that we traverse into branch (only useful for non-leaf nodes)
    return false;
  });

  return selected_codes;
}


function reset_scales(data, sizes){

  const [width, height] = sizes;

  // ===============================================================
  // Manhattan plot
  // ===============================================================
  const manhattan_height = manhattan_prop*height;
  const max_log_pval = d3.max(data, d => d.log_pval);

  manhattan_scales.x
    .domain([0, data.length])
    .range([0, width - margin.left - margin.right]);

  manhattan_scales.y
    .domain([0, max_log_pval])
    .range([(manhattan_prop*height) - margin.top - margin.bottom, 0]);


  // ===============================================================
  // Histogram
  // ===============================================================
  const hist_height = hist_prop*height;
  const log_ors = data.map(d => d.log_or);

  histogram_scales.x
    .range([0, width - margin.left - margin.right])
    .domain(d3.extent(log_ors)).nice();

  or_bins = d3.histogram()
    .domain(histogram_scales.x.domain())
    .thresholds(histogram_scales.x.ticks(num_hist_bins))
    (log_ors);

  histogram_scales.y
    .range([hist_height - margin.top - margin.bottom, 0])
    .domain([0, d3.max(or_bins, d => d.length)]).nice();
}


// ===============================================================
// Helper functions
// ===============================================================

function add_axis_label(label, y_axis = true){

  const bump_axis = y_axis ? 'x': 'y';

  const axis_label_style = {
    [bump_axis]: y_axis ? -3: 8,
    textAnchor: 'end',
    fontWeight: 'bold',
    fontSize: '0.7rem'
  };

  return g => {
    g.select(".tick:last-of-type line").remove();

    g.select(".tick:last-of-type text")
            .at(axis_label_style)
            .text(label);
  };
}

function remove_axis_spine(g){
   g.select(".domain").remove()
}

function selection_contains(selection, bx_min, by_min, bx_max = bx_min, by_max = by_min){
  const [[sx_min, sy_min],[sx_max, sy_max]] = selection;

  const xs_intersect = (sx_min < bx_max) && (sx_max > bx_min);
  const ys_intersect = (sy_min < by_max) && (sy_max > by_min);

  return xs_intersect && ys_intersect;
}

function format_val(d){
  return d3.format(".3")(d);
}

function tuples_equal(a,b){
  return (a[0] === b[0]) && (a[1] === b[1]);
}
