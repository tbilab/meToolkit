// !preview r2d3 data=readr::read_rds(here::here('data/manhattan_test_data.rds')), options=readr::read_rds(here::here('data/manhattan_test_options.rds')), container = 'div', dependencies = c('d3-jetpack', here::here('inst/d3/helpers.js'), here::here('inst/d3/manhattan_plot/phewas_table.js'), here::here('inst/d3/manhattan_plot/clusterize.js')), css = c( here::here('inst/d3/manhattan_plot/manhattan_plot.css'), here::here('inst/d3/helpers.css'), here::here('inst/css/common.css'))
//Test data path 'data/manhattan_test_data.rds'
//bad or data path 'data/manhattan_plot_zero_ors.rds'
// ===============================================================
// Initialization
// ===============================================================

let viz_width = width,
    viz_height = height,
    viz_data = data,
    default_selection = [];

const margin = {left: 70, right: 15, top: 35, bottom: 20};

// Relative sizes of the output components
const manhattan_unit = 3;
const hist_unit = 1;
const table_unit = 2;
const total_units = manhattan_unit + hist_unit + table_unit;

const size_props = {
  manhattan: manhattan_unit/total_units,
  histogram: hist_unit/total_units,
  table:     table_unit/total_units,
};

const num_hist_bins = 100;

// Holds the histogram data for us. Needs to be
// modified every time we resize the plot.
let or_bins;

// ================================================================
// Setup DOM elements
// ================================================================
// positioning for tooltips and buttons so they can be placed relative
// to the main div
div.st({
  overflow: 'scroll',
  position: 'relative',
});

const manhattan_viz = div
  .selectAppend('div.viz_holder')
  .style('position', 'relative');

const buttons = div.append('div.buttons')
  .st({
     textAlign: 'center',
     position: 'absolute',
     right: 10,
     top: 2,
  });

const send_button = buttons.append('button')
  .text('Update Network')
  .style('display', 'inline-block')
  .on('click', send_selection_to_shiny);

// Reset button that shows up when there is something selected
// allowing the user to back out to default.
const reset_button = buttons.append('button')
  .text('Undo selection changes')
  .style('display', 'inline-block')
  .style('margin-left', '0.5rem')
  .on('click', () => app_state.pass_action('reset_button', null));


const main_svg = manhattan_viz
  .append('svg')
  .attr('id', 'main_viz');

const or_svg = div.append('svg')
  .attr('id', 'or_hist');

const columns_to_show = [
  {name: 'Code',        id: 'code',        is_num: false, scroll: false, sortable: true,  size: 'small', small_col: true},
  {name: 'OR',          id: 'OR',          is_num: true,  scroll: false, sortable: true,  size: 'small', small_col: true},
  {name: 'P-Value',     id: 'p_val',       is_num: true,  scroll: false, sortable: true,  size: 'small', small_col: true},
  {name: 'Description', id: 'description', is_num: false, scroll: true,  sortable: false, size: 'large', small_col: false},
  {name: 'Category',    id: 'category',    is_num: false, scroll: true,  sortable: false,  size: 'med', small_col: false},
];

const table_div = div.append('div');

process_new_data(data);
const my_table = setup_table(
    table_div,
    options.colors.light_blue,
    columns_to_show
  )
  .add_data(viz_data)
  .set_selection_callback(send_table_selection);

// Setup tooltip to show same info as table.
const tooltip = setup_tooltip(manhattan_viz, columns_to_show.map(d => d.id));


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
  y: d3.scaleSqrt(),
};


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
        const newly_selected = payload;
        this.modify_property('selected_codes', newly_selected);
        break;
      case 'manhattan_brush_add':
        // User has held a while dragging so we just need to append new selection
       this.modify_property(
          'selected_codes',
          unique([...this.get('selected_codes'),...payload])
        );
        break;
      case 'manhattan_brush_delete':
        // Only keep codes that are not contained in the dragged box.
        const codes_to_delete = payload;
        this.modify_property(
          'selected_codes',
          this.get('selected_codes').filter(code => !codes_to_delete.includes(code))
        );
        break;
      case 'manhattan_click':
        // Click function passed a single code that was clicked.
        const current_selection = this.get('selected_codes');

        // Add code if it's not selected, remove if it is.
        this.modify_property(
          'selected_codes',
          current_selection.includes(payload) ?
            current_selection.filter(c => c !== payload) :
            [...current_selection, payload]
        );
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
        this.modify_property('selected_codes', default_selection);
        this.modify_property('or_bounds', [-Infinity, Infinity]);
        break;
      case 'set_sig_bars':
        this.modify_property('sig_bars', payload);
        break;
      default:
        console.log('unknown input');
    }

    this.on_new_state(this);
  }
}

