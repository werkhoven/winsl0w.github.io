// Behavior Summary Tab functions

const update_full_metric_table = function(metric_name){

    d3.select('#scree-plot').select('p').style('visibility','hidden');

    d3.csv('data/metric_glossary.csv').then(function(metric_table){

        // add metric glossary entry
        var metric_idx;

        metric_idx = metric_table.map((d,i) => { return d.Name; }).indexOf(metric_name)
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
        d3.csv('data/assay_glossary.csv').then(function(assay_table){

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
    
    d3.json('data/decathlon_raw_data.json').then(function(raw){

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
        .select('ul').select('li.active').nodes()[0].innerText === 'Behavior Summary';
    if(!summary_is_active) add_tab_notification('Behavior Summary');
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