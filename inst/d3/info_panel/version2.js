// !preview r2d3 data=readr::read_rds(here::here('data/fake_info_data.rds')), container = 'div', dependencies = c("d3-jetpack", here::here('inst/d3/helpers.js')), css = c(here::here('inst/d3/info_panel/version2.css'), here::here('inst/d3/helpers.css'))

const margin = {left: 5, right: 25};
const exome_color = 'steelblue';
const sel_color = 'orangered';
const maf_chart_start = width/3;
const label_gap= 35;
const point_r = 20;
const selection_height = height/2 - (point_r*1.1);
const exome_height =     height/2 + (point_r*1.1);

const lollypop_size = 5;

const {maf_exome, maf_sel, snp, ...loc_info} = data;

// Setup the divs for our viz
div.classed('container', true);

// ================================================================
// Title
// ================================================================
const header = div.append('div.snp_name.header');
header.append('h1').text(data.snp);


// ================================================================
// Allele Frequency Viz
// ================================================================
const maf_viz = div.append('div.maf_viz');
maf_viz.append('div.header')
  .append('h2')
  .text('Minor Allele Frequency');

const svg = maf_viz.append('svg');
const viz_w = +svg.style('width').replace('px', '') ;
const viz_h = +svg.style('height').replace('px', '');

// Decide what the max displayed frequency will be. This is either one or a small padding around the max.
const max_freq = Math.min(1, Math.max(maf_exome, maf_sel)*1.2);
const x_scale = d3.scaleLinear().domain([0,max_freq]).range([margin.left, viz_w - margin.right]);

const line_styles = {
  x1: margin.left,
  stroke: 'black',
  strokeWidth: 2,
};

const frequencies = svg.selectAll('g.frequencies')
  .data([
    {name: 'Entire Cohort',     freq: maf_exome},
    {name: 'Current Selection', freq: maf_sel}
  ])
  .enter().append('g')
  .translate((d,i) => [x_scale(d.freq), (i+1)*(viz_h/3)]);

frequencies
  .append('circle')
  .at({
    r: lollypop_size,
    fill: 'black'
  });

frequencies
  .append('text')
  .at({
    x: lollypop_size*1.2,
    alignmentBaseline: 'middle',
  })
  .text(d => toPercent(d.freq));

frequencies
  .append('text')
  .at({
    x: d => -x_scale(d.freq) + x_scale(0),
    y: -2,
  })
  .text(d => d.name);

frequencies
  .append('line')
  .at({
    x2: d => -x_scale(d.freq)  + x_scale(0),
    stroke: 'black',
    strokeWidth: 2,
  });


// ================================================================
// Location info
// ================================================================
const location = div.append('div.location');

location.append('div.header')
  .append('h2')
  .text('Location');

const loc_table_body = Object.keys(loc_info)
  .reduce((table, key) =>
        table + `<tr>
                  <td style='text-align:right'>${key}</td>
                  <td style='text-align:left; padding-left: 1rem'>${loc_info[key]}</td>
                </tr>`, '');

location.append('table')
  .html(loc_table_body);


//debugger;


