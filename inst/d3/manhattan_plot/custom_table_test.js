// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c('d3-jetpack'), css = here::here('inst/d3/manhattan_plot/table_styling.css')
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================
const margin = {left: 65, right: 10, top: 10, bottom: 20};
const up_cursor = 'n-resize';
const down_cursor = 's-resize';

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
  col.sorted = 'unsorted';
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
  .append('tr');

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


function column_sort(selected_column){
  console.log('clicking was done!');

  const id_to_sort = selected_column.id;

  const sort_type = ['unsorted', 'inc'].includes(selected_column.sorted) ? 'dec': 'inc';
  selected_column.sorted = sort_type;
  const sort_increasing = sort_type === 'inc';

  // Update mouseover cursor to reflect new sorting option
  d3.select(this)
   .attr('title', `Click to sort in ${sort_increasing ? 'decreasing': 'increasing'} order`)
   .style('cursor', sort_increasing? down_cursor: up_cursor);

  rows.sort(function(a,b){
   if(sort_increasing){
     return b[id_to_sort] < a[id_to_sort] ? -1: 1;
   } else {
     return b[id_to_sort] < a[id_to_sort] ? 1: -1;
   }
  });
}


function format_val(d){
  return d3.format(".3")(d);
}
