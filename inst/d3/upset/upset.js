// !preview r2d3 data = data_for_upset$data, options = data_for_upset$options, dependencies = c("d3-jetpack",here('inst/d3/upset/helpers.js')), css=here('inst/d3/upset/upset.css')
// r2d3: https://rstudio.github.io/r2d3
//

// Constants
const highlightColor = '#fdcdac'; // Color of the highlight bars
const margin = {right: 25, left: 25, top: 20, bottom: 50}; // margins on side of chart

// matrix settings
const matrixPadding = 5;              // How far in from sides the dots start
const matrixSize = 7;                  // radius of dots
const matrixPresentColor = 'black';
const matrixMissingColor = 'lightgrey';

// proportion plot settings
const propPointSize = 3; // size of the point estimates for proportions
const ciThickness = 4;   // how thick is the CI?

// maginal bars settings
const marginalBottomPadding = 5;  // padding between matrix and start of bars
const marginalBarPadding = 0.5;

// count bar settings
const countBarPadding = 0.5;  // vertical gap between count bars.
const countBarLeftPad = 35; // how much space on left of count bars do we leave for popup info?

// layout grid
const marginalChartRatio = 1/3;  // what proportion of vertical space is the code marginal count bars?
const proportionPlotUnits_opts = {just_snp: 0.5, all: 3}; // width of proportion CIs
const matrixPlotUnits_opts     = {just_snp: 2.5, all: 2};
const countBarUnits_opts       = {just_snp: 3.5, all: 3};

// new layout grid
const set_size_bars_units = 3;
const rr_plot_units = 3;
const matrix_plot_units = 3;
const total_width_units = set_size_bars_units + rr_plot_units + matrix_plot_units;
const marginal_count_prop = 0.3;


// Function to filter data down to the minimum desired set size
function filter_set_size(data, marginal_data, min_set_size = 100){
  // Filter the main dataset down
  const filtered_data = data.filter(d => d.count >= min_set_size);

  // Get the remaining codes present after filtering
  const distinct_codes = unique(filtered_data.map(d => d.pattern).join('-').split('-'));

  // Filter the marginal data down to just the remaining codes
  const filtered_marginals = marginal_data.filter(d => distinct_codes.includes(d.code) );

  return {
    patterns: filtered_data,
    marginals: filtered_marginals,
  };
}

// Function to generate all scales from data and a given size plot
function setup_scales(patterns, marginal, sizes){

  const {set_size_bars_w,
         rr_plot_w,
         matrix_plot_w,
         matrix_plot_h,
         margin_count_h,
         matrix_padding,
         padding } = sizes;

  // Place codes on x-axis of matrix
  const matrix_width_scale = d3.scaleBand()
    .domain(marginal.map(d => d.code))
    .range([matrix_padding, matrix_plot_w - matrix_padding])
    .round(true)
    .padding(0.05); // goes from right to left into left margin.

  // Make the top margin bars a tiny bit narrower than the columns of our matrix for breathing room
  const matrix_column_width = matrix_width_scale.bandwidth();
  const margin_bar_width = matrix_column_width*0.9;

  // Setup the x-scale for counts of the patterns
  const set_size_x = d3.scaleLinear()
    .range([set_size_bars_w, 0])
    .domain([0, d3.max(patterns, d=> d.count)]);

  // X scale for the relative risk intervals
  const rr_x = d3.scaleLinear()
    .range([0,rr_plot_w])
    .domain([0,d3.max(patterns, d => d.upper)]);

  // Y scale for patterns in all lower charts, domain is index of pattern
  const pattern_y = d3.scaleLinear()
    .range([margin_count_h, matrix_plot_h + margin_count_h])
    .domain([0, patterns.length]);

  // How thick each pattern's count bar is
  const matrix_row_height = pattern_y(1) - pattern_y(0);
  const set_size_bar_height = matrix_row_height*0.9;

  // Continuous y count scale for the code marginals
  const marginal_y = d3.scaleLinear()
    .range([margin_count_h, 0])
    .domain([0, d3.max(marginal, d => d.count)]);

  // How big should the dots be in matrix?
  const matrix_dot_size = (Math.min(matrix_column_width, matrix_row_height)*0.9)/2;

  return {
    matrix_width_scale,
    set_size_x,
    set_size_bar_height,
    rr_x,
    pattern_y,
    marginal_y,
    margin_bar_width,
    matrix_dot_size,
    matrix_row_height,
    matrix_column_width,
  };
}

