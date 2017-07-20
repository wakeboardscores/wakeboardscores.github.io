var DotPlot = {
	width: null,
	height: null,
	margin: {top: 30, right: 10, bottom: 0, left: 10},
	svg: null,

	allRankings: [[], [], [], []], // allRankings[0] = 2013 ... allRankings[3] = 2016
	summaryRankings: [[], [], [], []],

	currentState: "",
	needRestore: false, // if it is a bar chart and the user wants to sort, restore is needed
		
	init: function(viewWidth, viewHeight) {
		var self = this;

		self.extractRankings(); // for dot plot
		self.extractSummaryRankings(); // for bar chart

		self.width = viewWidth - self.margin.left - self.margin.right;
		self.height = viewHeight - self.margin.top - self.margin.bottom;

		self.svg = d3.select("#dp-svg")
						.attr("width", viewWidth)
						.attr("height", viewHeight)
						.append("g")
						.attr("transform", "translate(" + self.margin.left + ", " + self.margin.top + ")");

		self.initBarChart();
		self.drawLegend();
	},
	changePlot: function() {
		var self = this;

		if (self.currentState == "bar")
			self.initDotPlot();
		else if (self.currentState == "dot")
			self.initBarChart();
	},
	initBarChart: function() {
		var self = this;

		if (self.currentState == "bar") // just in case
			return;
		else if (self.currentState == "dot") // changing from dot to bar
			self.svg.selectAll("*").remove();

		var yScale = d3.scale.ordinal()
								.domain(Database.state)
								.rangeBands([0, self.height]);

		var state = self.svg.selectAll(".state")
							.data(self.summaryRankings[Database.currentIndex])
							.enter()
							.append("g")
							.attr("class", function(d) {
								return d[0][0].state.split(' ').join('-') + " state";
							})
							.attr("transform", function(d) {
								return "translate(0, " + yScale(d[0][0].state) + ")";
							})
							.attr("cursor", "pointer")
							.on("mouseenter", function(d, i) {
								d3.select(this)
									.select("rect")
									.attr("fill", "#999999");

								// show the user that some is high and some is low
								var stateRankings = Database.data[Database.currentIndex][i]; // an object
								for (key in stateRankings) {
									if (stateRankings[key] <= 17) {
										ArcView.svg.select("text." + key)
													.style("fill", Database.highColour);
									}
									else if (stateRankings[key] > 17 && stateRankings[key] <= 34) {
										ArcView.svg.select("text." + key)
													.style("fill", Database.moderateColour);
									}
									else if (stateRankings[key] > 34) {
										ArcView.svg.select("text." + key)
													.style("fill", Database.lowColour);
									}
								}

								// highlight the selected variables
								var hasChosen = (ArcView.chosenVariables.length > 0) ? true : false;
								if (hasChosen) {
									ArcView.svg.selectAll(".var-name")
													.style("opacity", "0.2");
									ArcView.svg.selectAll(".var-name.selected")
													.style("opacity", null);
								}

								// find common states
								if (ArcView.isTwo) {
									self.findCommonStates(stateRankings.abbr, "outcome");
									self.findCommonStates(stateRankings.abbr, "factor");
								}
								else {
									self.findCommonStates(stateRankings.abbr, "variable");
								}

							})
							.on("mouseleave", function(d, i) {
								// remove highlight
								d3.select(this)
									.select("rect")
									.attr("fill", "white");

								// restore text color
								ArcView.svg.selectAll(".var-name text")
											.style("fill", function(d) {
												var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];

												if ($.inArray(d, outcomes) != -1) // in the list
													return Database.outcomeColour;
												else
													return Database.factorColour;
											});

								// remove hightlights
								var hasChosen = (ArcView.chosenVariables.length > 0) ? true : false;
								if (hasChosen) {
									ArcView.svg.selectAll(".var-name")
														.style("opacity", null);
								}

								var textCoord = ArcView.computeNodeCoordinates(ArcView.radius + 10);
								var nodeCoord = ArcView.computeNodeCoordinates(ArcView.radius);

								// remove all the highlights
								ArcView.svg.selectAll(".state-node")
											.style("opacity", null);
								ArcView.svg.selectAll(".state-label")
											.style("opacity", null)
											.style("font-size", 7)
											.attr("x", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return textCoord[index].x;
											})
											.attr("y", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return textCoord[index].y;
											});

								// move the focal node to the centre
								ArcView.svg.selectAll(".focal-node")
											.transition()
											.attr("cx", 0)
											.attr("cy", 0);

								// remove the bars
								ArcView.svg.selectAll(".state-bar")
											.attr("height", 0);

								// remove focalNode's highlight
								ArcView.svg.selectAll(".state-node")
											.style("fill", "none")
											.style("r", 3)
											.attr("cx", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return nodeCoord[index].x;
											})
											.attr("cy", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return nodeCoord[index].y;
											});
								if (ArcView.isTwo) {
									ArcView.svg.selectAll(".outcome .state-label")
											.style("fill", Database.outcomeColour);
									ArcView.svg.selectAll(".factor .state-label")
											.style("fill", Database.factorColour);
								}
								else {
									ArcView.svg.selectAll(".variable .state-label")
												.style("fill", "#999999");
								}
							})
							.on("click", function(d) {
								var state = d[0][0].state;
								SmallMultiples.create(state);
							});

		// append rect for hovering
		state.append("rect")
				.attr("x", 0)
				.attr("y", -yScale.rangeBand() / 2)
				.attr("height", yScale.rangeBand())
				.attr("width", self.width + 4)
				.attr("fill", "white")
				.attr("opacity", 0.1);

		// append group for state name and rankings
		var nameRankingGroup = state.append("g");

		// draw state names
		nameRankingGroup.append("text")
						.text(function(d) {
							return d[0][0].state;
						})
						.attr("alignment-baseline", "central")
						.attr("class", "stateName")
						.attr("x", 0)
						.attr("y", 0);

		// draw the group of bars
		var groupWidth = (self.width - 100) / 3;
		var max = 0;
		var currentData = self.summaryRankings[Database.currentIndex];
		for (var i = 0; i < currentData.length; i++) {
			for (var j = 0; j < currentData[i].length; j++) {
				var currentBarValue = currentData[i][j][0].count + currentData[i][j][1].count;
				if (currentBarValue > max)
					max = currentBarValue;
			}
		}
		var padding = 10;
		var widthScale = d3.scale.linear()
								.domain([0, max])
								.range([0, groupWidth - padding]);


		HMLGroup = nameRankingGroup.selectAll("g")
									.data(function(d) {
										return d;
									})
									.enter()
									.append("g")
									.attr("class", function(d, i) {
										if (i == 0)
											return "high";
										else if (i == 1)
											return "medium";
										else
											return "low";
									})
									.attr("transform", function(d, i) {
										if (i == 0)
											return "translate(100, 0)"
										else if (i == 1)
											return "translate(" + (100 + groupWidth) + ", 0)";
										else
											return "translate(" + (100 + groupWidth * 2) + ", 0)";
									});

		HMLGroup.selectAll("rect")
					.data(function(d) {
						return d;
					})
					.enter()
					.append("rect")
					.attr("class", function(d, i) {
						if (i == 0)
							return "factor";
						else if (i == 1)
							return "outcome";
					})
					.attr("height", 4)
					.attr("width", function(d) {
						return widthScale(d.count);
					})
					.attr("x", function(d, i) {
						if (i == 0) // factor
							return 0;
						if (i == 1) // outcome
							return widthScale(d3.select(this.parentNode).datum()[0].count);
					})
					.attr("y", -yScale.rangeBand() / 2 + yScale.rangeBand() / 2 - 4 / 2)
					.style("fill", function(d, i) {
						if (i == 0) // factor
							return Database.factorColour;
						if (i == 1) // outcome
							return Database.outcomeColour;
					});

		// draw an axes for showing the meaning
		var axisScale = d3.scale.ordinal()
								.domain([])
								.range([0, groupWidth - padding]);
		var axis = d3.svg.axis()
							.scale(axisScale)
							.orient("top");

		var highAxis = self.svg.append("g")
								.call(axis)
								.attr("class", "axis")
								.attr("transform", "translate(100, -10)");
		var moderateAxis = self.svg.append("g")
									.call(axis)
									.attr("class", "axis")
									.attr("transform", "translate(" + (100 + groupWidth) + ", -10)");
		var lowAxis = self.svg.append("g")
								.call(axis)
								.attr("class", "axis")
								.attr("transform", "translate(" + (100 + groupWidth * 2) + ", -10)");
		highAxis.append("text")
				.attr("text-anchor", "middle")
				.attr("transform", "translate(" + ((groupWidth - 10) / 2) + ", -8)")
				.style("fill", Database.highColour)
				.text("High")
				.style("font-size", 10);
		moderateAxis.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(" + ((groupWidth - 10) / 2) + ", -8)")
					.style("fill", Database.moderateColour)
					.text("Moderate")
					.style("font-size", 10);
		lowAxis.append("text")
				.attr("text-anchor", "middle")
				.attr("transform", "translate(" + ((groupWidth - 10) / 2) + ", -8)")
				.style("fill", Database.lowColour)
				.text("Low")
				.style("font-size", 10);

		// change state
		self.currentState = "bar";
		$("#init-dot-plot span").removeClass("ui-icon-minus")
								.addClass("ui-icon-plus");
		d3.select("#legend .instruction")
			.text("Click to see details →");
	},
	initDotPlot: function() {
		var self = this;

		if (self.currentState == "dot") // just in case
			return;
		else if (self.currentState == "bar") // changing from bar to dot
			self.svg.selectAll("*").remove();


		var xScale = d3.scale.linear()
								.domain([1,51])
								.range([100, self.width]);
		var yScale = d3.scale.ordinal()
								.domain(Database.state)
								.rangeBands([0, self.height]);

		// draw all the state groups
		var state = self.svg.selectAll(".state")
							.data(self.allRankings[Database.currentIndex])
							.enter()
							.append("g")
							.attr("class", function(d) {
								return d[0].state.split(' ').join('-') + " state";
							})
							.attr("transform", function(d) {
								return "translate(0, " + yScale(d[0].state) + ")";
							})
							.attr("cursor", "pointer")
							.on("mouseenter", function(d, i) {
								d3.select(this)
									.select("rect")
									.attr("fill", "#999999");

								// show the user that some is high and some is low
								var stateRankings = Database.data[Database.currentIndex][i]; // an object
								for (key in stateRankings) {
									if (stateRankings[key] <= 17) {
										ArcView.svg.select("text." + key)
													.style("fill", Database.highColour);
									}
									else if (stateRankings[key] > 17 && stateRankings[key] <= 34) {
										ArcView.svg.select("text." + key)
													.style("fill", Database.moderateColour);
									}
									else if (stateRankings[key] > 34) {
										ArcView.svg.select("text." + key)
													.style("fill", Database.lowColour);
									}
								}

								// highlight the selected variables
								var hasChosen = (ArcView.chosenVariables.length > 0) ? true : false;
								if (hasChosen) {
									ArcView.svg.selectAll(".var-name")
													.style("opacity", "0.2");
									ArcView.svg.selectAll(".var-name.selected")
													.style("opacity", null);
								}

								// find common states
								if (ArcView.isTwo) {
									self.findCommonStates(stateRankings.abbr, "outcome");
									self.findCommonStates(stateRankings.abbr, "factor");
								}
								else {
									self.findCommonStates(stateRankings.abbr, "variable");
								}

							})
							.on("mouseleave", function(d, i) {
								// remove highlight
								d3.select(this)
									.select("rect")
									.attr("fill", "white");

								// restore text color
								ArcView.svg.selectAll(".var-name text")
											.style("fill", function(d) {
												var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];

												if ($.inArray(d, outcomes) != -1) // in the list
													return Database.outcomeColour;
												else
													return Database.factorColour;
											});

								// remove hightlights
								var hasChosen = (ArcView.chosenVariables.length > 0) ? true : false;
								if (hasChosen) {
									ArcView.svg.selectAll(".var-name")
														.style("opacity", null);
								}

								var textCoord = ArcView.computeNodeCoordinates(ArcView.radius + 10);
								var nodeCoord = ArcView.computeNodeCoordinates(ArcView.radius);

								// remove all the highlights
								ArcView.svg.selectAll(".state-node")
											.style("opacity", null);
								ArcView.svg.selectAll(".state-label")
											.style("opacity", null)
											.style("font-size", 7)
											.attr("x", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return textCoord[index].x;
											})
											.attr("y", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return textCoord[index].y;
											});

								// move the focal node to the centre
								ArcView.svg.selectAll(".focal-node")
											.transition()
											.attr("cx", 0)
											.attr("cy", 0);

								// remove the bars
								ArcView.svg.selectAll(".state-bar")
											.attr("height", 0);

								// remove focalNode's highlight
								ArcView.svg.selectAll(".state-node")
											.style("fill", "none")
											.style("r", 3)
											.attr("cx", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return nodeCoord[index].x;
											})
											.attr("cy", function(d) {
												var index = parseInt(d3.select(this).attr("data-class"))
												return nodeCoord[index].y;
											});
								if (ArcView.isTwo) {
									ArcView.svg.selectAll(".outcome .state-label")
											.style("fill", Database.outcomeColour);
									ArcView.svg.selectAll(".factor .state-label")
											.style("fill", Database.factorColour);
								}
								else {
									ArcView.svg.selectAll(".variable .state-label")
												.style("fill", "#999999");
								}
							})
							.on("click", function(d) {
								var state = d[0].state;
								SmallMultiples.create(state);
							});

		// append rect for hovering
		state.append("rect")
				.attr("x", 0)
				.attr("y", -yScale.rangeBand() / 2)
				.attr("height", yScale.rangeBand())
				.attr("width", self.width + 4)
				.attr("fill", "white")
				.attr("opacity", 0.1);

		// append group for state name and rankings
		var nameRankingGroup = state.append("g");

		// draw state names
		nameRankingGroup.append("text")
						.text(function(d) {
							return d[0].state;
						})
						.attr("alignment-baseline", "central")
						.attr("class", function(d) {
							return "stateName";
						})
						.attr("x", 0)
						.attr("y", 0);

		// draw the group of dots
		nameRankingGroup.selectAll("circle")
						.data(function(d) {
							return d;
						})
						.enter()
						.append("circle")
						.attr("class", function(d) {
							return d.variable;
						})
						.attr("r", 3)
						.attr("fill", function(d) {		
							if (d.isFactor)
								return Database.factorColour;
							else
								return Database.outcomeColour;
						})
						.attr("opacity", 0.5)
						.attr("cx", function(d) {
							return xScale(d.ranking);
						})
						.on("mouseover", function() {
							var variableName = d3.select(this).attr("class");

							// hightlight text in arc view
							ArcView.svg.selectAll(".var-name")
										.style("opacity", "0.2");
							ArcView.svg.select(".var-name." + variableName)
										.style("opacity", null);

							// change its own appearance
							d3.select(this)
								.attr("r", 5)
								.attr("opacity", null);
						})
						.on("mouseout", function() {
							// restore its appearance
							d3.select(this)
								.attr("r", 3)
								.attr("opacity", 0.5);

							// restore text in arc view
							ArcView.svg.selectAll(".var-name")
										.style("opacity", null);
						});

		// draw an axis for showing the meaning
		var axisScale = d3.scale.ordinal()
								.domain([])
								.range([100, self.width]);
		var axis = d3.svg.axis()
							.scale(axisScale)
							.orient("top");

		var axisGroup = self.svg.append("g")
								.call(axis)
								.attr("class", "axis")
								.attr("transform", "translate(0, -10)");

		axisGroup.append("text")
					.attr("text-anchor", "start")
					.attr("transform", "translate(" + (100 + 15) + ", -8)")
					.style("fill", Database.highColour)
					.text("Good")
					.style("font-size", 10);
		axisGroup.append("text")
					.attr("text-anchor", "end")
					.attr("transform", "translate(" + (self.width - 15) + ", -8)")
					.style("fill", Database.lowColour)
					.text("Bad")
					.style("font-size", 10);

		// change state
		self.currentState = "dot";
		$("#init-dot-plot span").removeClass("ui-icon-plus")
								.addClass("ui-icon-minus");
		d3.select("#legend .instruction")
			.text("Click to see overview →");

	},
	update: function(index) {
		var self = this;

		if (self.currentState == "bar")
			self.updateBarChart(index);
		else if (self.currentState == "dot")
			self.updateDotPlot(index);
	},
	updateDotPlot: function(index) {
		var self = this;

		var xScale = d3.scale.linear()
								.domain([1,51])
								.range([100, self.width]);
		var yScale = d3.scale.ordinal()
								.domain(Database.state)
								.rangeBands([0, self.height]);

		// draw all the state groups
		var state = self.svg.selectAll(".state")
							.data(self.allRankings[index])
							.attr("class", function(d) {
								return d[0].state.split(' ').join('-') + " state";
							})
							.attr("transform", function(d) {
								return "translate(0, " + yScale(d[0].state) + ")";
							});

		// get name and ranking group
		var nameRankingGroup = state.select("g");

		// draw state names
		nameRankingGroup.select("text")
						.text(function(d) {
							return d[0].state;
						})
						.attr("class", function(d) {
							return "stateName";
						});

		// draw the group of dots
		nameRankingGroup.selectAll("circle")
						.data(function(d) {
							return d;
						})
						.attr("class", function(d) {
							return d.variable;
						})
						.transition()
						.attr("fill", function(d) {		
							if (d.isFactor)
								return Database.factorColour;
							else
								return Database.outcomeColour;
						})
						.attr("cx", function(d) {
							return xScale(d.ranking);
						});
	},
	updateBarChart: function(index) {
		var self = this;

		var yScale = d3.scale.ordinal()
								.domain(Database.state)
								.rangeBands([0, self.height]);

		// update state group
		var state = self.svg.selectAll(".state")
							.data(self.summaryRankings[index])
							.attr("class", function(d) {
								return d[0][0].state.split(' ').join('-') + " state";
							})
							.attr("transform", function(d) {
								return "translate(0, " + yScale(d[0][0].state) + ")";
							});

		// select the group inside
		var nameRankingGroup = state.select("g")
									
		// select state names
		nameRankingGroup.select("text")
						.text(function(d) {
							return d[0][0].state;
						});

		// update the group of bars
		var groupWidth = (self.width - 100) / 3;
		var max = 0;
		var currentData = self.summaryRankings[index];
		for (var i = 0; i < currentData.length; i++) {
			for (var j = 0; j < currentData[i].length; j++) {
				var currentBarValue = currentData[i][j][0].count + currentData[i][j][1].count;
				if (currentBarValue > max)
					max = currentBarValue;
			}
		}
		var padding = 10;
		var widthScale = d3.scale.linear()
									.domain([0, max])
									.range([0, groupWidth - padding]);


		HMLGroup = nameRankingGroup.selectAll("g")
									.data(function(d) {
										return d;
									});

		HMLGroup.selectAll("rect")
					.data(function(d) {
						return d;
					})
					.transition()
					.attr("width", function(d) {
						return widthScale(d.count);
					})
					.attr("x", function(d, i) {
						if (i == 0) // factor
							return 0;
						if (i == 1) // outcome
							return widthScale(d3.select(this.parentNode).datum()[0].count);
					});
	},
	extractRankings: function() {
		var self = this;

		var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];

		for (var i = 0; i < 4; i++) {
			$.map(Database.data[i], function(stateData, index) { // loop for each state
				var stateRankings = []; // an array of rankingObj for a state

	    		$.map(stateData, function(value, key) { // loop for each ranking of a state
	    			if (key != "state" && key != "abbr") {
	    				var rankingObj = {
		    				ranking: 0,
		    				variable: null,
		    				isFactor: null,
		    				state: null
	    				};

	    				// storing the value of rankingObj   d
	    				rankingObj.ranking = value;
	    				rankingObj.variable = key;
	    				rankingObj.state = stateData.state;
		    			if ($.inArray(key, outcomes) != -1) // if the key is an outcome
		    				rankingObj.isFactor = false;
		    			else// if it is an outcome variable
		    				rankingObj.isFactor = true;

	    				stateRankings.push(rankingObj);
	    			}
	    		});

	    		self.allRankings[i].push(stateRankings);
			});
		}
	},
	extractSummaryRankings: function() {
		var self = this;

		var outcomes = ["premDeath", "poorHealth", "poorPhyHealth", "poorMenHealth", "lowBWeight"];
		for (var i = 0; i < 4; i++) {
			$.map(Database.data[i], function(stateData, index) { // loop for each state
				// 0: high, 1: medium, 2: low rankings for a state
				// 0: factor, 1: outcome
				var stateBarChart = [
					[
						{
							isFactor: true,
							state: stateData.state,
							count: 0
						},
						{
							isFactor: false,
							state: stateData.state,
							count: 0
						}
					],
					[
						{
							isFactor: true,
							state: stateData.state,
							count: 0
						},
						{
							isFactor: false,
							state: stateData.state,
							count: 0
						}
					],
					[
						{
							isFactor: true,
							state: stateData.state,
							count: 0
						},
						{
							isFactor: false,
							state: stateData.state,
							count: 0
						}
					]
				];

				// count number in each bin
				for (key in stateData) {
					if (key != "state" && key != "abbr") {
						if ($.inArray(key, outcomes) != -1) { // outcome
							if (stateData[key] <= 17) // low
								stateBarChart[0][1].count++;
							else if (stateData[key] > 17 && stateData[key] <= 34) // medium
								stateBarChart[1][1].count++;
							else if (stateData[key] > 34) // high
								stateBarChart[2][1].count++;
						}
		    			else { // factor
		    				if (stateData[key] <= 17) // low
								stateBarChart[0][0].count++;
							else if (stateData[key] > 17 && stateData[key] <= 34) // medium
								stateBarChart[1][0].count++;
							else if (stateData[key] > 34) // high
								stateBarChart[2][0].count++;
		    			}
					}
				}

				// push to corr array
				self.summaryRankings[i].push(stateBarChart);
			});
		}
	},
	sort: function(varName) {
		var self = this;

		if (self.currentState == "bar") {
			self.needRestore = true; // if dot, no need, else needed
			self.initDotPlot();
		}
		else {
			self.needRestore = false;
		}
		
		// extract the data you want
		var extractedData = [];

		$.map(Database.data[Database.currentIndex], function(stateData, index) { // loop for each state
			var stateExtractedData = {
				state: stateData.state,
				ranking: stateData[varName]
			};

			extractedData.push(stateExtractedData);
		});

		// sort them and extract the list of ordered states
		var sortedStates = [];
		extractedData.sort(function(a, b) {
			return a.ranking - b.ranking;
		});
		$.map(extractedData, function(d, index) {
			sortedStates.push(d.state);
		});

		// sort the visual elements
		var yScale = d3.scale.ordinal()
								.domain(sortedStates)
								.rangeBands([0, self.height]);
		for (var i = 0; i < sortedStates.length; i++) {
			d3.selectAll("." + sortedStates[i].split(' ').join('-'))
				.transition()
				.attr("transform", function(d) {
					return "translate(0, " + yScale(sortedStates[i]) + ")";
				})
		}

		var className = "." + varName;

		// showing only the related circles
		DotPlot.svg.selectAll("circle")
					.attr("opacity", 0);
		DotPlot.svg.selectAll(className)
					.attr("opacity", 0.5);
	},
	restore: function() { 
		var self = this;

		if (!self.needRestore) { // previously is a dot plot
			var yScale = d3.scale.ordinal()
								.domain(Database.state)
								.rangeBands([0, self.height]);

			for (var i = 0; i < Database.state.length; i++) {
				d3.selectAll("." + Database.state[i].split(' ').join('-'))
					.transition()
					.attr("transform", function(d) {
						return "translate(0, " + yScale(Database.state[i]) + ")";
					});
			}

			self.svg.selectAll("circle")
						.attr("opacity", 0.5);
		}
		
		if (self.needRestore) {
			self.initBarChart();
		}
	},
	drawLegend: function() {
		var self = this;

		// draw the legend
		d3.select("#legend")
			.append("circle")
			.attr("r", 5)
			.attr("cx", 20)
			.attr("cy", 10)
			.attr("fill", Database.factorColour)
		d3.select("#legend")
			.append("text")
			.attr("x", 30)
			.attr("y", 10)
			.attr("alignment-baseline", "central")
			.attr("fill", Database.factorColour)
			.text("Health Factors");
		d3.select("#legend")
			.append("circle")
			.attr("r", 5)
			.attr("cx", 120)
			.attr("cy", 10)
			.attr("fill", Database.outcomeColour)
		d3.select("#legend")
			.append("text")
			.attr("x", 130)
			.attr("y", 10)
			.attr("alignment-baseline", "central")
			.attr("fill", Database.outcomeColour)
			.text("Health Outcomes");

		// some instruction again
		d3.select("#legend")
			.append("text")
			.attr("class", "instruction")
			.attr("x", 370)
			.attr("y", 10)
			.attr("alignment-baseline", "central")
			.attr("text-anchor", "end")
			.text("Click to see details →");
	},
	findCommonStates: function(state, circleName) {
		var self = this;
		var commonStates = [];
		var stateCount = {};
		var chosenVariables = [];

		if (circleName == "factor")
			chosenVariables = ArcView.chosenFactors;
		else if (circleName == "outcome")
			chosenVariables = ArcView.chosenOutcomes;
		else if (circleName == "variable")
			chosenVariables = ArcView.chosenVariables;

		if (chosenVariables.length == 0)
			return;

		// init the vector
		for (i in Database.abbr) {
			stateCount[Database.abbr[i]] = 0;
		}

		// finding common states in terms of factor
		var currentStates = [];
		var foundStates = [];
		$.extend(true, currentStates, Database.abbr); // create a deep copy of abbr
		for (i in chosenVariables) {
			var variable = chosenVariables[i];
			var HML = Database.HMLdata[Database.currentIndex][state][variable]; // H, M, L for a variable for a state

			for (j in currentStates) {
				var currentState = currentStates[j];
				var stateData = Database.HMLdata[Database.currentIndex][currentState];
				if (stateData[variable] == HML) {
					foundStates.push(stateData["abbr"])
					stateCount[stateData["abbr"]]++;
				}
			}

			currentStates = foundStates;
			foundStates = [];
		}
		commonStates = currentStates;

		if (commonStates.length != 0) {
			ArcView.highlight(commonStates, state, circleName);
			ArcView.moveFocalNode(stateCount, circleName);
		}
	}
}
