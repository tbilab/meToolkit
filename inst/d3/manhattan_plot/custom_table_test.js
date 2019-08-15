// !preview r2d3 data=phewas_results, options=list(selected=first_selected), container = 'div', dependencies = c('d3-jetpack'), css = here::here('inst/d3/manhattan_plot/table_styling.css')
// ===============================================================
// Initialization
// This code is run a single time
// ===============================================================
const margin = {left: 65, right: 10, top: 10, bottom: 20};


function setup_table(dom_target, sizes){
  const up_cursor = 'n-resize';
  const down_cursor = 's-resize';

  // Scope variables that get modified by methods
  let selected_codes = [];
  let on_selection = selected_codes => console.log(selected_codes);
  let rows;

  const body_height = sizes.height - sizes.header - sizes.padding;

  const control_panel = div.append('div.control_panel');

  // ==============================================================
  // Search bar setup
  const search_bar = control_panel
    .append('div.search_box');

  search_bar.append('label')
    .text('Search for code(s):')
    .attr('for', 'search_bar');

  const search_text = search_bar.append('input')
    .attr('type', 'text')
    .attr('name', 'search_bar')
    .on('input', on_code_search);

  const search_clear_btn = search_bar.append('button.clear_search.hidden')
    .text('Clear')
    .on('click', clear_search);

  // ==============================================================
  // Bring selected codes to top button
  control_panel.append('button.raise_selected')
    .text('Bring selected codes to top')
    .on('click', raise_selected_codes);

  const table = div.append('div')
    .style('height', `${sizes.height}px`)
    .style('overflow', 'scroll')
    .append('table')
    .attr('class', 'fixed_header');

  const add_data = function(table_data, columns_to_show){
    // Add variable to keep track of sort direction for a column
    columns_to_show.forEach(col => {
      col.sort_inc = false;
    });

    // Draw headers for table
    table.append('thead')
      .st({
        height: `${sizes.header}px`,
        paddingBottom: `${sizes.padding}px`,
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
  rows = table.append('tbody')
    .st({
      display:'block',
      overflow:'auto',
      height: `${sizes.height}px`,
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

    return this;
  };

  const select_codes = function(codes_to_select){
    selected_codes = codes_to_select;
    rows.classed('selected', d => codes_to_select.includes(d.code));
    return this;
  };

  const selection_callback = callback => {
    on_selection = callback;
    return this;
  };

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

    on_selection(selected_codes);
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

  function raise_selected_codes(){
    rows.sort((a,b) => {
      const a_selected = selected_codes.includes(a.code);
      const b_selected = selected_codes.includes(b.code);
      return b_selected - a_selected
    })
  }

  function on_code_search(){
    const current_search = this.value;

    // Make sure to hide clear button if the user has deleted all their search
    if(current_search.length === 0){
      hide_clear_btn();
    } else {
      show_clear_btn();
    }

    // Only start searching if the query is over two letters long for efficiency.
    if(current_search.length < 2) {
      rows.classed('found_in_search', false);
      return;
    }

    rows.each(function(d){
      d.found_in_search = d.code.includes(current_search);
      d3.select(this).classed('found_in_search', d.found_in_search);
    })

    rows.sort((a,b) => {
      const a_found = a.found_in_search;
      const b_found = b.found_in_search;
      return b_found - a_found
    });
  }

  function clear_search(){
    rows.classed('found_in_search', false);
    search_text.node().value = '';
    hide_clear_btn();
  }

  function hide_clear_btn(){
    search_clear_btn.classed('hidden', true);
    search_clear_btn.classed('visible', false);
  }

  function show_clear_btn(){
    search_clear_btn.classed('hidden', false);
    search_clear_btn.classed('visible', true);
  }

  return {add_data, select_codes, selection_callback};
}


// ================================================================
// Global variables that get accessed in state functions
// ================================================================
const columns_to_show = [
  {name: 'Code', id: 'code', is_num: false},
  //{name: 'Description', id: 'description', is_num: false},
  {name: 'OR', id: 'OR', is_num: true},
  {name: 'P-Value', id: 'p_val', is_num: true},
];

const my_table = setup_table(div.append('div'), {height: 400, header: 35, padding: 5, control_panel: 50})
  .add_data(data, columns_to_show)
  .select_codes(['415.10', '414.20']);


function format_val(d){
  return d3.format(".3")(d);
}