function setup_chart_sizes(width, height, margin){
  const min_set_size = 100;
  const h = height - margin.top - margin.bottom;
  const w = width - margin.left - margin.right;

  return {
    set_size_bars_w: w*(set_size_bars_units/total_width_units),
    rr_plot_w: w*(rr_plot_units/total_width_units),
    matrix_plot_w: w*(matrix_plot_units/total_width_units),
    margin_count_h: h*marginal_count_prop,
    matrix_plot_h: h*(1 - marginal_count_prop),
    matrix_padding: 5,
    padding: 10,
    w,
    h,
    margin,
  };
}


// Function to draw upset plot given filtered data and scales
function render_plot(patterns, marginals, sizes){

  // Setup the scales
  const scales = setup_scales(patterns, marginals, sizes);

  // Add a g to pad chart
  const g = svg.selectAppend('g.padding')
    .translate([sizes.margin.left, sizes.margin.top]);

  // ----------------------------------------------------------------------
  // Chart Components
  // ----------------------------------------------------------------------
  const matrixChart = g.selectAppend('g.matrixChart')
    .translate([sizes.set_size_bars_w,0]);

  matrixChart.selectAll('.currentRow')
    .data(patterns)
    .enter().append('g.currentRow')
    .translate((d,i) => [0, scales.pattern_y(i) + scales.matrix_row_height/2] )
    .each(function(currentEntry, i){

      // Initially hidden box for highlighting purposes.
      const highlight_rect = d3.select(this)
        .selectAppend('rect.highlight_rect')
        .at({
          width: sizes.w + sizes.padding*2,
          x: -(sizes.set_size_bars_w + sizes.padding),
          y: -scales.matrix_row_height/2,
          height: scales.set_size_bar_height + sizes.padding,
          fillOpacity: 0.3,
          fill: highlightColor,
          stroke: 'black',
          rx: 5,
          opacity: 0.2,
          class: 'hoverInfo'
        });

      const matrixRow = d3.select(this).selectAppend('g.matrixRow');

      // Background greyed out dots
      const allCodes = matrixRow
        .selectAll('.allCodes')
        .data(marginals.map(d => d.code))
        .enter().append('circle')
        .attr('class', 'allCodes')
        .at({
          cx: d => scales.matrix_width_scale(d) + scales.matrix_width_scale.bandwidth()/2,
          r: scales.matrix_dot_size,
          fill: matrixMissingColor,
          fillOpacity: 0.3,
        });

      // Thin lines that span code range
      const code_positions = currentEntry.pattern
        .split('-')
        .map(d => scales.matrix_width_scale(d) + scales.matrix_width_scale.bandwidth()/2);

      const range_of_pattern = d3.extent(code_positions);

      matrixRow.append('line')
        .at({
          x1: range_of_pattern[0],
          x2: range_of_pattern[1],
          stroke: matrixPresentColor,
          strokeWidth: scales.matrix_dot_size/2
        });

      // Shaded present-codes dots
      const presentCodes = matrixRow
        .selectAll('.presentCodes')
        .data(code_positions)
        .enter().append('circle')
        .at({
          class: 'presentCodes',
          cx: d => d,
          r: scales.matrix_dot_size,
          fill: matrixPresentColor,
        });


      // If we have snp info lets draw relative risk bars
      //if(snp_status === 'all'){
      if(true){
        const rr_interval = d3.select(this).selectAppend('g.rr_interval')
          .translate([sizes.matrix_plot_w, 0]);

        const interval_line = rr_interval
          .selectAppend('line')
          .at({
            x1: scales.rr_x(currentEntry.lower),
            x2: scales.rr_x(currentEntry.upper),
            stroke: currentEntry.pointEst === 0 ? 'darkgrey': 'orangered',
            strokeWidth: ciThickness,
          });

        const interval_point = rr_interval
          .selectAppend('circle')
          .at({
            cx: scales.rr_x(currentEntry.pointEst),
            r: ciThickness*1.5,
            fill:currentEntry.pointEst === 0 ? 'darkgrey': 'orangered',
          });

        // Append some invisible text that can get shown when mouseover
        rr_interval
          .selectAppend('text.point_est')
          .html(d => `<tspan>Relative Risk:</tspan> ${pValFormat(currentEntry.pointEst)}`)
          .at({
            x: 50,
            y: -scales.pattern_y(i) + sizes.margin_count_h/3.5,
            opacity: 0,
            fontSize: 22,
            textAnchor: 'start',
            class: 'hoverInfo'
          });

       rr_interval
         .selectAppend('text.ci')
         .html(d => `<tspan>CI:</tspan> (${CiFormat(currentEntry.lower)},${CiFormat(currentEntry.upper)})`)
         .at({
           x: 50,
           y: -scales.pattern_y(i) + sizes.margin_count_h/2,
           opacity: 0,
           fontSize: 22,
           textAnchor: 'start',
           'class': 'hoverInfo'
         });
      } // end snp status if block

      // Draw pattern size/count bars
      const count_bar = d3.select(this).selectAppend('g.count_bar')
        .translate([-sizes.set_size_bars_w,0]);

      count_bar.selectAppend('rect')
        .at({
          fill: 'steelblue',
          height: scales.set_size_bar_height,
          x: scales.set_size_x(currentEntry.count),
          y: -scales.set_size_bar_height/2,
          width: scales.set_size_x(0) - scales.set_size_x(currentEntry.count),
        });

      const popup_text_pos = sizes.margin_count_h*(4/5) - scales.set_size_bar_height/2;

      count_bar.selectAppend('text')
        .text(countFormat(currentEntry.count))
        .at({
          x: scales.set_size_x(currentEntry.count) - 1,
          y: -scales.pattern_y(i) + popup_text_pos,
          alignmentBaseline: 'middle',
          textAnchor: 'end',
          fontWeight: 'bold',
          opacity: 0,
          class: 'hoverInfo'
        });

      // Line drawn on axis to show exactly where value fals
       count_bar.selectAppend('line')
        .at({
          x1: scales.set_size_x(currentEntry.count),
          x2: scales.set_size_x(currentEntry.count),
          y1: -scales.pattern_y(i) + popup_text_pos,
          y2: -scales.pattern_y(i) + sizes.margin_count_h - scales.set_size_bar_height/2,
          stroke: 'black',
          opacity: 0,
          class: 'hoverInfo'
        });




    })




}




