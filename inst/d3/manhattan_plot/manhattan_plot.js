// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c('d3-jetpack', here::here('inst/d3/manhattan_plot/rx.js'), here::here('inst/d3/manhattan_plot/datatables.min.js')), css = here::here('inst/d3/manhattan_plot/datatables.min.css')
// ===============================================================
// Initialization
// This code is run a single timex
// ===============================================================
const {scan, shareReplay} = rxjs.operators;

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
const main_svg = div.append('svg')
  .attr('id', 'main_viz');

const or_svg = div.append('svg')
  .attr('id', 'or_hist');

const code_table_div = div.append('div')
  .style('height', '20%')
  .append('table')
  .attr('class', 'display compact')
  .attr('id', 'code_table')
  //.html(` <thead><tr>
  //          <th>PheCode</th>
  //          <th>OR</th>
  //          <th>P-Value</th>
  //          <th>Description</th>
  //          <th>Category</th>
  //        </tr></thead>`);

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
// Setup brushes
// ================================================================
// First initialize the brush objects
const manhattan_brush = d3.brush().on('end', on_manhattan_brush);
const hist_brush = d3.brushX()
  .on('end', on_hist_brush);

// Then attach the brush objects to their holder g's
manhattan_brush_g.call(manhattan_brush);
hist_brush_g.call(hist_brush);

hist_brush_g.select('.selection')
  .attr('fill-opacity', 0.1);

hist_brush_g.selectAll('.handle')
  .at({
    width: 15,
    strokeWidth: 2,
    fill: 'darkgrey',
    rx: 10,
  });

function reset_brushes(brush_id = 'all'){
  if(brush_id === 'histogram' || brush_id === 'all'){
    hist_brush_g.call(hist_brush.move, histogram_scales.x.range());
  }
  if(brush_id === 'manhattan' || brush_id === 'all'){
    manhattan_brush_g.call(manhattan_brush.move, null);
  }
}

// Initialize a quadtree to help us filter through the manhattan points much faster
const main_quadtree = d3.quadtree();


// ================================================================
// Initalize Scales
// ================================================================
const manhattan_scales = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};

const histogram_scales = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};



// ================================================================
// Code table
// ================================================================
const code_table = $(code_table_div.node()).DataTable({
  data: data,
  columns: [
    {title: 'Code', data: 'code'},
    {title: 'OR', data: 'OR'},
    {title: 'P-Value', data: 'p_val'},
    {title: 'Description', data: 'description'},
    {title: 'Category', data: 'category'}
  ],
  scrollY: `${height*table_prop}px`
});

function select_codes_on_table(codes_to_select, sort_table = false){
  code_table
    .rows()
    .every(function(rowIdx, tableLoop, rowLoop) {
      if (codes_to_select.includes(this.data().code)) {
        $(this.nodes()).addClass('selected');
      }
    });
}

$(code_table_div.select('tbody').node())
  .on( 'click', 'tr', function () {
    $(this).toggleClass('selected');

    code_table.rows('.selected').data();
  });

// ================================================================
// Initalize State
// ================================================================
const initial_state = {
  all_data: null,
  or_bounds: [-Infinity, Infinity],
  selected_codes: []
};

const state_input = new rxjs.BehaviorSubject({type: 'initialize'});
const state_output = state_input.asObservable()
  .pipe(
    scan(process_action, initial_state),
    shareReplay(1)
  );

// Controls how inputs are managed
function process_action(state, {type, payload}) {
  let new_state = state;

  //debugger;
  switch(type){
    case 'initialize':
      break;
    case 'new_data':
      new_state.all_data = payload;
      reset_brushes(brush_id = 'all');
      break;
    case 'manhattan_brush':
      const newly_selected = manhattan_filter(state, payload);

      if( newly_selected.length !== 0){
        // If we have an empty selection just don't update. Hopefully not too confusing
        new_state.selected_codes = newly_selected;
        // Update table with newly selected codes
        select_codes_on_table(newly_selected);

      }

      //  reset the histogram brush now that it's been overridden
      reset_brushes('manhattan');
      break;
    case 'reset_button':
      // Clear the histogram brush
      reset_brushes('all');

      new_state.selected_codes = [];
      break;
    case 'histogram_filter':

      new_state.or_bounds = payload;
      new_state.selected_codes = new_state
        .all_data
        .filter(d => (d.log_or > payload[0]) && (d.log_or < payload[1]))
        .map(d => d.code);

      break;
    default:
      console.log('unknown input');
  }

  new_state.last_type = type;
  return new_state;
}


// ===============================================================
// Rendering
// This code runs whenever data changes
// ===============================================================
r2d3.onRender(function(data, svg, width, height, options) {
  state_input.next({
    type: 'new_data',
    payload: data
  });

  update_w_new_data(data);

  // Make sure viz is sized correctly.
  size_viz(width, height);
});

