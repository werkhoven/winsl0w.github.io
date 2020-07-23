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


