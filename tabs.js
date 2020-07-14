const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');
const tab_content = d3.select('#tab-content');

// define color and alpha presets
const sel_alpha = 1;
const unsel_alpha = 0.72
const sel_col = [240,160,0];    // selected text/rect color
const act_col = [240,160,240];  // active text/rect color
const irc = [160,160,240];      // inactive rect color
const itc = [255,255,255];      // inactive text color

// init loadings plot vars
const loadings_margin = {right: 0, left: 150, top: 15, bottom: 40};

tab_links.on('click',function(){
    tab_links.attr('class','inactive');
    d3.select(this).attr('class','active');
})

const str2rgb = function(str){
    str = str.replace(/[^\d\.?,]/g, '').split(',');
    return str.map(s => parseInt(s));
}

const plot_apriori_barplots = function(distilled_obj,apriori_gp_idx){
    
    for(let i=0; i<apriori_gp_idx.length; i++){
        plot_loadings(distilled_obj.loadings[i],
                distilled_obj.loadings_labels[i],
                distilled_obj.fields[i]
        );
    }
}

// hilight-unhighlight axis labels on barplot mouseover
const loading_bar_mouseover = function(d,i,y_grp){
    // get current colors
    const rect_col = str2rgb(d3.select(d).style('fill'));
    const text_elem = y_grp.selectAll('text').filter(function(dd,ii){ return i === ii })
    const text_col = str2rgb(text_elem.style('fill'));

    //set new colors
    d3.select(d).style('fill',d3.rgb(rect_col[0],rect_col[1],rect_col[2],1))
    text_elem.style('fill',d3.rgb(text_col[0],text_col[1],text_col[2],1))
}
const loading_bar_mouseout = function(d,i,y_grp){

    // get current colors
    const rect_col = str2rgb(d3.select(d).style('fill'));
    const text_elem = y_grp.selectAll('text').filter(function(dd,ii){ return i === ii })
    const text_col = str2rgb(text_elem.style('fill'));

    //set new colors
    d3.select(d).style('fill',d3.rgb(rect_col[0],rect_col[1],rect_col[2],0.72))
    text_elem.style('fill',d3.rgb(text_col[0],text_col[1],text_col[2],0.72))
}
const loading_bar_click = function(d,i,y_grp){

    const text_elem = y_grp.selectAll('text').filter(function(dd,ii){ return i === ii })
    if(text_elem.attr('selected') === 'true'){
        loading_click(text_elem.nodes()[0].innerHTML,false);
    } else {
        loading_click(text_elem.nodes()[0].innerHTML,true);
    }
}
const loading_click = function(metric_name,do_select){

    // select all y-axis label parents
    const y_lab_par = d3.selectAll('.y-axis');
    const bar_par = d3.selectAll('.loadings-bar-parent');

    // reset all color of all selected elements
    y_lab_par.each( function(){
        d3.select(this)
            .selectAll('text[selected="true"]')
                .each( function(){
                    if(d3.select(this).attr('active') === 'true'){
                        d3.select(this).style('fill',d3.rgb(act_col[0],act_col[1],act_col[2],0.72))
                    } else {
                        d3.select(this).style('fill',d3.rgb(itc[0],itc[1],itc[2],0.72))
                    }
                })
    })
    bar_par.each( function(){
        d3.select(this)
            .selectAll('rect[selected="true"]')
                .each( function(){
                    if(d3.select(this).attr('active') === 'true'){
                        d3.select(this).style('fill',d3.rgb(act_col[0],act_col[1],act_col[2],0.72))
                    } else {
                        d3.select(this).style('fill',d3.rgb(irc[0],irc[1],irc[2],0.72))
                    }
                })
    })      

    // select new colors
    var tc, rc;
    if(do_select){
        tc = sel_col; rc = sel_col;
    } else {
        tc = itc; rc = irc;
    }

    // update color of matching axis label on each plot
    const metric_idx = [];
    y_lab_par.each( function(){
        d3.select(this)
            .selectAll('text')
                .attr('selected',false)
            .filter( function(t,i){
                const is_match = d3.select(this).nodes()[0].innerHTML === metric_name;
                if(is_match) metric_idx.push(i);
                return  is_match;
            })
                .each( function() { d3.select(this).style('fill',d3.rgb(tc[0],tc[1],tc[2],0.72)) })
                .attr('selected',do_select)
    });
    bar_par.each( function(d,j){
        d3.select(this)
            .selectAll('rect')
                .attr('selected',false)
            .filter( function(t,i){ return i === metric_idx[j] })
                .each( function() { d3.select(this).style('fill',d3.rgb(rc[0],rc[1],rc[2],0.72)) })
                .attr('selected',do_select)
    })
}

