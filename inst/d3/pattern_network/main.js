// !preview r2d3 data = data_for_upset$data, options = options, dependencies = c("d3-jetpack",here('inst/d3/pattern_network/helpers.js')), css=here('inst/d3/upset/upset.css')

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
}, options);

// Function to generate a distance calculating function
// between two patterns based off of marginal prop weighted
// manhattan distance
function make_dist_funct(marginals){
  // Find total count of codes for normalization purposes
  const total_count = d3.sum(marginals, d => d.count);

  // Create object that maps code to inverse proportion of occurance in marginals, or weight for distance
  const code_to_weight = marginals.reduce(
    (acc,curr) => Object.assign(acc,{[curr.code]: total_count/curr.count}),
    {}
  );

  return (pattern_a, pattern_b) => {
    // Find union of the two patterns
    const common_codes = union(pattern_a.split('-'), pattern_b.split('-'));

    // return weighted sum using inverse proportions
    return common_codes.reduce((dist,code) => dist + code_to_weight[code], 0);
  };
}


const calc_dist = make_dist_funct(options.marginalData);

calc_dist(data[5].pattern, data[7].pattern)

