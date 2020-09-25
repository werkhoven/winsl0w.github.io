var behavior_gene_list_fbgn = [];

const clear_selected_genes = function(){
    d3.select(this.parentNode.parentNode.parentNode)
        .selectAll('.data-row')
            .attr('selected',false)
        .each(function(){ d3.select(this).selectAll('td').attr('class','inactive') });
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
    if(!summary_is_active) add_tab_notification('Search by Gene ID');
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

    var update_fbgn = all_table_fbgn.filter((v,i)=>{return select_range.some(j=>{return j===i})})
    if(prev_select_status === 'true'){
        update_behavior_gene_list_fbgn(update_fbgn,'add');
    } else {
        update_behavior_gene_list_fbgn(update_fbgn,'subtract');
    }
}


const update_behavior_gene_list_fbgn = function(fbgn,mode){

    if(typeof(fbgn)!=='object'){
        fbgn = [fbgn];
    }

    switch(mode){
        case 'add':
            behavior_gene_list_fbgn = behavior_gene_list_fbgn.concat(fbgn).getUnique();
            break;
        case 'subtract':
            behavior_gene_list_fbgn = behavior_gene_list_fbgn.filter(v=>{ return !fbgn.some(vv=>{return vv===v})})
            break;
    }
    d3.select('#num-genes-in-selection').nodes()[0].innerText = behavior_gene_list_fbgn.length;
}


const enrichment_table_click = function(obj){

    if(obj.parentNode.parentNode.id === 'behavior-gene-list-table'){
        d3.select(obj).selectAll('td')
            .filter(function(d,i){ return i==2 })
            .each(function(){
                if(d3.select(obj).attr('selected') === 'true'){
                    update_behavior_gene_list_fbgn(this.innerText,'subtract');
                    //behavior_gene_list_fbgn = behavior_gene_list_fbgn.filter(v=>{return v!==this.innerText})
                } else {
                    update_behavior_gene_list_fbgn(this.innerText,'add');
                }
            })
    }

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
                var sorted_p = rnaseq.hits[get_batch_idx()].p_gene[cat_idx].filter( v => { return v > 0 }).sort();
                sorted_p = sorted_p.map((v,i)=>{ return sorted_p[sorted_p.length-i-1] })
                d3.select(this_ele).text(sorted_p[row_num].toFixed(3));
                break;
        }
    } else {

        // handle the metric info
        if(col_num){
            //new_txt = cat_metric_p[row_num].toFixed(3);
            new_txt = rnaseq.hits[get_batch_idx()].p_metric[cat_idx][row_dat].toFixed(3);
        } else {
            new_txt = rnaseq.model[get_batch_idx()].fields[row_dat];
        }
        d3.select(this_ele).text(new_txt);
    }
}



const update_enrichment_table = function(cat_name,rnaseq){

    // get index of current category
    var cat_idx = rnaseq.hits[get_batch_idx()].cat_names.indexOf(cat_name);
    
    // sort gene hit idx in descending order of bootstrap probability
    var cat_gene_p = rnaseq.hits[get_batch_idx()].p_gene[cat_idx].filter( v => { return v > 0 });
    var gene_hit_sort_perm = get_sort_permutation(cat_gene_p);
    var cat_gene_hit_idx = gene_hit_sort_perm.map( v => { return rnaseq.hits[get_batch_idx()].cat_gene_idx[cat_idx][v] });

    // sort metric idx in descending order of bootstrap probability
    var cat_metric_idx = rnaseq.hits[get_batch_idx()].p_metric[cat_idx].map((v,i)=>{ if(v>0.02) return i }).filter(v=>{ return v!==undefined });
    var cat_metric_p = cat_metric_idx.map( v => { return rnaseq.hits[get_batch_idx()].p_metric[cat_idx][v] });
    var metric_sort_perm = get_sort_permutation(cat_metric_p);
    cat_metric_idx = metric_sort_perm.map( v => { return cat_metric_idx[v] });

    // sort gene all idx in alphabetic order
    var cat_gene_all_idx = rnaseq.hits[get_batch_idx()].cat_all_gene_idx[cat_idx].slice();
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
                        .attr('href','https://www.genome.jp/kegg-bin/show_pathway?' + rnaseq.hits[get_batch_idx()].cat_ids[cat_idx])
                    return rnaseq.hits[get_batch_idx()].cat_ids[cat_idx]
                    break;
                case 1:
                    if(rnaseq.hits[get_batch_idx()].p_cat[cat_idx]>2){
                        return Math.pow(10,-rnaseq.hits[get_batch_idx()].p_cat[cat_idx]).toExponential(2);
                    } else {
                        return Math.pow(10,-rnaseq.hits[get_batch_idx()].p_cat[cat_idx]).toFixed(2);
                    }
                    
                    break;
                case 2:
                    return rnaseq.hits[get_batch_idx()].n_metrics[cat_idx].toFixed(2);
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

    d3.json('data/decathlon_rnaseq_results.json').then(function(rnaseq){

        // dropdown menu for categories
        d3.select('#enrichment-tab').select('select').selectAll('option').remove();
        d3.select('#enrichment-tab')
            .select('select')
                .on('change',function(d){ update_enrichment_table(this.value,rnaseq) })
            .selectAll('option')
                .data(rnaseq.hits[get_batch_idx()].cat_names)
                .enter()
            .append('option')
                .attr('value',function(d){ return d })
                .text(function(d){ return d })

        d3.select('#append-gene-hits').on('click',append_selected_genes);
        d3.select('#append-gene-all').on('click',append_selected_genes);
        d3.select('#clear-gene-hits').on('click',clear_selected_genes);
        d3.select('#clear-gene-all').on('click',clear_selected_genes);
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
        var table_rows = ['Name','KEGG Pathway-ID','Bootstrap min. <i>p</i>-value','Num. Behaviors'];

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


        update_enrichment_table(rnaseq.hits[get_batch_idx()].cat_names[0],rnaseq);
    })

}