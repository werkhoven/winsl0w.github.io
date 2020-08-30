const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');
var curr_gene_name, curr_gene_idx;
var prev_loading_click = null;
var prev_gene_hit_click = null;
var prev_gene_all_click = null;


// init loadings plot vars
const loadings_margin = {right: 10, left: 150, top: 15, bottom: 40};

const get_selected_metric = function(){

    // search metric selection list
    var selected_metric = 
        d3.select('#metric-selections')
            .selectAll('div')
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
                    selected_metric = d[0][get_matrix_type()].fields[0] })
    }
    return selected_metric;
}

const switch_tab = function(){
    // set all tabs to inactive and activate selected tab
    tab_links.attr('class','inactive');
    d3.select(this).attr('class','active');

    // hide all tabs and set current tab to visible
    d3.selectAll('.tab-parent').style('visibility','hidden');
    const curr_tab_name = d3.select(this).nodes()[0].innerText;
    clear_tab_notification(curr_tab_name);
    switch(curr_tab_name){

        case "Metric Loadings":
            d3.select('#metric-loadings-tab').style('visibility','visible');
            break;

        case "Metric Summary":
            d3.select('#metric-summary-tab').style('visibility','visible');
            const selected_metric_name = get_selected_metric();
            var element = document.getElementById('metric-summary-tab-select');
            element.value = selected_metric_name;
            var event = new Event('change', {value: selected_metric_name});
            element.dispatchEvent(event);
            break;

        case "Gene Search":
            d3.select('#gene-search-tab').style('visibility','visible');
            init_gene_search_table();
            break;

        case "Enrichment Categories":
            d3.select('#enrichment-tab').style('visibility','visible');
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
    d3.selectAll('.loadings-svg').remove();

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

    const text_elem = y_grp.selectAll('text').filter(function(dd,ii){ return i === ii });
    if(text_elem.attr('active') === 'true'){
        text_elem.attr('active','false');
        d3.select(d).attr('active','false');
        loading_click(text_elem.nodes()[0].innerHTML,false,d.parentNode.parentNode);
    } else {
        text_elem.attr('active','true');
        d3.select(d).attr('active','true');
        loading_click(text_elem.nodes()[0].innerHTML,true,d.parentNode.parentNode);
    }
}
const pval_bar_click = function(d,i,y_grp){

    const text_elem = y_grp.selectAll('text').filter(function(dd,ii){ return i === ii })

    update_selected_metric(text_elem.nodes()[0].innerHTML,false)

    // execute click on metric summary tab and load selected summary
    d3.select('#tab-div').select('ul').selectAll('li')
        .filter(function(d,i){ return i===1 })
        .nodes()[0].click();

    

}
const loading_click = function(metric_name,do_select,axis_parent){

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
    
    // get currently selected element and all metric names 
    var all_metrics = [];
    var selected_element;
    var matrix_type = get_matrix_type();

    // get field names in order of the matrix
    var matrix_metrics;
    d3.select('#matrix-header')
            .select('select')
                .each(function(d){ matrix_metrics = d[get_dataset_idx()][get_matrix_type()].fields.slice() });

    // select range of selection if shift+click
    if(d3.event.shiftKey && prev_loading_click){

        d3.select(axis_parent)
            .select('.y-axis')
            .selectAll('text')
                .each(function(){
                    const this_metric = d3.select(this).nodes()[0].innerHTML;
                    if(this_metric===prev_loading_click) selected_element = d3.select(this);
                    all_metrics.push(this_metric);
            })

        // get index of first/last clicks
        var first_idx = all_metrics.indexOf(prev_loading_click);
        var last_idx = all_metrics.indexOf(metric_name);
        var new_selection_idx = all_metrics
            .slice(Math.min(first_idx,last_idx),Math.max(first_idx,last_idx)+1)
            .map( i => { return matrix_metrics.indexOf(i) });

        if(selected_element.attr('active')==='true'){
            curr_selection[matrix_type] = curr_selection[matrix_type].concat(new_selection_idx).getUnique();
        } else {
            curr_selection[matrix_type] = curr_selection[matrix_type].filter( i => {
                return !new_selection_idx.some(function(j){ return j===i }) 
            });
        }

    // else toggle current selected metric
    } else {
        
        d3.select(axis_parent)
            .select('.y-axis')
            .selectAll('text')
                .each(function(){
                    const this_metric = d3.select(this).nodes()[0].innerHTML;
                    if(this_metric===metric_name) selected_element = d3.select(this);
                    all_metrics.push(this_metric);
            })

        var new_selection_idx = matrix_metrics.indexOf(metric_name);
        if(selected_element.attr('active')==='true'){
            curr_selection[matrix_type].push(new_selection_idx);
            curr_selection[matrix_type] = curr_selection[matrix_type].getUnique();
        } else {
            curr_selection[matrix_type] = curr_selection[matrix_type].filter( i => { return i !== new_selection_idx });
        }

    }
    prev_loading_click = metric_name;

    const curr_qselect_grp = d3.select('#qselections').select('.selected').nodes()[0].innerText;
    const curr_loading_grp = d3.select('#tab-header').select('select').nodes()[0].value;
    if(curr_loading_grp===curr_qselect_grp){
        d3.select('#qselections').select('.selected').nodes()[0].click();
    }

    update_selected_metric(metric_name,true);
    update_rect_selections();
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
const loading_tick_click = function(d,i,y_grp){
  
    const rect_elem = y_grp.filter(function(dd,ii){ return i === ii })
    if(d3.select(d).attr('active') === 'true'){
        d3.select(d).attr('active','false');
        rect_elem.attr('active','false');
        loading_click(d3.select(d).nodes()[0].innerHTML,false,d.parentNode.parentNode.parentNode);
    } else {
        d3.select(d).attr('active','true');
        rect_elem.attr('active','false');
        loading_click(d3.select(d).nodes()[0].innerHTML,true,d.parentNode.parentNode.parentNode);
    }
}
const pval_tick_click = function(d){

    update_selected_metric(d.innerHTML,false)

    // execute click on metric summary tab and load selected summary
    d3.select('#tab-div').select('ul').selectAll('li')
        .filter(function(d,i){ return i===1 })
        .nodes()[0].click();
}


const new_plot = function(){
    var plot = {
        svg: null, svg_width: null, svg_height: null, trans_g: null,
        margin: null, width: null, height: null,
        xaxis: null, xscale: null, xmin: null, xmax: null, xlabel: null,
        yaxis: null, yscale: null, ymin: null, ymax: null, ylabel: null,
        data: null, labels: null, title: null, color: null
    }
    return plot;
}

const plot_bar = function(plot,plot_mode){

    plot.width = plot.svg_width - plot.margin.left - plot.margin.right;
    plot.height = plot.svg_height - plot.margin.top - plot.margin.bottom;

    plot.svg
        .attr("width", plot.svg_width)
        .attr("height", plot.svg_height)

    plot.trans_g = plot.svg.append("g")
		.attr('class','axis')
        .attr("transform", "translate(" + plot.margin.left + "," + plot.margin.top + ")");

    // set x-axis upper and lower bounds
    plot.xmin = plot.data.reduce((a,b) => { return Math.min(a,b) });
    plot.xmin = Math.floor(plot.xmin*10)/10;
    if(plot.xmin>0) plot.xmin = 0;
    plot.xmax = plot.data.reduce((a,b) => { return Math.max(a,b) });
    plot.xmax = Math.ceil(plot.xmax*10)/10;
    if(plot.xmax<0) plot.xmax=0;

    var data_scale, data_dim, nondata_dim, nondata_scale, data_range, offset, xfilt;
    offset = new Array(plot.data.length).fill(0);
    switch(plot_mode){
        case 'horizontal':
            data_scale = 'x';
            nondata_scale = 'y';
            data_dim = 'width';
            nondata_dim = 'height';
            data_range = [0,plot[data_dim]];
            break;
        case 'vertical':
            data_scale = 'y';
            nondata_scale = 'x';
            data_dim = 'height';
            nondata_dim = 'width';
            data_range = [plot[data_dim],0];
            if(plot.data.length>20){
                xfilt = 10;
            } else {
                xfilt = 1;
            }
            break;
    }

    plot[nondata_scale + 'scale'] = d3.scaleBand()
        .domain(plot.labels)
        .range([0,plot[nondata_dim]])
        .paddingOuter(.15)
        .paddingInner(.15)

    plot[data_scale + 'scale'] = d3.scaleLinear()
        .domain([plot.xmin,plot.xmax])
        .range(data_range)

    if(plot_mode==='vertical'){
        offset = plot.data.map(i => { return plot.height - plot.yscale(i)});

        // initialize axes
        plot.yaxis = plot.trans_g
            .append('g')
                .attr('class','y-axis')
                .call(d3.axisLeft(plot.yscale).ticks(5).tickSize(0.1));
        plot.trans_g
            .append('g')
                .attr('transform','translate(0,' + plot.height + ')')
                .call(d3.axisBottom(plot.xscale)
                    .tickValues(plot.xscale.domain()
                    .filter(function(d,i){ return !(d%xfilt)})));
    } else {

    // initialize axes
	plot.yaxis = plot.trans_g
        .append('g')
            .attr('class','y-axis')
            .call(d3.axisLeft(plot.yscale).ticks(0).tickSize(0));
    plot.trans_g
        .append('g')
            .attr('transform','translate(0,' + plot.height + ')')
            .call(d3.axisBottom(plot.xscale).ticks(5));
    }

    plot.trans_g
        .append('path')
            .attr('d',
                `M0,0
                H${plot.width}
                V${plot.height}
                H0
                V0`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill',d3.rgb(30,30,30));

    append_plot_labels(plot);

    // initialize plot bars
    plot.trans_g
        .append('g')
            .attr('class','loadings-bar-parent')
            .selectAll('rect')
                .data(plot.data)
                .enter()
            .append('rect')
                .attr('selected',false)
                .attr(nondata_dim,function(d,i){
                    return plot[nondata_scale + 'scale'].bandwidth(i);
                })
                .attr(data_dim,function(d,i){
                    return Math.abs(plot[data_scale + 'scale'](0)-plot[data_scale + 'scale'](d));
                })
                .attr("transform", function(d,i) {
                    if(data_scale==='x'){
                        var xx = d > 0 ? plot[data_scale + 'scale'](0) - offset[i] : plot[data_scale + 'scale'](d);
                        var yy = plot[nondata_scale + 'scale'](plot.labels[i]);
                    } else {
                        var yy = d > 0 ? plot[data_scale + 'scale'](0) - offset[i] : plot[data_scale + 'scale'](d);
                        var xx = plot[nondata_scale + 'scale'](plot.labels[i]);
                    }
                    return `translate(${xx},${yy})`;
                })
                .style('fill',plot.color)
                /*
                .attr(nondata_scale, function(d,i){
                    return plot[nondata_scale + 'scale'](plot.labels[i])
                })
                .attr(data_scale, function(d,i){
                    return d > 0 ? plot[data_scale + 'scale'](0) - offset[i] : plot[data_scale + 'scale'](d);
                })
                */
                

    return plot;
    
}

const plot_loadings = function(loadings,labels,title){

    if(typeof(loadings)==='number'){
        loadings = [loadings];
    }

    var plot = new_plot();
    
    plot.svg_width = 300;
    plot.margin = loadings_margin;
    plot.svg = d3.select('#metric-loadings-tab').select('.tab-content').append('svg').attr('class','loadings-svg')
    plot.data = loadings;
    plot.svg_height = plot.data.length*12 + plot.margin.top + plot.margin.bottom;
    plot.labels = labels;
    plot.title = title;
    plot.xlabel = 'metric weight';

    plot = plot_bar(plot,'horizontal');

    const loadings_rects = plot.svg.selectAll('rect')

    loadings_rects
        .attr('fill',d3.rgb(irc[0],irc[1],irc[2],0.72))
        .on('mouseover', function(d,i){ loading_bar_mouseover(this,i,plot.yaxis) })
        .on('mouseout', function(d,i){ loading_bar_mouseout(this,i,plot.yaxis) })
        .on('click', function(d,i){ loading_bar_click(this,i,plot.yaxis) });

    // attach axis tick mouseover callback
    plot.yaxis
        .selectAll('text')
        .attr('selected',false)
            .on('mouseover', function(d,i){ loading_tick_mouseover(this,i,loadings_rects) })
            .on('mouseout', function(d,i){ loading_tick_mouseout(this,i,loadings_rects) })
            .on('click',function(d,i){ loading_tick_click(this,i,loadings_rects) });

    // draw indicator line at zero
    plot.yaxis
        .append('path')
            .attr('d',`M${plot.xscale(0)},0V${plot.height}`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill','none');
}


const append_plot_labels = function(plot){

    // append x-axis label
    if(plot.xlabel){
        plot.trans_g
            .append('text')
                .attr('text-anchor','middle')
                .attr('x',plot.width/2)
                .attr('y',plot.height+30)
                .attr('class','plot-xlabel')
                .text(plot.xlabel)
                .style('font-size','14px')
    }
    
    // append y-axis label
    if(plot.ylabel){
        plot.trans_g
            .append('text')
                .text(plot.ylabel)
                .attr('class','plot-ylabel')
                .attr('text-anchor','middle')
                .attr('transform',`translate(-40,${plot.yscale(plot.ymax)/2}) rotate(-90)`)
                .style('font-size','14px')
        }
    
    // append title
    if(plot.title){
        plot.trans_g
            .append('text')
                .attr('text-anchor','middle')
                .attr('x',plot.width/2)
                .attr('y',-5)
                .attr('class','plot-title')
                .text(plot.title)
                .style('font-size','14px')
    }
    

}

const plot_hist = function(plot){

    plot.width = plot.svg_width - plot.margin.left - plot.margin.right;
    plot.height = plot.svg_height - plot.margin.top - plot.margin.bottom;

    plot.svg
        .attr("width", plot.svg_width)
        .attr("height", plot.svg_height)

    plot.trans_g = plot.svg.append("g")
		.attr('class','axis')
        .attr("transform",`translate(${plot.margin.left},${plot.margin.top})`);

    // set x-axis upper and lower bounds
    if(plot.xmin === null){
        plot.xmin = plot.data.reduce((a,b) => { return Math.min(a,b) });
        if(plot.xmin>0) plot.xmin = 0;
    }
    if(plot.xmax){
        plot.xmax = plot.data.reduce((a,b) => { return Math.max(a,b) });
        if(plot.xmax<0) plot.xmax=0;
    }

    plot.xscale = d3.scaleLinear()
        .domain([plot.xmin, plot.xmax])
        .range([0, plot.width]);
    var hist = d3.histogram()
        .value(function(d){ return d; })
        .domain(plot.xscale.domain())
        .thresholds(plot.xscale.ticks(30));
    var binned_data = hist(plot.data);
    var y_max = Math.ceil(d3.max(binned_data, function(d){ return d.length })*1.1);
    plot.yscale = d3.scaleLinear()
        .domain([0, y_max])
        .range([plot.height, 0]);


    plot.trans_g.append('path')
        .attr('d',
            `M0,1
            H${plot.xscale(plot.xmax)-plot.xscale(plot.xmin)}
            V${plot.yscale(0)}
            H0
            V0`)
        .attr('stroke-width',1)
        .attr('stroke','#000000')
        .attr('fill',d3.rgb(30,30,30));

    plot.xaxis = plot.trans_g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${plot.height})`)
        .call(d3.axisBottom().scale(plot.xscale).ticks(10));

    plot.yaxis = plot.trans_g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft().scale(plot.yscale).ticks(5));

    append_plot_labels(plot);

    // initialize bar elements
    var bar = plot.trans_g.selectAll(".bar")
        .data(binned_data)
        .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) {
                return `translate(${plot.xscale(d.x0)},${plot.yscale(d.length)})`;
            });
    bar.append("rect")
        .attr("x", 1)
        .attr("width", function(d) {
            return Math.max(Math.abs(plot.xscale(d.x1) - plot.xscale(d.x0)) -1,0);
        })
        .attr("height", function(d) { return plot.height - plot.yscale(d.length); })
        .attr('fill',plot.color);
}


const update_full_metric_table = function(metric_name){

    d3.select('#scree-plot').select('p').style('visibility','hidden');

    d3.csv('metric_glossary.csv').then(function(metric_table){

        // add metric glossary entry
        var metric_idx;

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

}


const update_distilled_metric_table = function(metric_name){

    //var init_table = d3.select('#metric-summary-tab').select('table').select('p').nodes()[0].innerHTML === '';
    
    var cols = ['header','Name','Description','Variance explained','Group','Num. group PCs'];
    const pc_num = metric_name.match(/\d+/g)[0];
    var grp_name = metric_name.match(/([A-z]| )*(?=( \())/g)[0];
    if(grp_name.indexOf(' ') > -1){
        grp_name = grp_name.split(' ');
        grp_name[1] = grp_name[1].charAt(0).toUpperCase() + grp_name[1].slice(1);
        grp_name = grp_name.reduce(function(a,b){ return a + b },'');
    }
    
    const metric_desc = `Principal component #${pc_num} for the behavioral metrics of the ${grp_name} a priori group.`;
    var npcs, curr_grp_idx, var_exp, grp_var_exp;
    d3.select('#tab-header').select('select').each(function(d){
        curr_grp_idx = d.map( v => v.name).indexOf(grp_name);
        var_exp =  d[curr_grp_idx].variance_explained;
        npcs = d[curr_grp_idx].loadings.length;
        grp_var_exp = var_exp
            .filter(function(v,i){ return i < npcs })
            .reduce(function(a,b){ return a + b }, 0)
    });
    var table_data = [
        metric_name,
        metric_desc,
        `${Math.round(var_exp[pc_num]*10)/10}% (group total: ${Math.round(grp_var_exp*10)/10}%)`,
        grp_name,
        npcs
    ];

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
                                            .text(table_data[i])
                                    break;
                            }
                        })
            })

    // initialize plotting parameters
    d3.select('#scree-plot').select('p').style('visibility','visible');
    var plot = new_plot();
    plot.svg = d3.select('#scree-plot').append('svg').style('display','block')
    plot.svg_width = 500;
    plot.svg_height = 230;
    plot.margin = {top: 25, right: 5, bottom: 60, left: 50};
    plot.xmin = var_exp.reduce(function(a,b){ return Math.min(a,b), 0});
    plot.xmax = var_exp.reduce(function(a,b){ return Math.max(a,b), 1});
    plot.data = var_exp;
    plot.xlabel = 'Principal Component #';
    plot.ylabel = 'Variance Explained';
    plot.color = 'rgb(200,200,200)';
    plot.title = 'Scree Plot';
    plot.labels = d3.range(var_exp.length).map( i => i+1)
    plot = plot_bar(plot,'vertical');
    plot.trans_g.select('g').attr('class','')
    plot.svg.selectAll('rect')
        .style('fill',plot.color)
        .filter(function(d,i){ return i === pc_num - 1 })
        .style('fill','rgb(200,0,100)');
}


