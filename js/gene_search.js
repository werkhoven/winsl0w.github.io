var prev_gene_hit_click = null;
var prev_gene_all_click = null;
var curr_gene_name, curr_gene_idx;


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
                                        .filter(function(){ return this.innerText.includes('KEGG')})
                                        .nodes()[0].click();
                                } 
                            })
                            .on('mouseover',function(){ d3.select(this).attr('class','active') })
                            .on('mouseout',function(){ d3.select(this).attr('class','inactive') })

                        pathway_table
                            .append('table')
                                .attr('class','scroll-table')
                                .style('overflow','hidden')
                            .append('thead')
                                .selectAll('th')
                                    .data(['Name','Pathway ID'])
                                    .enter()
                                .append('th')
                                    .style('height','20px')
                                    .style('width','230px')
                                    .style('font-size','12px')
                                    .style('box-sizing','border-box')
                                    .text(function(v){ return v })
                        d3.select(this)
                            .select('.scroll-table')
                            .append('tbody')
                                .attr('class','inactive')
                                .style('width','460px')
                                .style('overflow-y','hidden')
                                .style('overflow-x','hidden')
                            
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
    
    console.log('gene_idx: '+gene_idx,'n: '+rnaseq.num_modeled)
    if(gene_idx < rnaseq.num_modeled){

        var sig_idx = rnaseq.model[get_batch_idx()].log_p[gene_idx].reduce(function(arr,d,i){
            if(d>0) arr.push(i);
            return arr;
        }, []);
        var sig_logp = sig_idx.map( i => { return rnaseq.model[get_batch_idx()].log_p[gene_idx][i] })
        var sig_fields = sig_idx.map( i => { return rnaseq.model[get_batch_idx()].fields[i] })      
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
                            .style('width','58%')
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
                                .style('width','460px')
                                .each(function(row_dat,row_num){
                                    for(let col_num=0; col_num<2; col_num++){
                                        if(col_num){
                                            d3.select(this)
                                                .append('td')
                                                    .attr('class','inactive')
                                                    .style('width','230px')
                                                .append('a')
                                                    .style('font-size','12px')
                                                    .attr('class','active-link')
                                                    .attr('href',`https://www.genome.jp/kegg-bin/show_pathway?${cat_ids[row_num]}`)
                                                    .attr('target','_blank')
                                                    .text(cat_ids[row_num]);
                                        } else {
                                            d3.select(this).append('td')
                                                .attr('class','inactive')
                                                .style('width','230px')
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


const get_correlated_behaviors_from_genes = function(matched_idx,rnaseq){

    var pval_idx = matched_idx.filter(v=>{ return v < rnaseq.num_modeled })
    var sig_behaviors = [];
    pval_idx.forEach( v => {
        rnaseq.model[get_batch_idx()].log_p[v].forEach((p,i)=>{

            if(p>-Math.log10(0.05)){
                sig_behaviors.push(i);
            }
        })
    });
    sig_behaviors = sig_behaviors.getUnique().map(v=>{ return rnaseq.model[get_batch_idx()].fields[v] });

    if(sig_behaviors.length){

        // get currently selected element and all metric names 
        var matrix_type = get_matrix_type();

        // get field names in order of the matrix
        var matrix_metrics;
        d3.select('#matrix-header')
                .select('select')
                    .each(function(d){ matrix_metrics = d[get_dataset_idx()][matrix_type].fields.slice() });
        
        curr_selection[matrix_type] = sig_behaviors.map( i => { return matrix_metrics.indexOf(i) });

        update_selected_metric(matrix_metrics[curr_selection[matrix_type][0]],true);
        update_rect_selections();
    }
}


// GENE SEARCH TAB
const search_genes = function(input_txt){

    d3.json('data/decathlon_rnaseq_results.json').then(function(rnaseq){
        
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
            var p = rnaseq.model[get_batch_idx()].log_p.slice();
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

            d3.select('#genes-metric-button')
                .on('click',function(){ get_correlated_behaviors_from_genes(matched_idx,rnaseq) });
        }

    })
}

d3.select('#gene-search-clear').on('click',function(){
    d3.select('#gene-search-textbox').nodes()[0].value = '';
})

// File import
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