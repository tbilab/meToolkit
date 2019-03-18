// Helper functions for upset plot

// number formatters
const countFormat = d3.format(",d");
const CiFormat = d3.format(".2f");
const pValFormat = d3.format("0.2");


function unique(data, key){
  return d3.set(data).values();
};

function remove_zero_tick(axis){
  // Get rid of the zero tick value on an axis for cleanliness
  axis.selectAll('.tick')
    .filter(d => d === 0)
    .remove();
}
