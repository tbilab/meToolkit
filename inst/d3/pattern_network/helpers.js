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

  if(C.layout === 'bipartite'){
    nodes.forEach(d => {
      d.fx = d.type === 'pattern' ? (2*C.w)/3:  C.w/3;
    });
  return {nodes, links}
}
}
