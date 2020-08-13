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

// update the apriori menu selection and selected metric
const update_apriori_menu = function(metric_name){

    var qselect_div;
    var div_pos;
    var ndiv;
    d3.select('#tab-header').select('select')
        .each(function(d){
            var apriori_grp_name = get_apriori_grp(metric_name,d);
            qselect_div = d3.select('#behavior-selection-div')
                .selectAll('div')
                    .filter(function() { return this.innerHTML === apriori_grp_name });
            if(qselect_div.attr('class') !== 'selected'){
                qselect_div.nodes()[0].click();
            }
        })

    d3.select('#metric-selections').selectAll('div')
        .style('border','1px solid transparent')
        .filter(function(){ return this.innerHTML === metric_name })
        .style('border','1px dashed rgb(150,150,150)')

        /*
    var mselections_div = d3.select('#metric-selections')
    var max_scroll = mselections_div.nodes()[0].scrollHeight - mselections_div.attr('height');
    console.log(d3.select('#metric-selections').nodes()[0].scrollTop)
    */
}
