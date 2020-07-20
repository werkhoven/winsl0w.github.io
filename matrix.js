
//selections
var curr_selection = [];
var curr_quick_selection = '';

// define color and alpha presets
const sel_alpha = 1;
const unsel_alpha = 0.72;
const sel_col = [240,160,0];    // selected text/rect color
const act_col = [240,160,240];  // active text/rect color
const irc = [160,160,240];      // inactive rect color
const itc = [255,255,255];      // inactive text color

console.log('no')

const update_mouseover_texbox = function(d,dx,dy){

	const new_text = [d.x_label, d.y_label, d.z, d.n];
	const mouseover_text = d3.selectAll('.mouseover-text')
	mouseover_text.data(new_text)
		.each(format_mouseover_text)

	var text_widths = [];
	mouseover_text.each(function(d){ text_widths.push(this.getComputedTextLength())})
	const text_width = text_widths.reduce((a,b) => { return Math.max(a,b) }) + 10;

	d3.select('.mouseover-textbox').attr('width',text_width)
	mouseover_text.raise()

	if(dx + text_width > plot_width){
		dx = dx - text_width;
	}
	if(dy - d3.select('.mouseover-textbox').attr('height') < 0){
		dy = dy + d3.select('.mouseover-textbox').attr('height') + 80;
	}

	d3.select('.mouseover-textgroup').attr('visibility','visible')
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
			.attr('stroke-width','2px');

	if(in_selection(curr_selection,d.x,d.y) || curr_selection.length<1){
		d3.select('#hover-rect')
				.attr('x',scale(labels[d.y]))
				.attr('y',scale(labels[d.x]))
				.style('stroke-opacity',1);
	} else {
		d3.select('#hover-rect')
			.style('stroke-opacity',0);
		return;
	}

	d3.select('.mouseover-textgroup').raise()

    const tf_text = d3.select('.mouseover-textgroup').attr('transform')
    var re = /(\d+)(\.\d+)?/g;
    const prev_tform = tf_text.match(re);
    d3.select('.mouseover-textgroup').attr('transform',
            `translate(${-parseFloat(prev_tform[0])},${-parseFloat(prev_tform[1])})`);

    timerId = setTimeout(function(){
            update_mouseover_texbox(d,scale(labels[d.y]),scale(labels[d.x])-60) }, 500);
}

// callback for mouseover of matrix elements
const unhilightRowCol = function(d,scale,labels,obj){

    d3.select(obj).attr('stroke-opacity',0);

    d3.select('#hover-rect')
        .attr('x',scale(labels[d.y]))
        .attr('y',scale(labels[d.x]))

    d3.select('.mouseover-textgroup').attr('visibility','hidden')

    clearTimeout(timerId);

}