// switch apriori plots on dropdown menu change
const load_metric_summary = function(metric_name){

    update_apriori_menu(metric_name);

    // append histograms
    d3.select('#hist-div').selectAll('svg').remove()
    d3.select('#scree-plot').selectAll('svg').remove()

    if(get_matrix_type()==='full'){
        update_full_metric_table(metric_name);
    } else {
        update_distilled_metric_table(metric_name);
    }
    
    d3.json('decathlon_raw_data.json').then(function(raw){

        // initialize plot parameters and data
        var x_min = 0;
        var x_max = 1;
        var d_raw = [];
        var ylabels; 
        if(get_matrix_type()==='full'){
            ylabels = ['inbred batch[1]','inbred batch[2]','outbred batch[1]'];
        } else {
            ylabels = ['inbred batch[1]','outbred batch[1]'];
        }
        
        var plot_colors = ['rgb(130,200,130)','rgb(220,150,100)','rgb(200,180,110)']

        // get matrix type
        var matrix_type = get_matrix_type();

        for(let i=0; i<raw[matrix_type].length; i++){
 
            var metric_idx = raw[matrix_type][i].fields.indexOf(metric_name);
            var raw_data = raw[matrix_type][i].data.map( d => { return d[metric_idx] }).filter( d => { return d !== null});
            d_raw.push(raw_data)

            if(raw_data.some( d => {return d})){
                x_max = Math.max(d3.max(raw_data),x_max);
                x_min = Math.min(d3.min(raw_data),x_min);
            }
        }


        // init plotting params
        var plot = new_plot();
        plot.svg_width = 500;
        plot.xlabel = null;
        plot.xmin = x_min;
        plot.xmax = x_max;

        for(let i=0; i<raw[matrix_type].length; i++){
            if(d_raw[i].some( d => {return d})){
                plot.ylabel = ylabels[i];
                plot.color = plot_colors[i];
                plot.svg = d3.select('#hist-div').append('svg');
                plot.data = d_raw[i];
                plot.title = null;
                plot.svg_height = 180;
                plot.margin = {top: 5, right: 5, bottom: 30, left: 50};
                if(i+1===raw[matrix_type].length){
                    plot.xlabel = metric_name;
                    plot.margin.bottom = plot.margin.bottom + 30;
                    plot.svg_height = plot.svg_height + 30;
                } else if(i===0){
                    plot.title = 'Raw Data Histograms';
                    plot.margin.top = plot.margin.top + 20;
                    plot.svg_height = plot.svg_height + 20;
                }
                plot_hist(plot);
                plot.svg.select('.plot-ylabel').style('fill',plot.color)
            }
        }
    })

    // update notification tab if metric summary not active
	var summary_is_active = d3.select('#tab-div')
        .select('ul').select('li.active').nodes()[0].innerText === 'Metric Summary';
    if(!summary_is_active) add_tab_notification('Metric Summary');
}

