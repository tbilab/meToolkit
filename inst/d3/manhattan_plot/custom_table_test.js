// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c('d3-jetpack'), css = here::here('inst/d3/manhattan_plot/table_styling.css')
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================
const margin = {left: 65, right: 10, top: 10, bottom: 20};
const up_cursor = 'n-resize';
const down_cursor = 's-resize';
const selected_row_color = 'orangered';


const manhattan_unit = 3;
const hist_unit = 1;
const table_unit = 2;
const total_units = manhattan_unit + hist_unit + table_unit + 1;

let sort_ascending = true;

const size_props = {
  manhattan: manhattan_unit/total_units,
  histogram: hist_unit/total_units,
  table:     table_unit/total_units - 0.01,
};

const num_hist_bins = 100;

// Holds the histogram data for us. Needs to be
// modified every time we resize the plot.
let or_bins;

// ================================================================
// Setup DOM elements
// ================================================================

// ================================================================
// Global variables that get accessed in state functions
// ================================================================

const table_height = 500;
const header_height = 25;
const header_padding = 5;
const body_height = table_height - header_height - header_padding;

let selected_codes = ['411.00', '411.10'];

const dom_target = div.append('div')
  .style('height', 500)
  .style('overflow', 'scroll');

const columns_to_show = [
  {name: 'Code', id: 'code', is_num: false},
  //{name: 'Description', id: 'description', is_num: false},
  {name: 'OR', id: 'OR', is_num: true},
  {name: 'P-Value', id: 'p_val', is_num: true},
];

columns_to_show.forEach(col => {
  col.sort_inc = false;
});

const table_data = data;

const table = dom_target.append('table')
  .attr('class', 'fixed_header');

// Draw headers for table
table.append('thead')
  .st({
    //display: 'table-header-group',
    height: `${header_height}px`,
    paddingBottom: `${header_padding}px`,
  })
  .append('tr')
  .selectAll('th')
  .data(columns_to_show).enter()
  .append('th')
  .text(d => d.name)
  .style('cursor', down_cursor)
  .attr('title', "Click to sort in decreasing order")
  .attr('class', 'tool table_header')
  .on('click', column_sort);

// Initialize rows for every datapoint
const rows = table.append('tbody')
  .st({
    display:'block',
    overflow:'auto',
    height: `${body_height}px`,
    width:'100%',
  })
  .selectAll('tr')
  .data(table_data)
  .enter()
  .append('tr')
  .classed('selected', d => selected_codes.includes(d.code))
  .on('click', on_row_click);

// Fill in rows with each columns data
rows.selectAll('td')
  .data(d => columns_to_show
    .map(({name, id, is_num}) => ({
      column: name,
      value: is_num ? format_val(d[id]): d[id],
    })))
  .enter()
  .append('td')
  .attr('data-th', d => d.column)
  .text(d => d.value);


function on_row_click(d){
  const row = d3.select(this);
  const new_selection = !row.classed('selected');

  // toggle selection class
  row.classed('selected', new_selection);

  if(new_selection){
    selected_codes.push(d.code);
  } else {
    // Remove code if user has selected a previously selected code
    selected_codes = selected_codes.filter(code => code !== d.code);
  }

  console.log(selected_codes)
}

function column_sort(selected_column){

  const id_to_sort = selected_column.id;
  const sort_increasing = selected_column.sort_inc;

  // Update mouseover cursor to reflect new sorting option
  d3.select(this)
   .attr('title', `Click to sort in ${sort_increasing ? 'decreasing': 'increasing'} order`)
   .style('cursor', sort_increasing? down_cursor: up_cursor);

  rows.sort((a,b) => {
    const b_smaller =  b[id_to_sort] < a[id_to_sort];
    const direction_scalar = sort_increasing ? 1: -1;
    return direction_scalar * (b_smaller ? -1: 1);
  });

  // Update sorting direction.
  selected_column.sort_inc = !selected_column.sort_inc;
}


function format_val(d){
  return d3.format(".3")(d);
}