const matrix_click = function(d,dec_data,scatter_scale){

	if(!in_selection(curr_selection,d.x,d.y) && curr_selection.length>0){
		return;
	}

	d3.selectAll('.scatter-dot').remove()
	d3.selectAll('.scatter-fit').remove()
	d3.selectAll('.scatter-ci').remove()

	var scatter_data = [];
	for(let i=0; i<dec_data.data.length; i++){
		let x = dec_data.data[i][d.x], y = dec_data.data[i][d.y];
		scatter_data.push([x,y]);
	}

	d3.select('.scatter-axes')
		.selectAll('dot')
			.data(scatter_data)
			.enter()
		.append('circle')
			.attr('class','scatter-dot')
			.attr('cx', function(dd){ return scatter_scale(dd[0])})
			.attr('cy', function(dd){ return scatter_scale(-dd[1])})
			.attr('r',1)

	const flip_xy = d.y > d.x;
	var row, col;
	if(flip_xy){
		row = d.y + 1, col = d.x + 1;
	} else {
		row = d.x + 1, col = d.y + 1;
	}
	const num_fields = dec_data.fields.length;
	var ci_idx = 0;
	for(let i=0; i <= col-1; i++){
		if(i < col-1){
			ci_idx = ci_idx + num_fields - i - 1;
		} else {
			ci_idx = ci_idx + row - i - 1;
		}
	}

	d3.json('ci95s.json').then(function(ci_data){

		// get current dataset index
		var dataset_idx = parseInt(d3.select('#matrix-header').select('select').nodes()[0].value,10);
		const matrix_type = d3.select('#matrix-header').select('select')
					.selectAll('option')
					.filter(function(t,i){ return i === dataset_idx})
					.nodes()[0].innerHTML.split('-')[1];
		dataset_idx = dataset_idx % 2;

		var fit_x, fit_y;
		if(row===col){
			fit_x = [-3.5,3.5];
			fit_y = [-3.5,3.5];
			fit_x = fit_x.map(function(a){ return scatter_scale(a) });
			fit_y = fit_y.map(function(a){ return scatter_scale(-a) });

			d3.select('.scatter-axes').append('path')
					.attr('class','scatter-fit')
					.attr('d',`M${fit_x[0]},${fit_y[0]}L${fit_x[1]},${fit_y[1]}`)
					.attr('fill','none')
					.attr('stroke','#000000')

			return;
		}

		console.log(ci_data[dataset_idx][matrix_type]);
		if(flip_xy){
			fit_x = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_y;
			fit_y = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_x;
		} else {
			fit_x = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_x;
			fit_y = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_y;
		}
		
		fit_x = fit_x.map(function(a){ return scatter_scale(a) });
		fit_y = fit_y.map(function(a){ return scatter_scale(-a) });

		d3.select('.scatter-axes').append('path')
				.attr('class','scatter-fit')
				.attr('d',`M${fit_x[0]},${fit_y[0]}L${fit_x[1]},${fit_y[1]}`)
				.attr('fill','none')
				.attr('stroke','#000000')

		const n = ci_data[dataset_idx][matrix_type][ci_idx-1].upper.length;
		const upper_ci = ci_data[dataset_idx][matrix_type][ci_idx-1].upper;
		const lower_ci = ci_data[dataset_idx][matrix_type][ci_idx-1].lower;
		const xvals = d3.range(n).map(function(d){ return scatter_scale((d/(n-1))*7-3.5) });
		const line_data = [];
		for(let i=0; i<n*2; i++){
			var new_pt = [];
			if(i<n){
				new_pt = [xvals[i],scatter_scale(-lower_ci[i])];
			} else {
				
				new_pt = [xvals[n-i%n-1],scatter_scale(-upper_ci[n-i%n-1])];
			}
			if(flip_xy){
				new_pt = [new_pt[1],new_pt[0]];
			}
			line_data.push(new_pt);
		}

		console.log(upper_ci);
		console.log(lower_ci);

		var lineGenerator = d3.line();
		var pathString = lineGenerator(line_data);
		
		d3.select('.scatter-axes').append('path')
				.attr('d', pathString)
				.attr('class','scatter-ci')
				.attr('stroke','none')
				.attr('fill',d3.rgb(150,150,150))
				.attr('fill-opacity',0.25);

	})

	d3.select('#scatter-xlabel').text(dec_data.fields[d.x])
	d3.select('#scatter-ylabel').text(dec_data.fields[d.y])
		
}

// render the matrix in svg from data
var renderMatrix = (data,scale,labels,dec_data,scatter_scale) =>{

	// define matrix color scale
	var color = d3.scaleLinear().domain([-1,-.64,-.004,.004,.316,.756,1])
		.range([d3.rgb(0,255,255),d3.rgb(0,51,255),d3.rgb(0,10,50),
		d3.rgb(42,4,0),d3.rgb(255,26,0),d3.rgb(255,230,0),d3.rgb(255,255,255)]);

    var rows = d3.select('#matrix-svg-trans').selectAll(".row")
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
                    .on('mouseover',function(d){ hilightRowCol(d,scale,labels) })
					.on('mouseout',function(d){ unhilightRowCol(d,scale,labels,this) })
					.on('click', function(d){ matrix_click(d,dec_data,scatter_scale) });
        })

    return rows;
        
};

