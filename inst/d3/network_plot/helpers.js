// Helper functions for network plot

function unique(data, key){
  return d3.set(data).values();
};

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


// Function to make sure data conforms to the format we want
function sanitize_data(data){
  const data_props = Object.keys(data);

  return {
    nodes: data_props.includes('vertices') ? data.vertices : data.nodes,
    links: data_props.includes('edges') ? data.edges : data.links,
  };
};


// Function to add a dx or dy point to nodes for fixing them on a line in force simulation
function fix_nodes_to_line(data, C){
  data.nodes.forEach(d => {
    if(d.selectable){
      d.fx = -1;
    } else {
      d.fx = 1;
    }

  });
  return data;
}


// Function to find all nodes that a given node is connected to.
function find_connections(node_id, edges){
  return edges
    .filter(d => (d.target.name === node_id) || (d.source.name === node_id))
    .map(d => d.source.name === node_id ? d.target.name : d.source.name);
}


// Function to send a message back to shiny
function send_to_shiny(type, codes, C){

  // Only try and send a message if we have codes to do so.
  if(codes.length === 0) return;

  // Build message
  const message_body = {
    type: type,
    // append the date to the begining so sent value always changes.
    payload: [Date.now().toString(), ...codes]
  };

  // Send message off to server
  if(typeof Shiny !== 'undefined'){
    Shiny.onInputChange(C.msg_loc, message_body);
  } else {
    console.log('sending message to shiny');
  }
};


// Function to setup overlaid canvas and svg
function setup_dom_elements(div, C, on_message){
  // Make div relatively positioned so we can overlay svg and canvas
  div.style('position', 'relative');

  // Append the svg and padded g element
  const svg = div.selectAppend('svg')
    .html('') // wipe svg content if need be
    .style('position', 'absolute');

  // Append the canvas
  const canvas = div.selectAppend('canvas');
  const context = canvas.node().getContext('2d');

  const tooltip = setup_tooltip(div, C);

  const message_buttons = setup_message_buttons(div, on_message);

  const resize = function({width, height}){
    const viz_sizing = {
      height: height,
      width: width,
    };

    svg.at(viz_sizing)
       .st(viz_sizing);

    canvas.at(viz_sizing);
  };

  return {svg, canvas, context, tooltip, message_buttons, resize};
}


// Function to initialize a tooltip for showing mousover info
// Appends a tooltip to a div and opens up methods to move it around, show, hide, and update contents
function setup_tooltip(div, C){

  const tip = div.selectAppend('div.tooltip')
    .st({
      background: 'white',
      borderRadius: '10px',
      padding: '0px 15px',
      boxShadow: '1px 1px 3px black',
      position: 'absolute',
    });

  const tip_body = tip.selectAppend('div.body');

  const move = function(pos){
    tip
      .style('left', `${pos[0] + C.tooltip_offset}px`)
      .style('top',  `${pos[1]}px`);

    return this;
  };

  const show = function(){
    tip.style('display', 'block');
    return this;
  };

  const hide = function(){
    tip.style('display', 'none');
    return this;
  };

  const update = function(content){
    tip_body.html(content);
    return this;
  };

  // start with tooltip hidden
  hide();

  return {move, show, hide, update};
}


// Function to setup the message sending buttons to send codes to shiny
function setup_message_buttons(div, message_send_func){
  const button_span = {
    border: "1px solid black",
    padding: "5px",
    borderRadius: "8px",
    boxShadow: "black 1px 1px 0px",
    background: "lightyellow",
    cursor: "pointer",
    paddingRight: "5px"
  };

  const hidden_style = {
    display: 'none',
    left: -1000
  };

  const displayed_style = {
    bottom: '10px',
    left: '10px',
    display:'block'
  };

  const node_interaction_popup = div.selectAppend('div.node_message_buttons')
    .attr('class', 'node_interaction_popup')
    .st({
      background:'white',
      position:'absolute',
      display: 'none'
    });

  const delete_codes_button = node_interaction_popup
    .selectAppend('span#delete_button')
    .attr('id', 'delete_button')
    .st(button_span)
    .text('Delete Codes')
    .on('click', () => {
      message_send_func('delete');
    });

  const isolate_codes_button = node_interaction_popup
    .selectAppend('span#isolate_button')
    .attr('id', 'isolate_button')
    .st(button_span)
    .text('Isolate Codes')
    .on('click', () => {
      message_send_func('isolate');
    });

  const invert_codes_button = node_interaction_popup
    .selectAppend('span#invert_button')
    .attr('id', 'invert_button')
    .st(button_span)
    .text('Invert Codes')
    .on('click', () => {
      message_send_func('invert');
    });

  return {
    show: () => node_interaction_popup.st(displayed_style),
    hide: () => node_interaction_popup.st(hidden_style),
  };
}