let manhattan_plot, hist_brush;

function new_state(state){
  const changed_props = state.fresh_properties();

  // The flow of drawing the whole viz. Only refreshing components if they need to be.

  // From here on out we need data and sizes so let's check if we have data before proceeding
  const sizes = state.get('sizes');
  if(!sizes) return;

  // Update scales and the quadtree for selecting points
  if(state.has_changed('sizes')){
    // Set the sizes of the various dom elements
    size_viz(state.get('sizes'));

    reset_scales(viz_data, state.get('sizes'));

    manhattan_plot = draw_manhattan(viz_data);
    // Make sure to respect or bounds in drawn plot
    manhattan_plot.disable(this.get('or_bounds'));

    initialize_manhattan_brush(viz_data);

    draw_histogram(viz_data);

    hist_brush = initialize_histogram_brush(data, this.get('or_bounds'));

    manhattan_plot.draw_sig_line(this.get('sig_bars'));
  }

  if(state.has_changed('sig_bars')){
    manhattan_plot.draw_sig_line(this.get('sig_bars'));
  }


  if(state.has_changed('selected_codes') || state.has_changed('or_bounds')){

    const default_bounds = tuples_equal(
      state.get('or_bounds'),
      [-Infinity, Infinity] );

    //const no_codes_selected = state.get('selected_codes').length === 0;
    const no_change_from_default = arrays_equal(
      state.get('selected_codes'),
      default_selection
    );
    if(default_bounds && no_change_from_default){
      hide_reset();

    } else {
      show_reset();
    }
  }

  // Make sure manhattan and table have selected codes.
  if(state.has_changed('selected_codes') || state.has_changed('sizes')){
    manhattan_plot.highlight(state.get('selected_codes'));
    my_table.select_codes(state.get('selected_codes'));
  }


  if(state.has_changed('or_bounds')){
    manhattan_plot.disable(this.get('or_bounds'));
    my_table.disable_codes(this.get('or_bounds'));

    // Check if the vis was just reset.
    if(tuples_equal(state.get('or_bounds'), [-Infinity, Infinity])){
      hist_brush.reset();
      // Un-disable all the points
      state.get('data').forEach(d => d.disabled = false);
    }
  }


  // Make all the props completed.
  changed_props.forEach(p => state.mark_completed(p));
}

const initial_state = {
  data: viz_data,
  or_bounds: [-Infinity, Infinity],
  selected_codes: default_selection,
  sizes: null,
  sig_bar_locs: [],
};

const app_state = new App_State(initial_state, new_state);

// ===============================================================
// Rendering
// This code runs whenever data changes
// ===============================================================
r2d3.onRender(function(data, svg, width, height, options) {
  default_selection = options.selected;

  // Check if selection is different from current state and only reset if it is.
  const new_selection = !arrays_equal(default_selection, app_state.get('selected_codes'));

  if(new_selection){
    app_state.pass_action('new_sizes', [viz_width, height]);
    app_state.pass_action('reset_button', null);
    app_state.pass_action('table_selection', default_selection);
    app_state.pass_action('set_sig_bars', options.sig_bar_locs);
  }

});

// ===============================================================
// Resizing
// This is called by r2d3 runs whenever the plot is resized
// ===============================================================
r2d3.onResize(function(width, height){
  viz_width = width;
  viz_height = height;
  app_state.pass_action('new_sizes', [viz_width, height]);
});