const update_rect_selections = function(){

	// update matrix rects
	if(curr_selection.length<1){
		d3.selectAll('.matrix-rect').style('fill-opacity',1);

		// deselected loadings
		d3.selectAll('.y-axis').each(function(){
			d3.select(this).selectAll('text')
				.attr('active',false)
				.style('fill',d3.rgb(itc[0],itc[1],itc[2],unsel_alpha));
			
			d3.select(this.parentNode)
				.select('.loadings-bar-parent')
					.each(function(){ 
						d3.select(this).selectAll('rect')
						.attr('active',false)
						.style('fill',d3.rgb(irc[0],irc[1],irc[2],unsel_alpha));
					})
		});
	} else {
		const unselect_rects = d3.selectAll('.matrix-rect').filter(function(dd){
				return !in_selection(curr_selection,dd.x,dd.y);
		});
		const select_rects = d3.selectAll('.matrix-rect').filter(function(dd){
			return in_selection(curr_selection,dd.x,dd.y);
		});
		select_rects.style('fill-opacity',1);
		unselect_rects.style('fill-opacity',0.25);

		// query names of selected metrics
		var selected_metrics = [];
		select_rects
			.filter(function(dd){
				return dd.x === dd.y;
			})
			.each(function(dd,i){ selected_metrics.push(dd.x_label) });

		// update selected loadings
		d3.selectAll('.y-axis').each(function(){
			var metric_idx = [];
			d3.select(this).selectAll('text').each(function(t,i){
				const curr_metric = d3.select(this).nodes()[0].innerHTML;
				const is_selected = selected_metrics.some(function(m){ return m === curr_metric });
				if(is_selected){
					metric_idx.push(i);
					d3.select(this)
						.attr('active',true)
						.style('fill',d3.rgb(act_col[0],act_col[1],act_col[2],unsel_alpha));
				} else {
					d3.select(this)
						.attr('active',false)
						.style('fill',d3.rgb(itc[0],itc[1],itc[2],unsel_alpha));
				}
			})
			
			d3.select(this.parentNode)
				.select('.loadings-bar-parent')
					.each(function(){ 
						d3.select(this).selectAll('rect').each(function(t,i){
							if(metric_idx.some(function(v){ return v===i })){
								d3.select(this)
									.attr('active',true)
									.style('fill',d3.rgb(act_col[0],act_col[1],act_col[2],unsel_alpha));
							} else {
								d3.select(this)
									.attr('active',false)
									.style('fill',d3.rgb(irc[0],irc[1],irc[2],unsel_alpha));
							}
						})
					})
		})
	}
}

const qselection_mouseover = function(){
	if(d3.select(this).attr('class')==='selected'){
		return;
	}
	d3.select(this).attr('class','active');
	d3.select('#hover-rect').style('stroke-opacity',0);
}

const qselection_mouseout = function(){
	if(d3.select(this).attr('class')==='selected'){
		return;
	}
		d3.select(this).attr('class','inactive')
}

const qselection_click = function(d){

	// adjust current selection triangle indicator
	d3.selectAll('#qselection-arrow').remove()
	d3.select(this.parentNode)
		.append('div')
			.attr('id','qselection-arrow')
			.attr('class','on')
			.style('top',this.offsetTop+'px')
			.style('right','0px');

	// reset all other button appearance
	d3.select('#qselections').selectAll('div')
		.filter(function(){ return d3.select(this).attr('class')==='selected'; })
			.attr('data-status','off')
			.attr('class','inactive')

	// change button appearance	
	d3.select(this)
		.attr('data-status','on')
		.attr('class','selected');
	
	//define the current selection and initialize metric selection divs
	const metric_selections = d.idx.map((v,i) => { return {field: d.fields[i], idx: v, list_idx: d.list_idx[i]} });
	curr_quick_selection = this.innerText;
	init_metric_selections(metric_selections);
}