// empty old svg content
svg.html('');

if(data.length < 2){

  const lead_message = data.length === 1 ? "Only one group meets" : "No groups meet";
  svg.append('text')
    .attr('text-anchor', 'middle')
    .tspans([`${lead_message} filter size threshold`, 'Adjust threshold down to see groups.'])
    .attr('x', width/2)
    .attr('y', height/2);

} else {
  //draw_upset();
}


const min_set_size = 100;

const chart_sizes = setup_chart_sizes(width, height, margin);

const {patterns, marginals} = filter_set_size(data, options.marginalData, min_set_size);


// draw plot with size info
render_plot(patterns, marginals, chart_sizes);


function draw_upset(min_set_size = 100) {
  const {patterns: pattern_data, marginals: marginal_data} = filter_set_size(data, options.marginalData, min_set_size);

  // Check if we are looking at a just snp version of the plot record it so we can draw accordingly later.
  const num_snp_eq_total = pattern_data.map(d => +(d.count === d.num_snp)).reduce((running, cur) => running + cur);
  const snp_status = num_snp_eq_total === pattern_data.length ? 'just_snp': 'all';

  const h = height - margin.top - margin.bottom;
  const w = width - margin.left - margin.right;

  const chart_sizes = {
    set_size_bars_w: w*(set_size_bars_units/total_width_units),
    rr_plot_w: w*(rr_plot_units/total_width_units),
    matrix_plot_w: w*(matrix_plot_units/total_width_units),
    matrix_plot_h: h*marginal_count_prop,
    margin_count_h: h*(1 - marginal_count_prop),
    matrix_padding: 5,
    padding: 10,
    w,
    h,
    margin,
  };


  // draw plot with size info
  render_plot(pattern_data, marginal_data, chart_sizes);

  // Setup the scales
  //const scales = setup_scales(pattern_data, marginal_data, chart_sizes);


  const proportionPlotUnits = proportionPlotUnits_opts[snp_status];
  const matrixPlotUnits  = matrixPlotUnits_opts[snp_status];
  const countBarUnits = countBarUnits_opts[snp_status];

  // Calculated constants
  const totalWidthUnits = proportionPlotUnits + matrixPlotUnits + countBarUnits;
  const proportionPlotWidth = w*(proportionPlotUnits/totalWidthUnits);
  const matrixPlotWidth = w*(matrixPlotUnits/totalWidthUnits);
  const countBarWidth = w*(countBarUnits/totalWidthUnits);
  const marginalChartHeight = h*marginalChartRatio;
  const matrixDotSize = Math.min(
    (matrixPlotWidth )/(pattern_data.length),
    matrixSize
  );


  // Parent padded g element.
  const padded = svg.append('g')
    .translate([margin.left, margin.top]);

  // get unique codes present in the data.
  const codeList = Object.keys(
    pattern_data
    .reduce(
      (all, current) => [...all, ...(current.pattern.split('-'))],
      []
    ).reduce(
      (codeDict, currentCode) => Object.assign(codeDict, {[currentCode]: 1}),
      {}
    )
  );


  // ----------------------------------------------------------------------
  // Scales
  // ----------------------------------------------------------------------
  const matrix_width_scale = d3.scaleBand()
    .domain(codeList)
    .range([matrixPadding,matrixPlotWidth - matrixPadding])
    .round(true)
    .padding(0.05); // goes from right to left into left margin.

  const horizontalSpace = matrix_width_scale.bandwidth();

  const marginBarWidth = horizontalSpace - 2*marginalBarPadding;

  const countX = d3.scaleLinear()
    .range([countBarWidth, countBarLeftPad])
    .domain([0, d3.max(pattern_data, d=> d.count)]);

  const proportionX = d3.scaleLinear()
    .range([0,proportionPlotWidth])
    .domain([0,d3.max(pattern_data, d => d.upper)]);

  const y = d3.scaleLinear()
    .range([marginalChartHeight, h])
    .domain([0, pattern_data.length]);

  const verticalSpace = y(1) - y(0);   // how big of a gap each pattern gets
  const barHeight = verticalSpace - 2*countBarPadding;

  const marginalY = d3.scaleLinear()
    .range([marginalChartHeight-marginalBottomPadding, 0])
    .domain([0, d3.max(options.marginalData, d => d.count)]);

  // ----------------------------------------------------------------------
  // Chart Components
  // ----------------------------------------------------------------------
  const matrixChart = padded.append('g.matrixChart')
    .translate([countBarWidth,0]);
  matrixChart.selectAll('.currentRow')
    .data(pattern_data)
    .enter().append('g.currentRow')
    .translate((d,i) => [0, y(i)] )
    .each(function(currentEntry, i){

      // Initially hidden box for highlighting purposes.
      const highlightRect = d3.select(this)
        .selectAppend('rect.highlightRect')
        .at({
          width: w + 20,
          x: -(countBarWidth + countBarPadding*2),
          height: barHeight + countBarPadding,
          fillOpacity: 0.3,
          fill: highlightColor,
          stroke: 'black',
          rx: 5,
          opacity: 0,
          'class': 'hoverInfo'
        });

      // Matrix key
      const matrixRow = d3.select(this).append('g.matrixRow');

      const allCodes = matrixRow
        .selectAll('.allCodes')
        .data(codeList)
        .enter().append('circle')
        .attr('class', 'allCodes')
        .at({
          cx: d => matrix_width_scale(d) + matrix_width_scale.bandwidth()/2,
          cy: verticalSpace/2,
          r: matrixDotSize,
          fill: matrixMissingColor,
          fillOpacity: 0.3,
        });

      // bars that go accross
      const codePositions = currentEntry.pattern
        .split('-')
        .map(d => matrix_width_scale(d) + matrix_width_scale.bandwidth()/2);

      const rangeOfPattern = d3.extent(codePositions);

      matrixRow.append('line')
        .at({
          x1: rangeOfPattern[0],
          x2: rangeOfPattern[1],
          y1: verticalSpace/2,
          y2: verticalSpace/2,
          stroke: matrixPresentColor,
          strokeWidth: matrixDotSize/2
        });

      const presentCodes = matrixRow
        .selectAll('.presentCodes')
        .data(codePositions)
        .enter().append('circle')
        .attr('class', 'presentCodes')
        .at({
          cx: d => d,
          cy: verticalSpace/2,
          r: matrixDotSize,
          fill: matrixPresentColor,
        });


      // Proportion Intervals

      if(snp_status === 'all'){
        const proportionLine = d3.select(this).append('g.proportionLine')
          .translate([matrixPlotWidth, 0]);

        const intervalBar = proportionLine
          .append('line')
          .at({
            x1: proportionX(currentEntry.lower),
            x2: proportionX(currentEntry.upper),
            y1: verticalSpace/2, y2: verticalSpace/2,
            stroke: currentEntry.pointEst === 0 ? 'darkgrey': 'orangered',
            strokeWidth: ciThickness,
          });

      const pointEst = proportionLine
        .append('circle')
        .at({
          cx: proportionX(currentEntry.pointEst),
          cy: verticalSpace/2,
          r: propPointSize,
          fill:currentEntry.pointEst === 0 ? 'darkgrey': 'orangered',
          stroke: 'black',
          strokeWidth: 0.5,
        });

      proportionLine
        .append('text')
        .html(d => `<tspan>Relative Risk:</tspan> ${pValFormat(currentEntry.pointEst)}`)
        .at({
          x: 50,
          y: -y(i) + marginalChartHeight/3.5,
          opacity: 0,
          fontSize: 22,
          textAnchor: 'start',
          'class': 'hoverInfo'
        });

      proportionLine
        .append('text')
        .html(d => `<tspan>CI:</tspan> (${CiFormat(currentEntry.lower)},${CiFormat(currentEntry.upper)})`)
        .at({
          x: 50,
          y: -y(i) + marginalChartHeight/2,
          opacity: 0,
          fontSize: 22,
          textAnchor: 'start',
          'class': 'hoverInfo'
        });
      }


      // Count Bars
      const countBar = d3.select(this).append('g.countBar')
        .translate([-countBarWidth,0]);

      countBar.append('rect')
        .at({
          fill: 'steelblue',
          height: barHeight,
          x: countX(currentEntry.count),
          y: countBarPadding/2,
          width: countX(0) - countX(currentEntry.count),
        })

      countBar.append('text')
        .text(countFormat(currentEntry.count))
        .at({
          x: countX(currentEntry.count) - 1,
          y: -y(i) + marginalChartHeight - 28,
          alignmentBaseline: 'middle',
          textAnchor: 'end',
          fontWeight: 'bold',
          opacity: 0,
          'class': 'hoverInfo'
        })

       countBar.append('line')
        .at({
          x1: countX(currentEntry.count),
          x2: countX(currentEntry.count),
          y1: -y(i) + marginalChartHeight - 28,
          y2: -y(i) + marginalChartHeight,
          stroke: 'black',
          opacity: 0,
          'class': 'hoverInfo'
        })
    })
    .on('mouseover', function(d){
      d3.select(this).selectAll('.hoverInfo').attr('opacity', 1)
    })
    .on('mouseout', function(d){
      d3.select(this).selectAll('.hoverInfo').attr('opacity', 0)
    })
  // ----------------------------------------------------------------------
  // Axes
  // ----------------------------------------------------------------------

  const matrixAxis = matrixChart.append("g")
    .call(d3.axisBottom().scale(matrix_width_scale))
    .translate([0, h]);

  matrixAxis
    .selectAll("text")
    .at({
      x: -7,
      y: -1,
      textAnchor: 'end',
      transform: 'rotate(-60)',
      fontSize:12
    });

  matrixAxis.select('.domain').remove()


  if(snp_status === 'all'){
    const proportionAxis = padded.append('g.proportionAxis')
      .translate([matrixPlotWidth + countBarWidth, marginalChartHeight - marginalBottomPadding])

    proportionAxis.append("g")
      .call(d3.axisTop().scale(proportionX).ticks(5))
      .selectAll("text")
      .at({
        textAnchor: 'start',
        x: 2,
        y: -5,
        opacity: 0.5,
      });

    proportionAxis.select('.tick').select('line')
      .at({
        y1: h-marginalChartHeight
      });

    proportionAxis.append('text')
      .at({
        x: proportionPlotWidth/2,
        y: h - marginalChartHeight+ 20,
      })
      .classed('axisTitles', true)
      .text('Relative Risk')

    // Add a line to show overall snp proportions
    proportionAxis.append('line')
      .at({
        x1: proportionX(1),
        x2: proportionX(1),
        y1: 0,
        y2: h - marginalChartHeight,
        stroke: 'black',
        opacity: 0.8,
      })

  }


  const countAxis = padded.append('g.countAxis')
   .translate([0, marginalChartHeight - marginalBottomPadding]);

  countAxis.append("g")
    .call(d3.axisTop().scale(countX).ticks(5).tickSizeOuter(0))
    .selectAll("text")
    .at({
      x: -2,
      textAnchor: 'end',
      opacity: 0.5
    });

  countAxis.select('.tick').select('line')
    .at({
      y1: h-marginalChartHeight
    });

  countAxis.append('text')
    .at({
      x: countBarWidth/2,
      y: h - marginalChartHeight+ 20,
    })
    .classed('axisTitles', true)
    .text('Set size')


  const marginalCountAxis = padded.append("g")
    .translate([countBarWidth,0])
    .call(d3.axisLeft().scale(marginalY).ticks(4).tickSizeOuter(0));

  marginalCountAxis.selectAll("text")
    .attr('text-anchor', 'end')
    .attr('opacity', 0.5);

  marginalCountAxis.select('text').remove() // hides the first zero so we can double use the one from the proportion chart. Hacky.

  // ----------------------------------------------------------------------
  // Marginal bars.
  // ----------------------------------------------------------------------
  const marginalCountsChart = padded.append('g.marginalCountsChart')
    .translate([countBarWidth,0]);

  const marginalBars = marginalCountsChart.selectAll('.marginalCounts')
    .data(options.marginalData)
    .enter().append('g')
    .translate(d => [matrix_width_scale(d.code), marginalY(d.count)])
    .on('mouseover',function(d){
      d3.select(this).selectAll('.margingMouseoverInfo').attr('opacity', 1);
    })
    .on('mouseout',function(d){
      d3.select(this).selectAll('.margingMouseoverInfo').attr('opacity', 0);
    })

  marginalBars.append('rect')
    .at({
      height: d => marginalY(0) - marginalY(d.count),
      width: matrix_width_scale.bandwidth(),
      fill: 'orangered'
    })

  marginalBars.append('rect')
    .at({
      y: d => -marginalY(d.count)-marginalBottomPadding,
      height: h,
      width: matrix_width_scale.bandwidth(),
      fillOpacity: 0.3,
      fill: highlightColor,
      stroke: 'black',
      rx: 5,
      opacity: 0,
      "class": "margingMouseoverInfo"
    })


  marginalBars.append('text')
    .text(d => countFormat(d.count))
    .at({
      y: 0,
      x: d => -matrix_width_scale(d.code) - 20,
      textAnchor: 'end',
      fontWeight: 'bold',
      opacity: 0,
      "class": "margingMouseoverInfo"
    })

  marginalBars.append('line')
    .text(d => countFormat(d.count))
    .at({
      y1: 0,y2:0,
      x1: d => -matrix_width_scale(d.code) - 20,
      x2: d => -matrix_width_scale(d.code),
      stroke: 'black',
      opacity: 0,
      "class": "margingMouseoverInfo"
    })

  marginalBars.append('text')
    .html(d => `<tspan>Code:</tspan> ${d.code}`)
    .at({
      y: d => -marginalY(d.count) + marginalChartHeight/3,
      x: d => -matrix_width_scale(d.code) - countBarWidth,
      fontSize: 24,
      textAnchor: 'start',
      opacity: 0,
      "class": "margingMouseoverInfo"
    })
}// end of draw_upset() call.


