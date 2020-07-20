
console.log(getComputedStyle(document.documentElement)
	.getPropertyValue('--inactive-txt-color'))

// initialize matrix parameters
const width = 650, height = 650;
const margin = {right: 0, left: 2, top: 2, bottom: 0};
const plot_width = width - margin.left - margin.right;
const plot_height = height - margin.top - margin.bottom;
var timerId = setTimeout(() => {}, 1000);

// initialize scatter plot vars
const scatter_width = 240, scatter_height = 240;
const scatter_margin = {right: 0, left: 40, top: 0, bottom: 40};
const scatter_plot_width = scatter_width - scatter_margin.left - scatter_margin.right;
const scatter_plot_height = scatter_height - scatter_margin.top - scatter_margin.bottom;

console.log('hi')

// initialize page
const init_page_from_dataset = function(dec,matrix_type){

	d3.selectAll('svg').remove();

	// select the parent svg
	var svg = d3.select('#svg-container').append("svg")
			.attr("width", width)
			.attr('id','matrix-svg')
			.attr("height", width)
			.style('float','left')
		.append("g")
			.attr('transform','translate(1,1)')
			.attr('id','matrix-svg-trans')

	// initialize background rectangle
	svg.append('rect')
		.attr('class','background-rect')
		.attr('width',plot_height+2)
		.attr('height',plot_height+2)


	// initialize mouseover details box
	svg.append('g')
		.attr('class','mouseover-textgroup')
		.attr('transform','translate(0,0)')
	d3.select('.mouseover-textgroup').append('rect')
		.attr('class','mouseover-textbox')
	d3.select('.mouseover-textgroup').selectAll('text')
			.data(['','','',''])
			.enter()
		.append('text')
			.attr('class','mouseover-text')
			.attr('text-anchor','start')
			.attr('x','.32em')
			.attr('y',function(d,i){return 1.2 + i + 'em'})
			.attr('pointer-events','none')
			.text('')

	// define axes scales and labels
	var x_labels = dec[matrix_type].fields;
	const n = x_labels.length;
	var corr_data = [];
	d3.range(n).forEach((d,i) => {
		corr_data[i] = d3.range(n).map(j => {
			return {x: i,
				x_label: x_labels[i],
				y: j,
				y_label: x_labels[j],
				z: dec[matrix_type].r[i][j],
				n: dec[matrix_type].n[i][j]}});
	});
	
	const xscale = d3.scaleBand()
		.domain(x_labels)
		.range([0,plot_height])
        .paddingOuter(0)
        
	const scatter_scale = init_scatterplot();
		
	// initalize matrix elements
	renderMatrix(corr_data,xscale,x_labels,dec[matrix_type],scatter_scale);
	svg.selectAll(".column")
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
		

	// parse distilled matrix apriori grp selections
	const distilled_assays = getAssayNames(dec.distilled.fields);
	const unique_distilled_assays = distilled_assays.getUnique();
	const distilled_assay_idx = unique_distilled_assays.map(assay => {
		return d3.range(distilled_assays.length).filter(i => { return distilled_assays[i] === assay })
	});

	// define apriori grp selections
	const apriori_grps = Object.keys(dec.full.apriori);
	var apriori = apriori_grps.map(g => {return dec.full.apriori[g] });
	for(let i=0; i<apriori.length; i++){
		if(!Array.isArray(apriori[i].idx)){
			apriori[i].idx = [apriori[i].idx];
		}
		apriori[i].list_idx = d3.range(apriori[i].idx.length);
		apriori[i].name = apriori_grps[i];
		apriori[i].dist_idx = distilled_assay_idx[i];
		apriori[i].dist_fields = dec.distilled.fields.filter( function(ll,j){
			return distilled_assay_idx[i].some( ii => {return ii === j} )
		});
		apriori[i].loadings = dec.distilled.loadings.filter( function(ll,j){
			return distilled_assay_idx[i].some( ii => {return ii === j} )
		});
		apriori[i].loadings_labels = dec.distilled.loadings_labels.filter( function(ll,j){
			return distilled_assay_idx[i].some( ii => {return ii === j} )
		});
	}
	apriori = apriori.map( i => {
		i.fields = i.fields.map( j => { return j.replace('_',' ') } )
		return i;
	});
	init_qselections('behavior',apriori_grps,apriori);

	console.log(apriori)
	plot_apriori_barplots(apriori,'Activity');

	// set loadings drop-down menu items
	d3.select('#tab-header').selectAll('option').remove();

	d3.select('#tab-header')
		.select('select')
			.attr('name','a priori group')
			.data([apriori])
			.on('change', function(d){ 
				const grp_name = d3.select(this).nodes()[0].value;
				plot_apriori_barplots(d,grp_name);
				update_rect_selections();
				d3.select(this.parentNode).select('h2').nodes()[0].innerHTML = grp_name + ' PCs';
			 })
		.selectAll('option')
			.data(apriori_grps)
			.enter()
		.append('option')
			.each( function(d){ d3.select(this).attr('value',d) })
			.text(function(d){ return d })

		init_colorbar();

}


d3.json("decathlon.json").then(function(dec){


	// initialize dataset selection dropdown menu
	dataset_names = ['inbred-full','outbred-full','inbred-distilled','outbred-distilled'];
	d3.select('#matrix-header').select('select')
		.selectAll('option')
			.data(dataset_names)
			.enter()
		.append('option')
			.attr('value', function(d,i){ return i })
			.text(function(d){ return d })

	d3.select('#matrix-header')
		.select('select')
			.data([dec])
			.on('change', function(d){
				const dataset_idx = parseInt(d3.select(this).nodes()[0].value,10);
				const matrix_type = d3.select(this)
					.selectAll('option')
					.filter(function(t,i){ return i === dataset_idx})
					.nodes()[0].innerHTML.split('-')[1];
				init_page_from_dataset(d[dataset_idx%2],matrix_type);
			});

	// initialize page at start with inbred-full dataset
	init_page_from_dataset(dec[0],'full');

});

d3.select('.mouseover-textbox').raise()
d3.select('#svg-container')
	.on('mouseout',function(d){ d3.select('#hover-rect').style('stroke-opacity',0) })





	