// ================================================================
// Main drawing functions.
// ================================================================

function draw_manhattan(data){
  // Make sure that the neccesary info is provided before drawing.
  if(data === null) return;
  const point_size = 3;
  const outline = 1.5;

  let currently_selected_points;

  const default_point = {
    r: d => point_size - (d.log_or > 0 ? 0: outline/2),
    opacity: 0.85,
    fill: d => d.log_or > 0 ? d.unselected_color: 'white',
    stroke: d => d.unselected_color,
  };

  const selected_point = {
    r: d => point_size*1.5 - (d.log_or > 0 ? 0: outline/2),
    opacity: 0.95,
    fill: d => d.log_or > 0 ? d.color: 'white',
    stroke: d => d.color,
  };

  const disabled_point = {
    r: point_size/2,
    opacity: 0.2,
    fill: options.colors.med_grey,
    stroke: options.colors.med_grey,
  };

  let manhattan_points = main_viz.selectAll('circle.manhattan_points')
    .data(data, d => d.code);

  manhattan_points = manhattan_points.enter()
    .append('circle')
    .attr('class', 'manhattan_points')
    .merge(manhattan_points)
    .at({
      cx: d => manhattan_scales.x(d.index),
      cy: d => manhattan_scales.y(d.log_pval),
      strokeWidth: d => d.log_or > 0 ? 0 : outline,
    })
    .at(default_point)
    .on('mouseover', function(d){
      if(d.disabled) return;

      tooltip.show(d, d3.event);
    })
    .on('mouseout', function(d){
      if(d.disabled) return;
      tooltip.hide();
    })
    .on('click', function(d){
      if(d.disabled) return;
      // Send clicked code id to the app state
      app_state.pass_action('manhattan_click', d.code);
    });

  // Draw a legend
   main_viz
     .selectAppend('g.legend')
     .translate([margin.left, -margin.top + 5])
     .call(draw_legend);

  // Draw the axes
  main_viz.selectAppend("g#y-axis")
    .call(function(g){
      g.attr("transform", `translate(${-5},0)`)
      .call(d3.axisLeft(manhattan_scales.y).tickSizeOuter(0))
      .call(add_axis_label(`
        <tspan>-Log</tspan> <tspan dx='-0.3em' font-size="0.6rem" baseline-shift = "sub">10</tspan> <tspan dx='-0.2em'>(P)</tspan>
      `));
    });

  main_viz.selectAppend("g.x-axis")
    .call(g =>
      g.attr("transform", `translate(0,${manhattan_scales.y.range()[0]})`)
        .call(d3.axisBottom(histogram_scales.x).ticks(1).tickSizeOuter(0))
        .call(g => g.select(".tick:first-of-type").remove())
        .call(add_axis_label('Phecode', false))
    );


  // Add an extendable line to demostrate significance threshold
  const draw_sig_line = function(p_val){

    const no_threshold = !p_val;

    if(no_threshold){
      main_viz.selectAppend(`g.significance_line`).remove();
      return;
    }

    const sig_line_indent = -27;
    const line_end_extended = manhattan_scales.x.range()[1] - sig_line_indent;
    const line_end_shrunk = -(sig_line_indent + 4);
    const significance_thresh = main_viz
      .selectAppend(`g.significance_line`)
      .attr("transform",
            `translate(${sig_line_indent},${manhattan_scales.y(-Math.log10(p_val))})`);

    const significance_line = significance_thresh
      .selectAppend("line")
      .at({
        x1: line_end_shrunk,
        stroke: 'dimgrey',
        strokeWidth: 1,
      });

    const toggle_line = function(){
      const is_extended = significance_line.attr('x1') == line_end_extended;
      significance_instructions.text(is_extended ? "Show": "Hide");
      significance_line
        .transition()
        .attr(
          'x1',
          is_extended ? line_end_shrunk : line_end_extended
        );
    };

    const significance_instructions = significance_thresh.selectAppend('text.instructions')
      .text("Show")
      .at({
        x: -3,
        y: 11,
        fontSize: 10,
        textAnchor: 'end',
        fontStyle: 'italic'
      })
      .on('click', toggle_line)

    significance_thresh.selectAppend('text.label')
      .text(`P=${p_val}`)
      .at({
        x: -3,
        fontSize: 12,
        textAnchor: 'end',
      })
      .on('click', toggle_line);
  }

  //draw_sig_line(0.05);

  const disable_codes = function(or_bounds) {

    const is_disabled = function(d){
      return (d.log_or < or_bounds[0]) || (d.log_or > or_bounds[1])
    };

    manhattan_points
      .filter(is_disabled)
      .at(disabled_point)
      .each(d => d.disabled = true);

    const non_disabled_points = manhattan_points
      .filter(d => !is_disabled(d) && !currently_selected_points.includes(d.code))
      .at(default_point)
      .raise()
      .each(d => d.disabled = false);
  };

  const highlight_codes = function(selected_codes){
    currently_selected_points = selected_codes;
    manhattan_points
      .filter(d => selected_codes.includes(d.code))
      .raise()
      .at(selected_point);

    // Make sure points that are not disabled but not highlighted are back at default settings
    manhattan_points
      .filter(d => !selected_codes.includes(d.code) && !d.disabled)
      .at(default_point);
  };

  highlight_codes([]);

  return {
    highlight: highlight_codes,
    disable: disable_codes,
    draw_sig_line,
  };
}


