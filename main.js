
let blockC = document.getElementById("C");
blockC.innerHTML = "This block has been changed";
blockC.style.backgroundColor = 'green';

let mydata = new Array(3);
d3.json("./mydata.json").then(function(d) {
	for(let i=0; i<d[0].data.length; i++){
		mydata[i] = new Array(d[0].data[i].length);
		for(let j=0; j<d[0].data[i].length; j++){
			
			mydata[i][j] = d[0].data[i][j]
			console.log(mydata[i][j]);
		}
	};
});

console.log(mydata[0])

let divSelection = d3.select("#matrix")
    .selectAll("div")
    .data(mydata)
    .enter()
	.append("div")
		.text(function(d){
			return d;
		});

d3.json("miserables.json", function(miserables) {
	var matrix = [],
		nodes = miserables.nodes,
		n = nodes.length;
	
	// Compute index per node.
	nodes.forEach(function(node, i) {
		node.index = i;
		node.count = 0;
		matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
	});