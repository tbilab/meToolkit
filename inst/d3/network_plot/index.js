// !preview r2d3 data=network_data, options = list(viz_type = 'free', update_freq = 5), container = 'div', dependencies = c("d3-jetpack",here('inst/d3/network_plot/helpers.js'))
//
// r2d3: https://rstudio.github.io/r2d3
//

const margin = {right: 20, left: 20, top: 20, bottom: 5};


// Constants object for viz, all can be overwritten if passed a different value
// with the options argument of r2d3
const C = Object.assign(
  {
    padding: 20,
    tooltip_offset: 13,
    tooltip_height: 60,
    margin: margin,
    case_radius: 3,
    code_radius_mult: 4,
    case_opacity: 1,
    edge_color: '#aaa',
    edge_opacity: d3.scaleLinear().domain([0,5000]).range([0.5, 0.01])(data.edges.length),
    progress_bar_height: 20,
    progress_bar_color: 'orangered',
    msg_loc: 'shiny_server',
    viz_type: 'bipartite',
    update_freq: 5, // How often do we send back layout simulation progress?
  },
  options);

// Sets up size object given a width and height and the constants object for sizing viz
function setup_sizes(width, height, C){
  return {
    width: width,
    height: height,
    margin: C.margin,
    w: width - (C.margin.left + C.margin.right),
    h: height - (C.margin.top + C.margin.bottom),
  };
}

// Function to setup and run webworker
function launch_webworker(network_data, callbacks){
  const {on_progress_report, on_finish, on_layout_data} = callbacks;

  const nodes = network_data.nodes;
  const links = network_data.links;

  // Wrap up function into a fake script to call
  const worker_url = URL.createObjectURL(new Blob(['('+sim_webworker+`)(${C.update_freq})`]));

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
      case "progress_report": return on_progress_report(event.data.progress);
      case "layout_data": return on_layout_data(event.data);
      case "end": return on_finish(event.data);
    }
  };

}


// Function to entirely setup network viz.
// Exposes methods for adding new data and updating the size
function setup_network_viz(dom_elements, on_node_click){

  let layout_data = null,
      been_sized = false;

  const scales = {
    X: d3.scaleLinear(),
    Y: d3.scaleLinear(),
  };

  const new_data = function({nodes, links}){

    // Update scale domains
    scales.X.domain(d3.extent(nodes, d => d.x));
    scales.Y.domain(d3.extent(nodes, d => d.y));

    // Update function scope's copy of data
    layout_data = {nodes, links};

    if(been_sized){
      draw();
    }
  };

  const resize = function({width, height, margin}){

    // Update scale ranges
    scales.X.range([margin.left, width - margin.right]);
    scales.Y.range([height - margin.bottom, margin.top]);

    // Let scope know we have set a size for the viz.
    been_sized = true;

    if(layout_data){
      draw();
    }
  };

  const draw = function(){
    // Draw svg nodes of network
    draw_svg_nodes(layout_data, scales, dom_elements, C, on_node_click);
    draw_canvas_links(layout_data.links, scales, dom_elements, C);
  };

  return {new_data, resize};
};


//------------------------------------------------------------
// On initialization.
//------------------------------------------------------------
// This code gets run once and sets up the basic
// neccesities for the visualization.

let selected_codes = [];


// These hold the layout calculated network info once the webworker returns them
let message_buttons = setup_message_buttons(div, (type) => send_to_shiny(type, selected_codes, C));


const on_node_click = function(d){
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
    message_buttons.show();
  } else {
    message_buttons.hide();
  }
};

const dom_elements = setup_canvas_and_svg(div);
dom_elements.tooltip = setup_tooltip(div, C);
const progress_meter = setup_progress_meter(dom_elements.svg, C);

const network_viz = setup_network_viz(dom_elements, on_node_click);


//------------------------------------------------------------
// On Render
//------------------------------------------------------------
// This is code that runs whenever new data is received by the
// visualization.
r2d3.onRender(function(data, div, width, height, options){
  console.log('rendering now!');
  size_viz(width, height);

  // Prepare data based upon the desired format from options
  const data_for_viz = C.viz_type === 'bipartite' ?
    fix_nodes_to_line(sanitize_data(data), C):
    sanitize_data(data);

  // Launch webworker to calculate layout and kickoff network viz after finishing
  launch_webworker(
    data_for_viz,
    {
      on_progress_report: progress_meter.update,
      on_layout_data: (data) => {
        network_viz.new_data(data);
      },
      on_finish: () => {
        progress_meter.hide();
      },
    });

//  setup_zoom(svg, draw_network);
});

function size_viz(width, height){
  // Adjust size of svg and canvas elements
  const sizes = setup_sizes(width, height, C);
  dom_elements.resize(sizes);
  progress_meter.resize(sizes);
  network_viz.resize(sizes);
}

r2d3.onResize(size_viz);

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
    .data(nodes, d => d.id);

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
