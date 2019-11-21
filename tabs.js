
const tab_div = d3.select('#tab-div');
const tab_links = tab_div.selectAll('li');
const tab_content = d3.select('#tab-content');

tab_links.on('click',function(){
    tab_links.attr('class','inactive');
    d3.select(this).attr('class','active');
})