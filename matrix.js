

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

// callback for mouseover of matrix elements
const hilightRowCol = function(d,scale,labels,obj){

    d3.select(obj).attr('stroke-opacity',0)
            .attr('stroke-width','2px')

	/*
    d3.selectAll(".row-ticklabel")
        .filter(function(dd,ii){ return ii === d.x})
            .attr('fill-opacity',1)

    d3.selectAll(".col-ticklabel")
        .filter(function(dd,ii){ return ii === d.y})
			.attr('fill-opacity',1)
	*/

    d3.select('#hover-rect')
            .attr('x',scale(labels[d.y]))
            .attr('y',scale(labels[d.x]))
            .attr('stroke-opacity',1)

    mouseover_textgroup.raise()

    const tf_text = mouseover_textgroup.attr('transform')
    var re = /(\d+)(\.\d+)?/g;
    const prev_tform = tf_text.match(re);
    mouseover_textgroup.attr('transform',
            `translate(${-parseFloat(prev_tform[0])},${-parseFloat(prev_tform[1])})`);

    timerId = setTimeout(function(){
            update_mouseover_texbox(d,scale(labels[d.y]),scale(labels[d.x])-60) }, 500);
}

// callback for mouseover of matrix elements
const unhilightRowCol = function(d,scale,labels,obj){

    d3.select(obj).attr('stroke-opacity',0);

	/*
    d3.selectAll(".row-ticklabel")
        .filter(function(dd,ii){ return ii === d.x})
        .attr('fill-opacity',0)

    d3.selectAll(".col-ticklabel")
        .filter(function(dd,ii){ return ii === d.y})
		.attr('fill-opacity',0)
	*/

    d3.select('#hover-rect')
        .attr('x',scale(labels[d.y]))
        .attr('y',scale(labels[d.x]))
        .attr('stroke-opacity',0)

    mouseover_textgroup.attr('visibility','hidden')

    clearTimeout(timerId);

}

const matrix_click = function(d,dec_data,scatter_scale){

	d3.selectAll('.scatter-dot').remove()
	d3.selectAll('.scatter-fit').remove()

	var scatter_data = [];
	for(let i=0; i<dec_data[0].full.data[d.x].length; i++){
		let x = dec_data[0].full.data[d.x][i], y = dec_data[0].full.data[d.y][i];
		let in_bounds = x > -3.5 && x < 3.5 && y > -3.5 && y < 3.5;
		if(in_bounds){ scatter_data.push([x,y]) }
	}

	d3.select('.scatter-pts')
		.selectAll('dot')
			.data(scatter_data)
			.enter()
		.append('circle')
			.attr('class','scatter-dot')
			.attr('cx', function(dd){ return scatter_scale(dd[0])})
			.attr('cy', function(dd){ return scatter_scale(-dd[1])})
			.attr('r',2)
			.attr('fill','#000000')

	d3.select('#scatter-xlabel').text(dec_data[0].full.fields[d.x])
	d3.select('#scatter-ylabel').text(dec_data[0].full.fields[d.y])

	const flip_xy = d.x > d.y;
	var row, col;
	if(flip_xy){
		row = d.x + 1, col = d.y + 1;
	} else {
		row = d.y + 1, col = d.x + 1;
	}
	const num_fields = dec_data[0].full.fields.length;
	var ci_idx = 0;
	for(let i=0; i <= col-1; i++){
		if(i < col-1){
			ci_idx = ci_idx + num_fields - i - 1;
		} else {
			ci_idx = ci_idx + row - i - 1;
		}
	}
	console.log(ci_idx)


	d3.json('ci95s.json').then(function(ci_data){
		var fit_x = ci_data.full[ci_idx-1].fit_x, fit_y = ci_data.full[ci_idx-1].fit_y;
		fit_x = fit_x.map(function(a){ return scatter_scale(a) });
		fit_y = fit_y.map(function(a){ return scatter_scale(-a) });

		d3.select('.scatter-pts').append('path')
				.attr('class','scatter-fit')
				.attr('d',`M${fit_x[0]},${fit_y[0]}L${fit_x[1]},${fit_y[1]}`)
				.attr('fill','none')
				.attr('stroke','#000000')

				/*
		const upper_ci = ci_data.full[ci_idx-1].upper.map(function(d,i){ ci_data.full[ci_idx-1].upper[49-i] });
		const lower_ci = ci_data.full[ci_idx-1].lower;
		const xvals = d3.range(50).map(function(d){ scatter_scale(d) });
		var lineGenerator = d3.line();
		var pathString = lineGenerator(data);
		d3.select('path').attr('d', pathString);
		*/

	})
		
}

// render the matrix in svg from data
var renderMatrix = (data,scale,labels,dec_data,scatter_scale) =>{

    var rows = svg.selectAll(".row")
            .data(data)
            .enter()
        .append('g')
            .attr('class','row')
            .attr('transform', function(d,i){return 'translate(0,' + scale(labels[i]) + ')'})
            .each(function(row,i){
                d3.select(this).selectAll('rect')
                    .data(row.map(d => { return d}))
                    .enter()
                .append('rect')
                    .attr('class','matrix-rect')
                    .attr('width',scale.bandwidth(i))
                    .attr('height',scale.bandwidth(i))
                    .attr('x', function(d){ return scale(labels[d.y])})
                    .attr('fill',function(d){return color(d.z)})
                    .attr('stroke-opacity',0)
                    .attr('stroke-width',0)
                    .on('mouseover',function(d){ hilightRowCol(d,scale,labels) })
					.on('mouseout',function(d){ unhilightRowCol(d,scale,labels,this) })
					.on('click', function(d){ matrix_click(d,dec_data,scatter_scale) });
        })

    return rows;
        
};


const label_matrix_rows = function(rows,scale,labels){

    rows.append("text")
        .attr("class","row-ticklabel")
        .attr("x", 6)
        .attr("y", (d,i) => { return scale.bandwidth(i)/2 })
        .attr("dy",".32em")
        .attr("dx", "-1em")
        .attr("text-anchor", "end")
        .attr("fill-opacity",0)
        .text(function(d, i) { return labels[i]; });

}

const label_matrix_columns = function(columns,scale,labels){

    columns.append("text")
        .attr("class","col-ticklabel")
        .attr("y", (d,i) => { return scale.bandwidth(i)/2 })
        .attr("dy",".32em")
        .attr("dx", "-.32em")
        .attr("text-anchor", "end")
        .attr("fill-opacity",0)
        .text(function(d, i) { return labels[i]; })
}

