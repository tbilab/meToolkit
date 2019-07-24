// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c(here::here('inst/d3/manhattan_plot/rx.js'), 'd3-jetpack')
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================
d3.selection.prototype.last = function() {
  return d3.select(
      this.nodes()[this.size() - 1]
  );
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
  // Make sure viz is sized correctly.
  size_viz(width, height);

  let log_pval_max = 0,
      log_or_min = 0,
      log_or_max = 0;

  // Add a log_pval and log_or field to all points and keep track of extents
  data.forEach(d => {
    d.log_pval = -Math.log10(d.p_val);
    if(d.log_pval > log_pval_max) log_pval_max = d.log_pval;

    d.log_or = Math.log(d.OR);
    if(d.log_or < log_or_min) log_or_min = d.log_or;
    if(d.log_or > log_or_max) log_or_max = d.log_or;

    d.unselected_color = d3.interpolateLab(d.color, "white")(0.7);
  });

  // Update the domains for the manhattan plot
  manhattan_scales.x.domain([0, data.length]);
  manhattan_scales.y.domain([0,log_pval_max]).nice();
  draw_manhattan(options.selected);
});


function draw_manhattan(selected_codes){

  const any_selected = selected_codes.length !== 0;

  const manhattan_points = main_viz.selectAll('circle')
    .data(data, d => d.code);

  manhattan_points.enter()
    .append('circle')
    .merge(manhattan_points)
    .attr('cx', (d,i) => manhattan_scales.x(i))
    .attr('cy', (d,i) => manhattan_scales.y(d.log_pval))
    .attr('r', (d,i) => 2)
    .attr('fill', (d,i) => d[ !any_selected || selected_codes.includes(d.code) ? 'color': 'unselected_color']);

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
}

// ===============================================================
// Resizing
// This code runs whenever the plot is resized
// ===============================================================

r2d3.onResize(function(width, height) {
  console.log('The plot was just resized!');
  size_viz(width, height);
  draw_manhattan(options.selected);
});



draw_button(div, 'a', app_state);
draw_button(div, 'b', app_state);

// Function that draws a button with a count on it
function draw_button(div, id, state_input, state_output){

  div.append('button')
    .text(id)
    .on(
      'click',
      () => app_state.input.next({type: id, payload: Math.random()})
    );

  // subscripe to the state object
  app_state.output.subscribe(event => {
    console.log(`${JSON.stringify(event)} : observed from button ${id}`);
  });
}

function setup_state(){
  const initial_state = {
    clicks: 0,
    history: [],
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
    case 'a':
      new_state.clicks += 1;
      new_state.history.push(`button a pushed`);
      break;
    case 'b':
      new_state.clicks += 1;
      new_state.history.push(`button b pushed`);
      break;
    default:
      console.log('unknown input');
  }
  return new_state;
}

function desaturate(color, k = 1) {
  const {l, c, h} = d3.lch(color);
  return d3.lch(l, c + 18 * k, h);
}