// hilight-unhighlight barplot on axis tick mouseover
const loading_tick_mouseover = function(d,i,y_grp){
     // get current colors
    const text_col = str2rgb(d3.select(d).style('fill'));
    const rect_elem = y_grp.filter(function(dd,ii){ return i === ii })
    const rect_col = str2rgb(rect_elem.style('fill'));

    //set new colors
    d3.select(d).style('fill',d3.rgb(text_col[0],text_col[1],text_col[2],1))
    rect_elem.style('fill',d3.rgb(rect_col[0],rect_col[1],rect_col[2],1))
}
const loading_tick_mouseout = function(d,i,y_grp){
     // get current colors
     const text_col = str2rgb(d3.select(d).style('fill'));
     const rect_elem = y_grp.filter(function(dd,ii){ return i === ii })
     const rect_col = str2rgb(rect_elem.style('fill'));
 
     //set new colors
     d3.select(d).style('fill',d3.rgb(text_col[0],text_col[1],text_col[2],0.72))
     rect_elem.style('fill',d3.rgb(rect_col[0],rect_col[1],rect_col[2],0.72))
}
const loading_tick_click = function(){
  
    if(d3.select(this).attr('selected') === 'true'){
        loading_click(d3.select(this).nodes()[0].innerHTML,false);
    } else {
        loading_click(d3.select(this).nodes()[0].innerHTML,true);
    }
}



const plot_loadings = function(loadings,labels,title){

    var loadings_width = 300, loadings_height = loadings.length*12;
    var loadings_plot_width = loadings_width - loadings_margin.left - loadings_margin.right;
    var loadings_plot_height = loadings_height - loadings_margin.top - loadings_margin.bottom;

    const loadings_svg = tab_content.append('svg')
        .attr('class','loadings-svg')
		.attr("width", loadings_width)
        .attr("height", loadings_height)
		//.style("margin-left", -loadings_margin.left + "px")
        //.style("float",'right')

    const loadings_grp = loadings_svg.append("g")
		.attr('class','axis')
        .attr("transform", "translate(" + loadings_margin.left + "," + loadings_margin.top + ")");

    var min = loadings.reduce((a,b) => { return Math.min(a,b) });
    min = Math.floor(min*10)/10;
    var max = loadings.reduce((a,b) => { return Math.max(a,b) });
    max = Math.ceil(max*10)/10;
    

    const loadings_y_scale = d3.scaleBand()
        .domain(labels)
        .range([0,loadings_plot_height])
        .paddingOuter(.1)
        .paddingInner(.1)

    var loadings_x_scale = d3.scaleLinear()
        .domain([min,max])
        .range([0,loadings_plot_width])

    // initialize axes
	const y_axis_grp = loadings_grp
        .append('g')
            .attr('class','y-axis')
            .call(d3.axisLeft(loadings_y_scale).ticks(0).tickSize(0));

    console.log(y_axis_grp.selectAll('text').nodes()[0].innerHTML)

    loadings_grp
        .append('g')
            .attr('transform','translate(0,' + loadings_plot_height + ')')
            .call(d3.axisBottom(loadings_x_scale).ticks(3));

    loadings_grp
        .append('path')
            .attr('d',
                `M0,0
                H${loadings_plot_width}
                V${loadings_plot_height}
                H0
                V0`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill',d3.rgb(30,30,30));

    // append axis labels
    loadings_grp
        .append('text')
            .attr('text-anchor','middle')
            .attr('x',loadings_plot_width/2)
            .attr('y',loadings_plot_height+30)
            .attr('id','loadings-xlabel')
            .text('metric weight')
            .style('font-size','12px')
    // append axis labels
    loadings_grp
        .append('text')
            .attr('text-anchor','middle')
            .attr('x',loadings_plot_width/2)
            .attr('y',-5)
            .attr('id','loadings-xlabel')
            .text(title)
            .style('font-size','12px')

    // initialize plot bars
    const loadings_rects = loadings_grp
        .append('g')
            .attr('class','loadings-bar-parent')
            .selectAll('rect')
                .data(loadings)
                .enter()
            .append('rect')
                .attr('selected',false)
                .attr('height',function(d,i){
                    return loadings_y_scale.bandwidth(i);
                })
                .attr('width',function(d,i){
                    return Math.abs(loadings_x_scale(0)-loadings_x_scale(d));
                })
                .attr('y', function(d,i){
                    return loadings_y_scale(labels[i])
                })
                .attr('x', function(d,i){
                    return d > 0 ? loadings_x_scale(0) : loadings_x_scale(d);
                })
                .attr('fill',d3.rgb(irc[0],irc[1],irc[2],0.72))
                .on('mouseover', function(d,i){ loading_bar_mouseover(this,i,y_axis_grp) })
                .on('mouseout', function(d,i){ loading_bar_mouseout(this,i,y_axis_grp) })
                .on('click', function(d,i){ loading_bar_click(this,i,y_axis_grp) });

    // attach axis tick mouseover callback
    y_axis_grp
        .selectAll('text')
        .attr('selected',false)
            .on('mouseover', function(d,i){ loading_tick_mouseover(this,i,loadings_rects) })
            .on('mouseout', function(d,i){ loading_tick_mouseout(this,i,loadings_rects) })
            .on('click',loading_tick_click);

    // draw indicator line at zero
    loadings_grp
        .append('path')
            .attr('d',`M${loadings_x_scale(0)},0V${loadings_plot_height}`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill','none');
    
}