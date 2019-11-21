
// initialize matrix parameters
const width = 650, height = 650;
const margin = {right: 0, left: 2, top: 2, bottom: 0};
const plot_width = width - margin.left - margin.right;
const plot_height = height - margin.top - margin.bottom;
var timerId = setTimeout(() => {console.log("hello")}, 1000);

// initialize scatter plot vars
const scatter_width = 240, scatter_height = 240;
const scatter_margin = {right: 0, left: 40, top: 0, bottom: 40};
const scatter_plot_width = scatter_width - scatter_margin.left - scatter_margin.right;
const scatter_plot_height = scatter_height - scatter_margin.top - scatter_margin.bottom;

// select the parent svg
var svg = d3.select('#svg-container').append("svg")
			.attr("width", width)
			.attr('class','matrix-svg')
			.attr("height", width)
			.style('float','left')
		.append("g")
			.attr('transform','translate(1,1)')

// define matrix color scale
var color = d3.scaleLinear().domain([-1,-.64,-.004,.004,.316,.756,1])
	.range([d3.rgb(0,255,255),d3.rgb(0,51,255),d3.rgb(0,10,50),
		d3.rgb(42,4,0),d3.rgb(255,26,0),d3.rgb(255,230,0),d3.rgb(255,255,255)]);

// initialize background rectangle
svg.append('rect')
		.attr('class','background-rect')
		.attr('width',plot_height+2)
		.attr('height',plot_height+2)


// initialize mouseover details box
const mouseover_textgroup = svg.append('g')
		.attr('class','mouseover-textgroup')
		.attr('transform','translate(0,0)')
const mouseover_textbox = mouseover_textgroup.append('rect')
		.attr('class','mouseover-textbox')
const mouseover_text = mouseover_textgroup.selectAll('text')
		.data(['','','',''])
		.enter()
	.append('text')
		.attr('class','mouseover-text')
		.attr('text-anchor','start')
		.attr('x','.32em')
		.attr('y',function(d,i){return 1.2 + i + 'em'})
		.attr('pointer-events','none')
		.text('')


d3.json("decathlon.json").then(function(dec){

	// define axes scales and labels
	var x_labels = dec[0].full.fields;
	const n = x_labels.length;
	var corr_data = [];
	d3.range(n).forEach((d,i) => {
		corr_data[i] = d3.range(n).map(j => {
			return {x: i,
				x_label: x_labels[i],
				y: j,
				y_label: x_labels[j],
				z: dec[0].full.r[i][j]}});
	});
	
	const xscale = d3.scaleBand()
		.domain(x_labels)
		.range([0,plot_height])
        .paddingOuter(0)
        
    const scatter_scale = init_scatterplot();
    
		
	// initalize matrix elements
	var rows = renderMatrix(corr_data,xscale,x_labels,dec,scatter_scale);
	var columns = svg.selectAll(".column")
        .data(corr_data)
				.enter()
		.append("g")
			.attr("class", "column")
			.attr("transform", function(d, i) {
							return `translate(${xscale(x_labels[i])},${plot_height})rotate(-90)`; 
					});

	// initialize matrix cursor rectangle
	svg.append("rect")
			.attr('width',xscale.bandwidth(0))
			.attr('height',xscale.bandwidth(0))
			.attr('id','hover-rect')

	//define assay selections
	const assays = getAssayNames(x_labels);
	const unique_assays = assays.getUnique();
	const assay_idx = unique_assays.map(assay => {
		return d3.range(n).filter(i => { return assays[i] === assay })
	});
	var assay_data = assay_idx.map(i => { 
		return {idx: i.map(ii => { return ii+1; }), 
						fields: i.map(ii => { return x_labels[ii] }),
						list_idx: d3.range(i.length)} 
	});
	init_qselections('assay',unique_assays,assay_data);
		
	// define apriori grp selections
	const apriori_grps = Object.keys(dec[0].full.apriori);
	console.log(apriori_grps)
	var apriori = apriori_grps.map(g => {return dec[0].full.apriori[g] });
	for(let i=0; i<apriori.length; i++){
		if(!Array.isArray(apriori[i].idx)){
			apriori[i].idx = [apriori[i].idx];
			console.log('not array')
		}
		apriori[i].list_idx = d3.range(apriori[i].idx.length);
	}
	init_qselections('behavior',apriori_grps,apriori);

});


d3.select('.mouseover-textbox').raise()
d3.select('#svg-container')
	.on('mouseout',function(d){ d3.select('#hover-rect').style('stroke-opacity',0) })





	