d3.select('#metric-summary-tab')
    .select('select')
        .on('change',function(){ load_metric_summary(this.value) })

d3.selectAll('.buttons')
    .each(function(){
        d3.select(this)
            .selectAll('div')
                .on('mouseover', function(){ d3.select(this).attr('class','active') })
                .on('mouseout', function(){ d3.select(this).attr('class','inactive') })
    })
    

d3.select('#gene-search-import')
    .on('click', function(){ 
        d3.select('#fileid').nodes()[0].click()
     })


const init_gene_search_table = function(){

    const row_labels = ['Gene Name:','Gene Symbol:','FlyBase-ID:','KEGG-ID:','Num. Behaviors:','Enriched KEGG Pathways'];
    d3.select('#gene-search-tab')
        .select('table')
         .selectAll('tr')
            .data(row_labels)
            .enter()
        .append('tr')
            .each(function(d,i){
                if(i<5){
                    for(let j=0; j<2; j++){
                        if(!j){
                            d3.select(this)
                                .append('td')
                                    .style('width','38%')
                                .append('a').text(d)
                        } else {
                            d3.select(this).append('td').append('a').text('-')
                        }
                    }
                } else {
                    var pathway_table = d3.select(this)
                        .append('td')
                            .attr('colspan',2)
                            .style('margin-top','40px')
                            .style('width','450px')
                            .style('position','relative')
                            .text(d)

                    pathway_table
                        .append('div')
                            .attr('class','buttons')
                            .style('float','right')
                            .style('vertical-align','top')
                        .append('div')
                            .attr('class','inactive')
                            .attr('id','view-pathway-button')
                            .text('View Pathway')
                            .style('margin-top','0px')
                            .on('click',function(){
                                var selected_row = d3.select(this.parentNode.parentNode)
                                    .select('tr[selected=true]');
                                
                                if(selected_row.size()){
                                    var cat_name = selected_row.select('td').nodes()[0].innerText;
                                    var enrichment_dropdown = d3.select('#enrichment-tab-select').nodes()[0];
                                    enrichment_dropdown.value = cat_name;
                                    var enrichment_change = new Event('change',{value: cat_name});
                                    enrichment_dropdown.dispatchEvent(enrichment_change);
                                    d3.select('#tab-div').select('ul').selectAll('li')
                                        .filter(function(){ return this.innerText.includes('Enrichment')})
                                        .nodes()[0].click();
                                } 
                            })
                            .on('mouseover',function(){ d3.select(this).attr('class','active') })
                            .on('mouseout',function(){ d3.select(this).attr('class','inactive') })
                    pathway_table
                        .append('table')
                            .attr('class','scroll-table')
                        .append('thead')
                            .selectAll('th')
                                .data(['Name','Pathway ID'])
                                .enter()
                            .append('th')
                                .style('height','20px')
                                .style('font-size','12px')
                                .text(function(v){ return v })
                    d3.select(this)
                        .select('.scroll-table')
                        .append('tbody')
                            .attr('class','inactive')
                            .style('width','460px')
                            
                }

            })
}