// Function to setup a progress meter
function setup_progress_meter(svg, C){
  const roundness = 5;

  // Append a g for holding meter
  const meter = svg.append('g.progress_meter');

  const calculating_message = meter.selectAppend('text.message')
    .text('Calculating network layout')
    .at({
      y: C.progress_bar_height + 5,
      opacity: 0,
    })
    .st({
      alignmentBaseline: 'hanging',
      textAnchor: 'middle',
      fontSize: '1.5em',
      userSelect: "none",
    });

  // Add a rectangle to act as background showing finishing point
  const background = meter.append('rect.background')
    .at({
      height: C.progress_bar_height,
      fill: 'lightgrey',
      stroke: 'grey',
      strokeWidth: 1,
      rx: roundness,
    });

  // Add rectangle to 'fill up'
  const fill_bar = meter.append('rect.fill_bar')
    .at({
      height: C.progress_bar_height,
      fill: C.progress_bar_color,
      rx: roundness,
    });

  // For easy transitioning of both bars on show/hide
  const all_bars = meter.selectAll('rect');

  // Add text that write's out progress
  const progress_text = meter.append('text.progress_text')
    .at({
      y: C.progress_bar_height - 3,
    })
    .st({
      alignmentBaseline: 'bottom',
      fontSize: 20,
    });

  // Function to update meter with new progress
  const update = (prop_done) => {

    const full_width = +background.attr('width');
    const fill_position = full_width*prop_done;

    // Raise meter to top of viz;
    meter.raise();

    // Make sure all bars are visible
    all_bars.attr('height', C.progress_bar_height);

    // Update width of fill bar
    fill_bar.attr('width', fill_position);


    // Update text
    progress_text
      .attr('x', fill_position + 2)
      .text(d3.format(".0%")(prop_done));

    // Make sure all text is visible
    meter.selectAll('text').attr('opacity', 1);
  };

  const resize = ({width, height}) => {
    // Update the general size of progress bar in case we have resized viz.
    background.attr('width', width);
    calculating_message.attr('x', width/2);
  };

  // Function to hide meter
  const hide = () => {

    const t = d3.transition()
      .duration(750)
      .ease(d3.easeLinear);

    meter.selectAll('rect')
      .transition(t)
      .attr('height', 0);

    meter.selectAll('text')
      .transition(t)
      .attr('opacity', 0)
      .text('');
  };

  return {update, hide, resize};
}


// Simulation webworker function
function sim_webworker(update_freq){
  importScripts("https://d3js.org/d3-collection.v1.min.js");
  importScripts("https://d3js.org/d3-dispatch.v1.min.js");
  importScripts("https://d3js.org/d3-quadtree.v1.min.js");
  importScripts("https://d3js.org/d3-timer.v1.min.js");
  importScripts("https://d3js.org/d3-force.v1.min.js");

  onmessage = function(event) {
    const nodes = event.data.nodes;
    const links = event.data.links;
    const centering_force = d => d.selectable ? 0.5: 0;

    const simulation = d3.forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links)
          .id(d => d.id)
          .distance(0.2)
          .strength(0.8)
      )
      .force(
        'collision',
        d3.forceCollide()
          .radius(d => d.selectable ? 10: 3)
          .strength(0.4)
      )
      .force(
        "charge",
        d3.forceManyBody()
      )
      .force(
        "X",
        d3.forceX()
          .strength(centering_force)
      )
      .force(
        "Y",
        d3.forceY()
          .strength(centering_force)
      );

    const num_itts = Math.ceil((Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())));
    let i = 0;

    // How often in terms of number of iterations do we send current progress back?
    simulation.on('tick', () => {
      i++;
      postMessage({type: "progress_report", progress: i / num_itts});
      if((i % update_freq) === 0){
        postMessage({type: 'layout_data', nodes: nodes, links: links});
      }
    });

    simulation.on('end', () => {
      postMessage({type: "end", nodes: nodes, links: links});
    });
  };
}

