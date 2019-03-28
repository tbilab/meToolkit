// Helper functions for pattern network code

// Take the union between two arrays
function union(arr_a, arr_b){
  return arr_a.reduce(
    (common, curr_a) => {
      const common_val = arr_b.includes(curr_a);
      if(common_val) common.push(curr_a);
      return common;
  },
  [] );
}



function build_nodes_links(patterns, codes, C){
  // Build the 'links'
  const links = [];
  patterns.forEach(d => {
    const codes_in_pattern = d.pattern.split('-');
    codes_in_pattern.forEach(c => {
      links.push({
        source: `pattern${d.pattern}`,
        target: c,
        count: d.count,
      });
    });
  });

  // Build the nodes
  const nodes = [
    ...patterns.map(d => ({
        name: `pattern${d.pattern}`,
        type: 'pattern',
        total_size: d.count,
        num_snp: d.num_snp,
        snp_ratio: d.num_snp/d.count,
    })),
    ...codes.map(d => ({
        name: d.code,
        type: 'code',
        total_size: d.count,
        num_snp: d.num_snp,
    }))
  ];

  if(C.bipartite){
    nodes.forEach(d => {
      d.fx = C.w * (d.type === 'pattern' ? 0.8:  0.2);
    });
  }

  return {nodes, links};
}

function setup_scales(nodes, C){
  // How many total pattern nodes do we have?
  const patterns = nodes.filter(d => d.type === 'pattern');
  const n_patterns = patterns.length;
  // What's the average radius of a given node going to need to be
  // to fit on the vertical space we have?
  const average_node_r = (C.h/n_patterns) - (C.radius_exageration/2);

  // Scale to size the nodes in network
  const size = d3.scaleSqrt()
    .domain([0, d3.max(patterns, d => d.total_size)])
    .range([0, average_node_r]);

  const color = d3.scaleLinear()
    .domain(d3.extent(nodes, d => d.snp_ratio))
    .range([C.no_snp_color, C.snp_color]);

  return {size, color};
}

function setup_network(nodes, links, g, scales, C){

  // Setup the chart components
  const link_lines = g.selectAppend("g.links")
    .at({ stroke: "#999", strokeOpacity: 0.6 })
      .selectAll("line")
      .data(links)
      .enter()
      .append('line')
      .at({strokeWidth: 1});

  const node_gs = g.selectAppend("g.nodes")
    .selectAll('circle')
    .data(nodes)
    .enter().append('g.node');

  const node_circles = node_gs.append('circle')
    .at({
      stroke: 'darkgrey',
      strokeWidth: 1,
      r: d => d.type === 'pattern' ? scales.size(d.total_size): C.code_radius,
      fill: d => d.type === 'pattern' ? scales.color(d.snp_ratio): C.code_color
    });

  const code_text = node_gs.filter(d => d.type === 'code')
    .append('text')
    .at({
      textAnchor: 'middle',
      alignmentBaseline: 'middle',
      fill: 'white',
    })
    .st({
      fontSize: '0.9em',
    })
    .text(d => d.name);

  node_gs
    .on('mouseover', d => {
      console.log(d.name);
    });

  function update(){
    node_circles
      .at({
        cx: d => {
          if(C.pin_in_window){
            const radius = scales.size(d.total_size);
            d.x = Math.max(radius, Math.min(C.w - radius, d.x));
          }
          return d.x;
        },
        cy: d => {
          if(C.pin_in_window){
            const radius = scales.size(d.total_size);
            d.y = Math.max(radius, Math.min(C.h - radius, d.y));
          }
          return d.y;
        }
      });

  code_text
    .at({
      x: d => d.x,
      y: d => d.y
    });

    link_lines
      .at({
        x1: d => d.source.x,
        x2: d => d.target.x,
        y1: d => d.source.y,
        y2: d => d.target.y,
      });
  }

  return {
    update,
    set_call: f => node_circles.call(f),
  };
}
