// Helper functions for all visualizations

// Turn number into a given number of decimal places
function format_val(d, places = 3){
  return d3.format(`.${places}`)(d);
}

// number formatters
const countFormat = d3.format(",d");
const CiFormat = d3.format(".2f");
const pValFormat = d3.format("0.2");


// Compare two tuples as equal.
// E.g.
// tuples_equal([1,2], [1,2]) = true
// tuples_equal([1,2], [1,1]) = false
function tuples_equal(a, b){
  return (a[0] === b[0]) && (a[1] === b[1]);
}

function arrays_equal(arr_1, arr_2){
  // If vecs are different lengths data must different
  if(arr_1.length !== arr_1.length)
    return false;

  // If the union of the two arrays is the same size as both they're the same.
  const size_of_union = unique([...arr_1, ...arr_2]).length;
  return (size_of_union === arr_1.length) && (size_of_union === arr_2.length);
}


// Get unique set of values in an array
function unique(data){
  return d3.set(data).values();
};


// Takes a d3 selection of an SVG and downloads a svg for user
function downloadPlot(svg){
  const svgData = svg.node().outerHTML;
  const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = "phecode_network.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}


// Function to send a message back to shiny
function send_to_shiny(type, payload, destination){
  // Build message
  const message_body = {
    type: type,
    // append the date to the begining so sent value always changes.
    payload: [Date.now().toString(), ...payload]
  };

  // Make sure shiny is available before sending message
  if(typeof Shiny !== 'undefined'){
    // Send message off to server
    Shiny.onInputChange(destination, message_body);
  }
}

function setup_tooltip(dom_target){

  const tooltip = dom_target.selectAppend('div.tooltip')
    .st({
      background:'rgba(255,255,255,0.7)',
      position:'fixed',
      fontSize: 18,
    });

  const show = function(d, loc){
    tooltip
     .st({
       left: loc[0] + 10,
       top:  loc[1] + 10,
       display: 'block'
     })
     .html(d.tooltip);
  };

  const hide = function(){
    tooltip
      .st({
        left: 0,
        top: 0,
        display: 'none',
      });
  };

  return {show, hide}
}

