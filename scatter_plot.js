const scatter_width = 240, scatter_height = 240;
const scatter_margin = {right: 0, left: 40, top: 0, bottom: 40};
const scatter_plot_width = scatter_width - scatter_margin.left - scatter_margin.right;
const scatter_plot_height = scatter_height - scatter_margin.top - scatter_margin.bottom;



d3.json("decathlon.json").then(function(dec){

	// select the parent svg
	var scatter_svg = d3.select("body").append("svg")
			.attr('class','scatter-plot')
			.attr("width", scatter_width)
			.attr("height", scatter_height)
			.style("margin-left", -scatter_margin.left + "px")
			.style("float",'right')
		.append("g")
					.attr('class','scatter-pts')
					.attr("transform", "translate(" + scatter_margin.left + "," + scatter_margin.top + ")")
					
	scatter_svg.append('rect')
			.attr('width',scatter_plot_width)
			.attr('height',scatter_plot_height)
			.attr('fill',d3.rgb(252,252,252))


	// initialize the scatter data points
	/*
	var scatter_data = new Array(100).fill().map((a,i) => { 
			return new Array(2).fill().map((b,j) => { return Math.random()*6 - 3 });
	})
	*/
	var scatter_data = new Array(100).fill().map((a,i) => { 
		return new Array(2).fill(NaN,0,1);
	})

	// initialize axes
	var scatter_scale = d3.scaleLinear()
			.domain([-3.5,3.5])
			.range([0,scatter_plot_width])
	d3.select('.scatter-pts')
		.append('g')
			.call(d3.axisLeft(scatter_scale).ticks(5).tickSize(0))
	d3.select('.scatter-pts')
		.append('g')
			.attr('transform','translate(0,' + scatter_plot_height + ')')
			.call(d3.axisBottom(scatter_scale).ticks(5).tickSize(0))
	d3.select('.scatter-pts')
		.append('path')
			.attr('d',`M0,0H${scatter_plot_width}V${scatter_plot_height}`)
			.attr('stroke-width',1)
			.attr('stroke','#000000')
			.attr('fill','none')

	// append axis labels
	d3.select('.scatter-pts')
		.append('text')
			.attr('text-anchor','middle')
			.attr('x',scatter_scale(0))
			.attr('y',scatter_plot_height+30)
			.text('feature x')
			.style('font-size','14px')

	d3.select('.scatter-pts')
			.append('text')
				.attr('transform','rotate(-90)')
				.attr('text-anchor','middle')
				.attr('y',-25)
				.attr('x',-scatter_scale(0))
				.text('feature y')
				.style('font-size','14px')

	d3.select('.scatter-pts')
			.selectAll('dot')
			.data(scatter_data)
			.enter()
		.append('circle')
			.attr('class','scatter-dot')
			.attr('cx', function(d){ return scatter_scale(d[0])})
			.attr('cy', function(d){ return scatter_scale(d[1])})
			.attr('r',2)
			.style('fill','none')

	
});