var prev_metric_selection;
var prev_selected_element;
var selection_idx = [];

const init_qselections = function(selection,names,selection_idx){

	d3.select('#' + selection + '-selection-div').selectAll('div')
		.filter(function(){ return d3.select(this).attr('id')!=='qselection-arrow'; })
			.data(selection_idx)
			.enter()
		.append('div')
			.attr('class','inactive')
			.attr('data-status','off')
			.on('mouseover',qselection_mouseover)
			.on('mouseout',qselection_mouseout)
			.on('click',qselection_click)
			.text(function(d,i){ return names[i]; })	

}

// define metric selection callbacks
const metric_selection_click = function(d){

	var new_selection_idx;
	if(d3.event.shiftKey && !(prev_metric_selection==null)){
		if(prev_metric_selection < d.list_idx){
			new_selection_idx = d3.range(prev_metric_selection,d.list_idx+1,1);
		} else {
			new_selection_idx = d3.range(d.list_idx,prev_metric_selection+1,1);
		}	
	} else {
		new_selection_idx = [d.list_idx];
		prev_metric_selection = d.list_idx;
		selection_idx = new_selection_idx;
	}

	// remove items from selection that are no longer in current selection
	const trim_idx = selection_idx.filter(v => { 
		return !new_selection_idx.some(vv => vv === v); 
	});
	selection_idx = new_selection_idx;
	const trim_divs = d3.select(this.parentNode)
		.selectAll('div')
			.filter(function(dd){ 
				return trim_idx.some(v => v === dd.list_idx) 
			})


	if(prev_selected_element){
		prev_selected_element.style('border','1px solid transparent');
	}
	
	prev_selected_element = d3.select(this.parentNode)
		.selectAll('div')
			.filter(function(dd){ 
				return dd.list_idx === prev_metric_selection;
			})
			.style('border','1px dashed rgb(150,150,150)')

	var selection_status = prev_selected_element.attr('data-status');
	if(d3.event.shiftKey){
		switch(selection_status){
			case 'on':
				selection_status = 'off';
				break;
			case 'off':
				selection_status = 'on';
				break;
		}
	}

	// define selection elements
	const selection_divs = d3.select(this.parentNode)
		.selectAll('div')
			.filter(function(dd){ 
				return selection_idx.some(v => v === dd.list_idx) 
			})
	var metric_idx = selection_divs.data();
	metric_idx = metric_idx.map(i => { return i.idx-1 });

	if(selection_status==='off'){
		metric_idx.forEach(i => curr_selection.push(i));
	} else {
		curr_selection = curr_selection.filter((v) => { return !metric_idx.some(vv => vv===v) });
	}

	// update matrix rects with new selection
	update_rect_selections();
	
	// update metric selection div appearance
	if(selection_status==='off'){
		selection_divs
			.attr('data-status','on')
			.attr('class','active');
		trim_divs
			.attr('data-status','off')
			.attr('class','inactive');
	} else {
		selection_divs
			.attr('data-status','off')
			.attr('class','inactive');
		trim_divs
			.attr('data-status','on')
			.attr('class','active');
	}
}

const init_metric_selections = function(metric_selections){

	// remove old divs
	d3.select('#metric-selections').selectAll('div').remove()
	prev_metric_selection = null;

	// initialize new divs
	d3.select('#metric-selections').selectAll('div')
			.data(metric_selections)
			.enter()
		.append('div')
			.attr('class',function(d){
				return curr_selection.some(v => v===d.idx-1) ? 'active' : 'inactive';
			})
			.attr('data-status',function(d){
				return curr_selection.some(v => v===d.idx-1) ? 'on' : 'off';
			})
			.on('click',metric_selection_click)
			.text(function(d,i){ return d.field; });	

}

