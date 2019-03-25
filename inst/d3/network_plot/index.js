// !preview r2d3 data=network_data, options = list(viz_type = 'free', update_freq = 5), container = 'div', dependencies = c("d3-jetpack",here('inst/d3/network_plot/helpers.js'))


// Constants object for viz, all can be overwritten if passed a different value
// with the options argument of r2d3
const C = Object.assign(
  {
    padding: 20,
    tooltip_offset: 13,
    tooltip_height: 60,
    margin: {right: 20, left: 20, top: 20, bottom: 5},
    case_radius: 3,
    code_radius_mult: 4,
    case_opacity: 1,
    edge_color: '#aaa',
    progress_bar_height: 20,
    progress_bar_color: 'orangered',
    msg_loc: 'shiny_server',
    viz_type: 'bipartite',
    update_freq: 5, // How often do we send back layout simulation progress?
  },
  options);


function setup_webworker(C){
  let worker;

  // Wrap up function into a fake script to call
  const worker_url = URL.createObjectURL(
    new Blob(['('+sim_webworker+`)(${C.update_freq})`])
  );

  const send_new_job = function(network_data, callbacks){

    if(worker){
      // If we already have a webworker running make sure to
      // terminate it so we don't have multiple going at the
      // same time.
      worker.terminate();
    }

    const {on_progress_report, on_finish, on_layout_data} = callbacks;

    // Initialize the worker
    worker = new Worker(worker_url);

    // Send worker the data we are working with
    worker.postMessage(network_data);


    // Control what is done when a message is received from the webworker
    worker.onmessage = function(event) {
      switch (event.data.type) {
        case "progress_report": return on_progress_report(event.data.progress);
        case "layout_data": return on_layout_data(event.data);
        case "end": return on_finish(event.data);
      }
    };
  };

  return send_new_job;
}


// Function to entirely setup network viz.
// Exposes methods for adding new data and updating the size
function setup_network_viz(dom_elements, on_node_click){

  let layout_data = null,
      been_sized = false,
      current_zoom = null;

  const X = d3.scaleLinear();
  const Y = d3.scaleLinear();

  const new_data = function({nodes, links}){
    // Remove old network nodes
    dom_elements.svg.selectAll('circle').remove();

    // Update scale domains
    X.domain(d3.extent(nodes, d => d.x));
    Y.domain(d3.extent(nodes, d => d.y));

    // Update function scope's copy of data
    layout_data = {nodes, links};

    if(been_sized){
      draw();
    }
  };

  const resize = function({width, height, margin}){

    // Update scale ranges
    X.range([margin.left, width - margin.right]);
    Y.range([height - margin.bottom, margin.top]);

    // Let scope know we have set a size for the viz.
    been_sized = true;

    if(layout_data){
      draw();
    }
  };

  const draw = function(){
    // Update scales with the zoom if we have any
    const scales = {
      X: current_zoom ? current_zoom.rescaleX(X) : X,
      Y: current_zoom ? current_zoom.rescaleY(Y) : Y,
    };

    // Draw svg nodes of network
    draw_svg_nodes(layout_data, scales, dom_elements, C, on_node_click);
    draw_canvas_portion(layout_data, scales, dom_elements, C);
  };

  dom_elements.svg.call(
    d3.zoom()
    .scaleExtent([0.5, 5])
    .on("zoom", () => {
      // Record the zoom event to function scope.
      current_zoom = d3.event.transform;

      // Redraw network with this zoom scale
      draw();
    })
  );

  return {new_data, resize};
};


//------------------------------------------------------------
// On initialization.
//------------------------------------------------------------
// This code gets run once and sets up the basic
// neccesities for the visualization.


// Setup all the dom elements for the viz. This includes
// the svg, canvas, context, tooltip, and message buttons.
const dom_elements = setup_dom_elements(div, C, on_message);

// Setup the progress bar for network simulation progress
const progress_meter = setup_progress_meter(dom_elements.svg, C);

// Setup the actual network viz itself.
const network_viz = setup_network_viz(dom_elements, on_node_click);

// Holds the currently selected codes.
let selected_codes = [];

const webworker = setup_webworker(C);

// Function that is called when a message button is pressed. Passed the type of message.
function on_message(type){
  send_to_shiny(type, selected_codes, C);
}

