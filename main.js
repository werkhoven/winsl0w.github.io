
// initialize matrix parameters
const width = 850, height = 850;
const margin = {right: 0, left: 200, top: 0, bottom: 200};
const plot_width = width - margin.left - margin.right;
const plot_height = height - margin.top - margin.bottom;
var timerId = setTimeout(() => {console.log("hello")}, 1000);

// initialize scatter plot vars
const scatter_width = 240, scatter_height = 240;
const scatter_margin = {right: 0, left: 40, top: 0, bottom: 40};
const scatter_plot_width = scatter_width - scatter_margin.left - scatter_margin.right;
const scatter_plot_height = scatter_height - scatter_margin.top - scatter_margin.bottom;

// select the parent svg
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr('class','matrix-svg')
    .attr("height", height)
    .style("margin-left", -margin.left + "px")
    .style('float','left')
  .append("g")
    .attr("transform", "translate(" + (margin.left-1) + "," + (margin.top+1) + ")")

// define matrix color scale
var color = d3.scaleLinear().domain([-1,-.64,-.004,.004,.316,.756,1])
	.range([d3.rgb(0,255,255),d3.rgb(0,51,255),d3.rgb(0,10,50),
		d3.rgb(42,4,0),d3.rgb(255,26,0),d3.rgb(255,230,0),d3.rgb(255,255,255)]);

// initialize background rectangle
svg.append('rect')
		.attr('class','background-rect')
		.attr('width',plot_height)
		.attr('height',plot_height)


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
		.text('HELLO')


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

	// append row labels to rows
	//label_matrix_rows(rows,xscale,x_labels);
	//label_matrix_columns(columns,xscale,x_labels)

	// initialize matrix cursor rectangle
	svg.append("rect")
			.attr('width',xscale.bandwidth(0))
			.attr('height',xscale.bandwidth(0))
			.attr('id','hover-rect')

});


d3.select('.mouseover-textbox').raise()





	


