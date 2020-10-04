const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');


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
    const curr_tab_name = d3.select(this).nodes()[0].innerText.match(/([A-z]| )*/g)[0];
    clear_tab_notification(curr_tab_name);
    console.log(curr_tab_name)
    switch(curr_tab_name){

        case "Behavior Loadings":
            d3.select('#metric-loadings-tab').style('visibility','visible');
            break;

        case "Behavior Summary":
            d3.select('#metric-summary-tab').style('visibility','visible');
            const selected_metric_name = get_selected_metric();
            var element = document.getElementById('metric-summary-tab-select');
            element.value = selected_metric_name;
            var event = new Event('change', {value: selected_metric_name});
            element.dispatchEvent(event);
            break;

        case "Select Genes by Behavior":
            d3.select('#behavior-gene-lists-tab').style('visibility','visible');
            break;

        case "Search by Gene ID":
            d3.select('#gene-search-tab').style('visibility','visible');
            init_gene_search_table();
            break;

        case "KEGG Pathways":
            d3.select('#enrichment-tab').style('visibility','visible');
            break;
    }
}
tab_links.on('click',switch_tab)




// set hover tooltip
const show_tooltip = function(e,msg){

    d3.select(e)
        .select('.tooltip')
        .data([msg])
        .enter()
    .append('span')
        .attr('class','tooltip')
        .text(msg)
}



