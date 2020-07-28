const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');


// init loadings plot vars
const loadings_margin = {right: 0, left: 150, top: 15, bottom: 40};

const get_selected_metric = function(){

    // search metric selection list
    var selected_metric = 
        d3.select('#metric-selections')
            .selectAll('div.active')
            .filter(function(){
                const style = d3.select(this).attr('style');
                if(typeof(style)==='string'){
                    return style.includes('dashed');
                } 
            })
            .nodes()[0];

    if(!selected_metric){
        const selected_label = d3.select('#metric-loadings-tab')
            .select('.tab-content')
            .select('text[selected=true]');
        if(selected_label.nodes()[0]){
            selected_metric = selected_label.nodes()[0].innerHTML;
        }
    } else {
        selected_metric = selected_metric.innerHTML;
    }
    if(!selected_metric){
        d3.select('#matrix-header')
            .select('select')
                .each(function(d){ 
                    selected_metric = d[0]['full'].fields[0] })
    }
    return selected_metric;
}

const switch_tab = function(){
    // set all tabs to inactive and activate selected tab
    tab_links.attr('class','inactive');
    d3.select(this).attr('class','active');

    // hide all tabs and set current tab to visible
    d3.selectAll('.tab-parent').style('visibility','hidden');
    const curr_tab_name = d3.select(this).nodes()[0].innerHTML;
    switch(curr_tab_name){
        case "Metric Loadings":
            d3.select('#metric-loadings-tab').style('visibility','visible');
            break;
        case "Metric Summary":
            d3.select('#metric-summary-tab').style('visibility','visible');

            var all_metrics = [];
            d3.select('#matrix-header')
                .select('select')
                    .each(function(d){ 
                        all_metrics = d[0]['full'].fields })
            d3.select('#metric-summary-tab').select('select')
                .selectAll('option')
                    .data(all_metrics)
                    .enter()
                .append('option')
                    .attr('value',function(d){ return d; })
                    .text(function(d){ return d; });

            d3.select('#metric-summary-tab')
                .selectAll('tr')
                    .filter(function(d,i){ return i>0 })
                    .remove();

            d3.select('#metric-summary-tab')
                .select('table')
                .selectAll('tr')
                    .data(d3.range(8))
                    .enter()
                .append('tr')
                    .each(function(d){
                        d3.select(this).selectAll('td')
                            .data(d3.range(3))
                            .enter()
                        .append('td')
                            .each(function(){ d3.select(this).append('p') })
                    })

            console.log(d3.select('#metric-summary-tab').selectAll('tr').size())

            const selected_metric_name = get_selected_metric();
            //load_metric_summary(selected_metric_name);
            var element = document.getElementById('metric-summary-tab-select');
            var event = new Event('change', {value: selected_metric_name});
            element.dispatchEvent(event);
            break;
        case "Gene Search":
            d3.select('#gene-search-tab').style('visibility','visible');
            break;
    }
}
tab_links.on('click',switch_tab)

const str2rgb = function(str){
    str = str.replace(/[^\d\.?,]/g, '').split(',');
    return str.map(s => parseInt(s));
}