const update_selected_gene = function(gene_idx,rnaseq){

    const dataset_idx = get_dataset_idx();

    var plot = new_plot();
    if(d3.select('#pval-plot').size()){
        plot.svg = d3.select('#pval-plot')
        plot.svg.select('.axis').remove()
    }
    
    if(gene_idx < rnaseq.num_modeled){

        var sig_idx = rnaseq.model[dataset_idx].log_p[gene_idx].reduce(function(arr,d,i){
            if(d>0) arr.push(i);
            return arr;
        }, []);
        var sig_logp = sig_idx.map( i => { return rnaseq.model[dataset_idx].log_p[gene_idx][i] })
        var sig_fields = sig_idx.map( i => { return rnaseq.fields[i] })      
        var sorted_order = get_sort_permutation(sig_logp.slice());
        var sorted_logp = sorted_order.map( v => { return sig_logp[v] });
        var sorted_fields = sorted_order.map( v => { return sig_fields[v] });
    
        
        plot.svg_width = 320;
        plot.margin = {top: 50, right: 10, bottom: 60, left: 160};

        if(!d3.select('#pval-plot').size()){
            plot.svg = d3.select('#gene-search-results-div').append('svg')
        }
        plot.data = sorted_logp;
        plot.svg_height = plot.data.length*12 + plot.margin.top + plot.margin.bottom;
        plot.labels = sorted_fields;
        plot.title = 'Significant Behaviors';
        plot.xlabel = '-log[p-value]';

        plot = plot_bar(plot,'horizontal');
        var plot_rects = plot.svg
            .attr('id','pval-plot')
            .attr('transform-origin','top right')
            .attr('transform','scale(1.15)')
            .style('padding','0px')
        .selectAll('rect')
            .style('fill','rgba(150,150,220,0.72)')
            .on('mouseover', function(d,i){ loading_bar_mouseover(this,i,plot.yaxis) })
            .on('mouseout', function(d,i){ loading_bar_mouseout(this,i,plot.yaxis) })
            .on('click', function(d,i){ pval_bar_click(this,i,plot.yaxis) })

        plot.yaxis
            .selectAll('text')
                .on('mouseover', function(d,i){ loading_tick_mouseover(this,i,plot_rects) })
                .on('mouseout', function(d,i){ loading_tick_mouseout(this,i,plot_rects) })
                .on('click', function(d,i){ pval_tick_click(this) })
    } else {
        var sig_logp = ['**gene not modeled**']
    }

    var gene_fbgn = 'FBgn' + rnaseq['fbgn'][gene_idx].toFixed(0).padStart(7,'0');
    var gene_hit_idx = rnaseq['hits'][dataset_idx]['gene_idx'].indexOf(gene_idx+1);

    var gene_cats = ['none'];
    var cat_ids = [null]
    if(gene_hit_idx>=0){
        var gene_cat_idx = rnaseq['hits'][dataset_idx]['cat_idx'][gene_hit_idx];
        if(typeof(gene_cat_idx)==='number') gene_cat_idx = [gene_cat_idx];
        cat_ids = gene_cat_idx.map( i => { return rnaseq['hits'][dataset_idx]['cat_ids'][i-1] });
        gene_cats = gene_cat_idx.map( i => { return rnaseq['hits'][dataset_idx]['cat_names'][i-1] });
    }

    var gene_id_types = ['name','symbol','fbgn','kegg'];
    var gene_ids = gene_id_types.map( v => { return rnaseq[v][gene_idx] });
    gene_ids.push(sig_logp,gene_cats);

    d3.select('#gene-search-tab')
    .select('table')
    .selectAll('tr')
        .data(gene_ids)
        .each(function(d,i){
            d3.select(this).selectAll('td')
                .each(function(dd,j){
                    if(j & i < 5){
                        var href = null;
                        switch(i){
                            case 2:
                                d = 'FBgn' + d.toFixed(0).padStart(7,'0');
                                href = 'https://flybase.org/reports/' + d;
                                d3.select(this).select('a').attr('class','active-link').attr('target','_blank')
                                break;
                            case 3:
                                d = 'Dmel_' + d;
                                href = 'https://www.genome.jp/dbget-bin/www_bget?dme:' + d;
                                d3.select(this).select('a').attr('class','active-link').attr('target','_blank')
                                break;
                            case 4:
                                if(typeof(d[0])==='number'){
                                    d = d.length;
                                } else if (typeof(d[0]==='string')){
                                    d = d[0];
                                }
                                break;
                            default:
                                href = null;
                                break;
                        }
                        d3.select(this)
                        .select('a')
                            .attr('href',href)
                            .nodes()[0].innerHTML = d;
                    } else if (i===5){
                        var data_rows = d3.select(this)
                            .select('tbody')
                            .selectAll('.data-row')
                                .data(d)
                        
                        // add new entries
                        data_rows
                            .enter()
                            .append('tr')
                                .attr('class','data-row')
                                .style('height','20px')
                                .attr('selected','false')
                                .each(function(row_dat,row_num){
                                    for(let col_num=0; col_num<2; col_num++){
                                        if(col_num){
                                            d3.select(this)
                                                .append('td')
                                                    .attr('class','inactive')
                                                    .style('width','225px')
                                                .append('a')
                                                    .style('font-size','12px')
                                                    .attr('class','active-link')
                                                    .attr('href',`https://www.genome.jp/kegg-bin/show_pathway?${cat_ids[row_num]}`)
                                                    .attr('target','_blank')
                                                    .text(cat_ids[row_num]);
                                        } else {
                                            d3.select(this).append('td')
                                                .attr('class','inactive')
                                                .style('width','225px')
                                                .style('font-size','12px')
                                                .text(row_dat);
                                        }
                                    }
                                    
                                })
                                .on('mouseover',function(){
                                    if(d3.select(this).attr('selected')!=='true'){
                                        d3.select(this).selectAll('td').attr('class','active');
                                    }
                                })
                                .on('mouseout',function(){
                                    if(d3.select(this).attr('selected')!=='true'){
                                        d3.select(this).selectAll('td').attr('class','inactive');
                                    }
                                })
                                .on('click',function(){

                                    d3.select(this.parentNode).selectAll('td').attr('class','inactive');
                                    if(d3.select(this).attr('selected')==='true'){
                                        d3.select(this.parentNode).selectAll('tr').attr('selected','false');
                                    } else {
                                        d3.select(this.parentNode).selectAll('tr').attr('selected','false');
                                        d3.select(this).attr('selected','true').selectAll('td').attr('class','active')
                                    }               

                                })

                        // remove old entries
                        data_rows.exit().remove()

                        // update old entries
                        data_rows
                            .attr('selected','false')
                            .each(function(row_dat,row_num){
                            for(let col_num=0; col_num<2; col_num++){
                                if(col_num){
                                    d3.select(this).select('a')
                                            .attr('href',`https://www.genome.jp/kegg-bin/show_pathway?${cat_ids[row_num]}`)
                                            .text(cat_ids[row_num]);
                                } else {
                                    d3.select(this)
                                        .select('td')
                                            .text(row_dat);
                                }
                            }
                        })
                        .selectAll('td')
                            .attr('class','inactive')
                    }
                })
        })

    d3.select('#num-behaviors')
    .selectAll('rect')
        .style('fill','rgb(200,200,200)')
        .each(function(d,i){
            if(i===sig_logp.length & gene_idx < rnaseq.num_modeled){
                d3.select(this).style('fill','rgb(200,0,100)')
            }
        })
}


