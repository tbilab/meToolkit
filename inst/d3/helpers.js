// Helper functions for all visualizations

// Turn number into a given number of decimal places
function format_val(d, places = 3){
  return d3.format(`.${places}`)(d);
}

// number formatters
const countFormat = d3.format(",d");
const CiFormat = d3.format(".2f");
const pValFormat = d3.format("0.2");
const toPercent = d3.format(".1%");


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

function setup_tooltip(dom_target, fields_to_show = ['code','OR']){

  // Modify logic here.

  const tooltip = dom_target.selectAppend('div.tooltip')
    .st({
      background:'rgba(255,255,255,0.8)',
      position:'absolute',
      padding: '0.25rem',
      fontSize: 18,
      border: '1px solid grey',
      borderRadius: '5px'
    });

  const santatize_key = key => key.replace('_', ' ');

  const santatize_value = val => typeof(val) === 'number' ? format_val(val): val;


  const show = function(d, mouse_event){
    // By filtering I avoid errors caused by not having data for something
    const table_body = Object.keys(d)
      .filter(key => fields_to_show.includes(key))
      .sort((a,b) => a == 'code' ? -1 : 1) // trick to make sure code field shows up first
      .reduce((table, key) =>
        table + `<tr>
                  <td style='text-align:right'>${santatize_key(key)}</td>
                  <td style='text-align:left; padding-left: 1rem'>${santatize_value(d[key])}</td>
                </tr>`, '');

      const tooltip_content = `<table> ${table_body} </table>`;

      const parent_width = +tooltip.parent().style('width').replace('px', '');
      const parent_height = +tooltip.parent().style('height').replace('px', '');

      //debugger;
      const [event_x, event_y] = d3.clientPoint(tooltip.parent().node(), mouse_event);

      const on_left_half = event_x < parent_width/2;
      const on_upper_half = event_y < parent_height/2;

      const offset = 5;

      const style_positioning = {
         display: 'block',
       };

      if(on_left_half){
        style_positioning.left = event_x + offset;
        style_positioning.right = 'auto';
      } else {
        style_positioning.right = parent_width - event_x + 2*offset;
        style_positioning.left = 'auto';
      }

      if(on_upper_half){
        style_positioning.top = event_y + offset;
        style_positioning.bottom = 'auto';
      } else {
        style_positioning.bottom = parent_height - event_y + 2*offset;
        style_positioning.top = 'auto';
      }


      //debugger;
      tooltip
       .st(style_positioning)
       .html(tooltip_content);
  };

  const hide = function(){
    tooltip
      .st({
        left: 0,
        top: 0,
        display: 'none',
      });
  };

  // Start tooltip hidden.
  hide();

  return {show, hide}
}

