var ArcView = {
	width: null,
	height: null,
	margin: {top: 10, right: 10, bottom: 10, left: 10},
	svg: null,

	radius: 130,

	chosenFactors: [],
	chosenOutcomes: [],
	chosenVariables: [], // if there is only one circle

	barWidth: 10,

	isTwo: true,
	
	init: function(viewWidth, viewHeight) {
		var self = this;

		self.width = viewWidth - self.margin.left - self.margin.right;
		self.height = viewHeight - self.margin.top - self.margin.bottom;

		self.svg = d3.select("#av-svg")
						.attr("width", viewWidth)
						.attr("height", viewHeight)
						.append("g")
						.attr("transform", "translate(" + self.margin.left + ", " + self.margin.top + ")");

		self.createCircle("Health Factors");
		self.createCircle("Health Outcomes");
		self.createVarNameList();
		self.createYearSelect();
		self.drawInstructions();
	},
	computeNodeCoordinates: function(radius) {
		var self = this;
		var numOfNodes = 51; // including the focal node
		var angleInterval = Math.PI * 2 / numOfNodes;
		var startingAngle = Math.PI / 2;
		var coord = [];

		for (var i = 0; i < numOfNodes; i++) {
			var currentAngle = startingAngle + i * angleInterval;
			var x = radius * Math.cos(currentAngle);
			var y = radius * Math.sin(currentAngle);

			coord.push({ x: x, y: y });
		}

		return coord;
	},
	createCircle: function(type) { // layout 52 nodes on a circle
		var self = this;
		var nodeCoord = self.computeNodeCoordinates(self.radius);
		var textCoord = self.computeNodeCoordinates(self.radius + 10);
		var circleGroup, colour;

		if (type == "Health Factors") {
			circleGroup = self.svg.append("g")
									.attr("class", "factor")
									.attr("transform", "translate(328, 145)");
			colour = Database.factorColour
		}
		else if (type == "Health Outcomes") {
			circleGroup = self.svg.append("g")
									.attr("class", "outcome")
									.attr("transform", "translate(633, 145)");
			colour = Database.outcomeColour;
		}
		else if (type == "Health Variables") {
			circleGroup = self.svg.append("g")
									.attr("class", "variable")
									.attr("transform", "translate(480, 145)");
			colour = "#999999";
		}
		
		// draw nodes
		circleGroup.append("circle")
					.attr("class", "focal-node")
					.attr("r", 10)
					.style("fill", colour)
					.attr("cx", 0)
					.attr("cy", 0);

		circleGroup.selectAll(".state-node")
					.data(Database.stateByRegions)
					.enter()
					.append("circle")
					.attr("class", function(d) {
						return d.abbr + " state-node";
					})
					.attr("data-class", function(d, i) {
						return i;
					})
					.attr("r", 3)
					.attr("cx", function(d, i) {
						return nodeCoord[i].x;
					})
					.attr("cy", function(d, i) {
						return nodeCoord[i].y;
					})
					.style("fill", "white")
					.attr("stroke", colour)
					.attr("stroke-width", 1);

		// draw state labels
		circleGroup.selectAll(".state-label")
					.data(Database.stateByRegions)
					.enter()
					.append("text")
					.attr("class", function(d) {
						return d.abbr + " state-label";
					})
					.attr("data-class", function(d, i) {
						return i;
					})
					.style("font-size", 7)
					.attr("text-anchor", "middle")
					.attr("alignment-baseline", "central")
					.attr("x", function(d, i) {
						return textCoord[i].x;
					})
					.attr("y", function(d, i) {
						return textCoord[i].y;
					})
					.style("fill", colour)
					.text(function(d) {
						return d.abbr;
					});

		// draw factor outcome lables
		circleGroup.append("text")
					.text(type)
					.attr("text-anchor", "middle")
					.attr("x", 0)
					.attr("y", self.radius + 35)
					.style("fill", colour)
					.style("font-size", 15);

		// draw inner arcs
		var startAngle = Math.PI;
		var anglePadding = Math.PI / 36;
		var availableAngle  = Math.PI * 2 - anglePadding * 4; // 4 regions
		for (var i = 0; i < Database.numberOfStatesByRegions.length; i++) {
			var angleDiff = Database.numberOfStatesByRegions[i] / 51 * availableAngle;
			var offset = "75%";
			var textInnerRadius = 100, textOuterRadius = 110;

			if (Database.regions[i] == "West" || Database.regions[i] == "Northeast") {
		    	offset = "25%"
		    	textInnerRadius = 85;
		    	textOuterRadius = 95;
			}

			var arc = d3.svg.arc()
				    .innerRadius(115)
				    .outerRadius(120)
				    .startAngle(startAngle)
				    .endAngle(startAngle + angleDiff);

			var textArc = d3.svg.arc()
							    .innerRadius(textInnerRadius)
							    .outerRadius(textOuterRadius)
							    .startAngle(startAngle)
							    .endAngle(startAngle + angleDiff);

			// append arc
			circleGroup.append("path")
						.style("fill", colour)
		    			.attr("d", arc);

		    // append text path
		    circleGroup.append("path")
						.style("fill", "none")
		    			.attr("d", textArc)
		    			.attr("id", Database.regions[i]);

		    // append text
		    circleGroup.append("text")
					   .append("textPath")
						.attr("xlink:href", "#" + Database.regions[i])
						.style("text-anchor","middle")
						.attr("startOffset", offset)
						.text(Database.regions[i]);

		    startAngle += angleDiff + anglePadding;
		}

		// draw bar charts
		circleGroup.selectAll(".state-bar")
					.data(Database.stateByRegions)
					.enter()
					.append("rect")
					.attr("class", function(d) {
						return d.abbr + " state-bar";
					})
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", self.barWidth)
					.attr("height", 0)
					.attr("fill", colour);
	},
	createVarNameList: function() {
		var self = this;
		var containerPaddingTop = 6, containerPaddingBottom = 15, containerPaddingRight = 7, containerPaddingLeft = 7;
		var containerHeight = self.height - 40;
		var containerWidth = 170;
		var contentWidth = containerWidth - containerPaddingRight - containerPaddingLeft;
		var contentHeight = containerHeight - containerPaddingTop - containerPaddingBottom;

		var nameScale = d3.scale.linear()
								.domain([0, Database.varName.length])
								.range([containerPaddingTop, contentHeight]);

		// draw the container
		self.svg.append("rect")
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", containerWidth)
					.attr("height", containerHeight)
					.attr("stroke", "#999999")
					.style("fill", "white")
					.attr("rx", 10)
					.attr("ry", 10);

		var containter = self.svg.append("g")
									.attr("transform", "translate(" + containerPaddingLeft + "," + containerPaddingTop + ")");

		var name = containter.selectAll(".var-name")
									.data(Database.varName)
									.enter()
									.append("g")
									.attr("class", function(d) {
										return d + " var-name";
									})
									.attr("transform", function(d, i) {
										return "translate(0, " + nameScale(i) + ")";
									})
									.on("mouseenter", function(d, i) {
										d3.select(this)
											.select("rect")
											.style("fill", "#999999");

										DotPlot.sort(d);
									})
									.on("mouseleave", function() {
										d3.select(this)
											.select("rect")
											.style("fill", "white");

										DotPlot.restore();
									})
									.on("click", function() {
										var variableSelected = d3.select(this).data()[0];
										var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];
										var isOutcome = false;
										if ($.inArray(variableSelected, outcomes) != -1)
											isOutcome = true;

										if (d3.select(this).classed("selected")) { // remove the visual element and the item from the list
											// remove class
											d3.select(this).classed("selected", false);
											
											// remove the variable
											if (isOutcome) {
												var index = self.chosenOutcomes.indexOf(variableSelected);
												self.chosenOutcomes.splice(index, 1);
											}
											else {
												var index = self.chosenFactors.indexOf(variableSelected);
												self.chosenFactors.splice(index, 1);
											}
											var index = self.chosenVariables.indexOf(variableSelected);
											self.chosenVariables.splice(index, 1);

											// change the visual
											d3.select(this)
												.select("circle")
												.style("fill", "none");
										}
										else { // add the visual element and the item to the list
											// add class
											d3.select(this).classed("selected", true);

											// add items and visual elements
											if (isOutcome) {
												self.chosenOutcomes.push(variableSelected);
												d3.select(this)
													.select("circle")
													.style("fill", Database.outcomeColour);
											}
											else {
												self.chosenFactors.push(variableSelected)
												d3.select(this)
													.select("circle")
													.style("fill", Database.factorColour);
											}
											self.chosenVariables.push(variableSelected);
										}

										// change the select all toggle
										if (self.chosenVariables.length == 0) { // no selection, select all is shown
											// change class of text
											containter.select(".select-toggle-group")
														.select("text")
														.classed("select-all", true)
														.text("Click to select all");

											// leave the circle hollow
											containter.select(".select-toggle-group")
														.select("circle")
														.style("fill", "none");
										}
										else { // has selection, select none
											// add class and change text to select none
											containter.select(".select-toggle-group")
														.select("text")
														.classed("select-all", false)
														.text("Click to select none");

											// fill in the circle
											containter.select(".select-toggle-group")
														.select("circle")
														.style("fill", "black");
										}
									});

		var height = (contentHeight - containerPaddingTop) / Database.varName.length;

		name.append("rect")
			.attr("x", 0)
			.attr("y", -height / 2)
			.attr("height", height)
			.attr("width", contentWidth)
			.style("fill", "white")
			.style("opacity", 0.1)
			.style("cursor", "pointer");

		var nameGroup = name.append("g");

		nameGroup.append("text")
					.text(function(d) {
						return Database.varNameDict[d];
					})
					.attr("class", function(d) {
						return d;
					})
					.style("fill", function(d) {
						var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];

						if ($.inArray(d, outcomes) != -1) // in the list
							return Database.outcomeColour;
						else
							return Database.factorColour;
					})
					.attr("x", 12)
					.attr("alignment-baseline", "central")
					.style("cursor", "pointer");

		// upon clicking a label, the circle lights up
		nameGroup.append("circle")
					.attr("class", function(d) {
						return d;
					})
					.attr("r", 3)
					.attr("cx", 3)
					.attr("cy", 0)
					.attr("stroke-width", 1)
					.attr("stroke", function(d) {
						var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];

						if ($.inArray(d, outcomes) != -1) // in the list
							return Database.outcomeColour;
						else
							return Database.factorColour;
					})
					.style("fill", "none");

		// draw select command
		var selectGroup = containter.append("g")
									.attr("class", "select-toggle-group")
									.attr("transform", "translate(0, " + (nameScale(Database.varName.length) + 3) + ")");

		selectGroup.append("circle")
					.attr("r", 3)
					.attr("cx", 3)
					.attr("cy", 0)
					.style("stroke-width", 1)
					.style("stroke", "black")
					.style("fill", "none");

		selectGroup.append("text")
					.attr("class", "select-all")
					.attr("x", 12)
					.attr("alignment-baseline", "central")
					.text("Click to select all")
					.style("cursor", "pointer")
					.on("click", function() {
						if (d3.select(this).classed("select-all")) { // text is select all
							// add class and change text to select none
							d3.select(this)
								.classed("select-all", false)
								.text("Click to select none");

							// fill in the circle
							selectGroup.select("circle")
										.style("fill", "black");

							// select all
							name.classed("selected", true);
							nameGroup.selectAll("circle")
										.style("fill", function() {
											var variableSelected = d3.select(this).data()[0];
											var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];
											var isOutcome = false;
											if ($.inArray(variableSelected, outcomes) != -1)
												isOutcome = true;

											// add visual elements
											if (isOutcome)
												return Database.outcomeColour;
											else
												return Database.factorColour;
										});

							// add variables to the lists
							var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];
							self.chosenVariables = [];
							self.chosenFactors = [];
							self.chosenOutcomes = [];
							for (var i = 0 ; i < Database.varName.length; i++) {
								var isOutcome = false;
								if ($.inArray(Database.varName[i], outcomes) != -1)
									isOutcome = true;

								if (isOutcome)
									self.chosenOutcomes.push(Database.varName[i]);
								else
									self.chosenFactors.push(Database.varName[i]);

								self.chosenVariables.push(Database.varName[i]);
							}
						}
						else { // text is select none
							// remove class
							d3.select(this)
								.classed("select-all", true)
								.text("Click to select all");;

							// leave the circle hollow
							selectGroup.select("circle")
										.style("fill", "none");

							// remove selection
							name.classed("selected", false);
							nameGroup.selectAll("circle")
										.style("fill", "none");

							// remove items
							self.chosenVariables = [];
							self.chosenFactors = [];
							self.chosenOutcomes = [];
						}
					});
	},
	createYearSelect: function() {
		var self = this;

		d3.select("#year-select")
			.append("text")
			.text("2013")
			.attr("alignment-baseline", "central")
			.attr("x", 30)
			.attr("y", 10)
			.attr("id", "y2013")
			.attr("class", "year")
			.attr("cursor", "pointer")
			.style("opacity", 0.1)
			.on("click", function() {
				// change opacity
				d3.selectAll(".year")
					.style("opacity", 0.1);
				d3.select("#y2013")
					.style("opacity", 1);

				Database.update(2013, 0);
			});

		d3.select("#year-select")
			.append("line")
			.attr("stroke-width", 1)
			.attr("stroke", "black")
			.attr("x1", 60)
			.attr("x2", 90)
			.attr("y1", 10)
			.attr("y2", 10)
			.style("opacity", 0.1);

		d3.select("#year-select")
			.append("text")
			.text("2014")
			.attr("alignment-baseline", "central")
			.attr("x", 100)
			.attr("y", 10)
			.attr("id", "y2014")
			.attr("class", "year")
			.attr("cursor", "pointer")
			.style("opacity", 0.1)
			.on("click", function() {
				// change opacity
				d3.selectAll(".year")
					.style("opacity", 0.1);
				d3.select("#y2014")
					.style("opacity", 1);

				Database.update(2014, 1);
			});

		d3.select("#year-select")
			.append("line")
			.attr("stroke-width", 1)
			.attr("stroke", "black")
			.attr("x1", 130)
			.attr("x2", 160)
			.attr("y1", 10)
			.attr("y2", 10)
			.style("opacity", 0.1);

		d3.select("#year-select")
			.append("text")
			.text("2015")
			.attr("alignment-baseline", "central")
			.attr("x", 170)
			.attr("y", 10)
			.attr("id", "y2015")
			.attr("class", "year")
			.attr("cursor", "pointer")
			.style("opacity", 0.1)
			.on("click", function() {
				// change opacity
				d3.selectAll(".year")
					.style("opacity", 0.1);
				d3.select("#y2015")
					.style("opacity", 1);

				Database.update(2015, 2);
			});

		d3.select("#year-select")
			.append("line")
			.attr("stroke-width", 1)
			.attr("stroke", "black")
			.attr("x1", 200)
			.attr("x2", 230)
			.attr("y1", 10)
			.attr("y2", 10)
			.style("opacity", 0.1);

		d3.select("#year-select")
			.append("text")
			.text("2016")
			.attr("alignment-baseline", "central")
			.attr("x", 240)
			.attr("y", 10)
			.attr("cursor", "pointer")
			.attr("id", "y2016")
			.attr("class", "year")
			.on("click", function() {
				// change opacity
				d3.selectAll(".year")
					.style("opacity", 0.1);
				d3.select("#y2016")
					.style("opacity", 1);

				Database.update(2016, 3);
			});

		// some instruction again
		d3.select("#year-select")
			.append("text")
			.attr("x", 770)
			.attr("y", 10)
			.attr("alignment-baseline", "central")
			.attr("text-anchor", "end")
			.attr("class", "instruction")
			.text("Click to combine the two circles →");
	},
	drawInstructions: function() {
		var self = this;

		self.svg.append("text")
					.attr("class", "instruction")
					.attr("x", self.margin.left)
					.attr("y", self.height - 20) 
					.text("1. Select health factors and outcomes. \xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + 
						  "\xa0\xa0\xa0\xa0\xa0 2. Hover on a state. \xa0\xa0\xa0\xa0\xa0\xa0\xa0" + 
						  "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa03. A state is highlighted if it is similar to the " +
						  "selected state in terms of the selected variables.");

		self.svg.append("text")
					.attr("class", "instruction")
					.attr("x", self.margin.left)
					.attr("y", self.height - 5)
					.text("4. The center circle is attracted towards the similar states and the bar charts inside indicates how similar a state is to the hovered state");
	},
	highlight: function(states, focalState, circleName) {
		var self = this;
		var colour = ""
		var textCoord = self.computeNodeCoordinates(self.radius + 15);

		if (circleName == "outcome")
			colour = Database.outcomeColour;
		else if (circleName == "factor")
			colour = Database.factorColour;
		else if (circleName == "variable")
			colour = "#999999";

		// change nodes and labels to highlight
		self.svg.selectAll("." + circleName + " .state-node")
				.style("opacity", 0.1);
		self.svg.selectAll("." + circleName + " .state-label")
				.style("opacity", 0.1);
		self.svg.selectAll("." + circleName + " .state-label")
			.style("font-size", 7);

		for (i in states) {
			self.svg.selectAll("." + circleName + " ." + states[i])
					.style("opacity", null);
			self.svg.selectAll("." + circleName + " .state-label." + states[i])
					.style("font-size", 10)
					.attr("x", function(d) {
						var index = parseInt(d3.select(this).attr("data-class"))
						return textCoord[index].x;
					})
					.attr("y", function(d) {
						var index = parseInt(d3.select(this).attr("data-class"))
						return textCoord[index].y;
					});
		}

		// highlight the focal state
		var numOfNodes = 51; // including the focal node
		var angleInterval = Math.PI * 2 / numOfNodes;
		var startingAngle = Math.PI / 2;
		var i = parseInt(self.svg.selectAll("." + circleName + " .state-label." + focalState).attr("data-class"));
		var currentAngle = startingAngle + i * angleInterval;
		var nodeX = (self.radius + 15) * Math.cos(currentAngle);
		var nodeY = (self.radius + 15) * Math.sin(currentAngle);

		self.svg.selectAll("." + circleName + " .state-node." + focalState)
					.style("fill", colour)
					.style("r", 9)
					.attr("cx", nodeX)
					.attr("cy", nodeY);
		self.svg.selectAll("." + circleName + " .state-label." + focalState)
					.style("fill", "white");
	},
	moveFocalNode: function(stateCount, circleName) { // using VIBE layout algorithm to find the new pos
		var self = this;
		var POI = [{ x: 0, y: 0, weight: null }]; // the centre is also one POI
		var barCoord = self.computeNodeCoordinates(self.radius - 18);

		// extract coordinates of all the states
		var maxWeight = 0;
		for (state in stateCount) {
			var coord = { x: null, y: null, weight: null };

			coord.x = parseFloat(self.svg.selectAll("." + circleName + " .state-node." + state).attr("cx"));
			coord.y = parseFloat(self.svg.selectAll("." + circleName + " .state-node." + state).attr("cy"));
			coord.weight = stateCount[state];

			if (stateCount[state] > maxWeight)
				maxWeight = stateCount[state];

			POI.push(coord);
		}

		// update state-bar
		var barScale = d3.scale.linear()
							.domain([0, maxWeight])
							.range([5, 15]);

		self.svg.selectAll("." + circleName + " .state-bar")
				.attr("height", function(d) {
					return barScale(stateCount[d.abbr]);
				})
				.attr("transform", function(d, i) {
					var angle = i * 360 / 51;
					var yShift = 8 - barScale(stateCount[d.abbr]);
					return "translate(" + barCoord[i].x + ", " + barCoord[i].y + ") " + "rotate(" + angle + ") " + "translate(" + (-self.barWidth / 2) + "," + yShift + ")";
				});;

		// set the weight of centre to the max
		POI[0].weight = maxWeight;

		// compute new coordinate for focual node
		var currentPos = POI[0];
		for (var i = 1; i < POI.length; i++) {
			var newPos = { x: null, y: null, weight: null };
			var currentPointWeight = currentPos.weight / (currentPos.weight + POI[i].weight);

			newPos.x = currentPos.x * currentPointWeight + POI[i].x * (1 - currentPointWeight);
			newPos.y = currentPos.y * currentPointWeight + POI[i].y * (1 - currentPointWeight);
			newPos.weight = currentPos.weight + POI[i].weight;

			currentPos = newPos;
		}

		// position the focal node using currentPos
		self.svg.select("." + circleName + " .focal-node")
				.transition()
				.attr("cx", currentPos.x)
				.attr("cy", currentPos.y);
	},
	changeCircles: function() {
		var self = this;

		if (self.isTwo)
			self.combineCircles();
		else
			self.splitCircle();
	},
	combineCircles: function() {
		var self = this;

		self.svg.select(".outcome").remove();
		self.svg.select(".factor").remove();

		self.createCircle("Health Variables");

		// change state
		self.isTwo = false;
		d3.select("#year-select .instruction")
			.text("Click to split the circle into factors and outcomes →");
	},
	splitCircle: function() {
		var self = this;

		self.svg.select(".variable").remove();

		self.createCircle("Health Factors");
		self.createCircle("Health Outcomes");

		// change state
		self.isTwo = true;
		d3.select("#year-select .instruction")
			.text("Click to combine the two circles →");
	}
}