// Function to draw canvas parts of network
function draw_canvas_portion({nodes, links}, scales, {canvas, context}, C, highlighted_nodes = []){

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

  // Function to assign node highlights
  // Only check for highlight modification if we need to to avoid expensive calculations
  const node_border = d => highlighted_nodes.length != 0 ?
    `rgba(0, 0, 0, ${highlighted_nodes.includes(d.name) ? 1 : 0})` :
    `rgba(0, 0, 0, 0)`;


  nodes.forEach( d => {
    if(!d.selectable){

      // Border around the nodes.
      context.strokeStyle = node_border(d);

      context.fillStyle = d.color;

      context.beginPath();
      context.arc(scales.X(d.x), scales.Y(d.y), C.case_radius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
    }
  });

}


// Function to draw svg parts of network
function draw_svg_nodes({nodes, links}, scales, {svg, canvas, context, tooltip}, C, on_click, on_mouseover){

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
      on_mouseover(d);

      // Redraw the canvas part of the viz with these highlights
      //draw_canvas_portion({nodes, links}, scales, {canvas, context}, C, connected_nodes);

      tooltip
        .move([scales.X(d.x), scales.Y(d.y)])
        .update(d.tooltip)
        .show();
    })
    .on('mouseout', function(d){
      tooltip.hide();

      // Reset nodes that may have been highlighted
      draw_canvas_portion({nodes, links}, scales, {canvas, context}, C);
    })
    .on('click', on_click);
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


// Finds which patient nodes contain a given pattern of codes.
function find_patients_by_pattern({nodes, links}, pattern){

  if(pattern.length === 1){
    return find_connections(pattern[0], links);
  }

  return Object.values(
    links.reduce(
      (acc, d) => {
        const patient = d.source.name;
        const code = d.target.name;
        // Only add the code if we need to.
        if(pattern.includes(code)){
          patient_info = acc[patient] || {};
          patient_codes = patient_info.codes || [];
          patient_info.codes = [...patient_codes, code];
          patient_info.name = patient;
          acc[patient] = patient_info;
        }
        return acc;
      },{} )
  ).filter(d => d.codes.length == pattern.length)
   .map(d => d.name);

}

// Builds array of patient to phecode pattern for use in filtering
function build_patient_patterns(data){
  const nodes = data.nodes || data.vertices;
  const links = data.links || data.edges;

  const id_to_code = nodes.reduce(
    (acc, d) => {
      if(d.selectable){
        acc[d.id] = d.name;
      }
      return acc;
    },
    {}
  );


  const patient_to_codes = {};

  for(let i = 0; i < links.length; i++){
    patient_to_codes[links[i].source] = [...(patient_to_codes[links[i].source] || []), id_to_code[links[i].target]];
  }

  return nodes.filter(d => !d.selectable).map(d => ({name: d.name, pattern: patient_to_codes[d.id]}));
}


// Test if two datasets are equal for determining if we have new data from render call
function is_new_data(old_data, new_data) {
  const old_nodes = old_data.nodes || old_data.vertices,
        new_nodes = new_data.nodes || new_data.vertices;

  if(typeof old_nodes === 'undefined')
    return true;

  // If node vecs are different lengths data must be new
  if(old_nodes.length !== new_nodes.length)
    return true;

  // Next, test if both node sets combined unique nodes is same length as old data
  const combined_names = unique([...old_nodes, ...new_nodes].map(d => d.name));

  // If we have a different length then we have new data somewhere
  return combined_names.length !== old_nodes.length;
}

function arrays_equal(arr_1, arr_2){
  // If vecs are different lengths data must different
  if(arr_1.length !== arr_1.length)
    return false;

  // If the union of the two arrays is the same size as both they're the same.
  const size_of_union = unique([...arr_1, ...arr_2]).length
  return (size_of_union === arr_1.length) && (size_of_union === arr_2.length);
}
