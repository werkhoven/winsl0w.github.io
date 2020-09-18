const behavior_gene_list_col_widths = [200,80,80,80];

const apply_pval_thresh = function(rnaseq){
    
    var pval_thresh = parseFloat(document.getElementById('pval-thresh-textbox').value);
    var sig_idx = [];
    rnaseq.model[get_batch_idx()].log_p.forEach(function(p_arr,i){
        if(p_arr.some(log_p => { return Math.pow(10,-log_p) < pval_thresh })){
            sig_idx.push(i);
        }
    })
    
    var sig_fbgn = sig_idx.map(i => {return 'FBgn' + rnaseq.fbgn[i].toFixed(0).padStart(7,'0')});
    behavior_gene_list_fbgn = behavior_gene_list_fbgn.concat(sig_fbgn).getUnique();
    
    // update selected rows
    update_gene_selection();
}

const update_behavior_gene_list_row = function(this_ele,idx,col_name,rnaseq){

    var href = null;
    var new_txt = '-';
    switch(col_name){
        case 'Name':
            new_txt = rnaseq.name[idx];
            if(new_txt === '-'){
                new_txt = rnaseq.symbol[idx];
            }
            d3.select(this_ele).text(new_txt);
            break;
        case 'Symbol':
            d3.select(this_ele).text(rnaseq.symbol[idx]);
            break;
        case 'FlyBase':
            if(rnaseq.fbgn[idx]>-1){
                new_txt = 'FBgn' + rnaseq.fbgn[idx].toFixed(0).padStart(7,'0');
                href = 'https://flybase.org/reports/' + new_txt;
            }
            d3.select(this_ele).select('a')
                .attr('class','active-link')
                .attr('href',href)
                .attr('target','_blank')
                .text(new_txt);
            break;
        case 'KEGG':
            if(rnaseq.kegg[idx]!==undefined){
                new_txt = 'Dmel_' + rnaseq.kegg[idx];
                href = 'https://www.genome.jp/dbget-bin/www_bget?dme:' + new_txt;
            }
            d3.select(this_ele).select('a')
                .attr('href',href)
                .attr('class','active-link')
                .attr('target','_blank')
                .text(new_txt);
            break;
    }
}

const update_gene_selection = function(){
    var all_table_fbgn = [];
    d3.select('#behavior-gene-list-table').selectAll('.data-row')
        .each(function(){
            d3.select(this).selectAll('td')
                .filter(function(d,i){return i==2})
                .each(function(){ all_table_fbgn.push(this.innerText) })
        })

    console.log(all_table_fbgn,behavior_gene_list_fbgn)
    d3.select('#behavior-gene-list-table').selectAll('.data-row')
        .filter(function(d,i){ return behavior_gene_list_fbgn.some(v=>{return v === all_table_fbgn[i] })})
        .attr('selected',true)
        .selectAll('td')
            .attr('class','active')
}

const update_behavior_gene_list_table = function(metric_name,rnaseq){

    console.log('update')

    var metric_idx = rnaseq.model[get_batch_idx()].fields.indexOf(metric_name);
    var metric_pvals = rnaseq.model[get_batch_idx()].log_p.map(v => {return v[metric_idx] });
    var gene_idx = [];

    metric_pvals.forEach((v,i) => {
        if(v){
            gene_idx.push(i);
        }
    });

    var table_cols = ['Name','Symbol','FlyBase','KEGG'];
    var table_rows = d3.select('#behavior-gene-list-table')
        .select('tbody')
        .selectAll('tr')
            .data(gene_idx);

    // append
    table_rows.enter()
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
            d3.select(this).selectAll('td')
                .data(table_cols)
                .enter()
            .append('td')
                .style('width',function(d,i){ return behavior_gene_list_col_widths[i]+'px' })
                .each(function(col_dat){
                    if(col_dat === 'FlyBase' | col_dat === 'KEGG'){
                        d3.select(this).append('a');
                    }
                    update_behavior_gene_list_row(this,row_dat,col_dat,rnaseq)
                })
        })

    // exit
    table_rows.exit().remove();

    // update
    table_rows
        .attr('selected',false)
        .each(function(row_dat,row_num){
            d3.select(this).selectAll('td')
                .attr('class','inactive')
                .each(function(col_dat){
                    update_behavior_gene_list_row(this,row_dat,col_dat,rnaseq)
            })
        })

    // update selected rows
    update_gene_selection();

    var this_table = d3.select('#behavior-gene-list-table')
    table_height = this_table.select('tbody').style('height').match(/\d*/g)[0];
    if(this_table.select('tbody').nodes()[0].scrollHeight<=table_height){
        this_table.select('tbody').attr('class','inactive');
    } else {
        this_table.select('tbody').attr('class','active');
    }

    d3.selectAll('.data-row').on('click',function(){
        enrichment_table_click(this);
    })
}

const init_behavior_gene_list_table = function(){

    d3.json('data/decathlon_rnaseq_results.json').then(function(rnaseq){

        // table of sequenced genes associated with cat
        d3.select('#behavior-gene-list-table')
            .select('thead')
            .selectAll('th')
                .style('width',function(d,i){ return behavior_gene_list_col_widths[i]+'px' })
                

        var initial_metric = d3.select('#behavior-gene-dropdown').nodes()[0].value;
        update_behavior_gene_list_table(initial_metric,rnaseq);

        // attach callback to gene append button
        d3.select('#behavior-gene-list-append').on('click',append_selected_genes);
        d3.select('#pval-thresh-button').on('click',function(){ apply_pval_thresh(rnaseq) });
    })
}
        