const find_all_genes = function(gene_ids,rnaseq){

    var gene_idx = [];
    for(let i=0; i<gene_ids.length; i++){

        // get input type
        var input_type, input_txt;
        input_txt = gene_ids[i].toLowerCase();
        if(input_txt.includes('fbgn')){
            input_type = 'fbgn';
            input_txt = input_txt.match(/(?<=(fbgn0))\d*/g);
            input_txt = parseInt(input_txt,10);
            gene_idx.push(rnaseq[input_type].indexOf(input_txt));
        } else if(input_txt.includes('dmel')){
            input_type = 'kegg';
            input_txt = input_txt.match(/(?<=(dmel_)).*/g)[0];
            gene_idx.push(rnaseq[input_type].map( v => { return v.toLowerCase() }).indexOf(input_txt));
        } else {
            input_type = 'symbol';
            gene_idx.push(rnaseq[input_type].map( v => { return v.toLowerCase() }).indexOf(input_txt));
        }
        
    }

    return gene_idx;
}

const parse_input_list = function(input_txt){

    var split_txt = input_txt.split(/\n| /);
    return split_txt;   
}

const update_matching_id_div = function(gene_idx,gene_list,rnaseq){

    d3.select('#gene-result-textbox').selectAll('div').remove()

    d3.select('#gene-result-textbox')
        .selectAll('div')
            .data(gene_idx)
            .enter()
        .append('div')
            .each(function(d,i){
                if(i){
                    d3.select(this).attr('class','inactive').attr('selected',false);
                } else {
                    d3.select(this).attr('class','active').attr('selected',true);
                }
            })
            .text(function(d,i){ return gene_list[i] })
            .on('click',function(d){

                d3.select('#gene-result-textbox')
                    .selectAll('div')
                        .attr('class','inactive')
                        .attr('selected',false)
                        .style('color','rgba(255,255,255,0.38)');
                d3.select(this)
                    .attr('class','active')
                    .attr('selected',true)
                    .style('color','rgba(255,255,255,0.72)');

                update_selected_gene(d,rnaseq);
            })
            .on('mouseover',function(){ d3.select(this).style('color','rgba(255,255,255,0.87)') })
            .on('mouseout',function(){
                if(d3.select(this).attr('selected') === 'true' ){
                    d3.select(this).style('color','rgba(255,255,255,0.72)');
                } else {
                    d3.select(this).style('color','rgba(255,255,255,0.38)');
                }
            })

}


