
//selections
var curr_selection = {
	full: [],
	distilled: []
};
var curr_quick_selection = '';
var selected_metric_labels = [];
var drag_start = [];
var drag_stop = [];
var is_dragging = false;

// define color and alpha presets
const sel_alpha = 1;
const unsel_alpha = 0.72;
const sel_col = [240,160,0];    // selected text/rect color
const act_col = [240,160,240];  // active text/rect color
const irc = [160,160,240];      // inactive rect color
const itc = [255,255,255];      // inactive text color


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

	var hov_rect = d3.select('#hover-rect')
	var matrix_type = get_matrix_type();

	var curr_coords = [d.y,d.x];
	if(!drag_start.every(function(v,i){ return v === curr_coords[i] }) 
			& !drag_start.some(function(v){ return v === null })){
		is_dragging = true;
	}

	if(is_dragging){
			hov_rect
				.style('stroke-opacity',1)
				.attr('x',scale(labels[Math.min(drag_start[0],d.y)]))
				.attr('y',scale(labels[Math.min(drag_start[1],d.x)]))
				.attr('width',scale(labels[Math.abs(drag_start[0] - d.y)+1]))
				.attr('height',scale(labels[Math.abs(drag_start[1] - d.x)+1]))

			if(d3.event.ctrlKey){
				hov_rect.style('stroke','rgb(255,0,0)')
			} else {
				hov_rect.style('stroke','rgb(0,255,0)')
			}

	} else if(in_selection(curr_selection[matrix_type],d.x,d.y) || curr_selection[matrix_type].length<1){
		hov_rect
			.attr('width',scale(labels[1]))
			.attr('height',scale(labels[1]))
			.attr('x',scale(labels[d.y]))
			.attr('y',scale(labels[d.x]))
			.style('stroke-opacity',1)
			.style('stroke','rgb(0,255,0)');
	} else {
		hov_rect
			.attr('width',scale(labels[1]))
			.attr('height',scale(labels[1]))
			.attr('x',scale(labels[d.y]))
			.attr('y',scale(labels[d.x]))
			.style('stroke-opacity',0.7)
			.style('stroke','rgb(200,200,255)');
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

		if(!is_dragging){
			d3.select('#hover-rect')
        .attr('x',scale(labels[d.y]))
        .attr('y',scale(labels[d.x]))
		}
    

    d3.select('.mouseover-textgroup').attr('visibility','hidden')

    clearTimeout(timerId);

}

const matrix_mousedown = function(d){
	drag_start = [d.y,d.x];
	is_dragging = false;

	
	if(d3.event.ctrlKey){
		d3.select('#hover-rect')
			.style('stroke','rgb(255,0,0)')
	}
}

const matrix_mouseup= function(rect,d,scale,labels){

	drag_stop = [d.y,d.x];
	if(drag_start.every(function(v,i){ return v === drag_stop[i] }) & !is_dragging){
		drag_start = [null,null];
		is_dragging = false;
		return;
	}
	is_dragging = false;

	// get metric indices in selection range
	var xrange = [Math.min(drag_start[0],drag_stop[0]),Math.max(drag_start[0],drag_stop[0])];
	var yrange = [Math.min(drag_start[1],drag_stop[1]),Math.max(drag_start[1],drag_stop[1])];
	xrange = d3.range(xrange[0],xrange[1]+1);
	yrange = d3.range(yrange[0],yrange[1]+1);

	yrange.forEach( i => { xrange.push(i) });
	xrange = xrange.getUnique();

	var matrix_type = get_matrix_type();

	// remove metrics in selection if shiftkey pressed
	if(d3.event.ctrlKey){
		for(let i=0; i<xrange.length; i++){
			if(curr_selection[matrix_type].some( function(j){ return j === xrange[i] })){
				curr_selection[matrix_type] = curr_selection[matrix_type].filter( j => { return j !== xrange[i] });
			}
		}

	// add metrics in selection if shiftkey NOT pressed
	} else {
		for(let i=0; i<xrange.length; i++){
			if(curr_selection[matrix_type].every( function(j){ return j !== xrange[i] })){
				curr_selection[matrix_type].push(xrange[i]);
			}
		}
	}	

	// update hover rect properties
	var hov_rect = d3.select('#hover-rect')
	if(in_selection(curr_selection[matrix_type],d.x,d.y) || curr_selection[matrix_type].length<1){
		hov_rect
			.attr('width',scale(labels[1]))
			.attr('height',scale(labels[1]))
			.attr('x',scale(labels[d.y]))
			.attr('y',scale(labels[d.x]))
			.style('stroke-opacity',1)
			.style('stroke','rgb(0,255,0)');
	} else {
		hov_rect
			.attr('width',scale(labels[1]))
			.attr('height',scale(labels[1]))
			.attr('x',scale(labels[d.y]))
			.attr('y',scale(labels[d.x]))
			.style('stroke-opacity',0.7)
			.style('stroke','rgb(200,200,255)');
	}
	
	// refresh the qselections/metric selections
	if(d3.select('#qselections').select('.selected').size()){
		d3.select('#qselections').select('.selected').nodes()[0].click()
	}

	// update matrix rendering
	update_rect_selections();

	// trigger scatter plot
	rect.dispatchEvent(new Event('click'));
	drag_start = [null,null];
}

