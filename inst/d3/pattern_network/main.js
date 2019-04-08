// !preview r2d3 data = read_rds(here('module_tests/data/upset_r2d3_data.rds')), dependencies = c("d3-jetpack",here('inst/d3/pattern_network/helpers.js'))

// Constants
const margin = {right: 25, left: 25, top: 20, bottom: 70}; // margins on side of chart

// Default constants for the viz. All can be overwritten if passed a different value
// with the options argument of r2d3
const C = Object.assign({
  padding: 20,
  tooltip_offset: 13,
  tooltip_height: 60,
  w: width - (margin.left + margin.right),
  h: height - (margin.top + margin.bottom),
  margin: margin,
  edge_color: '#aaa',
  msg_loc: 'shiny_server',
  bipartite: false,
  radius_exageration: 15,
  code_radius: 25,
  snp_color: '#fc8d59',
  no_snp_color: '#99d594',
  code_color: '#beaed4',
  pin_in_window: true,
}, options);

const viz_g = svg.selectAppend('g.viz')
  .translate([margin.left, margin.top]);

// Extract the 'node' data
const patterns = HTMLWidgets.dataframeToD3(data.data);
const codes = data.options.marginalData;

const {nodes, links} = build_nodes_links(patterns, codes, C);

const scales = setup_scales(nodes, C);
const network = setup_network(nodes, links, viz_g, scales, C);

const collision_detection = (exageration) => d3.forceCollide()
  .radius(d =>
    (d.type === 'pattern' ?
      scales.size(d.total_size):
      C.code_radius) + exageration
  )
  .strength(0.7);

const link_force = d3.forceLink(links)
  .id(d => d.name)
  .strength(0.6)
  .iterations(25);



// Setup the simulation
const simulation = d3.forceSimulation(nodes)
  .alphaDecay(0.02)
  .force("link", link_force)
  .force('collision',collision_detection(C.radius_exageration))
  .force("charge",d3.forceManyBody())
  .force("y",d3.forceY(C.h/2).strength(0.7));

if(!C.bipartite){
  simulation.force('x', d3.forceX(C.w/2).strength(0.7));
}

let i = 1;
const num_ticks = 300;
simulation.on('tick', () => {
  i++;
  if(i === Math.ceil(num_ticks*0.8)){
    simulation
      .force('collision',
            collision_detection(C.radius_exageration*0.35)
      );
  }

  network.update();
});


network.set_call(drag(simulation));

function drag(simulation){

  function dragstarted(d) {
    if (!d3.event.active) {
      simulation
        .alphaTarget(0.1)
        .restart();
    }
    if(!C.bipartite){
      d.fx = d.x;
    }
    d.fy = d.y;
  }

  function dragged(d) {
    if(!C.bipartite){
      d.fx = d3.event.x;
    }
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) {
      simulation
        .alphaTarget(0);
    }

    if(!C.bipartite){
      d.fx = null;
    }

    d.fy = null;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
};