// GENE SEARCH TAB
const search_genes = function(input_txt){

    d3.json('decathlon_rnaseq_results.json').then(function(rnaseq){
        
        var input_list = parse_input_list(input_txt);
        var matched_idx = find_all_genes(input_list,rnaseq)
        var matched_list = matched_idx.reduce(function(arr,d,i){
            if(d>=0) arr.push(input_list[i]);
            return arr;
        }, []);
        matched_idx = matched_idx.filter( i => { return i>=0; });
        update_matching_id_div(matched_idx,matched_list,rnaseq);

        if(matched_idx.length){
            d3.select('#gene-search-results-div').selectAll('svg').remove()

        // get dataset index
        const dataset_idx = get_dataset_idx();

        // plot num behaviors/gene histogram
        var p = rnaseq.model[dataset_idx].log_p.slice();
        for(let i=0; i<p.length; i++){
            p[i] = p[i].reduce(function(a,b){ return a + Number(b>0) }, 0);
        }
        
        // initialize plotting parameters
        var plot = new_plot();
        plot.svg = d3.select('#gene-search-results-div').append('svg').style('display','block')
        plot.svg_width = 320;
        plot.svg_height = 270;
        plot.margin = {top: 35, right: 10, bottom: 100, left: 50};
        plot.xmin = p.reduce(function(a,b){ return Math.min(a,b), 0});
        plot.xmax = p.reduce(function(a,b){ return Math.max(a,b), 1});
        plot.data = p;
        plot.xlabel = 'Num. Behaviors';
        plot.ylabel = 'Count';
        plot.color = 'rgb(200,200,200)';
        plot_hist(plot);
        plot.svg
            .selectAll('text')
            .style('font-size','12px')
        plot.svg.select('.x-axis')
            .selectAll('text')
            .style('font-size','10px')
        plot.svg.select('.y-axis')
            .selectAll('text')
            .style('font-size','10px')
        plot.svg
            .attr('id','num-behaviors')
            .attr('transform-origin','top right')
            .attr('transform','scale(1.25)');
        
        // append data to the search tab
        d3.select('#gene-search-tab').data(rnaseq);

        update_selected_gene(matched_idx[0],rnaseq);
        }

    })
}



const append_selected_genes = function(){

    var selected_genes = [];
    d3.select(this.parentNode.parentNode.parentNode)
        .selectAll('.data-row[selected=true]')
        .each(function(){
            d3.select(this).selectAll('td').each(function(d,i){
                if(i===1) selected_genes.push(this.innerText);
            })
        })

    if(selected_genes.length){
        var selected_genes_txt = selected_genes.reduce(function(a,b){ return a + b + '\n'},[])
        var curr_genelist = d3.select('#gene-search-textbox').nodes()[0].value;
        if(curr_genelist.length){
            curr_genelist = curr_genelist.concat('\n',selected_genes_txt);
        } else {
            curr_genelist = curr_genelist.concat(selected_genes_txt);
        }
        d3.select('#gene-search-textbox').nodes()[0].value = curr_genelist;
    }

    // update notification tab if enrichment not active
	var summary_is_active = d3.select('#tab-div')
        .select('ul').select('li.active').nodes()[0].innerText.includes('Gene');
    if(!summary_is_active) add_tab_notification('Gene Search');
}


