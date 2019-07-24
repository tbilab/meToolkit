// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c(here::here('inst/d3/manhattan_plot/rx.js'), 'd3-jetpack')
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================
d3.selection.prototype.last = function() {
  return d3.select(this.nodes()[this.size() - 1]);
};

const margin = {left: 65, right: 10, top: 10, bottom: 10};
const manhattan_prop = 0.6;

const main_svg = div.append('svg')
  .attr('id', 'main_viz');

const main_viz = main_svg
  .append('g')
  .attr("transform", `translate(${margin.left},${margin.top})`);

const or_svg = div.append('svg')
  .attr('id', 'or_hist')
  .style('background', 'forestgreen');

const or_hist = or_svg
  .append('g')
  .attr("transform", `translate(${margin.left},${margin.top})`);

const brush = d3.brush().on('end', manhattan_brush);
// attach the brush to the chart
const gBrush = main_viz.append('g')
  .attr('class', 'brush')
  .call(brush);

const main_quadtree = d3.quadtree();

const manhattan_scales = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};

const {scan, shareReplay} = rxjs.operators;

const app_state = setup_state();

// ===============================================================
// Rendering
// This code runs whenever data changes
// ===============================================================
r2d3.onRender(function(data, svg, width, height, options) {

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

  // Make sure viz is sized correctly.
  size_viz(width, height);

  draw_manhattan();
});


function draw_manhattan(){

  let manhattan_points = main_viz.selectAll('circle')
    .data(data, d => d.code);

  manhattan_points = manhattan_points.enter()
    .append('circle')
    .merge(manhattan_points)
    .attr('cx', d => manhattan_scales.x(d.index))
    .attr('cy', d => manhattan_scales.y(d.log_pval));


  // subscripe to the state object
  app_state.output.subscribe(({selected_codes}) => {


    const code_selected = d => (selected_codes.length === 0) || selected_codes.includes(d.code);

    manhattan_points
      .attr('r',  d => code_selected(d) ? 3 : 2)
      .attr('fill', d => d[ code_selected(d) ? 'color': 'unselected_color']);
  });

  const y_axis = main_viz.selectAppend("g#y-axis")
    .call(function(g){
      g.attr("transform", `translate(${-5},0)`)
      .call(d3.axisLeft(manhattan_scales.y).tickSizeOuter(0));
    });

  y_axis.selectAll('text')
    .last()
    .text('-Log10 P');
}

function size_viz(width, height){

  const manhattan_height = height*manhattan_prop;
  const or_height = height*(1 - manhattan_prop);

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

  // generate a quadtree for faster lookups for brushing
  // Rebuild the quadtree with new positions
  main_quadtree.removeAll(main_quadtree.data());

  main_quadtree
    .x(d => manhattan_scales.x(d.index))
    .y(d => manhattan_scales.y(d.log_pval))
    .addAll(data);

  // Update the extent of the brush
  brush.extent(main_quadtree.extent());
  gBrush.call(brush);
}

function manhattan_brush(){

  const { selection } = d3.event;

  // if we have no selection, just reset the brush highlight to no nodes
  if(!selection) {
    // If the selection is null the brush has been hidden and we do nothing
    if(selection === null){
      return;
    } else {
      console.log('nothing selected!');
      app_state.input.next({
        type: 'manhattan_brush',
        payload: []
      });
      return;
    }
  }

  // begin an array to collect the brushed nodes
  const brushedNodes = [];

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
        brushedNodes.push(d);
      }
    }

    // return false so that we traverse into branch (only useful for non-leaf nodes)
    return false;
  });

  // Send result of brush event to the app state
  app_state.input.next({
    type: 'manhattan_brush',
    payload: brushedNodes.map(d => d.code)
  });

  // Clear the brush
  gBrush.call(brush.move, null);

  app_state.output.subscribe(({selected_codes}) => {
    console.log('State event observed inside of brush');
  });
}



// ===============================================================
// Resizing
// This code runs whenever the plot is resized
// ===============================================================

r2d3.onResize(function(width, height) {
  console.log('The plot was just resized!');
  size_viz(width, height);
  draw_manhattan();
});


// ===============================================================
// State control
// ===============================================================

function setup_state(){
  const initial_state = {
    selected_codes: []
  };

  const state_input = new rxjs.BehaviorSubject({type: 'initialize'});
  const state_output = state_input.asObservable()
    .pipe(
      scan(process_action, initial_state),
      shareReplay(1)
    );

  return {
    input: state_input,
    output: state_output,
  };
}


function process_action(state, {type, payload}) {
  let new_state = state;
  switch(type){
    case 'initialize':
      console.log('initializing state');
      break;
    case 'manhattan_brush':
      new_state.selected_codes = payload;
      break;
    default:
      console.log('unknown input');
  }
  return new_state;
}


// ===============================================================
// Helper functions
// ===============================================================

function selection_contains(selection, bx_min, by_min, bx_max = bx_min, by_max = by_min){
  const [[sx_min, sy_min],[sx_max, sy_max]] = selection;

  const xs_intersect = (sx_min < bx_max) && (sx_max > bx_min);
  const ys_intersect = (sy_min < by_max) && (sy_max > by_min);

  return xs_intersect && ys_intersect;
}