// toggle all metrics in selection ON
const metric_toggle_all = function(){

	// change button appearance to unpressed
	d3.select(this).attr('class','active');

	const curr_qselect = d3.select('#qselections')
		.selectAll('div')
		.filter(function(){ return this.innerText === curr_quick_selection});

	if(this.innerText === 'Select All'){
		curr_qselect.each(function(dd){ dd.idx.forEach(v => curr_selection.push(v-1)) });
	} else {
		curr_qselect.each(function(dd){
			curr_selection = curr_selection.filter((v) => { return !dd.idx.some(vv => v===vv-1) });
		})
	}

	//define the current selection and initialize metric selection divs
	curr_qselect.each(function(dd){
		const metric_selections = dd.idx.map((v,i) => {
			return {field: dd.fields[i], idx: v, list_idx: dd.list_idx[i]};
		});
		curr_quick_selection = this.innerText;
		init_metric_selections(metric_selections);
	});
	update_rect_selections();
}


// ititialize colorbar
const init_colorbar = function(){

	    // define matrix color scale
		const caxis_domain = [-1,-.64,-.004,.004,.316,.756,1];
		const min = caxis_domain.reduce((a,b) => { return Math.min(a,b) });
		var caxis_pct = caxis_domain.map( v => v + (0-min));
		const max = caxis_pct.reduce((a,b) => { return Math.max(a,b) });
		caxis_pct = caxis_pct.map( v => v / max * 100);
		console.log(caxis_pct)
		const caxis_colors = [
				d3.rgb(0,255,255),
				d3.rgb(0,51,255),
				d3.rgb(0,10,50),
				d3.rgb(42,4,0),
				d3.rgb(255,26,0),
				d3.rgb(255,230,0),
				d3.rgb(255,255,255)];
		var color = d3.scaleLinear()
			.domain(caxis_domain)
			.range(caxis_colors);
			
		var w = 70, h = 140;
		const w_pad = w - 20;
	
		var key = d3.select("#colorbar")
		  .append("svg")
		  .attr("width", w)
		  .attr("height", h + 20)
		  .attr('class','axis');
	
		var legend = key.append("defs")
		  .append("svg:linearGradient")
		  .attr("id", "gradient")
		  .attr("x1", "100%")
		  .attr("y1", "0%")
		  .attr("x2", "100%")
		  .attr("y2", "100%")
		  .attr("spreadMethod", "pad");
	
		legend.selectAll('stop')
				.data(caxis_pct)
				.enter()
			.append('stop')
				.attr('offset', function(d){ return d + '%' })
				.attr('stop-color', function(d,i){ return caxis_colors[i] })
				.attr('stop-opacity',1);
	
		key.append("rect")
		  .attr("width", w - w_pad)
		  .attr("height", h)
		  .attr('stroke','#000000')
		  .style("fill", "url(#gradient)")
		  .attr("transform", "translate(0,10)");
	
		var y = d3.scaleLinear()
		  .range([h, 0])
		  .domain([1, -1]);
	
		var yAxis = d3.axisRight()
		  .scale(y)
		  .ticks(5);
	
		key.append("g")
		  .attr("class", "y-axis")
		  .attr("transform", `translate(${w-w_pad},10)`)
		  .call(yAxis)
	
		key.append('text')
			.text('correlation coefficient')
			.attr('text-anchor','middle')
			.attr('transform',`translate(${w},${(h+20)/2}) rotate(-90)`)
			.style('font-size','14px')

}

// apply metric toggling to metric selection buttons
d3.select('#metric-select-buttons').selectAll('div')
	.on('mouseup',metric_toggle_all)
	.on('mousedown',function(){ d3.select(this).attr('class','selected') })
	.on('mouseover',function(){ d3.select(this).attr('class','active') })
	.on('mouseout',function(){ d3.select(this).attr('class','inactive') })