const select_table_range = function(obj,this_fbgn,prev_fbgn){
    var all_table_fbgn = [];
    d3.select(obj.parentNode).selectAll('.data-row')
        .each(function(){
            d3.select(this).selectAll('td').each(function(d,i){
                if(i===2) all_table_fbgn.push(this.innerText);
            })
        })
    var row_idx = all_table_fbgn.indexOf(this_fbgn);
    var prev_row_idx = all_table_fbgn.indexOf(prev_fbgn);
    var select_range = d3.range(Math.min(row_idx,prev_row_idx),Math.max(row_idx,prev_row_idx)+1);
    var prev_select_status = d3.select(obj.parentNode)
        .selectAll('.data-row')
        .filter(function(d,i){ return i === prev_row_idx })
            .attr('selected')
    d3.select(obj.parentNode)
        .selectAll('.data-row')
        .filter(function(d,i){ return select_range.some(j=>{return j===i})})
        .attr('selected',prev_select_status)
        .each(function(){
            if(prev_select_status==='true'){
                d3.select(this).selectAll('td').attr('class','active');
            } else {
                d3.select(this).selectAll('td').attr('class','inactive');
            }
        })
}


const enrichment_table_click = function(obj){

    // determine which table the click occurred in
    var ncols = d3.select(obj).selectAll('td').size()
    switch(ncols){
        case 2:

            d3.select(obj.parentNode).selectAll('td').attr('class','inactive');
            if(d3.select(obj).attr('selected')==='true'){
                d3.select(obj).attr('selected','false');
            } else {
                d3.select(obj).attr('selected','true').selectAll('td').attr('class','active')
            }               
            break;
        case 5:
            
            var is_selected = d3.select(obj).attr('selected') === 'true';
            var this_fbgn;
            d3.select(obj).selectAll('td.active').each(function(d,i){
                if(i===2) this_fbgn = this.innerText;
            });

            if(d3.event.shiftKey & prev_gene_hit_click!==null){
                // handle shift click case
                select_table_range(obj,this_fbgn,prev_gene_hit_click);
            } else {
                // handle single click case
                if(is_selected){
                    d3.select(obj).attr('selected','false').selectAll('td').attr('class','inactive')
                } else {
                    d3.select(obj).attr('selected','true').selectAll('td').attr('class','active')
                }
                prev_gene_hit_click = this_fbgn;
            }
            break;
        case 4:
            
            var is_selected = d3.select(obj).attr('selected') === 'true';
            var this_fbgn;
            d3.select(obj).selectAll('td.active').each(function(d,i){
                if(i===2) this_fbgn = this.innerText;
            });

            if(d3.event.shiftKey & prev_gene_all_click!==null){
                // handle shift click case
                select_table_range(obj,this_fbgn,prev_gene_all_click);
            } else {
                // handle single click case
                if(is_selected){
                    d3.select(obj).attr('selected','false').selectAll('td').attr('class','inactive')
                } else {
                    d3.select(obj).attr('selected','true').selectAll('td').attr('class','active')
                }
                prev_gene_all_click = this_fbgn;
            }
            break;
    }
}


const update_enrichment_table_row = function(this_ele,rnaseq,cat_idx,table_num,row_dat,row_num,col_num){

    

    var new_txt, href;
    new_txt = '-';
    if(table_num){
        
        // Category Gene Hits / All Genes tables
        switch(col_num){
            case 0:
                if(rnaseq.name[row_dat]!=='-'){
                    new_txt = rnaseq.name[row_dat];
                } else {
                    new_txt = rnaseq.symbol[row_dat];
                }
                d3.select(this_ele).text(new_txt);
                break;
            case 1:
                if(rnaseq.symbol[row_dat]) new_txt = rnaseq.symbol[row_dat];
                d3.select(this_ele).text(new_txt);
                break;
            case 2:
                if(rnaseq.fbgn[row_dat]>-1){
                    new_txt = 'FBgn' + rnaseq.fbgn[row_dat].toFixed(0).padStart(7,'0');
                    href = 'https://flybase.org/reports/' + new_txt;
                }
                d3.select(this_ele).select('a')
                    .attr('href',href)
                    .attr('class','active-link')
                    .attr('target','_blank')
                    .text(new_txt);
                break;
            case 3:
                if(rnaseq.kegg[row_dat]!==undefined){
                    new_txt = 'Dmel_' + rnaseq.kegg[row_dat];
                    href = 'https://www.genome.jp/dbget-bin/www_bget?dme:' + new_txt;
                }
                d3.select(this_ele).select('a')
                    .attr('href',href)
                    .attr('class','active-link')
                    .attr('target','_blank')
                    .text(new_txt);
                break;
            case 4:
                var sorted_p = rnaseq.hits[0].p_gene[cat_idx].filter( v => { return v > 0 }).sort();
                sorted_p = sorted_p.map((v,i)=>{ return sorted_p[sorted_p.length-i-1] })
                d3.select(this_ele).text(sorted_p[row_num].toFixed(3));
                break;
        }
    } else {

        // handle the metric info
        if(col_num){
            //new_txt = cat_metric_p[row_num].toFixed(3);
            new_txt = rnaseq.hits[0].p_metric[cat_idx][row_dat].toFixed(3);
        } else {
            new_txt = rnaseq.fields[row_dat];
        }
        d3.select(this_ele).text(new_txt);
    }
}