const matrix_click = function(d,dec_data,scatter_scale){

		d3.selectAll('.scatter-ci').remove()

		var scatter_data = [];
		for(let i=0; i<dec_data.data.length; i++){
			let x = dec_data.data[i][d.x], y = dec_data.data[i][d.y];
			scatter_data.push([x,y]);
		}

		// select scatter dots
		var scatter_dots = d3.select('.scatter-axes').selectAll('circle').data(scatter_data);

		// add new dots as necessary
		scatter_dots
			.enter()
			.append('circle')
				.attr('class','scatter-dot')
				.attr('r',1);

		// remove expired dots
		scatter_dots.exit().remove();

		// update dot positions
		scatter_dots
				.attr('cx', function(d){ return scatter_scale(d[0])})
				.attr('cy', function(d){ return scatter_scale(-d[1])})
				

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

	d3.json('data/ci95s.json').then(function(ci_data){

		// get current dataset index
		const dataset_idx = get_dataset_idx();
		const matrix_type = get_matrix_type();

		var fit_x, fit_y;
		if(row===col){
			fit_x = [-3.5,3.5];
			fit_y = [-3.5,3.5];
			fit_x = fit_x.map(function(a){ return scatter_scale(a) });
			fit_y = fit_y.map(function(a){ return scatter_scale(-a) });
		} else {

			if(flip_xy){
				fit_x = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_y;
				fit_y = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_x;
			} else {
				fit_x = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_x;
				fit_y = ci_data[dataset_idx][matrix_type][ci_idx-1].fit_y;
			}
			fit_x = fit_x.map(function(a){ return scatter_scale(a) });
			fit_y = fit_y.map(function(a){ return scatter_scale(-a) });
		}

		d3.selectAll('.scatter-fit').remove()
		d3.select('.scatter-axes').append('path')
				.attr('class','scatter-fit')
				.attr('d',`M${fit_x[0]},${fit_y[0]}L${fit_x[1]},${fit_y[1]}`)
				.attr('fill','none')
				.attr('stroke','#000000');

		if(row===col) return;

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
	update_selected_metric(d.x_label,true)
		
}

// render the matrix in svg from data
var renderMatrix = (data,scale,labels,dec_data,scatter_scale) =>{

	// define matrix color scale
	var color = d3.scaleLinear()
		.domain([-1.0000,-0.8745,-0.7490,-0.6235,-0.5059,-0.3804,-0.2549,-0.1294,-0.0118,-0.0039,0.1216,0.2471,0.3725,0.4980,0.6235,0.7490,0.8745,1.0000])
		.range([
			d3.rgb(253,255,255),
			d3.rgb(187,252,255),
			d3.rgb(114,235,255),
			d3.rgb(44,202,255),
			d3.rgb(0,157,255),
			d3.rgb(0,103,255),
			d3.rgb(21,39,255),
			d3.rgb(19,0,201),
			d3.rgb(0,0,0),
			d3.rgb(0,0,0),
			d3.rgb(96,0,0),
			d3.rgb(164,6,0),
			d3.rgb(215,56,0),
			d3.rgb(248,109,0),
			d3.rgb(255,165,0),
			d3.rgb(255,215,0),
			d3.rgb(255,247,107),
			d3.rgb(255,255,251)
		]);

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
										.on('click', function(d){ matrix_click(d,dec_data,scatter_scale) })
										.on('mousedown', function(d){ matrix_mousedown(d) })
										.on('mouseup', function(d){ matrix_mouseup(this,d,scale,labels) });
        })

		update_rect_selections();
    return rows;
        
};

