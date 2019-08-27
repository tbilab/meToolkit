// !preview r2d3 data=readr::read_rds(here::here('data/fake_info_data.rds')), container = 'div', dependencies = c("d3-jetpack", here::here('inst/d3/helpers.js'))

// Info banner for SNP name, MAF for current selection and the entire cohort. Along with link to click for genome browser location of SNP.

const snp_info_style = {
  fontWeight: 'bold',
};



const padding = 15;
const exome_color = 'steelblue';
const sel_color = 'orangered';
const maf_chart_start = width/3;
const label_gap= 35;
const point_r = 20;
const selection_height = height/2 - (point_r*1.1);
const exome_height =     height/2 + (point_r*1.1);
const max_freq = Math.min(1, Math.max(maf_exome, maf_sel)*1.1);

// turns proportion into a rounded percentange
const toPercent = d3.format(".1%");

// clear any old stuff left from previous visualization.
svg.html('');

// draw the snp name in the upper left corner
svg.append('text')
  .text(snp)
  //.attr('class', 'snp_name')
  .st({
    alignmentBaseline: 'hanging',
    textAnchor: 'start',
    fontWeight: 'bold',
    fontSize: '30px',
  })
  .attr('x', 10)
  .attr('y', 10);

const snp_details = svg.append('g').attr('id', 'snp_details').st({fontSize: '18px'});

snp_details.append('text')
  .html(`Gene: `)
  .attr('x', 10)
  .attr('y', height - 50)
  .append('tspan')
    .text(gene)
    .st(snp_info_style);

snp_details.append('text')
  .html(`Chromosome: `)
  .attr('x', 10)
  .attr('y', height - 30)
  .append('tspan')
    .text(chromosome)
    .st(snp_info_style);

snp_details.append('text')
  .html(`Genome Browser Link`)
  .attr('class', 'genome_browser_link')
  .st({
    textDecoration: 'underline',
    cursor: 'pointer',
  })
  .attr('x', 10)
  .attr('y', height - 10)
  .on('click', () => {

    const db = 'hg19';
    const link = `http://genome.ucsc.edu/cgi-bin/hgTracks?org=human&db=${db}&position=ch${chromosome}:${snp}`;

    window.open(link, '_blank');
  });

// MAF scale
const x = d3.scaleLinear()
  .domain([0,max_freq])
  .range([maf_chart_start, width - padding*1.5]);

svg.append("g")
  .attr("transform", `translate(0,${exome_height})`)
  .call( d3.axisBottom(x)
    .tickValues([0, max_freq])
    .tickFormat(toPercent)
    .tickSizeOuter(0)
  );

// add label for MAF
svg.append("text")
  .attr('id', 'maf_axis_label')
  .st({
    textAnchor: 'middle',
    fontSize: '14px',
    fill: '#5c5b5b',
  })
  .attr("transform", `translate(${maf_chart_start + (width - maf_chart_start)/2},${exome_height + 35})`)
  .text("Minor Allele Frequency (MAF)");


svg.append('line')
  .attr('x1', x(0))
  .attr('x2', x(max_freq))
  .attr('y1', selection_height)
  .attr('y2', selection_height)
  .attr('stroke', 'black')
  .attr('stroke-width', 1);


const maf_plot = svg.selectAll('#maf_plot')
  .data([ {group: 'Entire Cohort', maf: maf_exome},
          {group: 'Current Selection', maf: maf_sel} ])
  .enter().append('g')
  .attr('transform', d => `translate(${x(d.maf)}, ${d.group == 'Entire Cohort' ? exome_height: selection_height} )`);


// group label text
maf_plot.append('text')
  .text(d => d.group)
  .attr('class', 'labels')
  .st({
    textAnchor: 'end',
    fontSize: '20px',
  })
  .attr('y', -3)
  .attr('x', -(point_r + 3));

// points on axis for groups
maf_plot.append('circle')
  .attr('r', point_r)
  .attr('fill', d => d.group == 'Entire Cohort' ? exome_color: sel_color);

maf_plot.append('text')
  .text(d => toPercent(d.maf).replace('%',''))
  .st({
    fill: 'white',
    alignmentBaseline: 'middle',
    textAnchor: 'middle',
    fontSize: '16px',
  })
  .attr('class', 'maf_points');
