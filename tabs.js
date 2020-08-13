const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');
var curr_gene_name, curr_gene_idx;


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
const pval_bar_click = function(d,i,y_grp){

    const text_elem = y_grp.selectAll('text').filter(function(dd,ii){ return i === ii })

    update_apriori_menu(text_elem.nodes()[0].innerHTML)

    // execute click on metric summary tab and load selected summary
    d3.select('#tab-div').select('ul').selectAll('li')
        .filter(function(d,i){ return i===1 })
        .nodes()[0].click();
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
const pval_tick_click = function(d){

    update_apriori_menu(d.innerHTML)

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

const plot_hbar = function(plot){

    plot.svg_height = plot.data.length*12 + plot.margin.top + plot.margin.bottom;
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

    plot.yscale = d3.scaleBand()
        .domain(plot.labels)
        .range([0,plot.height])
        .paddingOuter(.1)
        .paddingInner(.1)

    plot.xscale = d3.scaleLinear()
        .domain([plot.xmin,plot.xmax])
        .range([0,plot.width])

    // initialize axes
	plot.yaxis = plot.trans_g
        .append('g')
            .attr('class','y-axis')
            .call(d3.axisLeft(plot.yscale).ticks(0).tickSize(0));

    plot.trans_g
        .append('g')
            .attr('transform','translate(0,' + plot.height + ')')
            .call(d3.axisBottom(plot.xscale).ticks(5));

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

    // append axis labels
    plot.trans_g
        .append('text')
            .attr('text-anchor','middle')
            .attr('x',plot.width/2)
            .attr('y',plot.height+30)
            .attr('id','loadings-xlabel')
            .text(plot.xlabel)
            .style('font-size','12px')
    // append axis labels
    plot.trans_g
        .append('text')
            .attr('text-anchor','middle')
            .attr('x',plot.width/2)
            .attr('y',-5)
            .attr('id','loadings-xlabel')
            .text(plot.title)
            .style('font-size','12px')

    // initialize plot bars
    plot.trans_g
        .append('g')
            .attr('class','loadings-bar-parent')
            .selectAll('rect')
                .data(plot.data)
                .enter()
            .append('rect')
                .attr('selected',false)
                .attr('height',function(d,i){
                    return plot.yscale.bandwidth(i);
                })
                .attr('width',function(d,i){
                    return Math.abs(plot.xscale(0)-plot.xscale(d));
                })
                .attr('y', function(d,i){
                    return plot.yscale(plot.labels[i])
                })
                .attr('x', function(d,i){
                    return d > 0 ? plot.xscale(0) : plot.xscale(d);
                })

    return plot;
    
}

const plot_loadings = function(loadings,labels,title){


    var plot = new_plot();
    
    plot.svg_width = 300;
    plot.margin = loadings_margin;
    plot.svg = d3.select('#metric-loadings-tab').select('.tab-content').append('svg').attr('class','loadings-svg')
    plot.data = loadings;
    plot.labels = labels;
    plot.title = title;
    plot.xlabel = 'metric weight';

    plot = plot_hbar(plot);

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
            .on('click',loading_tick_click);

    // draw indicator line at zero
    plot.yaxis
        .append('path')
            .attr('d',`M${plot.xscale(0)},0V${plot.height}`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill','none');
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
    plot.trans_g.append('text')
        .text(plot.ylabel)
        .attr('text-anchor','middle')
        .attr('transform',`translate(-40,${plot.yscale(0)/2}) rotate(-90)`)
        .style('font-size','14px')
        .style('fill',plot.color);

    plot.trans_g.append('text')
        .text(plot.xlabel)
        .attr('text-anchor','middle')
        .attr('transform',`translate(${plot.xscale(plot.xmax)/2},${plot.yscale(0)+50})`)
        .style('font-size','14px');

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


// switch apriori plots on dropdown menu change
const load_metric_summary = function(metric_name){

    update_apriori_menu(metric_name);

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

        // initialize plot parameters and data
        var x_min = 0;
        var x_max = 1;
        var d_raw = [];
        var ylabels = ['inbred batch[1]','inbred batch[2]','outbred batch[1]'];
        var plot_colors = ['rgb(220,150,220)','rgb(220,150,120)','rgb(150,150,220)']

        for(let i=0; i<raw.length; i++){
            var metric_idx = raw[i].fields.indexOf(metric_name);
            var raw_data = raw[i].data.map( d => { return d[metric_idx] }).filter( d => { return d !== null});
            d_raw.push(raw_data)

            if(raw_data.some( d => {return d})){
                x_max = Math.max(d3.max(raw_data),x_max);
                x_min = Math.min(d3.min(raw_data),x_min);
            }
        }

        // init plotting params
        var plot = new_plot();
        plot.svg_width = 500;
        plot.svg_height = 180;
        plot.margin = {top: 5, right: 5, bottom: 30, left: 50};
        plot.xlabel = null;
        plot.xmin = x_min;
        plot.xmax = x_max;

        for(let i=0; i<3; i++){
            if(d_raw[i].some( d => {return d})){
                plot.ylabel = ylabels[i];
                plot.color = plot_colors[i];
                plot.svg = d3.select('#hist-div').append('svg');
                plot.data = d_raw[i];
                if(i+1===raw.length){
                    plot.xlabel = metric_name;
                    plot.margin.bottom = 60;
                }
                plot_hist(plot);
            }
        }
    })
}

d3.select('#metric-summary-tab')
    .select('select')
        .on('change',function(){ load_metric_summary(this.value) })

d3.select('.buttons')
    .selectAll('div')
        .on('mouseover', function(){ d3.select(this).attr('class','active') })
        .on('mouseout', function(){ d3.select(this).attr('class','inactive') })

d3.select('#gene-search-import')
    .on('click', function(){ 
        d3.select('#fileid').nodes()[0].click()
     })


const init_gene_search_table = function(){

    const row_labels = ['Gene Name:','Gene Symbol:','FlyBase-ID:','KEGG-ID:','Num. Behaviors:','Enrichment Categories:'];
    d3.select('#gene-search-tab')
        .select('table')
         .selectAll('tr')
            .data(row_labels)
            .enter()
        .append('tr')
            .each(function(d){
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
            })

}


const update_selected_gene = function(gene_idx,rnaseq){

    var dataset_idx = d3.select('#matrix-header').select('select').nodes()[0].value % 2;

    var sig_idx = rnaseq.model[dataset_idx].log_p[gene_idx].reduce(function(arr,d,i){
        if(d>0) arr.push(i);
        return arr;
    }, []);
    var sig_logp = sig_idx.map( i => { return rnaseq.model[dataset_idx].log_p[gene_idx][i] })
    var sig_fields = sig_idx.map( i => { return rnaseq.fields[i] })

    var sorted_logp = sig_logp.slice(0).sort();
    var sorted_order = sorted_logp.map( (v,i) => { return sig_logp.indexOf(v) });
    var sorted_fields = sorted_order.map( v => { return sig_fields[v] })
        
    var plot = new_plot();
    plot.svg_width = 320;
    plot.margin = {top: 50, right: 10, bottom: 60, left: 160};

    if(d3.select('#pval-plot').size()){
        plot.svg = d3.select('#pval-plot')
        plot.svg.select('.axis').remove()
    } else {
        plot.svg = d3.select('#gene-search-results-div').append('svg')
    }
    plot.data = sorted_logp;
    plot.labels = sorted_fields;
    plot.title = 'Significant Behaviors';
    plot.xlabel = '-log[p-value]';

    plot = plot_hbar(plot);
    var plot_rects = plot.svg
        .attr('id','pval-plot')
        .attr('transform-origin','top right')
        .attr('transform','scale(1.25)')
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

    var gene_fbgn = rnaseq['fbgn'][gene_idx]
    var gene_hit_idx = rnaseq['hits'][dataset_idx]['fbgn'].indexOf(gene_fbgn);
    var gene_cats = rnaseq['hits'][dataset_idx]['cats'][gene_hit_idx];
    var cat_ids = rnaseq['hits'][dataset_idx]['cat_id'][gene_hit_idx];

    if(!gene_cats) gene_cats = 'none';

    console.log(gene_cats);
    gene_cats = gene_cats.split(',').map( function(v,i){
        if(v!=='none'){
            v = `<a style="color: rgb(170,170,255)" href=https://www.genome.jp/kegg-bin/show_pathway?${cat_ids[i]}>${v}</a>,</br>`
        }
        return v;
    });
    console.log(gene_cats);
    gene_cats = gene_cats.reduce(function(arr,i){ return arr + i }, [])

    var gene_id_types = ['gene_names','gene_symbols','fbgn','kegg'];
    gene_ids = gene_id_types.map( v => { return rnaseq[v][gene_idx] });
    gene_ids.push(sig_logp.length,gene_cats);

    d3.select('#gene-search-tab')
    .select('table')
    .selectAll('tr')
        .data(gene_ids)
        .each(function(d,i){
            d3.select(this).selectAll('td')
                .each(function(dd,j){
                    if(j){
                        var href = null;
                        switch(i){
                            case 2:
                                href = 'https://flybase.org/reports/' + d;
                                d3.select(this).select('a').attr('class','active-link')
                                break;
                            case 3:
                                href = 'https://www.genome.jp/dbget-bin/www_bget?dme:' + d;
                                d3.select(this).select('a').attr('class','active-link')
                                break;
                            default:
                                href = null;
                                break;
                        }
                        d3.select(this)
                        .select('a')
                            .attr('href',href)
                            .nodes()[0].innerHTML = d;
                    } 
                })
        })

    d3.select('#num-behaviors')
    .selectAll('rect')
        .style('fill','rgb(200,200,200)')
        .each(function(d,i){
            if(i===sig_logp.length){
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
        } else if(input_txt.includes('dmel')){
            input_type = 'kegg';
        } else {
            input_type = 'gene_symbols';
        }
        gene_idx.push(rnaseq[input_type].map( v => { return v.toLowerCase() }).indexOf(input_txt));
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
        var dataset_idx = d3.select('#matrix-header').select('select').nodes()[0].value % 2;

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


