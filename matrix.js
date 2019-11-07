

const width = 850, height = 850;
const margin = {right: 0, left: 200, top: 0, bottom: 200};
const plot_width = width - margin.left - margin.right;
const plot_height = height - margin.top - margin.bottom;
var timerId = setTimeout(() => {console.log("hello")}, 1000);

// select the parent svg
var svg = d3.select("body").append("svg")
    .attr("width", width)
		.attr("height", height)
		.style("margin-left", -margin.left + "px")
		.style("float",'left')
  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

/*
var color = d3.scaleLinear().domain([0,.18,.498,.502,.658,.878,1])
	.range([d3.rgb(0,255,255),d3.rgb(0,51,255),d3.rgb(0,10,50),
		d3.rgb(42,4,0),d3.rgb(255,26,0),d3.rgb(255,230,0),d3.rgb(255,255,255)]);
*/

var color = d3.scaleLinear().domain([-1,-.64,-.004,.004,.316,.756,1])
	.range([d3.rgb(0,255,255),d3.rgb(0,51,255),d3.rgb(0,10,50),
		d3.rgb(42,4,0),d3.rgb(255,26,0),d3.rgb(255,230,0),d3.rgb(255,255,255)]);

// initialize background rectangle
svg.append('rect')
		.attr('class','background-rect')
		.attr('width',plot_height)
		.attr('height',plot_height)
		.attr('fill-opacity',1)
		.attr('stroke',"none")
		.attr("fill",d3.rgb(0,0,0));

// initialize mouseover details box
const mouseover_textgroup = svg.append('g')
		.attr('class','mouseover-textgroup')
		.attr('transform','translate(0,0)')
const mouseover_textbox = mouseover_textgroup.append('rect')
		.attr('class','mouseover-textbox')

const	mouseover_text =	mouseover_textgroup.selectAll('text')
		.data(['','','',''])
		.enter()
	.append('text')
		.attr('class','mouseover-text')
		.attr('text-anchor','start')
		.attr('x','.32em')
		.attr('y',function(d,i){return 1.2 + i + 'em'})
		.attr('pointer-events','none')
		.text('HELLO')

const update_mouseover_texbox = function(d,dx,dy){

	const new_text = [d.x_label, d.y_label, d.z, 100];
	mouseover_text.data(new_text)
		.each(format_mouseover_text)

	var text_widths = [];
	mouseover_text.each(function(d){ text_widths.push(this.getComputedTextLength())})
	const text_width = text_widths.reduce((a,b) => { return Math.max(a,b) }) + 10;

	mouseover_textbox.attr('width',text_width)
	mouseover_text.raise()

	if(dx + text_width > plot_width){
		dx = dx - text_width;
	}
	if(dy - mouseover_textbox.attr('height') < 0){
		dy = dy + mouseover_textbox.attr('height') + 80;
	}

	mouseover_textgroup.attr('visibility','visible')
		.attr('transform',`translate(${dx},${dy})`)
}

const format_mouseover_text = function(d,i){
	switch(i){
		case 0:
			d3.select(this).text(`Row: ${d}`);
			break;
		case 1:
			d3.select(this).text(`Col: ${d}`);
			break;
		case 2:
			d3.select(this).text(`r = ${d.toFixed(3)}`);
			break;
		case 3:
			d3.select(this).text(`n = ${d}`);
			break;
	}
};



