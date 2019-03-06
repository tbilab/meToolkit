// Helper functions for upset plot

// number formatters
const countFormat = d3.format(",d");
const CiFormat = d3.format(".3f");
const pValFormat = d3.format("0.2");


function unique(data, key){
  return d3.set(data).values();
};