function draw_legend(legend_g){

   // Draw simple legend
 const legend_w = 110;
 const legend_h = 25;
 const negative_circ_r = 4.5;
 const circ_outline = 1.5;
 const positive_circ_r = negative_circ_r + circ_outline/2;
 const legend_gap = 4;

 legend_g.selectAppend('rect')
   .at({
     width: legend_w,
     height: legend_h,
     fill: options.colors.light_grey,
     stroke: options.colors.med_grey,
     strokeWidth: 1,
   });

  const text_attrs = {
    alignmentBaseline: 'middle',
    dominantBaseline: 'middle',
    textAnchor: 'end',
    y: 1,
  };

  const g = legend_g.selectAppend('g.text_holder')
    .st({
      fontSize: '0.75rem',
    })
    .translate([0, legend_h/2]);

  g.selectAppend('text.lead')
    .at(text_attrs)
    .attr('x', -legend_gap)
    .text('Odds Ratio: ');

 let legend_elements = g.selectAll('g.legend_element')
  .data(['negative', 'positive']);

 legend_elements
  .enter().append('g')
  .attr('class', d => d)
  .merge(legend_elements)
  .translate((d,i)=> [(1 + 2*i)*legend_w/(4), 0])
  .each(function(d){
    const element_g = d3.select(this);

    const is_neg = d === 'negative';

    // Draw the circles
    element_g.selectAppend(`circle.${d}`)
     .at({
        cx: (is_neg ? negative_circ_r: positive_circ_r) + 5,
        stroke: 'orangered',
        r: is_neg ? negative_circ_r: positive_circ_r,
        fill: is_neg ? 'white': 'orangered',
        strokeWidth: is_neg ? circ_outline: 0,
      });

  // Write the text
   element_g.selectAppend('text')
     .text(is_neg ? '< 1': '> 1')
     .at(text_attrs);
  });

  legend_g.selectAppend('line')
    .at({
      x1: legend_w/2,
      x2: legend_w/2,
      y1: legend_h,
      y2: 0,
      stroke: options.colors.med_grey,
      strokeWidth: circ_outline,
    });

}


function show_reset(){
  reset_button.style('display', 'inline-block');
}


function hide_reset(){
  reset_button.style('display', 'none');
}


