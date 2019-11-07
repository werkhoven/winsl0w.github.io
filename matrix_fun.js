// render the matrix in svg from data
var renderMatrix = (data,scale,labels) =>{

    var rows = svg.selectAll(".row")
            .data(data)
            .enter()
        .append('g')
            .attr('class','row')
            .attr('transform', function(d,i){return 'translate(0,' + scale(labels[i]) + ')'})
            .each(function(row,i){
                d3.select(this).selectAll('rect')
                    .data(row.map(d => { return d}))
                    .enter()
                .append('rect')
                    .attr('class','matrix-rect')
                    .attr('width',scale.bandwidth(i))
                    .attr('height',scale.bandwidth(i))
                    .attr('x', function(d){ return scale(labels[d.y])})
                    .attr('fill',function(d){return color(d.z)})
                    .attr('stroke-opacity',0)
                    .attr('stroke-width',0)
                    .on('mouseover',hilightRowCol)
                    .on('mouseout',unhilightRowCol)
        })

    return rows;
        
};