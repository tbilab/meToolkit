// !preview r2d3 data=c(0.3, 0.6, 0.8, 0.95, 0.40, 0.20), container = 'div', dependencies = c(here::here('inst/d3/manhattan_plot/rx.js'))
//
// r2d3: https://rstudio.github.io/r2d3
//
const {scan, shareReplay} = rxjs.operators;

const app_state = setup_state();
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
