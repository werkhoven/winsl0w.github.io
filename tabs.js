
const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');
const tab_content = d3.select('#tab-content');

// init loadings plot vars
const loadings_margin = {right: 0, left: 150, top: 15, bottom: 40};

tab_links.on('click',function(){
    tab_links.attr('class','inactive');
    d3.select(this).attr('class','active');
})


const plot_loadings = function(loadings,labels,title){

    var loadings_width = 300, loadings_height = loadings.length*12;
    var loadings_plot_width = loadings_width - loadings_margin.left - loadings_margin.right;
    var loadings_plot_height = loadings_height - loadings_margin.top - loadings_margin.bottom;

    const loadings_svg = tab_content.append('svg')
        .attr('class','loadings-svg')
		.attr("width", loadings_width)
		.attr("height", loadings_height)
		.style("margin-left", -loadings_margin.left + "px")
        .style("float",'right')

    const loadings_grp = loadings_svg.append("g")
		.attr('class','axis')
        .attr("transform", "translate(" + loadings_margin.left + "," + loadings_margin.top + ")");

    var min = loadings.reduce((a,b) => { return Math.min(a,b) });
    min = Math.floor(min*10)/10;
    var max = loadings.reduce((a,b) => { return Math.max(a,b) });
    max = Math.ceil(max*10)/10;
    

    const loadings_y_scale = d3.scaleBand()
        .domain(labels)
        .range([0,loadings_plot_height])
        .paddingOuter(.1)
        .paddingInner(.1)

    console.log(min)
    console.log(max)

    var loadings_x_scale = d3.scaleLinear()
        .domain([min,max])
        .range([0,loadings_plot_width])

    console.log(loadings_x_scale(0.3))
    console.log(loadings_x_scale(-.1))

    // initialize axes
	loadings_grp
        .append('g')
            .attr('class','axis')
            .call(d3.axisLeft(loadings_y_scale).ticks(0).tickSize(0))
    loadings_grp
        .append('g')
            .attr('class','axis')
            .attr('transform','translate(0,' + loadings_plot_height + ')')
            .call(d3.axisBottom(loadings_x_scale).ticks(3));
    loadings_grp
        .append('path')
            .attr('d',
                `M0,0
                H${loadings_plot_width}
                V${loadings_plot_height}
                H0
                V0`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill',d3.rgb(30,30,30));

    // append axis labels
    loadings_grp
        .append('text')
            .attr('text-anchor','middle')
            .attr('x',loadings_plot_width/2)
            .attr('y',loadings_plot_height+30)
            .attr('id','loadings-xlabel')
            .text('metric weight')
            .style('font-size','12px')
    // append axis labels
    loadings_grp
        .append('text')
            .attr('text-anchor','middle')
            .attr('x',loadings_plot_width/2)
            .attr('y',-5)
            .attr('id','loadings-xlabel')
            .text(title)
            .style('font-size','12px')

    // initialize plot bars
    loadings_grp.selectAll('rect')
        .data(loadings)
        .enter()
    .append('rect')
        .attr('height',function(d,i){
            return loadings_y_scale.bandwidth(i);
        })
        .attr('width',function(d,i){
            return Math.abs(loadings_x_scale(0)-loadings_x_scale(d));
        })
        .attr('y', function(d,i){
            return loadings_y_scale(labels[i])
        })
        .attr('x', function(d,i){
            return d > 0 ? loadings_x_scale(0) : loadings_x_scale(d);
        })
        .attr('fill',d3.rgb(120,120,180));


    // draw indicator line at zero
    loadings_grp
        .append('path')
            .attr('d',`M${loadings_x_scale(0)},0V${loadings_plot_height}`)
            .attr('stroke-width',1)
            .attr('stroke','#000000')
            .attr('fill','none');
    
}