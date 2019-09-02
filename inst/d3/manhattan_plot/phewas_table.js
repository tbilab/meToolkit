function setup_table(dom_target, sizes){
  const up_cursor = 'n-resize';
  const down_cursor = 's-resize';

  const col_sizes = {
    small: '70px',
    med: '120px',
    large: '220px',
  };

  // Scope variables that get modified by methods
  let selected_codes = [];
  let on_selection = selected_codes => console.log(selected_codes);
  let rows;

  const body_height = sizes.height - sizes.header - sizes.padding;

  // Let CSS know this is the main container div.
  dom_target.classed('table_holder', true);
  const main_div = dom_target.append('div');

  const control_panel = main_div.append('div.control_panel');

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

  const table = main_div.append('div')
    //.style('height', `${sizes.height}px`)
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
      .style('cursor', d => d.sortable ? down_cursor: null)
      .style('width', d => col_sizes[d.size])
      .attr('title', "Click to sort in decreasing order")
      .attr('class', 'tool table_header')
      .on('click', column_sort);

    // Initialize rows for every datapoint
  rows = table.append('tbody')
    .style('height', `${sizes.height}px`)
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
    .style('width', d => col_sizes[d.size])
    .attr('data-th', d => d.column)
    .html(d => `${d.scroll ? `<div style="width:${col_sizes[d.size]}"><span>`: ''} ${d.value} ${d.scroll ? '</span></div>': ''}`);

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

  function column_sort(selected_column){
    // Only do sorting if the column allows it.
    if(!selected_column.sortable) return;

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