function update_w_new_data(data){
  let log_pval_max = 0,
      log_or_min = 0,
      log_or_max = 0;

  // Add a log_pval and log_or field to all points and keep track of extents
  data.forEach((d,i) => {
    d.log_pval = -Math.log10(d.p_val);
    if(d.log_pval > log_pval_max) log_pval_max = d.log_pval;

    d.log_or = Math.log(d.OR);
    if(d.log_or < log_or_min) log_or_min = d.log_or;
    if(d.log_or > log_or_max) log_or_max = d.log_or;

    d.unselected_color = d3.interpolateLab(d.color, "white")(0.7);
    d.index = i;
  });

  // Update the domains for the manhattan plot
  manhattan_scales.x.domain([0, data.length]);
  manhattan_scales.y.domain([0,log_pval_max]).nice();

  // Next for the histogram
  const log_ors = data.map(d => d.log_or);

  histogram_scales.x.domain(d3.extent(log_ors)).nice();

  or_bins = d3.histogram()
    .domain(histogram_scales.x.domain())
    .thresholds(histogram_scales.x.ticks(num_hist_bins))
    (log_ors);

  histogram_scales.y.domain([0, d3.max(or_bins, d => d.length)]).nice();
}


function draw_manhattan(){

  let manhattan_points = main_viz.selectAll('circle')
    .data(data, d => d.code);

  manhattan_points = manhattan_points.enter()
    .append('circle')
    .merge(manhattan_points)
    .attr('cx', d => manhattan_scales.x(d.index))
    .attr('cy', d => manhattan_scales.y(d.log_pval))
    .on('mouseover', d => console.log(d.code));

  const y_axis = main_viz.selectAppend("g#y-axis")
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

  // Reset button to jump back to default selection
  const reset_button = main_viz.selectAppend('text#clear_button')
      .attr('x', manhattan_scales.x.range()[1])
      .attr('y', 10)
      .attr('text-anchor', 'end')
      .text('Reset selection')
      .attr('font-size', 0)
      .on('click', function(){
        state_input.next({
          type: 'reset_button',
          payload: null
        });
      });

  // subscripe to the state object
  state_output.subscribe(state => {
    const {selected_codes} = state;
    const empty_selection = selected_codes.length === 0;

    const code_selected = d => selected_codes.includes(d.code);

    manhattan_points
      .attr('r',  d => code_selected(d) ? 3 : 2)
      .attr('fill', d => d[ code_selected(d) ? 'color': 'unselected_color']);

    reset_button.attr('font-size', empty_selection ? 0: 18);
  });
}


function draw_histogram(){

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


function on_hist_brush(){

  const { selection } = d3.event;

  // if we have no selection, just reset the brush highlight to no nodes
  if((selection[0] == histogram_scales.x.range()[0]) && (selection[1] == histogram_scales.x.range()[1])) return;

  // Send result of brush event to the app state
  state_input.next({
    type: 'histogram_filter',
    payload: selection.map(x => histogram_scales.x.invert(x))
  });
}

function manhattan_filter(state, selection){
  const {or_bounds} = state;

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

function on_manhattan_brush(){

  const { selection } = d3.event;

  // if we have no selection, just reset the brush highlight to no nodes
  if(!selection) return;

  // Send result of brush event to the app state
  state_input.next({
    type: 'manhattan_brush',
    payload: selection
  });

}


// ===============================================================
// Resizing
// This is called by r2d3 runs whenever the plot is resized
// ===============================================================
r2d3.onResize(size_viz);

function size_viz(width, height){

  const manhattan_height = height*manhattan_prop;
  const or_height = height*hist_prop;
  const table_height = height*table_prop;

  // Adjust the sizes of the svgs
  main_svg
    .attr('height', manhattan_height)
    .attr('width', width);

  or_svg
    .attr('height', or_height)
    .attr('width', width);

  // Calculate the sizes needed and return scales for use
  // Update the scale ranges
  manhattan_scales.x.range([0, width - margin.left - margin.right]);
  manhattan_scales.y.range([manhattan_height - margin.top - margin.bottom, 0]);

  const hist_x_range = [0, width - margin.left - margin.right];
  const hist_y_range = [or_height - margin.top - margin.bottom, 0];
  histogram_scales.x.range(hist_x_range);
  histogram_scales.y.range(hist_y_range);


  // generate a quadtree for faster lookups for brushing
  // Rebuild the quadtree with new positions
  main_quadtree.removeAll(main_quadtree.data());

  main_quadtree
    .x(d => manhattan_scales.x(d.index))
    .y(d => manhattan_scales.y(d.log_pval))
    .addAll(data);

  // Update the extent of the brush
  manhattan_brush.extent(main_quadtree.extent());
  manhattan_brush_g.call(manhattan_brush);

  // The plus and minus one is so we can detect when the user has reset the extent
  // rather than just happen to drag the selection to the edges. When the user resets the
  // brush will be set to the exact range, whereas if they drag the whole way they will go one beyond
  // the end of the range.
  hist_brush.extent([
    [hist_x_range[0] - 1, hist_y_range[1]],
    [hist_x_range[1] + 1, hist_y_range[0]]
  ]);
  hist_brush_g.call(hist_brush);

  // Finally draw the plots with new sizes
  draw_manhattan();
  draw_histogram();
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