const update_enrichment_table = function(cat_name,rnaseq){

    // get index of current category
    var cat_idx = rnaseq.hits[0].cat_names.indexOf(cat_name);
    
    // sort gene hit idx in descending order of bootstrap probability
    var cat_gene_p = rnaseq.hits[0].p_gene[cat_idx].filter( v => { return v > 0 });
    var gene_hit_sort_perm = get_sort_permutation(cat_gene_p);
    var cat_gene_hit_idx = gene_hit_sort_perm.map( v => { return rnaseq.hits[0].cat_gene_idx[cat_idx][v] });

    // sort metric idx in descending order of bootstrap probability
    var cat_metric_idx = rnaseq.hits[0].p_metric[cat_idx].map((v,i)=>{ if(v>0.02) return i }).filter(v=>{ return v!==undefined });
    var cat_metric_p = cat_metric_idx.map( v => { return rnaseq.hits[0].p_metric[cat_idx][v] });
    var metric_sort_perm = get_sort_permutation(cat_metric_p);
    cat_metric_idx = metric_sort_perm.map( v => { return cat_metric_idx[v] });

    // sort gene all idx in alphabetic order
    var cat_gene_all_idx = rnaseq.hits[0].cat_all_gene_idx[cat_idx].slice();
    var cat_gene_all = cat_gene_all_idx.map( v => { return rnaseq.symbol[v-1].toLowerCase() });
    var sorted_gene_all = cat_gene_all.slice().sort();
    
    var cat_gene_all_sort_perm = sorted_gene_all.map( v => { return cat_gene_all.indexOf(v) });
    cat_gene_all_idx = cat_gene_all_sort_perm.map( v => { return cat_gene_all_idx[v] });

    var col_widths = [
        [140,50],
        [175,65,75,75,50],
        [170,75,75,75],
    ]

    // update summary data at the top
    d3.select('#enrichment-tab').select('table').selectAll('a')
        .text(function(d,i){
            switch(i){
                case 0:
                    d3.select(this)
                        .attr('class','active-link')
                        .attr('target','_blank')
                        .attr('href','https://www.genome.jp/kegg-bin/show_pathway?' + rnaseq.hits[0].cat_ids[cat_idx])
                    return rnaseq.hits[0].cat_ids[cat_idx]
                    break;
                case 1:
                    if(rnaseq.hits[0].p_cat[cat_idx]>2){
                        return Math.pow(10,-rnaseq.hits[0].p_cat[cat_idx]).toExponential(2);
                    } else {
                        return Math.pow(10,-rnaseq.hits[0].p_cat[cat_idx]).toFixed(2);
                    }
                    
                    break;
                case 2:
                    return rnaseq.hits[0].n_metrics[cat_idx].toFixed(2);
                    break;
            }
        })

    var table_data = [cat_metric_idx,cat_gene_hit_idx,cat_gene_all_idx]

    // update table
    d3.select('#enrichment-tab').selectAll('.scroll-table')
        .each(function(table_dat,table_num){

            var data_rows = d3.select(this)
                .select('tbody')
                .selectAll('.data-row')
                    .data(table_data[table_num])

            var ncols = d3.select(this).select('thead').selectAll('th').size();
            var table_width = d3.select(this.parentNode).style('width').match(/\d*/g)[0];
            var table_height = d3.select(this).select('tbody').style('height').match(/\d*/g)[0];
            table_width = parseInt(table_width,10)-10;
            table_width = parseInt(table_height,10);
            d3.select(this).select('thead').selectAll('th')
                .style('width',function(d,col_num){ return col_widths[table_num][col_num] +'px' })
            
            // append new elements
            data_rows
                .enter()
            .append('tr')
                .attr('class','data-row')
                .attr('selected',false)
                .on('mouseover',function(){
                    if(d3.select(this).attr('selected')==='false'){
                        d3.select(this).selectAll('td').attr('class','active');
                    }  
                })
                .on('mouseout',function(){
                    if(d3.select(this).attr('selected')==='false'){
                        d3.select(this).selectAll('td').attr('class','inactive');
                    }
                })
                .each(function(row_dat,row_num){
                    if(table_num){
                        row_dat = row_dat - 1;
                    }
                    d3.select(this).selectAll('td')
                        .data(d3.range(ncols))
                        .enter()
                    .append('td')
                        .attr('class','inactive')
                        .style('width',function(col_num){ return col_widths[table_num][col_num] +'px' })
                        .each(function(col_num){
                           if(table_num){
                               if(col_num===2 | col_num===3){
                                d3.select(this).append('a')
                               }
                           }
                           update_enrichment_table_row(this,rnaseq,cat_idx,table_num,row_dat,row_num,col_num);
                        })
                    })
                
            
            // delete empty elements
            data_rows.exit().remove()

            // update data
            data_rows
                .attr('selected',false)
                .each(function(row_dat,row_num){
                if(table_num){
                    row_dat = row_dat - 1;
                }
                d3.select(this)
                    .selectAll('td')
                        .attr('class','inactive')
                    .each(function(col_num){
                        update_enrichment_table_row(this,rnaseq,cat_idx,table_num,row_dat,row_num,col_num);
                    })
            })

            if(d3.select(this).select('tbody').nodes()[0].scrollHeight<=table_height){
                d3.select(this).select('tbody').attr('class','inactive');
            } else {
                d3.select(this).select('tbody').attr('class','active');
            }
        })

        d3.selectAll('.data-row').on('click',function(){
            enrichment_table_click(this);
        })

}


const init_enrichment_table = function(){

    d3.json('decathlon_rnaseq_results.json').then(function(rnaseq){

        // dropdown menu for categories
        d3.select('#enrichment-tab')
            .select('select')
                .on('change',function(d){ update_enrichment_table(this.value,rnaseq) })
            .selectAll('option')
                .data(rnaseq.hits[0].cat_names)
                .enter()
            .append('option')
                .attr('value',function(d){ return d })
                .text(function(d){ return d })

        d3.select('#append-gene-hits').on('click',append_selected_genes);
        d3.select('#append-gene-all').on('click',append_selected_genes);
        d3.select('#view-metric-summary').on('click',function(){
            // execute click on metric summary tab and load selected summary
            var selected_row = d3.select('#cat-metrics').selectAll('td.active')
            if(selected_row.size()){
                selected_row.each(function(d,i){
                    if(!i) update_selected_metric(this.innerText,false);
                });

                d3.select('#tab-div').select('ul').selectAll('li')
                    .filter(function(d,i){ return i===1 })
                    .nodes()[0].click();
            }
        })

        // init table rows
        var table_rows = ['Name','KEGG Pathway-ID','Bootstrap min. <i>p</i>-value','Num. Metrics'];

        // table of sequenced genes associated with cat
        d3.select('#enrichment-tab')
            .select('table')
            .selectAll('tr')
                .data(table_rows)
                .enter()
            .append('tr')
                .each(function(d,i){
                    d3.select(this)
                        .selectAll('td')
                            .data([0,1])
                            .enter()
                        .append('td')
                            .style('width','50%')
                            .each(function(v){
                                if(v){
                                    d3.select(this).append('a')
                                        .attr('href',null)
                                        .text('-');
                                } else {
                                    d3.select(this).append('p')
                                        .nodes()[0].innerHTML = d+':';
                                }
                            })
                        })


        update_enrichment_table(rnaseq.hits[0].cat_names[0],rnaseq);
    })

}

d3.select('#gene-search-submit')
    .on("click",function(d){ search_genes(d3.select('#gene-search-textbox').nodes()[0].value) })

var fileInput = document.getElementById('fileid');
var fileDisplayArea = document.getElementById('gene-search-textbox');

fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];
    var file_ext = file.name.split('.').pop();

    if (file_ext === 'txt' | file_ext === 'csv') {
        var reader = new FileReader();

        reader.onload = function(e) {
            fileDisplayArea.value = reader.result;
        }

        reader.readAsText(file);
    }
});


