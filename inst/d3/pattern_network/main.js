// !preview r2d3 data = read_rds(here('module_tests/data/upset_r2d3_data.rds')), dependencies = c("d3-jetpack",here('inst/d3/pattern_network/helpers.js'))

console.log('im here!');

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
  layout: 'bipartite',
  radius_exageration: 10,
  code_radius: 25,
  snp_color: '#fc8d59',
  no_snp_color: '#99d594',
  code_color: '#beaed4',
}, options);

const viz_g = svg.selectAppend('g.viz')
  .translate([margin.left, margin.top]);

// Extract the 'node' data
const patterns = HTMLWidgets.dataframeToD3(data.data);
const codes = data.options.marginalData;

const {nodes, links} = build_nodes_links(patterns, codes, C);


// Scale to size the nodes in network
const node_size_scale = d3.scaleSqrt()
  .domain([0, d3.max(patterns, d => d.count)])
  .range([0, 50]);

const pattern_color_scale = d3.scaleLinear()
  .domain(d3.extent(nodes, d => d.snp_ratio))
  .range([C.no_snp_color, C.snp_color]);


// Setup the simulation
const simulation = d3.forceSimulation(nodes)
  .force("link",
    d3.forceLink(links)
      .id(d => d.name)
  )
 .force('collision',
    d3.forceCollide()
      .radius(d =>
        (d.type === 'pattern' ?
          node_size_scale(d.total_size):
          C.code_radius) + C.radius_exageration
      )
      .strength(0.8)
  )
  .force("charge", d3.forceManyBody())
  //.force("x", d3.forceX(C.w / 2))
  .force("y", d3.forceY(C.h / 2));

// Setup the chart components
const link_lines = viz_g.selectAppend("g.links")
  .at({ stroke: "#999", strokeOpacity: 0.6 })
    .selectAll("line")
    .data(links)
    .enter()
    .append('line')
    .at({strokeWidth: 3});

const node_circles = viz_g.selectAppend("g.nodes")
  .at()
  .selectAll('circle')
  .data(nodes)
  .enter().append('g.node');

node_circles.append('circle')
  .at({
    stroke: '#fff',
    strokeWidth: 1.5,
    r: d => d.type === 'pattern' ? node_size_scale(d.total_size): C.code_radius,
    fill: d => d.type === 'pattern' ? pattern_color_scale(d.snp_ratio): C.code_color
  })
  .call(drag(simulation));

node_circles.filter(d => d.type === 'code')
  .append('text')
  .at({
    //x: - C.code_radius,
    textAnchor: 'middle',
    alignmentBaseline: 'middle',
    fill: 'white',
  })
  .st({
    fontSize: '0.9em',
  })
  .text(d => d.name)

node_circles
  .on('mouseover', d => {
    console.log(d.name);
  });

simulation.on("tick", () => {
  link_lines
    .at({
      x1: d => d.source.x,
      x2: d => d.target.x,
      y1: d => d.source.y,
      y2: d => d.target.y,
    });

  node_circles
    .translate(d => [d.x, d.y]);
});


function drag(simulation){

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    //d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
   // d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    //d.fx = null;
    d.fy = null;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
};