const plot_apriori_barplots = function(apriori_obj,grp_name){

    // delete all existing plots
    d3.selectAll('.loadings-svg').remove()

    // get group names
    const curr_grp_idx = apriori_obj.map( v=> v.name).indexOf(grp_name);
    for(let i=0; i<apriori_obj[curr_grp_idx].dist_idx.length; i++){
        plot_loadings(apriori_obj[curr_grp_idx].loadings[i],
                apriori_obj[curr_grp_idx].loadings_labels[i],
                apriori_obj[curr_grp_idx].dist_fields[i]
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
                .attr('selected',do_select)
                .each( function() { 
                    if(d3.select(this).attr('active') === "true" && !do_select){
                        d3.select(this).style('fill',d3.rgb(act_col[0],act_col[1],act_col[2],1))
                    } else {
                        d3.select(this).style('fill',d3.rgb(tc[0],tc[1],tc[2],0.72))
                    }
                })
                
    });
    bar_par.each( function(d,j){
        d3.select(this)
            .selectAll('rect')
                .attr('selected',false)
            .filter( function(t,i){ return i === metric_idx[j] })
            .attr('selected',do_select)
                .each( function() { 
                    if(d3.select(this).attr('active') === "true" && !do_select){
                        d3.select(this).style('fill',d3.rgb(act_col[0],act_col[1],act_col[2],1))
                    } else {
                        d3.select(this).style('fill',d3.rgb(rc[0],rc[1],rc[2],0.72))
                    }
                })
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

    
    var loadings_width = 300;
    var loadings_height = loadings.length*12 + loadings_margin.top + loadings_margin.bottom;
    var loadings_plot_width = loadings_width - loadings_margin.left - loadings_margin.right;
    var loadings_plot_height = loadings_height - loadings_margin.top - loadings_margin.bottom;

    const loadings_svg = d3.select('#metric-loadings-tab')
            .select('.tab-content')
        .append('svg')
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
    if(min>0) min = 0;
    var max = loadings.reduce((a,b) => { return Math.max(a,b) });
    max = Math.ceil(max*10)/10;
    if(max<0) max=0;

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

const plot_raw_histogram = function(data,x_min,x_max,ylabel,plot_color,xlabel,append_xlabel){

    // init plotting params
    var hist_margin = {top: 5, right: 5, bottom: 30, left: 50};
    var width = 500 - hist_margin.left - hist_margin.right,
        height = 180 - hist_margin.top - hist_margin.bottom;
    if(append_xlabel) hist_margin.bottom = 60;

    var x = d3.scaleLinear()
        .domain([x_min, x_max])
        .range([0, width]);
    var hist = d3.histogram()
        .value(function(d){ return d; })
        .domain(x.domain())
        .thresholds(x.ticks(30));
    var binned_data = hist(data);
    var y_max = Math.ceil(d3.max(binned_data, function(d){ return d.length })*1.1);
    var y = d3.scaleLinear()
        .domain([0, y_max])
        .range([height, 0]);

    // initialize axes
    var bar_svg = d3.select('#hist-div').append('svg')
        .attr('class','axis')
        .attr("width", width + hist_margin.left + hist_margin.right)
        .attr("height", height + hist_margin.top + hist_margin.bottom)
      .append("g")
        .attr("transform",`translate(${hist_margin.left},${hist_margin.top})`);
    bar_svg.append('path')
        .attr('d',
            `M0,1
            H${x(x_max)-x(x_min)}
            V${y(0)}
            H0
            V0`)
        .attr('stroke-width',1)
        .attr('stroke','#000000')
        .attr('fill',d3.rgb(30,30,30));
    var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(10);
    bar_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(5);
    bar_svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    bar_svg.append('text')
        .text(ylabel)
        .attr('text-anchor','middle')
        .attr('transform',`translate(-40,${y(0)/2}) rotate(-90)`)
        .style('font-size','14px')
        .style('fill',plot_color);

    if(append_xlabel){
        bar_svg.append('text')
            .text(xlabel)
            .attr('text-anchor','middle')
            .attr('transform',`translate(${x(x_max)/2},${y(0)+50})`)
            .style('font-size','14px');     
    }
    

    // initialize bar elements
    var bar = bar_svg.selectAll(".bar")
        .data(binned_data)
        .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return `translate(${x(d.x0)},${y(d.length)})`; });
    bar.append("rect")
        .attr("x", 1)
        .attr("width", function(d) { return Math.max(Math.abs(x(d.x1) - x(d.x0)) -1,0) ; })
        .attr("height", function(d) { return height - y(d.length); })
        .attr('fill',plot_color);
}


// switch apriori plots on dropdown menu change
const load_metric_summary = function(metric_name){

    // add metric glossary entry
    var metric_idx;
    d3.csv('metric_glossary.csv').then(function(metric_table){

        metric_idx = metric_table.map((d,i) => { return d.Metric; }).indexOf(metric_name)
        const assay_name = metric_table[metric_idx].Assay;
        var cols = ['header'];
        metric_table.columns.forEach( i => { cols.push(i) });

        d3.select('#metric-summary-tab').select('table')
            .selectAll('tr')
                .data(cols)
                .filter(function(d,i){ return i > 0 && i < 6 })
                .each(function(d,i){
                    d3.select(this)
                        .selectAll('td')
                            .each(function(dd,j){
                                switch(j){
                                    case 0:
                                        d3.select(this)
                                            .style('width','40%')
                                            .select('p')
                                                .text(d+':')
                                                .style('font-weight','bold')
                                        break;
                                    case 1:
                                        d3.select(this)
                                            .style('width','60%')
                                            .select('p')
                                                .text(metric_table[metric_idx][d])
                                        break;
                                    case 2:
                                        break;
                                }
                            })
                })

        // add assay glossary entry
        d3.csv('assay_glossary.csv').then(function(assay_table){

            const assay_idx = assay_table.map((d,i) => { return d.Name; }).indexOf(assay_name)
            const assay_cols = assay_table.columns.slice(1,4);
            assay_cols.forEach( i => { cols.push(i) });

            d3.select('#metric-summary-tab').select('table')
                .selectAll('tr')
                    .data(cols)
                    .filter(function(d,i){ return i > 5 })
                    .each(function(d,i){
                        d3.select(this)
                            .selectAll('td')
                                .each(function(dd,j){
                                    switch(j){
                                        case 0:
                                            d3.select(this).select('p').text('Assay '+d+':').style('font-weight','bold')
                                            break;
                                        case 1:
                                            d3.select(this).select('p').text(assay_table[assay_idx][d])
                                            break;
                                        case 2:
                                            break;
                                    }
                                })
                    })
        })
    })

    // append histograms
    d3.select('#hist-div').selectAll('svg').remove()
    d3.json('decathlon_raw_data.json').then(function(raw){

        var x_min = 0;
        var x_max = 1;
        var d_raw = [];
        var ylabels = ['inbred batch[1]','inbred batch[2]','outbred batch[1]'];
        var plot_colors = ['rgb(220,150,220)','rgb(220,150,120)','rgb(150,150,220)']

        console.log(raw)

        for(let i=0; i<raw.length; i++){
            var metric_idx = raw[i].fields.indexOf(metric_name);
            var raw_data = raw[i].data.map( d => { return d[metric_idx] }).filter( d => { return d !== null});
            d_raw.push(raw_data)

            if(raw_data.some( d => {return d})){
                x_max = Math.max(d3.max(raw_data),x_max);
                x_min = Math.min(d3.min(raw_data),x_min);
            }
        }

        console.log(d_raw)

        for(let i=0; i<3; i++){
            if(d_raw[i].some( d => {return d})){
                plot_raw_histogram(d_raw[i],x_min,x_max,ylabels[i],plot_colors[i],metric_name,i+1===raw.length);
            }
        }
    })
    
    

    
}

d3.select('#metric-summary-tab')
    .select('select')
        .on('change',function(){ load_metric_summary(this.value) })