const update_rect_selections = function(){

	var matrix_type = get_matrix_type();
	var matrix_metrics;
    d3.select('#matrix-header')
            .select('select')
								.each(function(d){ matrix_metrics = d[get_dataset_idx()][get_matrix_type()].fields.slice() });
								
	// update matrix rects
	if(curr_selection[matrix_type].length<1){
		d3.selectAll('.matrix-rect').style('fill-opacity',1);

	} else {
		const unselect_rects = d3.selectAll('.matrix-rect').filter(function(dd){
				return !in_selection(curr_selection[matrix_type],dd.x,dd.y);
		});
		const select_rects = d3.selectAll('.matrix-rect').filter(function(dd){
			return in_selection(curr_selection[matrix_type],dd.x,dd.y);
		});
		select_rects.style('fill-opacity',1);
		unselect_rects.style('fill-opacity',0.25);

		// query names of selected metrics
		selected_metric_labels = [];
		select_rects
			.filter(function(dd){
				return dd.x === dd.y;
			})
			.each(function(dd,i){ selected_metric_labels.push(dd.x_label) });
	}

	// update the color of loading bars
	update_loading_bar_colors();
}


const update_loading_bar_colors = function(){

	var matrix_type = get_matrix_type();
	if(curr_selection[matrix_type].length<1){

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
			// update selected loadings
			d3.selectAll('.y-axis').each(function(){
				var metric_idx = [];
				d3.select(this).selectAll('text').each(function(t,i){
					const curr_metric = d3.select(this).nodes()[0].innerHTML;
					const is_selected = selected_metric_labels.some(function(m){ return m === curr_metric });
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

	// add notification to loadings tab if not active
	var loadings_tab_is_active = d3.select('#tab-div')
		.select('ul').select('li.active').nodes()[0].innerText === 'Behavior Loadings';
	if(!loadings_tab_is_active) add_tab_notification('Behavior Loadings');

}

const qselection_mouseover = function(){
	if(d3.select(this).attr('class')==='selected'){
		return;
	}
	d3.select(this).attr('class','active');
	d3.select(this).select('.qselection-color-tab').style('fill-opacity',1);
	d3.select('#hover-rect').style('stroke-opacity',0);
}

const qselection_mouseout = function(){
	if(d3.select(this).attr('class')==='selected'){
		return;
	}
		d3.select(this).attr('class','inactive');
		d3.select(this).select('.qselection-color-tab').style('fill-opacity',0.72);
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
			.select('.qselection-color-tab').style('fill-opacity',0.72);

	// change button appearance	
	d3.select(this)
		.attr('data-status','on')
		.attr('class','selected')
		.select('.qselection-color-tab').style('fill-opacity',1);

	d3.selectAll('.apriori-rect')
		.style('opacity',0.72)
		.style('outline','0px solid white')
		.style('outline-offset','0px')
		.filter(function(){ return d3.select(this).attr('name') === d.name })
		.style('opacity',1)
		.style('outline','1px solid rgb(200,200,200)')
		.style('outline-offset','-1px')

	//define the current selection and initialize metric selection divs
	const metric_selections = d.idx.map((v,i) => { return {field: d.fields[i], idx: v, list_idx: d.list_idx[i]} });
	curr_quick_selection = this.innerText;
	init_metric_selections(metric_selections);
}

var prev_metric_selection;
var prev_selected_element;
var selection_idx = [];
const apriori_bar_colors = [
	'rgb(255,0,195)',
	'rgb(124,0,255)',
	'rgb(0,67,255)',
	'rgb(0,255,255)',
	'rgb(0,255,60)',
	'rgb(255,188,0)',
	'rgb(255,0,0)',
	'rgb(74,0,89)',
	'rgb(0,191,153)',
	'rgb(11,142,0)',
	'rgb(164,181,0)'
]

const init_qselections = function(selection,names,selection_idx){

	d3.select('#' + selection + '-selection-div').selectAll('div')
		.filter(function(){ return d3.select(this).attr('id')!=='qselection-arrow'; })
			.data(selection_idx)
			.enter()
		.append('div')
			.attr('class','inactive')
			.attr('data-status','off')
			.style('position','relative')
			.on('mouseover',qselection_mouseover)
			.on('mouseout',qselection_mouseout)
			.on('click',qselection_click)
			.text(function(d,i){ return names[i] })
			//.style('color',function(d,i){ return apriori_bar_colors[i] })
			.each(function(d,i){
				if(selection==='behavior'){
					d3.select(this)
						.append('svg')
							.style('position','absolute')
							.style('right','0px')
							.style('top','0px')
							.style('margin','0px')
							.style('width','7px')
							.style('height','23px')
							.style('border-left','1px solid rgb(35,35,35)')
						.append('rect')
							.attr('class','qselection-color-tab')
							.style('fill',apriori_bar_colors[i])
							.style('fill-opacity',0.72)
				}
			})

}

// define metric selection callbacks
const metric_selection_click = function(d){

	var matrix_type = get_matrix_type();
	var new_selection_idx;
	if(prev_metric_selection===null){
		d3.select('#metric-selections')
            .selectAll('div.active')
            .each(function(dd,i){
                const style = d3.select(this).attr('style');
                if(typeof(style)==='string'){
									prev_metric_selection = i;
                } 
						})
	}
	
	if(d3.event.shiftKey && !(prev_metric_selection===null)){
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
		metric_idx.forEach(i => curr_selection[matrix_type].push(i));
	} else {
		curr_selection[matrix_type] = curr_selection[matrix_type].filter((v) => { return !metric_idx.some(vv => vv===v) });
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

	// update metric summary tab
	var selected_metric = 
        d3.select('#metric-selections')
            .selectAll('div.active')
            .filter(function(){
                const style = d3.select(this).attr('style');
                if(typeof(style)==='string'){
                    return style.includes('dashed');
                } 
            })
						.nodes()[0]
						
	if(selected_metric){
		/*
		var element = document.getElementById('metric-summary-tab-select');
		element.value = selected_metric.innerText;
		var event = new Event('change', {value: selected_metric.innerHTML});
		element.dispatchEvent(event);
		*/
		update_selected_metric(selected_metric.innerText,true);
	}
}

const init_metric_selections = function(metric_selections){

	var matrix_type = get_matrix_type();

	// remove old divs
	d3.select('#metric-selections').selectAll('div').remove()
	prev_metric_selection = null;

	// initialize new divs
	d3.select('#metric-selections').selectAll('div')
			.data(metric_selections)
			.enter()
		.append('div')
			.attr('class',function(d){
				return curr_selection[matrix_type].some(v => v===d.idx-1) ? 'active' : 'inactive';
			})
			.attr('data-status',function(d){
				return curr_selection[matrix_type].some(v => v===d.idx-1) ? 'on' : 'off';
			})
			.on('click',metric_selection_click)
			.text(function(d,i){ return d.field });	

}

// toggle all metrics in selection ON
const metric_toggle_all = function(){

	// change button appearance to unpressed
	d3.select(this).attr('class','active');


	var qselect_to_update;
	switch(d3.select(this.parentNode).attr('id')){
		case 'loadings-select-buttons':
			qselect_to_update = d3.select('#tab-header').select('select').nodes()[0].value;
			break;
		default:
			if(!curr_quick_selection){
				curr_quick_selection = d3.select('#behavior-selection-div').select('div').nodes()[0].innerText;
			} 
			qselect_to_update = curr_quick_selection;
			break;
	}
	
	const curr_qselect = d3.select('#qselections')
			.selectAll('div')
			.filter(function(){ return this.innerText === qselect_to_update});


	var matrix_type = get_matrix_type();
	switch(this.innerText){
		case "Select Group":
			curr_qselect.each(function(dd){ dd.idx.forEach(v => curr_selection[matrix_type].push(v-1)) });
			break;
		case "Deselect Group":
			curr_qselect.each(function(dd){
				curr_selection[matrix_type] = curr_selection[matrix_type].filter((v) => { return !dd.idx.some(vv => v===vv-1) });
			})
			break;
		case "Clear All Selections":
			curr_selection[matrix_type] = [];
			break;
	}

	//define the current selection and initialize metric selection divs
	curr_qselect.each(function(dd){
		const metric_selections = dd.idx.map((v,i) => {
			return {field: dd.fields[i], idx: v, list_idx: dd.list_idx[i]};
		});
		init_metric_selections(metric_selections);
	});
	curr_qselect.nodes()[0].click();
	update_rect_selections();
}


// ititialize colorbar
const init_colorbar = function(){


	    // define matrix color scale
		const caxis_domain = [-1.0000,-0.8745,-0.7490,-0.6235,-0.5059,
							-0.3804,-0.2549,-0.1294,-0.0118,-0.0039,
							0.1216,0.2471,0.3725,0.4980,0.6235,0.7490,
							0.8745,1.0000];
		const min = caxis_domain.reduce((a,b) => { return Math.min(a,b) });
		var caxis_pct = caxis_domain.map( v => v + (0-min));
		const max = caxis_pct.reduce((a,b) => { return Math.max(a,b) });
		caxis_pct = caxis_pct.map( v => v / max * 100);
		const caxis_colors = [
			d3.rgb(253,255,255),
			d3.rgb(187,252,255),
			d3.rgb(114,235,255),
			d3.rgb(44,202,255),
			d3.rgb(0,157,255),
			d3.rgb(0,103,255),
			d3.rgb(21,39,255),
			d3.rgb(19,0,201),
			d3.rgb(0,0,0),
			d3.rgb(0,0,0),
			d3.rgb(96,0,0),
			d3.rgb(164,6,0),
			d3.rgb(215,56,0),
			d3.rgb(248,109,0),
			d3.rgb(255,165,0),
			d3.rgb(255,215,0),
			d3.rgb(255,247,107),
			d3.rgb(255,255,251)
		];
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
		  .attr('transform-origin','center center')
		  .attr("transform", `translate(${-30},${-10}) rotate(180)`);
	
		var y = d3.scaleLinear()
		  .range([h,  0])
		  .domain([-1, 1]);
	
		var yAxis = d3.axisRight()
		  .scale(y)
		  .ticks(5);
	
		key.append("g")
		  .attr("class", "y-axis")
		  .attr("transform", `translate(${w_pad-10},10)`)
		  .call(yAxis)
	
		key.append('text')
			.text('correlation coefficient')
			.attr('text-anchor','middle')
			.attr('transform',`translate(10,${(h+20)/2}) rotate(-90)`)
			.style('font-size','14px')

}



const init_apriori_rects = function(apriori,matrix_type,scale){
	
	var rect_arr = [];
	const trim_factor = 6;
	var field_key;
	if(matrix_type==='full'){
		field_key = 'fields';
	} else {
		field_key = 'dist_fields';
	}

	const y_trim = (scale(apriori[0][field_key][1]) - scale(apriori[0][field_key][0]))/trim_factor;
	for(let i=0; i<apriori.length; i++){
		var rect = {
			y1: scale(apriori[i][field_key][0]) + y_trim,
			y2: scale(apriori[i][field_key][apriori[i][field_key].length-1]) + y_trim*trim_factor - y_trim,
			height: null,
		}
		rect.height = rect.y2 - rect.y1;
		rect_arr.push(rect);
	}

	d3.select('#matrix-div')
		.append('svg')
			.attr('id','apriori-rect-parent')
		.selectAll('rect')
			.data(rect_arr)
			.enter()
		.append('rect')
			.attr('name',function(d,i){ return apriori[i].name })
			.attr('class','apriori-rect')
			.attr('y', function(d){ return d.y1 })
			.attr('height',function(d){ return d.height })
			.style('fill',function(d,i){ return apriori_bar_colors[i] })
			.style('opacity',0.72)
}

// apply metric toggling to metric selection buttons
d3.select('#metric-select-buttons').selectAll('div')
	.on('mouseup',metric_toggle_all)
	.on('mousedown',function(){ d3.select(this).attr('class','selected') })
	.on('mouseover',function(){ d3.select(this).attr('class','active') })
	.on('mouseout',function(){ d3.select(this).attr('class','inactive') })

d3.select('#tab-header').select('.buttons').selectAll('div')
	.on('mouseup',metric_toggle_all)
	.on('mousedown',function(){ d3.select(this).attr('class','selected') })
	.on('mouseover',function(){ d3.select(this).attr('class','active') })
	.on('mouseout',function(){ d3.select(this).attr('class','inactive') })

// apply metric toggling to metric selection buttons
d3.select('#clear-selections')
	.on('mousedown',function(){ d3.select(this).attr('class','selected') })
	.on('mouseover',function(){ d3.select(this).attr('class','active') })
	.on('mouseout',function(){ d3.select(this).attr('class','inactive') })
	.on('click',metric_toggle_all)