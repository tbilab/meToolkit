// !preview r2d3 data=readr::read_rds(here::here('data/fake_info_data.rds')), options = readr::read_rds(here::here('data/fake_info_options.rds')),  container = 'div', dependencies = c("d3-jetpack", here::here('inst/d3/helpers.js')), css = c(here::here('inst/d3/info_panel/info_panel.css'), here::here('inst/d3/helpers.css'), here::here('inst/css/common.css'))

const margin = {left: 15, right: 25};
const exome_color = 'steelblue';
const sel_color = 'orangered';
const maf_chart_start = width/3;
const label_gap= 35;
const point_r = 20;
const selection_height = height/2 - (point_r*1.1);
const exome_height =     height/2 + (point_r*1.1);


const {maf_exome, maf_sel, snp, annotations} = data;

// Setup the divs for our viz
div.classed('container', true);

// ================================================================
// Main layout of panel
// ================================================================
const header = div.selectAppend('div.snp_name.header');
const maf_viz = div.selectAppend('div.maf_viz');
const location = div.selectAppend('div.location');
const instructions = div.selectAppend('div.instructions');

// ================================================================
// Title
// ================================================================
header.selectAppend('h1')
  .style('border-bottom', `1px solid ${options.colors.med_grey}`)
  .style('width', '100%')
  .text(data.snp);


// ================================================================
// Allele Frequency Viz
// ================================================================
maf_viz.selectAppend('div.header')
  .selectAppend('h2')
  .text('Minor Allele Frequency');

const svg = maf_viz.selectAppend('svg');
const viz_w = +svg.style('width').replace('px', '') ;
const viz_h = +svg.style('height').replace('px', '');

// Decide what the max displayed frequency will be. This is either one or a small padding around the max.
const max_freq = Math.min(1, Math.max(maf_exome, maf_sel)*1.2);
const x_scale = d3.scaleLinear().domain([0,max_freq]).range([margin.left, viz_w - margin.right]);

const draw_lollypop = (maf, name, title, i) => {
  const dist_between_lines = 30;
  const stick_size = 20;
  const lollypop_size = stick_size/2;

  const lollypop_g = svg.selectAppend(`g.${name}`)
    .translate([x_scale(maf), (viz_h/2) + (-1 + 2*i)*dist_between_lines]);

  lollypop_g
    .selectAppend('line')
    .at({
      x2: -x_scale(maf)  + x_scale(0),
      stroke: options.colors.dark_red,
      strokeWidth: stick_size,
    });

  lollypop_g
    .selectAppend('circle')
    .at({
      r: lollypop_size,
      fill: options.colors.dark_red,
    });

  // Percent number
  lollypop_g
    .selectAppend('text.percent')
    .at({
      x: lollypop_size - 5,
      y: 1,
      textAnchor: 'end',
      alignmentBaseline: 'middle',
      dominantBaseline: 'middle',
      fill: 'white',
    })
    .text(toPercent(maf));

  // Bar title
  lollypop_g
    .selectAppend('text.title')
    .at({
      x: -x_scale(maf) + x_scale(0),
      y: -stick_size/2 - 3,
    })
    .text(title);
};

draw_lollypop(maf_exome, 'cohort_freq', 'Entire Cohort', 0);
draw_lollypop(maf_sel, 'selection_freq', 'Current Selection', 1);


// ================================================================
// Location info
// ================================================================
location.selectAppend('div.header')
  .selectAppend('h2')
  .text('Annotations');

const loc_table_body = annotations.key
  .reduce((table, key, i) =>
        table + `<tr>
                  <td style='text-align:right'>${key}</td>
                  <td style='text-align:left; padding-left: 1rem'>${annotations.value[i]}</td>
                </tr>`, '');

location
  .selectAppend('div.table_holder')
  .selectAppend('table')
  .html(loc_table_body);


// ================================================================
// Instruction text
// ================================================================
instructions
  .style('border-top', `1px solid ${options.colors.dark_grey}`)
  .html(options.instructions);