function draw_histogram(data){

  const scales = histogram_scales; // Rename to make function code a bit neater

  // Draw bars
  let hist_bars = or_hist
    .attr("fill", options.colors.light_blue)
    .selectAll("rect.histogram_bar")
    .data(or_bins);

  hist_bars = hist_bars.enter().append('rect')
    .attr('class', 'histogram_bar')
    .merge(hist_bars)
    .attr("x", d =>  scales.x(d.x0) + 1)
    .attr("width", d => Math.max(0,  scales.x(d.x1) - scales.x(d.x0) - 1))
    .attr("y", d =>  scales.y(d.length))
    .attr("height", d =>  scales.y(0) -  scales.y(d.length));

  // Append axes
  or_hist.selectAppend("g.x-axis")
    .call(g =>
      g.attr("transform", `translate(0,${scales.y.range()[0]})`)
        .call(d3.axisBottom(scales.x).tickSizeOuter(0))
        .call(add_axis_label('Log OR', false))
    );

  or_hist.selectAppend("g.y-axis")
    .call(
      g => g.attr("transform", `translate(${-5},0)`)
        .call(d3.axisLeft(scales.y).ticks(5).tickSizeOuter(0))
        .call(add_axis_label('# Codes'))
    );

  const title = or_hist.selectAppend('text.title')
    .style('fill', 'dimgrey')
    .translate([5, -5])
    .html(
      `<tspan class = 'main-title'>Log Odds Ratio distribution</tspan>   <tspan class = 'sub-title'>Drag handles to filter to codes in a given range</tspan>`
    );
}


function send_selection_to_shiny(){
  const currently_selected = app_state.get('selected_codes');
  // Hook up the to app code here.

  send_to_shiny(
    'selection',
    currently_selected,
    options.msg_loc
  );
}


function send_table_selection(selected_codes){
    app_state.pass_action('table_selection', selected_codes);
}


// ================================================================
// On load functions for resizing and processing raw data
// ================================================================

function size_viz([width, height]){

  manhattan_viz
    .style('height', `${height*size_props.manhattan}px`)
    .style('width', `${width}px`);

  // Adjust the sizes of the svgs
  main_svg
    .attr('height', height*size_props.manhattan)
    .attr('width', width);

  or_svg
    .attr('height', height*size_props.histogram)
    .attr('width', width);

  table_div.style('height', `${height*size_props.table}px`);
}