// Logic for what is done when a node is clicked.
function on_node_click(d){
  const node = d3.select(this);

  // Is code already selected?
  if(selected_codes.includes(d.name)){
    // pull code out of selected list
    selected_codes = selected_codes.filter(code => code !== d.name);

    // reset the style of node
    node.attr("stroke-width", 0);

  } else {
    // add code to selected codes list
    selected_codes = [d.name, ...selected_codes];

    // Outline node to emphasize highlight
     node.attr("stroke-width", 2);
  }

  // do we have selected codes currently? If so display the action popup.
  if(selected_codes.length > 0){
    dom_elements.message_buttons.show();
  } else {
    dom_elements.message_buttons.hide();
  }
};


//------------------------------------------------------------
// On Render
//------------------------------------------------------------
// This is code that runs whenever new data is received by the
// visualization.
r2d3.onRender(function(data, div, width, height, options){
  // Make sure viz is correct size.
  size_viz(width, height);

  // Prepare data based upon the desired format from options
  const data_for_viz = C.viz_type === 'bipartite' ?
    fix_nodes_to_line(sanitize_data(data), C):
    sanitize_data(data);

  // Launch webworker to calculate layout and kickoff network viz after finishing
  webworker(
    data_for_viz,
    {
      on_progress_report: progress_meter.update,
      on_layout_data: (data) => {
        network_viz.new_data(data);
      },
      on_finish: () => {
        progress_meter.hide();
      },
    }
  );
});


// Tell r2d3 what to do when we resize the viz
r2d3.onResize(size_viz);


function size_viz(width, height){
  // Adjust size of svg and canvas elements
  const sizes = setup_sizes(width, height, C);
  dom_elements.resize(sizes);
  progress_meter.resize(sizes);
  network_viz.resize(sizes);
}

// Function to draw svg parts of network
function draw_svg_nodes({nodes, links}, scales, {svg, tooltip}, C, on_click){

  const x_max = scales.X.range()[1];
  const y_max = scales.Y.range()[1];

  const choose_stroke_width = (d) => {
    const selected = selected_codes.includes(d.name);

    return d.inverted ? 3:
           selected ? 2 : 0;
  };

  const node_attrs = {
    r: d => C.case_radius*(d.selectable ? C.code_radius_mult: 1),
    cx: d => scales.X(d.x),
    cy: d => scales.Y(d.y),
    stroke: d => d.inverted ?  d.color: 'black',
    strokeWidth: choose_stroke_width,
    fill: d => d.inverted ? 'white': d.color,
  };

  // Bind data but only the phenotype nodes
  const node_circles = svg.selectAll('circle')
    .data(nodes.filter(d => d.selectable), d => d.id);


  const all_nodes = node_circles.enter()
    .append('circle')
    .at({
      r: 0,
      cx: d => Math.random()*x_max,
      cy: d => Math.random()*y_max,
    })
    .merge(node_circles)
    .at(node_attrs);

  // Add mouseover behavior for nodes that are selectable
  all_nodes
    .on('mouseover', function(d){

      const connected_nodes = find_connections(d.name, links);
      // Highlight connected nodes by making them 1.5 times larger than default
      all_nodes
        .filter(n => connected_nodes.includes(n.name))
        .attr('r', function(){return d3.select(this).attr('r')*1.5})
        .at('stroke-width', 1);

      tooltip
        .move([scales.X(d.x), scales.Y(d.y)])
        .update(d.tooltip)
        .show();
    })
    .on('mouseout', function(d){
      tooltip.hide();

      // Reset nodes that may have been highlighted
      all_nodes.at(node_attrs);
    })
    .on('click', on_click);
}

// Function to draw canvas parts of network
function draw_canvas_portion({nodes, links}, scales, {canvas, context}, C){

  // Clear canvas
  context.clearRect(0, 0, +canvas.attr('width'), +canvas.attr('height'));
  context.save();
  // Scale edge opacity based upon how many edges we have
  context.globalAlpha = d3.scaleLinear().domain([0,5000]).range([0.5, 0.01])(links.length);

  context.beginPath();
  links.forEach(d => {
    context.moveTo(scales.X(d.source.x), scales.Y(d.source.y));
    context.lineTo(scales.X(d.target.x), scales.Y(d.target.y));
  });

  // Set color of edges
  context.strokeStyle = C.edge_color;

  // Draw to canvas
  context.stroke();

  // Draw patient nodes
  context.globalAlpha = C.case_opacity;

  nodes.forEach( d => {
    if(!d.selectable){
      // No border around the nodes. This will change when selection is built back in
      context.strokeStyle = `rgba(0, 0, 0, 0)`;
      context.fillStyle = d.color;

      context.beginPath();
      context.arc(scales.X(d.x), scales.Y(d.y), C.case_radius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
    }
  });

}
