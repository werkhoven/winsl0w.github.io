
const init_scatterplot = function(){

	// select the parent svg
	var scatter_svg = d3.select("#matrix-div").append("svg")
		.attr('class','scatter-plot')
		.attr("width", scatter_width)
		.attr("height", scatter_height)
		.style("margin-left", -scatter_margin.left + "px")
		.style("float",'right')
	.append("g")
		.attr('class','scatter-grp')
		.attr("transform", "translate(" + scatter_margin.left + "," + scatter_margin.top + ")")


	// initialize the scatter data points
	var scatter_data = new Array(100).fill().map((a,i) => { 
			return new Array(2).fill(NaN,0,1);
	})

	// initialize scale
	var scatter_scale = d3.scaleLinear()
		.domain([-3.5,3.5])
		.range([0,scatter_plot_width])

	var scatter_y_scale = d3.scaleLinear()
		.domain([-3.5,3.5])
		.range([scatter_plot_width,0])

	// initialize axes
	d3.select('.scatter-grp')
		.append('g')
			.call(d3.axisLeft(scatter_y_scale).ticks(5).tickSize(0))
	d3.select('.scatter-grp')
		.append('g')
			.attr('transform','translate(0,' + scatter_plot_height + ')')
			.call(d3.axisBottom(scatter_scale).ticks(5).tickSize(0))
	d3.select('.scatter-grp')
		.append('path')
			.attr('d',
				`M0,0
				H${scatter_plot_width}
				V${scatter_plot_height}
				H0
				V0`)
			.attr('stroke-width',1)
			.attr('stroke','#000000')
			.attr('fill',d3.rgb(25,25,25))

	// append axis labels
	d3.select('.scatter-grp')
		.append('text')
			.attr('text-anchor','middle')
			.attr('x',scatter_scale(0))
			.attr('y',scatter_plot_height+30)
			.attr('id','scatter-xlabel')
			.text('feature x')
			.style('font-size','12px')

	d3.select('.scatter-grp')
		.append('text')
			.attr('transform','rotate(-90)')
			.attr('text-anchor','middle')
			.attr('id','scatter-ylabel')
			.attr('y',-25)
			.attr('x',-scatter_scale(0))
			.text('feature y')
			.style('font-size','12px')

	d3.select('.scatter-grp')
		.append('svg')
			.attr('class','scatter-axes')
			.attr('width',200)
			.attr('height',200)

	d3.select('.scatter-axes')
			.selectAll('circle')
			.data(scatter_data)
			.enter()
		.append('circle')
			.attr('class','scatter-dot')
			.attr('cx', function(d){ return scatter_scale(d[0])})
			.attr('cy', function(d){ return scatter_scale(d[1])})
			.attr('r',1)

	return scatter_scale;

}