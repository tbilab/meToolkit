// !preview r2d3 data= readr::read_rds(here::here('data/fake_network_data.rds')), options = readr::read_rds(here::here('data/fake_network_options.rds')), container = 'div', dependencies = c("d3-jetpack", here::here('inst/d3/helpers.js'), here::here('inst/d3/network_plot/helpers.js')), css = c(here::here('inst/d3/network_plot/network.css'), here::here('inst/d3/helpers.css'), here::here('inst/css/common.css'))


// Constants object for viz, all can be overwritten if passed a different value
// with the options argument of r2d3

// Holds the currently selected codes.
let selected_codes = [];

let viz = {
      data: {},
      width,
      height,
      options,
      patient_patterns: null,
    };


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
    callouts: false,
    export_mode: false,
    fields_to_show: ['code', 'OR', 'p_val', 'description', 'category'],
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
      current_zoom = null,
      scales = null,
      patient_patterns = null,
      nodes_to_highlight = [];

  const X = d3.scaleLinear();
  const Y = d3.scaleLinear();

  const new_data = function(data){

    const nodes = data.nodes || data.vertices;
    const links = data.links || data.edges;

    // Remove old network nodes
    dom_elements.svg.selectAll('circle').remove();

    // Make sure message buttons are hidden only if
    // no codes are selected.
    if(selected_codes.length === 0) {
      dom_elements.message_buttons.hide();
    }

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

  const update_scales = function(){
     // Update scales with the zoom if we have any
    scales = {
      X: current_zoom ? current_zoom.rescaleX(X) : X,
      Y: current_zoom ? current_zoom.rescaleY(Y) : Y,
    };
  };

  const new_patterns = function(patterns){
    patient_patterns = patterns;
  };

  function find_nodes_to_highlight({type, codes}){
    let to_highlight = [];

    // If we have a null code dump, nothing gets highlighted.
    if(codes === null) {
      return to_highlight;
    }

    if(type === 'code'){
      to_highlight = patient_patterns
        .filter(d => d.pattern.includes(codes))
        .map(d => d.name);
    } else {
      const single_code = typeof codes === 'string';

      // Find the patient nodes who have the pattern we want to highlight
      to_highlight = patient_patterns
        .filter(d => arrays_equal(d.pattern, single_code ? [codes] : codes))
        .map(d => d.name);
    }

    return to_highlight;
  }

  function highlight_nodes(highlight_pattern){

    const nodes_to_highlight = find_nodes_to_highlight(highlight_pattern);

    // Highlight SVG nodes if in export mode
    if(C.export_mode){

      dom_elements.svg.selectAll('circle')
        .at({
          stroke: 'black',
          strokeWidth: d => nodes_to_highlight.includes(d.name) ? 1: 0,
        });

    } else {
      draw_canvas_portion(layout_data, scales, dom_elements, C, nodes_to_highlight);
    }
  }

  const draw = function(highlight_pattern = viz.options.highlighted_pattern){
    // Update scales with the zoom if we have any
    update_scales();


    const node_callbacks = {
      mouseover: d => highlight_nodes({type: 'code', codes: d.name}),
      mouseout: d => {
        highlight_nodes(highlight_pattern);
      },
    };

    draw_svg_nodes({
      layout_data,
      scales,
      dom_elements,
      C,
      on_node_click,
      node_callbacks,
    });

    highlight_nodes(highlight_pattern);
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

  return {new_data, resize, new_patterns, redraw:draw};
};


//------------------------------------------------------------
// On initialization.
//------------------------------------------------------------
// This code gets run once and sets up the basic
// neccesities for the visualization.

// Setup all the dom elements for the viz. This includes
// the svg, canvas, context, tooltip, and message buttons.
const dom_elements = setup_dom_elements(
  div, C,
  // Function that is called when a message button is pressed. Passed the type of message
  function(type){
    send_to_shiny(type, selected_codes, C);
    // Reset out selected codes
    selected_codes = [];
  });

// Setup the progress bar for network simulation progress
const progress_meter = setup_progress_meter(dom_elements.svg, C);

// Setup the actual network viz itself.
const network_viz = setup_network_viz(dom_elements, on_node_click);
network_viz.new_data(data);

const webworker = setup_webworker(C);


//------------------------------------------------------------
// On Render
//------------------------------------------------------------
// This is code that runs whenever new data is received by the
// visualization.
r2d3.onRender(function(data, div, width, height, options){
  viz.options = options;

  const new_data = is_new_data(viz.data, data);

  if(new_data){
    // Update the global viz info object
    viz.data = data;
    // Reset selected codes
    selected_codes = [];
  } else {
    network_viz.redraw();
  }


  if(new_data){
    // Build a patient pattern array and send to network viz
    viz.patient_patterns = build_patient_patterns(viz.data);
    network_viz.new_patterns(viz.patient_patterns);

    // Prepare data based upon the desired format from options
    const data_for_viz = C.viz_type === 'bipartite' ?
      fix_nodes_to_line(sanitize_data(viz.data), C):
      sanitize_data(viz.data);

    // Make sure viz is correct size.
    size_viz(viz.width, viz.height);

    // Launch webworker to calculate layout and kickoff network viz after finishing
    webworker(
      data_for_viz,
      {
        on_progress_report: progress_meter.update,
        on_layout_data: (d) => {
          network_viz.new_data(d);
        },
        on_finish: () => {
          progress_meter.hide();
        },
      }
    );
  }

});


// Tell r2d3 what to do when we resize the viz
r2d3.onResize((new_width, new_height) => {

  // Update the global viz info object
  viz.width = new_width;
  viz.height = new_height;

  size_viz(viz.width, viz.height);
});


function size_viz(width, height){
  // Adjust size of svg and canvas elementsT
  const sizes = setup_sizes(width, height, C);
  dom_elements.resize(sizes);
  progress_meter.resize(sizes);
  network_viz.resize(sizes);
}


// Function to draw svg parts of network
function draw_svg_nodes({
  layout_data,
  scales,
  dom_elements,
  C,
  on_node_click,
  node_callbacks,
}){
  const {nodes, links} = layout_data;
  const {svg, canvas, context, tooltip} = dom_elements;

  // Make sure we have node positions provided by the webworker before we try and draw
  if(nodes[0].x === undefined) return;

  nodes.forEach(d => {
    d.code = d.name;
  });

  const x_max = scales.X.range()[1];
  const y_max = scales.Y.range()[1];

  // Special attributes for selected codes
  const choose_stroke_color = d => d.inverted ?  d.color: 'black';

  const choose_stroke_width = d => {
    if(d.inverted) return 3;

    const selected = selected_codes.includes(d.name);

    return selected ? 2 : 0;
  };

  const choose_fill = d => {
    if(d.inverted){
      return selected_codes.includes(d.name) ? 'grey' : 'white';
    } else {
      return d.color;
    }
  }

  const node_attrs = {
    r: d => C.case_radius*(d.selectable ? C.code_radius_mult: 1),
    cx: d => scales.X(d.x),
    cy: d => scales.Y(d.y),
    stroke: choose_stroke_color,
    strokeWidth: choose_stroke_width,
    fill: choose_fill,
  };

  // If we isolated the phenotypes before we need to remove them
  svg.select('g.phenotypes').remove();
  const phenotype_nodes = nodes.filter(d => d.selectable);

  // Bind data but only the phenotype nodes unless we're in export mode and need everything to be SVG
  const node_holder = svg.selectAppend('g.nodes');
  const node_circles = node_holder.selectAll('circle')
    .data(
      C.export_mode ? nodes: phenotype_nodes,
      d => d.id
    );

  node_circles.exit().remove();

  const all_nodes = node_circles.enter()
    .append('circle')
    .at({
      r: 0,
      cx: d => Math.random()*x_max,
      cy: d => Math.random()*y_max,
    })
    .merge(node_circles)
    .at(node_attrs);

  // Build container for phenotypes
  const phenotype_holder = svg.selectAppend('g.phenotypes');
  // Swap all phenotype nodes into this container
  all_nodes.filter(d => d.selectable)
    .each(function(){
      phenotype_holder.node().appendChild(this);
    });
  // raise container above everything else
  phenotype_holder.raise();

  // Add mouseover behavior for nodes that are selectable
  all_nodes
    .on('mouseover', function(d){
      node_callbacks.mouseover(d);
      tooltip.show(d, d3.event);
    })
    .on('mouseout', function(d){
      tooltip.hide();
      // Reset nodes that may have been highlighted
      node_callbacks.mouseout(d);
    })
    .on('click', on_node_click);

    // Callout boxes
    if(C.callouts){
      const box_padding = 2;
      const start_x_delta = C.case_radius*C.code_radius_mult*1.2;

      // Draw the sticky node names
      const node_callouts = svg.selectAll('g.node_callout')
        .data(phenotype_nodes, d => d.name);

      // Remove callouts for nodes that are no longer in network
      node_callouts.exit().remove();

      // Add new codes and update all positions
      const callout_g = node_callouts.enter()
        .append('g.node_callout')
        .style('cursor', 'move')
        .merge(node_callouts)
        .each(d => {
          // How far away from the point is this callout?
          //d.callout_delta = [C.case_radius*C.code_radius_mult*1.2, 0];

          d.delta_x = d.delta_x || start_x_delta;
          d.delta_y = d.delta_y || 0;

          // Prefill a fixed-size bounding box for background
          d.bounding_box = d.bounding_box || {width: 20, height:20};
        })
        .translate(d => [scales.X(d.x), scales.Y(d.y)]);

      callout_g.selectAppend('line.callout_line')
        .at({
          x2: d => d.delta_x + d.bounding_box.width/2,
          y2: d => (d.delta_y || 0) - d.bounding_box.height/2,
          stroke: 'black',
          strokeWidth: 1.5,
        });

      const callout_rects = callout_g.selectAppend('rect.callout_background')
        .at({
          x: d => d.delta_x,
          y: d => d.delta_y - d.bounding_box.height,
          rx: 5,
          ry: 5,
          fill: 'white',
          stroke: 'grey',
          strokeWidth: 1,
        })

      callout_g.selectAppend('text.callout_title')
        .text(d => d.name)
        .at({
          x: d => d.delta_x + box_padding,
          y: d => d.delta_y - box_padding*2,
          fontSize: 15,
        })
        .each(function(d){
          const bbox = this.getBBox();
          // grab bounding box size of filled text;
          d.bounding_box = {width: bbox.width + box_padding*2, height: bbox.height + box_padding*2};
        });

      // Update the rectangle backgrounds with the calculated bounding boxes
      callout_rects
        .at({
          width: d => d.bounding_box.width,
          height: d => d.bounding_box.height,
        });

      // Raise callouts above everything else
      callout_g.raise();
      // Make sure that the phenotype nodes are above the callout lines
      phenotype_holder.raise()

      callout_g.call(
        d3.drag()
          .on("drag", function(d){

            d.delta_x += d3.event.dx;
            d.delta_y += d3.event.dy;

            d3.select(this).select('rect')
              .at({
                x: d.delta_x,
                y: d.delta_y - d.bounding_box.height + 3*box_padding,
              });

            d3.select(this).select('line')
              .at({
                x2: d.delta_x + d.bounding_box.width/2,
                y2: d.delta_y - d.bounding_box.height/2,
              });

            d3.select(this).select('text')
              .at({
                x: d.delta_x + box_padding,
                y: d.delta_y + box_padding/2,
              })

          })
      );

    } else {
      // Remove old callouts (if they exist)
      svg.selectAll('g.node_callout').remove();
    }

    if(C.export_mode){
      const link_opacity = decide_link_opacity(links);
      const link_holder = svg.selectAppend('g.links')
      const link_lines = link_holder.selectAll('line.link_lines')
        .data(links, (d,i) => i);

      link_lines.exit().remove();

      link_lines.enter()
        .append('line.link_lines')
        .merge(link_lines)
        .at({
          x1: d => scales.X(d.source.x),
          y1: d => scales.Y(d.source.y),
          x2: d => scales.X(d.target.x),
          y2: d => scales.Y(d.target.y),
          stroke: C.edge_color,
          strokeWidth: 1,
          opacity: link_opacity,
        });

      // Make sure the nodes are above the links
      link_holder.lower();
      svg.selectAll('circle').raise();

    } else {
      svg.selectAll('line.link_lines').remove();
    }
}



const settings_menu = div.selectAppend('div.settings_menu');

const download_button = settings_menu.selectAppend('div.download_button')
  .html(button_icon)
  .classed('hidden', true)
  .on('click', () => downloadPlot(dom_elements.svg))
  .on('mouseover', function(){
      d3.select(this)
        .select('svg')
        .st({
          stroke: 'blue',
          strokeWidth: 3,
        });
    })
  .on('mouseout', function(){
       d3.select(this)
        .select('svg')
        .st({
          stroke: 'black',
          strokeWidth: 2,
        });
    });

const callout_button = settings_menu.selectAppend('button.callout_button')
  .html(`Turn on callouts`)
  .classed('hidden', true)
  .on('click', function(){
    // Toggle callout status
    C.callouts = !C.callouts;

    d3.select(this)
      .html(C.callouts ? `Turn off callouts`: `Turn on callouts`)

    // Redraw viz with new callout status
    size_viz(viz.width, viz.height);
  });

const export_mode_button = settings_menu.selectAppend('button.export_mode_button')
  .html(`${C.export_mode? 'Turn off e': 'E'}xport mode`)
  .on('click', function(){
    // Toggle export mode
    C.export_mode = !C.export_mode;

    // Show buttons if export mode is on, hide otherwise.
    callout_button.classed('hidden', !C.export_mode);
    download_button.classed('hidden', !C.export_mode);

    d3.select(this).html(`${C.export_mode? 'Turn off e': 'E'}xport mode`)

    if(!C.export_mode){
      C.callouts = false;
      callout_button.html(`Turn on callouts`)
    }

    size_viz(viz.width, viz.height);
});
