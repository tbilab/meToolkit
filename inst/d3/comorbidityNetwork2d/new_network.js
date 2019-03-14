// !preview r2d3 data=network_data, container = 'div', dependencies = 'd3-jetpack'
//
// r2d3: https://rstudio.github.io/r2d3
//

const margin = {right: 25, left: 25, top: 20, bottom: 70};

// These hold the layout calculated network info once the webworker returns them
let layout_nodes, layout_links, scales;

// Constants object for viz.
const C = {
  padding: 20,
  tooltip_offset: 15,
  w: width - (margin.left + margin.right),
  h: height - (margin.top + margin.bottom),
  margin: margin,
  case_radius: 3,
  code_radius_mult: 4,
  case_opacity: 1,
  edge_color: '#aaa',
  edge_opacity: 0.5,
  progress_bar_height: 20,
  progress_bar_color: 'orangered',
};

// Function to make sure data conforms to the format we want
function sanitize_data(data){
  const data_props = Object.keys(data);
  return {
    nodes: data_props.includes('vertices') ? data.vertices : data.nodes,
    links: data_props.includes('edges') ? data.edges : data.links,
  };
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
    .style('position', 'absolute');

  // Append the canvas
  const canvas = div.selectAppend('canvas')
    .at(viz_sizing);

  const context = canvas.node().getContext('2d');

  return {svg, canvas, context}
}

// Function to setup scales for drawing to screen
function setup_scales(nodes, C){
  // For ease of resizing we will conduct the simulation
  // in 0-1 space and then just go from that to pixels
  // Note that we are building the padding into the scales
  // because we want it to be the same between the svg and
  // canvas elements and so we cant use the padded g that
  // is normal when just using svg.


  return {
    X: d3.scaleLinear()
        .domain(d3.extent(nodes, d => d.x))
        .range([C.margin.left, C.w - C.margin.right]),
    Y: d3.scaleLinear()
        .domain(d3.extent(nodes, d => d.y))
        .range([C.h - C.margin.top, C.margin.bottom]),
  };
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
  };


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

// Simulation webworker function
function sim_webworker(){
  importScripts("https://d3js.org/d3-collection.v1.min.js");
  importScripts("https://d3js.org/d3-dispatch.v1.min.js");
  importScripts("https://d3js.org/d3-quadtree.v1.min.js");
  importScripts("https://d3js.org/d3-timer.v1.min.js");
  importScripts("https://d3js.org/d3-force.v1.min.js");

  onmessage = function(event) {
    const nodes = event.data.nodes;
    const links = event.data.links;

    const simulation = d3.forceSimulation(nodes)
      .force("link",
        d3.forceLink(links)
          .id(d => d.id)
          .distance(1)
          .strength(0.6)
      )
      .force("charge",
        d3.forceManyBody()
          .strength(-8)
      )
      .stop();

    for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
      postMessage({type: "tick", progress: i / n});
      simulation.tick();
    }

    postMessage({type: "end", nodes: nodes, links: links});
  };
}

// Function to setup and run webworker
function launch_webworker(network_data, progress_meter, on_finish){
  const nodes = network_data.nodes;
  const links = network_data.links;

  // Wrap up function into a fake script to call
  const worker_url = URL.createObjectURL(new Blob(['('+sim_webworker+')()']));

  // Initialize the worker
  const worker = new Worker(worker_url);

  // Send worker the data we are working with
  worker.postMessage({
    nodes: nodes,
    links: links
  });

  // Control what is done when a message is received from the webworker
  worker.onmessage = function(event) {
    switch (event.data.type) {
      case "tick": return ticked(event.data);
      case "end": return on_finish(event.data);
    }
  };

  function ticked(data) {
    // Update the progress meter with how far we are along in sim
    progress_meter.update(data.progress);
  }
}

// Function to draw canvas parts of network
function draw_canvas_links(links, scales, canvas, C){
  // Clear canvas
  context.clearRect(0, 0, +canvas.attr('width'), +canvas.attr('height'));
  context.save();
  context.globalAlpha = C.edge_opacity;

  context.beginPath();
  links.forEach(d => {
    context.moveTo(scales.X(d.source.x), scales.Y(d.source.y));
    context.lineTo(scales.X(d.target.x), scales.Y(d.target.y));
  });

  // Set color of edges
  context.strokeStyle = C.edge_color;

  // Draw to canvas
  context.stroke();
}

// Function to draw svg parts of network
function draw_svg_nodes(nodes, scales, svg, C){

  // Bind data but only the phenotype nodes
  const node_circles = svg.selectAll('circle')
    .data(nodes, d => d.id);

  node_circles.enter()
    .append('circle')
    .at({
      r: 0,
      cx: d => Math.random()*C.w,
      cy: d => Math.random()*C.h,
    })
    .merge(node_circles)
    .transition(
       d3.transition()
        .duration(1750)
        .ease(d3.easeLinear)
    )
    .at({
      r: d => C.case_radius*(d.selectable ? C.code_radius_mult: 1),
      cx: d => scales.X(d.x),
      cy: d => scales.Y(d.y),
      stroke: d => d.inverted ?  d.color: 'black',
      strokeWidth: d => d.inverted ? 3: 0,
      fill: d => d.inverted ? 'white': d.color,
    });
}

// Function to extract webworker data and kickoff the viz
function start_viz(data){
  // What to do after worker is done and has returned data

  // Hide progress bar
  progress_meter.hide();

  // Extract nodes and links
  layout_nodes = data.nodes;
  layout_links = data.links;

  // Initialize the scales with these data
  scales = setup_scales(layout_nodes, C);

  // Draw network
  draw_network(layout_nodes, layout_links, scales);
}

// Function to draw the network
function draw_network(layout_nodes, layout_links, scales){

  // Draw svg nodes of network
  draw_svg_nodes(layout_nodes, scales, svg, C);

  // Draw canvas edges
  draw_canvas_links(layout_links, scales, canvas, C);
}

// Setup basic components of viz.
const {svg, canvas, context} = setup_canvas_and_svg(div, C);
const progress_meter = setup_progress_meter(svg, C);

// Launch webworker to calculate layout and kickoff network viz after finishing
launch_webworker(sanitize_data(data), progress_meter, start_viz);
