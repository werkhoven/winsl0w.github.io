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
    var re = /([A-Z](-*)[A-z]+\s)+/g;
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

// update the apriori menu selection and selected metric
const update_apriori_menu = function(metric_name){

    var qselect_div;
    var selection = {
        group: null,
        active: false,
    }
    d3.select('#tab-header').select('select')
        .each(function(d){
            selection.group = get_apriori_grp(metric_name,d);
            qselect_div = d3.select('#behavior-selection-div')
                .selectAll('div')
                    .filter(function(){ return this.innerText === selection.group });
            if(qselect_div.size()){
                if(qselect_div.attr('class') !== 'selected'){
                    qselect_div.nodes()[0].click();
                }
            }
        })

    var selected_div = d3.select('#metric-selections').selectAll('div')
        .style('border','1px solid transparent')
        .filter(function(d,i){
            return this.innerHTML === metric_name;
        })
        .style('border','1px dashed rgb(150,150,150)')

    console.log(selected_div.nodes()[0])
    if(selected_div.size()){
        selection.active = selected_div.attr('class') === 'active';
    }
    return selection;
}


// schedule all page updates for metric selection change
const update_selected_metric = function(metric_name,update_dropdown){

    console.log('update selected metric')
    
    // update metric summary dropdown
    if(update_dropdown){
        var element = document.getElementById('metric-summary-tab-select');
        element.value = metric_name;
        var event = new Event('change', {value: metric_name});
        element.dispatchEvent(event);
    }
    
    

    // update qselection and metric selection menus
    const selection = update_apriori_menu(metric_name);

    console.log('active:',selection.active);
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
