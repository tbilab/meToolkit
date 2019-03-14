// !preview r2d3 data=network_data, container = 'div', dependencies = 'd3-jetpack'
//
// r2d3: https://rstudio.github.io/r2d3
//

const margin = {right: 25, left: 25, top: 20, bottom: 70};

// Constants object for viz.
const C = {
  padding: 20,
  tooltip_offset: 15,
  w: width - (margin.left + margin.right),
  h: height - (margin.top + margin.bottom),
  margin: margin,
  case_radius: 2,
  case_opacity: 1,
  edge_color: '#aaa',
  edge_opacity: 0.5,
  progress_bar_height: 20,
  progress_bar_color: 'orangered',
};

// Function to setup overlaid canvas and svg
function setup_canvas_and_svg(div, C){
  // Make div relatively positioned so we can overlay svg and canvas
  div.style('position', 'relative');

  const viz_sizing = {
    height: C.h + margin.top + margin.bottom,
    width: C.w + margin.left + margin.right,
  }

  // Append the svg and padded g element
  const svg = div.selectAppend('svg')
    .at(viz_sizing)
    .st(viz_sizing)
    .style('position', 'absolute')
    .selectAppend('g.padded_svg')
    .translate([C.margin.left, C.margin.top]);

  // Append the canvas
  const canvas = div.selectAppend('canvas')
    .at(viz_sizing);

  const context = canvas.node().getContext('2d');

  return {svg, canvas, context}
}

// Function to setup scales for drawing to screen
function setup_scales(C){
  // For ease of resizing we will conduct the simulation
  // in 0-1 space and then just go from that to pixels

  // X scale
  const X = d3.scaleLinear().range([0, C.w]);

  // Y scale
  const Y = d3.scaleLinear().range([C.h, 0]);

  return {X, Y};
}


// Function to setup a progress meter
function setup_progress_meter(svg, C){

  const roundness = 5;

  // Append a g for holding meter
  const meter = svg.append('g.progress_meter');

  // Add a rectangle to act as background showing finishing point
  const background = meter.append('rect.background')
    .at({
      width: C.w,
      height: C.progress_bar_height,
      fill: 'lightgrey',
      stroke: 'grey',
      strokeWidth: 1,
      rx: roundness,
    });

  // Add rectangle to 'fill up'
  const fill_bar = meter.append('rect.fill_bar')
    .at({
      width: C.w*0.5,
      height: C.progress_bar_height,
      fill: C.progress_bar_color,
      rx: roundness,
    });

  // For easy transitioning of both bars on show/hide
  const all_bars = meter.selectAll('rect');

  // Add text that write's out progress
  const progress_text = meter.append('text.progress_text')
    .at({
      x: C.w*0.5,
      y: C.progress_bar_height - 3,
    })
    .st({
      alignmentBaseline: 'bottom',
      fontSize: 20,
    })
    .text("50%");

  // Function to update meter with new progress
  const update = (prop_done) => {

    // Make sure all bars are visible
    all_bars.attr('height', C.progress_bar_height);

    // Update width of fill bar
    fill_bar.attr('width', C.w*prop_done);

    // Update text
    progress_text
      .attr('x', C.w*prop_done + 2)
      .text(d3.format(".0%")(prop_done));
  }


  // Function to hide meter
  const hide = () => {

    const t = d3.transition()
      .duration(750)
      .ease(d3.easeLinear);

    meter.selectAll('rect')
      .transition(t)
      .attr('height', 0);

    progress_text
      .transition(t)
      .attr('opacity', 0);
  };

  return {update, hide};
}

// Function to draw canvas parts of network

// Function to draw svg parts of network

// Function to setup viz, run webworker, and display results


const {svg, canvas, context} = setup_canvas_and_svg(div, C);
const {X, Y} = setup_scales(C);
const progress_meter = setup_progress_meter(svg, C);


console.log('im here!');