function process_new_data(data){
  // Keep track of ORs to deal with zeros.
  let min_seen_or = 1;
  let max_seen_or = 0;

  // Add a log_pval and log_or field to all points and keep track of extents
  data.forEach((d,i) => {
    d.log_pval = -Math.log10(d.p_val);

    if((d.OR < min_seen_or) && (d.OR !== 0)) min_seen_or = d.OR;
    if(d.OR > max_seen_or) max_seen_or = d.OR;

    d.unselected_color = d3.interpolateLab(d.color, "white")(0.66);
    d.index = i;
  });

  // Place OR = 0 values to a value 10% or the or range below lowest seen value
  const filler_log_or = Math.log(min_seen_or*0.9);

  data.forEach((d, i) => {
     d.log_or = d.OR > 0 ? Math.log(d.OR): filler_log_or;
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

  const manhattan_brush = d3.brush()
    .on("start.nokey", function() {
      d3.select(window)
        .on("keydown.brush keyup.brush", null);
    })
    .on('end', on_manhattan_brush);

  // Add a g element and call the brush on it.
  const manhattan_brush_g = main_viz
    .selectAppend('g#manhattan_brush')
    .attr('class', 'brush');

  manhattan_brush_g.call(manhattan_brush);

  let a_pressed = false;
  let d_pressed = false;

  d3.select('body')
    .on('keydown', function(d){
      a_pressed = d3.event.key === 'a';
      d_pressed = d3.event.key === 'd';
    })
    .on('keyup', function(d){
      a_pressed = false;
      d_pressed = false;
    });

  function on_manhattan_brush(){
    const { selection } = d3.event;

    // if we have no selection, just reset the brush highlight to no nodes
    if(!selection) return;

    manhattan_brush_g.call(manhattan_brush.move, null);

    // Find what codes intersect the selection
    const overlapped_codes = scan_tree_for_selection(main_quadtree, selection, app_state.get('or_bounds'))

    const action_type = a_pressed ?
      'manhattan_brush_add':
      d_pressed ?
      'manhattan_brush_delete' :
      'manhattan_brush';

    app_state.pass_action(action_type, overlapped_codes);
  }
}


function scan_tree_for_selection(quadtree, selection, or_bounds){
  // Scans passed quadtree for points in a given range, excludes them if they fall out of
  // the or bounds.

  // begin an array to collect the brushed nodes
  const selected_codes = [];

  // traverse all branches of the quad tree
  quadtree.visit((node, x1, y1, x2, y2) => {

    const overlaps_selection = selection_contains(
      selection, x1, y1, x2, y2
    );

    // skip if it doesn't overlap the brush
    if(!overlaps_selection) return true;

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


function initialize_histogram_brush(data, initial_position = null){

  const [x_min, x_max] = histogram_scales.x.range();
  const [y_min, y_max] = histogram_scales.y.range();

  const selection_range = [
    [x_min - 1, y_max],
    [x_max + 1, y_min]
  ];


  const hist_brush = d3.brushX()
    .extent(selection_range);


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
      strokeWidth: 2,
      fill: options.colors.dark_grey,
    });

  // If the user has requested an initial position and that initial position is not just the default
  // then place the brush before initializing the on-watcher.
  if((initial_position !== null) && !tuples_equal(initial_position, [-Infinity, Infinity])){
    set_brush_pos(initial_position.map(histogram_scales.x))
  }

   // Kick of watcher for dragging.
   hist_brush.on('end', on_hist_brush);

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


function reset_scales(data, sizes){

  const [width, height] = sizes;

  // ===============================================================
  // Manhattan plot
  // ===============================================================
  // How much should we pad the top of the axis in terms of percent?
  const y_buffer = 1.1;
  const max_log_pval = d3.max(data, d => d.log_pval);

  manhattan_scales.x
    .domain([0, data.length])
    .range([0, width - margin.left - margin.right]);

  manhattan_scales.y
    .domain([0, y_buffer*max_log_pval])
    .range([(size_props.manhattan*height) - margin.top - margin.bottom, 0]);


  // ===============================================================
  // Histogram
  // ===============================================================
  const hist_height = size_props.histogram*height;
  const log_ors = data.map(d => d.log_or);
  const [log_or_min, log_or_max] = d3.extent(log_ors);
  const x_domain_buffer = (log_or_max - log_or_min)*0.01;

  histogram_scales.x
    .range([0, width - margin.left - margin.right])
    .domain([log_or_min - x_domain_buffer, log_or_max + x_domain_buffer]);

  or_bins = d3.histogram()
    .domain(histogram_scales.x.domain())
    .thresholds(histogram_scales.x.ticks(num_hist_bins))
    (log_ors);

  // If we have one bin that is way larger than the others,
  // switch to using a sqrt scale.
  const bin_sizes = or_bins.map(d => d.length).sort((a,b) => b - a);
  const largest_bin = bin_sizes[0];
  const big_bin_variance = largest_bin > bin_sizes[1]*2;

  histogram_scales.y = big_bin_variance
    ? d3.scaleSqrt()
    : d3.scaleLinear();

  histogram_scales.y
    .range([hist_height - margin.top - margin.bottom, 0])
    .domain([0, largest_bin]).nice();
}


// ===============================================================
// Helper functions
// ===============================================================
function add_axis_label(label, y_axis = true){

  const bump_axis = y_axis ? 'x': 'y';

  const axis_label_style = {
    [bump_axis]: y_axis ? -3: 8,
    textAnchor: 'end',
    fontWeight: '300',
    fontSize: '0.8rem'
  };

  return g => {
    let last_tick = g.select(".tick:last-of-type");
    const no_ticks = last_tick.empty();
    if(no_ticks){
      last_tick = g.append('g')
        .attr('class', 'tick')
        .translate([viz_width - margin.left - margin.right, 5]);
      last_tick.append('text')
        .attr('fill', "#000");
    }

    last_tick.select("line").remove();

    last_tick.select("text")
            .at(axis_label_style)
            .html(label);
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

