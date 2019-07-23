// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c(here::here('inst/d3/manhattan_plot/rx.js'))
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================
const margin = {left: 10, right: 10, top: 10, bottom: 10};
const manhattan_prop = 0.6;

const main_viz = div.append('svg')
  .attr('id', 'main_viz')
  .attr('height', height*0.6)
  .attr('width', width - margin.left - margin.right)
  .style('background', 'steelblue');

const or_hist = div.append('svg')
  .attr('id', 'or_hist')
  .attr('height', height*0.2)
  .attr('width', width - margin.left - margin.right)
  .style('background', 'forestgreen');


const {scan, shareReplay} = rxjs.operators;
const app_state = setup_state();


// ===============================================================
// Rendering
// This code runs whenever data changes
// ===============================================================
r2d3.onRender(function(data, svg, width, height, options) {
  const main_sizes = {
    h: (height - margin.top - margin.bottom) * manhattan_prop,
    w: width - margin.left - margin.right,
  };

  let log_pval_max = 0,
      log_or_min = 0,
      log_or_max = 0;

  data.forEach(d => {
    d.log_pval = -Math.log10(d.p_val);
    if(d.log_pval > log_pval_max) log_pval_max = d.log_pval;

    d.log_or = Math.log(d.OR);
    if(d.log_or < log_or_min) log_or_min = d.log_or;
    if(d.log_or > log_or_max) log_or_max = d.log_or;
  });


});

// ===============================================================
// Resizing
// This code runs whenever the plot is resized
// ===============================================================

r2d3.onResize(function(width, height) {
  console.log('The plot was just resized!')

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
