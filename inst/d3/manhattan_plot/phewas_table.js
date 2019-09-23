const arrow_colors = {
  unsorted: 'dimgrey',
  sorted: 'black',
};

function setup_table(dom_target, arrow_color){
  const up_cursor = 'n-resize';
  const down_cursor = 's-resize';


  // Scope variables that get modified by methods
  let selected_codes = [];
  let on_selection = selected_codes => console.log(selected_codes);
  let rows;

  // Let CSS know this is the main container div.
  dom_target.classed('table_holder', true);

  // ==============================================================
  // Search bar setup
  const search_bar = dom_target.append('div.search_box');

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
  dom_target.append('div.raise_selected')
    .append('button')
    .text('Bring selected to top')
    .on('click', raise_selected_codes);

  const table = dom_target.append('div.table_wrapper')
    .style('overflow', 'scroll')
    .append('table')
    .attr('class', 'flex-table');

  const add_data = function(table_data, columns_to_show){
    // Add variable to keep track of sort direction for a column
    columns_to_show.forEach(col => {
      col.sort_inc = false;
    });

    // Draw headers for table
    const header_columns = table.append('thead.flex-table-header')
      .append('tr')
      .selectAll('th')
      .data(columns_to_show).enter()
      .append('th')
      .html(d => `${d.name} `)
      .attr('title', "Click to sort in decreasing order")
      .attr('class', d => `tool ${d.size}-column ${d.id}`)
      .each(function(d){
        if(d.sortable){
          const column_header = d3.select(this);
          ['decrease', 'increase'].forEach(direction => {
             column_header
              .append(`span.${direction}`)
              .text(direction === 'decrease' ? '↓': '↑')
              .style('font-weight', 'bold')
              .on('click', function(d){
                column_sort(d.id, direction);
              });
          });
        }
      });


  // Initialize rows for every datapoint
  rows = table.append('tbody.flex-table-body')
    .selectAll('tr')
    .data(table_data)
    .enter()
    .append('tr')
    .classed('selected', d => selected_codes.includes(d.code))
    .on('click', on_row_click);

  // Fill in rows with each columns data
  rows.selectAll('td')
    .data(d => columns_to_show
      .map(({name, id, is_num, size, scroll}) => ({
        column: name,
        size: size,
        value: is_num ? format_val(d[id]): d[id],
        scroll: scroll,
      })))
    .enter()
    .append('td')
    .attr('data-th', d => d.column)
    .attr('class', d => `${d.size}-column`)
    .html(d => `${d.scroll ? `<div style="width:100%}"><span>`: ''} ${d.value} ${d.scroll ? '</span></div>': ''}`);

    // Initialize column sorting
    column_sort('p_val', 'decrease');

    return this;
  };

  const select_codes = function(codes_to_select){

    selected_codes = codes_to_select;
    let number_changed = 0;

    rows.classed('selected', function(d){
      const is_selected = codes_to_select.includes(d.code);
      if(is_selected){
        // Check to see if this code was selected before to keep track of number of codes changed.
        const new_selection = !d3.select(this).classed('selected');
        if(new_selection) number_changed++;
      }
      return is_selected;
    });

    // If more than one code has changed in one go that means the user selected codes using dragging so
    // we want to raise selected codes to top of table
    if(number_changed > 1){
      raise_selected_codes();
    }

    // If more than two selected codes have been changed, sort table too.
    return this;
  };

  const disable_codes = function(or_bounds){
    if(or_bounds == null) return

    const is_disabled = d =>  (d.log_or < or_bounds[0]) || (d.log_or > or_bounds[1]);

    rows.classed('disabled', is_disabled);


    return this;
  }

  function set_selection_callback(callback){
    on_selection = callback;
    return this;
  }

  function on_row_click(d){
    const row = d3.select(this);

    // Dont let user interact with disabled codes.
    const is_disabled = row.classed('disabled');
    if(is_disabled) return;

    const new_selection = !row.classed('selected');

    if(new_selection){
      selected_codes.push(d.code);
    } else {
      // Remove code if user has selected a previously selected code
      selected_codes = selected_codes.filter(code => code !== d.code);
    }

    on_selection(selected_codes);
  }

  function column_sort(col_id, sort_direction){

    // Only do sorting if the column allows it.
    const header_cols = dom_target.selectAll(`.flex-table-header th`);

    const column_selector = header_cols.filter(h => h.id === col_id);

    // Reset all arrows to default colors
    header_cols
      .selectAll('span')
      .st({
        color: 'dimgrey',
        opacity: 0.5,
      });

    // Update this header's proper sorting arrow to the active color
    column_selector.select(`span.${sort_direction}`)
      .st({
        color: arrow_color,
        opacity: 1,
      });

    rows.sort((a,b) => {
      const b_smaller =  b[col_id] < a[col_id];
      const direction_scalar = sort_direction == 'increase' ? 1: -1;
      return direction_scalar * (b_smaller ? -1: 1);
    });
  }

  function raise_selected_codes(){
    rows.sort((a,b) => {
      const a_selected = selected_codes.includes(a.code);
      const b_selected = selected_codes.includes(b.code);
      return b_selected - a_selected;
    });
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

    let num_results = 0;
    rows.each(function(d){

      d.found_in_search = (
        d.code.includes(current_search) ||
        d.description.includes(current_search)
      );

      if(d.found_in_search) num_results++;

      // Update classes of each row to let css know if it
      // was found and what it was found because of
      d3.select(this).classed('found_in_search', d.found_in_search);
    })

    // Only do sorting if the search has any results.
    if(num_results > 0){
      rows.sort((a,b) => {
        const a_found = a.found_in_search;
        const b_found = b.found_in_search;
        return b_found - a_found
      });
    }
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

  return {add_data, select_codes, disable_codes, set_selection_callback, raise_selected_codes};
}


