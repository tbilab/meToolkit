const arrow_colors = {
  unsorted: 'dimgrey',
  sorted: 'black',
};

// Relative size units of different column types
const col_units = {
  small: 1,
  med: 2,
  large: 4,
};

function build_column_style(columns_to_show, col_units){
  // Get widths of columns in terms of percents
  const single_unit_size = columns_to_show.reduce(function(units, col){
    return units + col_units[col.size];
  }, 0);

  const col_percent_widths = Object.assign({},col_units);
  for(let size in col_percent_widths){
     col_percent_widths[size] *= (100/single_unit_size);
  }

  const col_to_width = {};

  columns_to_show.forEach(function(col){
    col_to_width[col.id] = `${col_percent_widths[col.size]}%`;
  });

  return (col, first_row = false, just_width = false) => {
    const w = col_to_width[col.id];
    if(just_width) return w;

    const width_st = first_row ? `width:${w}; min-width:${w};`: '';
    const align_st = col.size === 'small' ? '': 'text-align: left';
    return `style='${width_st} ${align_st}'`;
  };
}

function setup_table(dom_target, arrow_color, columns_to_show){
  const up_cursor = 'n-resize';
  const down_cursor = 's-resize';

  // Scope variables that get modified by methods
  let selected_codes = [];
  let or_bounds = [-Infinity, Infinity];
  let table_data = [];
  let current_sort = {col: 'p_val', direction: 'increasing'};

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
    .on('click', function(){
      update_w_sort(raise_selected = true);
    });

  const table_holder = dom_target
    .append('div.table_wrapper');

  const header_table = table_holder
    .append('table.header')
    .append('tbody')
    .append('tr');

  const scroll_area = table_holder
    .append('div#scroll-area')
    .style('overflow-y', 'scroll');

  const content_area = scroll_area
    .append('table.content')
    .append('tbody.clusterize-content')
    .attr('id', 'content-area');

  const table_body = content_area
    .append('tr.clusterize-no-data');

   // Build key for how wide each column needs to be.
    get_col_style = build_column_style(columns_to_show, col_units);

    function setup_sort_arrows(d){
      if(d.sortable){
        const column_header = d3.select(this);
        ['decreasing', 'increasing'].forEach(direction => {
           column_header
            .append(`span.${direction}`)
            .text(direction === 'decreasing' ? ' ↓' : '↑')
            .attr(
              'title',
              `Click to sort ${d.name} column ` +
              `in ${direction} order`
            )
            .on('click', function(d){
              current_sort = {
                col: d.id,
                direction,
              };
              update_w_sort();
            });
        });
      }
    }

    // Draw headers for table
    const header_columns = header_table
      .selectAll('td')
      .data(columns_to_show).enter()
      .append('td')
      .html(d => `${d.name}`)
      .style('width', col => get_col_style(col, false, true))
      .attr('class', d => `tool ${d.size}-column ${d.id}`)
      .each(setup_sort_arrows);

    // Fill in first loading row
    table_body.append('td')
      .attr('colspan', 100)
      .html(`Loading data...`);

  const table_obj = new Clusterize({
    rows: [],
    scroll_el: scroll_area.node(),
    content_el: content_area.node(),
  });


  // Logic for row/code selection
  content_area.on('click', function(e){

    const target = d3.event.target.parentNode;
    if(target.nodeName != 'TR') return;

    // Grab code from of selected row
    const target_code = target.dataset.code;

    const already_selected = selected_codes.includes(target_code);

    // Update selected codes array
    if(already_selected){
      selected_codes = selected_codes
        .filter(code => code !== target_code);
    } else {
      selected_codes = [...selected_codes, target_code];
    }

    // Update class for selection
    target.className = already_selected ? '': 'selected';

    // Send new selection to callback
    on_selection(selected_codes);
  });

  function update_w_sort(raise_selected = false){


    const sort_eq = (row_a, row_b) => {
      // If we're raising selected check selection status
      if(raise_selected){
        const a_selected = selected_codes.includes(row_a.code);
        const b_selected = selected_codes.includes(row_b.code);

        // If there is a difference in selection status,
        // that's all we need for sorting
        if(a_selected !== b_selected){
          return b_selected - a_selected;
        }
        // Otherwise we need to proceed as usual...
      }
      return (
        current_sort.direction === 'decreasing'
        ? row_b[current_sort.col] - row_a[current_sort.col]
        : row_a[current_sort.col] - row_b[current_sort.col]
      );
    };

    table_data = table_data.sort(sort_eq);

    const header_cols = dom_target.selectAll(`table.header td`);
    const column_selector = header_cols.filter(h => h.id === current_sort.col);

    // Reset all arrows to default colors
    header_cols
      .selectAll('span')
      .st({
        color: 'dimgrey',
        opacity: 0.5,
      });

    // Update this header's proper sorting arrow to the active color
    column_selector.select(`span.${current_sort.direction}`)
      .st({
        color: arrow_color,
        opacity: 1,
      });

    // Finally actually run the table update.
    update_table();
  }

  // Takes the current table data, converts it to html,
  // and updates the table object.
  function update_table(){
    const build_row_html = (d,i) => {
      const row_data = columns_to_show
        .map(col => {
          // Only need to apply width settings to first row.
          const body = col.is_num ? format_val(d[col.id]): d[col.id];
          return `<td ${get_col_style(col, i===0)}>${body}</td>`;
        })
        .join(' ');

      const inside_or_bounds = d.log_or > or_bounds[0] && d.log_or < or_bounds[1];

      const row_class = (
        inside_or_bounds
        ? (
           selected_codes.includes(d.code)
           ? `class='selected'`
           : ''
          )
        : `class='disabled'`
      );
      return `<tr data-code=${d.code} ${row_class}'>${row_data}</tr>`;
    };

    table_obj.update(
      table_data.map(build_row_html)
    );
  }

  function add_data(new_table_data){
    table_data = new_table_data;
    update_w_sort();
    return this;
  }

  function select_codes(codes_to_select){
     // How many codes changed in this selection update?
    const number_changed = unique([...codes_to_select, ...selected_codes])
      .reduce(function(codes_changed, code){
        const code_in_new = codes_to_select.includes(code);
        const code_in_old = selected_codes.includes(code);

        return codes_changed + (code_in_new && code_in_old ? 0 : 1);
      }, 0);

    selected_codes = codes_to_select;

    const raising_selected = number_changed > 2;

    // If more than two codes have changed, send selected to top.
    update_w_sort(raising_selected);
    return this;
  }

  function disable_codes(new_or_bounds){
    if(new_or_bounds == null) return;
    or_bounds = new_or_bounds;
    update_table();
  }

  function set_selection_callback(callback){
    on_selection = callback;
    return this;
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

  return {add_data, select_codes, disable_codes, set_selection_callback};
}