d3.json("decathlon.json").then(function(dec){

	// define axes scales and labels
	var x_labels = dec[0].full.fields;
	const n = x_labels.length;
	var mydata = [];
	d3.range(n).forEach((d,i) => {
		mydata[i] = d3.range(n).map(j => {
			return {x: i,
				x_label: x_labels[i],
				y: j,
				y_label: x_labels[j],
				z: dec[0].full.r[i][j]}});
	});
	
	const xscale = d3.scaleBand()
		.domain(x_labels)
		.range([0,plot_height])

	xscale.paddingOuter(0)

	// callback for mouseover of matrix elements
	const hilightRowCol = function(d){

		d3.select(this).attr('stroke-opacity',0)
				.attr('stroke-width','2px')

		d3.selectAll(".row-ticklabel")
			.filter(function(dd,ii){ return ii === d.x})
				.attr('fill-opacity',1)

		d3.selectAll(".col-ticklabel")
			.filter(function(dd,ii){ return ii === d.y})
				.attr('fill-opacity',1)

		d3.select('#hoverRect')
				.attr('x',xscale(x_labels[d.y]))
				.attr('y',xscale(x_labels[d.x]))
				.attr('stroke-opacity',1)

		mouseover_textgroup.raise()

		const tf_text = mouseover_textgroup.attr('transform')
		var re = /(\d+)(\.\d+)?/g;
		const prev_tform = tf_text.match(re);
		mouseover_textgroup.attr('transform',
				`translate(${-parseFloat(prev_tform[0])},${-parseFloat(prev_tform[1])})`);

		timerId = setTimeout(function(){
				update_mouseover_texbox(d,xscale(x_labels[d.y]),xscale(x_labels[d.x])-60) }, 500);
	}

	// callback for mouseover of matrix elements
	const unhilightRowCol = function(d){

		d3.select(this).attr('stroke-opacity',0);

		d3.selectAll(".row-ticklabel")
			.filter(function(dd,ii){ return ii === d.x})
			.attr('fill-opacity',0)

		d3.selectAll(".col-ticklabel")
			.filter(function(dd,ii){ return ii === d.y})
			.attr('fill-opacity',0)

		d3.select('#hoverRect')
			.attr('x',xscale(x_labels[d.y]))
			.attr('y',xscale(x_labels[d.x]))
			.attr('stroke-opacity',0)

		mouseover_textgroup.attr('visibility','hidden')

		clearTimeout(timerId);

	}

	// render the matrix in svg from data
	var renderMatrix = (data) =>{

		var rows = svg.selectAll(".row")
				.data(data)
				.enter()
			.append('g')
				.attr('class','row')
				.attr('transform', function(d,i){return 'translate(0,' + xscale(x_labels[i]) + ')'})
				.each(function(row,i){
					d3.select(this).selectAll('rect')
						.data(row.map(d => { return d}))
						.enter()
					.append('rect')
						.attr('width',xscale.bandwidth(i))
						.attr('height',xscale.bandwidth(i))
						.attr('x', function(d){ return xscale(x_labels[d.y])})
						.attr('fill',function(d){return color(d.z)})
						.attr('stroke-opacity',0)
						.attr('stroke-width',0)
						.on('mouseover',hilightRowCol)
						.on('mouseout',unhilightRowCol)
			})

		return rows;
			
	};
	
	// initalize column elements with xlabels
	var columns = svg.selectAll(".column")
		.data(mydata)
		.enter().append("g")
		.attr("class", "column")
		.attr("transform", function(d, i) {
				return `translate(${xscale(x_labels[i])},${plot_height})rotate(-90)`; 
			});

	columns.append("text")
		.attr("class","col-ticklabel")
		.attr("y", (d,i) => { return xscale.bandwidth(i)/2 })
		.attr("dy",".32em")
		.attr("dx", "-.32em")
		.attr("text-anchor", "end")
		.attr("fill-opacity",0)
		.text(function(d, i) { return x_labels[i]; })
		
	// initalize matrix elements
	var rows = renderMatrix(mydata);

	// append row labels to rows
	rows.append("text")
		.attr("class","row-ticklabel")
		.attr("x", 6)
		.attr("y", (d,i) => { return xscale.bandwidth(i)/2 })
		.attr("dy",".32em")
		.attr("dx", "-1em")
		.attr("text-anchor", "end")
		.attr("fill-opacity",0)
		.text(function(d, i) { return x_labels[i]; });


	svg.append("rect")
		.attr('width',xscale.bandwidth(0))
		.attr('height',xscale.bandwidth(0))
		.attr('class','hover-rect')
		.attr('id','hoverRect')
		.attr('fill-opacity',0)
		.attr('stroke',d3.rgb(0,255,0))
		.attr('stroke-opacity',1)
		.attr('stroke-width',1.5)
		.attr('pointer-events','none')
});


d3.select('.mouseover-textbox').raise()
	


