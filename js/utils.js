Array.prototype.getUnique = function(){
    var u = {}, a = [];
    for (var i = 0, l = this.length; i < l; ++i) {
        if (u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
return a;
}

const get_sort_permutation = function(arr){

    // handle cases with duplicate arrays
    if(arr.getUnique().length < arr.length){
        var u_p = arr.getUnique();
        var n_p = u_p.map( i => {
            return arr.reduce(function(a,b){ if(b==i) a++; return a;}, []);
        })
        var dup_idx = [];
        n_p.forEach((v,i)=>{ if(v>1) dup_idx.push(i) });
        var dup_vals = dup_idx.map(v=>{ return u_p[v] });
        for(let i=0; i<dup_vals.length; i++){
            var idx = [];
            arr.forEach((v,j)=>{ if(v===dup_vals[i]) idx.push(j) });
            idx.filter((v,j)=>{ return j>0 }).forEach((v,j)=>{ arr[v] = arr[v]+0.0001*(j+1)})
        }
    }

    // sort the array
    var sorted_arr = arr.slice(0).sort();

    // return sorted order
    var sorted_order = sorted_arr.map( (v,i) => { return arr.indexOf(v) });
    return sorted_order.map((v,i)=>{ return sorted_order[sorted_order.length-i-1] })
}

const getAssayNames = function(fields){
    var re = /([A-Z][A-z]*(-*)[A-z]+\s)+/g;
    return fields.map(d => { return d.match(re)[0].trim() });
}

const in_selection = function(selection,col,row){
    const in_row = selection.some(v => v === row)
    const in_col = selection.some(v => v === col)
    return in_row && in_col;
}

const format_loadings_labels = function(labels){
    for(let i=0; i<labels.length; i++){
        for(let j=0; j<labels[i].length; j++){
            labels[i][j] = labels[i][j].replace('_',' ')
        }
    }
    return labels;
}

const get_apriori_grp = function(metric_name,apriori){

    for(let i=0; i<apriori.length; i++){
        if(apriori[i].fields.some( j => { return j === metric_name })){
            return apriori[i].name;
        }
    }
}

const get_matrix_type = function(){
    if(Math.floor(d3.select('#matrix-header').select('select').nodes()[0].value / 2)){
        return 'distilled';
    } else {
        return 'full';
    }
}

const get_dataset_idx = function(){
    return parseInt(d3.select('#matrix-header').select('select').nodes()[0].value,10) % 2;
}

const get_batch_idx = function(){
    var curr_batch_idx = d3.select('#batch-select-dropdown').nodes()[0].value
    var re = /[0-9]/g;
    return get_dataset_idx()*2 + parseInt(curr_batch_idx.match(re),10) - 1;
}

// update the apriori menu selection and selected metric
const update_apriori_menu = function(metric_name){

    var qselect_div, qselect_id, update_qselect;
    update_qselect = true;
    var selection = {
        group: null,
        active: false,
    }
    
    // check if click occurred in an assay selection that is active
    var qselect_div = d3.select('#qselections').select('div.selected');
    if(qselect_div.size()){
        qselect_id = qselect_div.nodes()[0].parentNode.id;
    }
    if(qselect_id === 'assay-selection-div'){
        qselect_div.each(function(d){ console.log(metric_name,d.fields); update_qselect = !d.fields.some(v=>{ return v === metric_name }) });
        console.log(update_qselect)
    }
    
    d3.select('#tab-header').select('select')
        .each(function(d){
            selection.group = get_apriori_grp(metric_name,d);

            if(update_qselect){
                qselect_div = d3.select('#behavior-selection-div')
                .selectAll('div')
                    .filter(function(){ return this.innerText === selection.group });
                if(qselect_div.size()){
                    if(qselect_div.attr('class') !== 'selected'){
                        qselect_div.nodes()[0].click();
                    }
                }
            }
        })

    var selected_div = d3.select('#metric-selections').selectAll('div')
        .style('border','1px solid transparent')
        .filter(function(d,i){
            return this.innerHTML === metric_name;
        })
        .style('border','1px dashed rgb(150,150,150)')

    if(selected_div.size()){
        selection.active = selected_div.attr('class') === 'active';
    }
    return selection;
}


// schedule all page updates for metric selection change
const update_selected_metric = function(metric_name,update_dropdown){
    
    // update metric summary dropdown
    if(update_dropdown){
        var element = document.getElementById('metric-summary-tab-select');
        element.value = metric_name;
        var event = new Event('change', {value: metric_name});
        element.dispatchEvent(event);
    }
    

    // update qselection and metric selection menus
    const selection = update_apriori_menu(metric_name);

    // update loading dropdown menu
    if(selection.active){
        var loadings_dropdown = d3.select('#tab-header').select('select').nodes()[0];

        if(loadings_dropdown.value !== selection.group){
            loadings_dropdown.value = selection.group;
            var event = new Event('change', {value: selection.group});
            loadings_dropdown.dispatchEvent(event);
        }
    }
}


const clear_tab_notification = function(tab_name){
    var tab = d3.select('#tab-div').select('ul')
        .selectAll('li').filter(function(){
            return this.innerText === tab_name;
        }
    )

    tab.select('table').remove();
}

const add_tab_notification = function(tab_name){

    var tab = d3.select('#tab-div').select('ul')
        .selectAll('li').filter(function(){
            return this.innerText === tab_name;
        }
    )

    // check to see if notification already exists
    if(tab.select('.notification').size()){
        return;
    } else {
        tab.append('table')
            .style('vertical-align','middle')
            .style('position','absolute')
            .style('right','10px')
            .style('top','7px')
            .style('width','15px')
            .style('height','15px')
        .append('tr')
            .attr('class','notification')
    }
}


// PLOTTING FUNCTIONS
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
    plot.margin = {right: 10, left: 150, top: 15, bottom: 40};;
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