


// init loadings plot vars
var prev_loading_click = null;

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