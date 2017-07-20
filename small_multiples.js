var SmallMultiples = {
	width: null,
	height: null,
	margin: {top: 8, right: 10, bottom: 30, left: 25},
	svg: null,

	init: function(viewWidth, viewHeight) {

        var self = this;

        //default state is Georgia
        self.state = state;

        self.width = viewWidth - self.margin.left - self.margin.right;
        self.height = viewHeight - self.margin.top - self.margin.bottom;

        self.svg = d3.select("#sm-svg")
                    .attr("width", viewWidth)
                    .attr("height", viewHeight)
                    .append("g")
                    .attr("transform", "translate(" + self.margin.left + ", " + self.margin.top + ")");

        // draw small multiples
        d3.select("#current-state")
            .append("text")
            .attr("x", 10)
            .attr("y", 10)
            .attr("alignment-baseline", "central")
            .attr("fill", "black")
            .text("Click on a state to see its detailed temporal trend.");
    },
    create: function(state) {
        var self = this;
        var clean_data = [];
        var year = [2013, 2014, 2015, 2016];

        // set up the data in following format:
        // {key: var1, value: [rank2013, rank2014,...}
        for (var key in Database.varNameDict){
            clean_data.push({
                "varName": key,
                "value": [],
                "type": null
            });
        }

        Database.data.forEach(function(yearData, i) {
            yearData.forEach(function(stateData) {
                if (stateData.state == state){
                    for (var key in stateData){
                        value = stateData[key];
                        clean_data.forEach(function(stateData) {
                            if (stateData.varName == key)
                                stateData.value[i] = value;
                        });
                    }
                }
            });
        });

        clean_data.forEach(function(d, i) { // label first 6 as outcome and the rest as factor
            if (i < 5)
                d.type = "outcome"
            else
                d.type = "factor"
        });

        // used for position of each multiple
        var multipleXScale = d3.scale.ordinal()
                                        .domain([0, 1, 2, 3, 4, 5])
                                        .rangeBands([0, self.width], 0.3, 0);
        var multipleYScale = d3.scale.ordinal()
                                        .domain([0, 1, 2, 3])
                                        .rangeBands([0, self.height], 0.6, 0);

        // for each line chart
        var lineXScale = d3.scale.ordinal()
                                    .domain(year)
                                    .rangePoints([0, multipleXScale.rangeBand()], 1);
        var lineYScale = d3.scale.linear()
                                    .domain([1, 51])
                                    .range([0, multipleYScale.rangeBand()]);

        // encode postion for each multiple
        var multiplesUpdate = self.svg.selectAll(".multiples")
                                        .data(clean_data);
        var multiplesEnter = multiplesUpdate.enter()
                                            .append("g")
                                            .attr("class", function(d) {
                                                return d.varName + " multiples"
                                            })
                                            .attr("transform", function(d, i) {
                                                return "translate(" + multipleXScale(i % 6) + "," + multipleYScale(Math.floor(i / 6)) + ")";
                                            });

        // draw x axis
        multiplesEnter.append("g")
                        .attr("class", function(d){
                            if (d.type == "outcome")
                                return "axis sm outcome";
                            else
                                return "axis sm factor";
                         })
                        .attr("transform", "translate(0, " + multipleYScale.rangeBand() + ")")
                        .call(d3.svg.axis().scale(lineXScale).orient("bottom"));

        // draw y axis
        multiplesEnter.append("g")
                         .attr("class", function(d){
                            if (d.type == "outcome")
                                return "axis sm outcome";
                            else
                                return "axis sm factor";
                         })
                         .call(d3.svg.axis().scale(lineYScale).orient("left").tickValues([1, 25, 51]));

        // draw line chart
        var valueline = d3.svg.line()
                                .interpolate("cardinal")
                                .x(function(d, i) {
                                    return lineXScale(year[i]); 
                                })
                                .y(function(d) {
                                    return lineYScale(d); 
                                });

        multiplesUpdate.selectAll(".line")
                        .data(function(d) {
                            return d3.select(this.parentNode).data();
                        })
                        .transition()
                        .attr("d", function(d, i) {
                            return valueline(d.value);
                        });
        multiplesEnter.append("path")
                        .attr("class", function(d) {
                            if (d.type == "outcome")
                                return "line sm outcome";
                            else
                                return "line sm factor";
                        })
                        .attr("d", function(d) {
                            return valueline(d.value);
                        })
                        .style("fill", "none")
                        .style("stroke-width", 2)
                        .style("stroke", function(d) {
                            if (d.type == "outcome")
                                return Database.outcomeColour;
                            else
                                return Database.factorColour;
                        });

        // append title
        multiplesEnter.append("text")
                    .attr("x", multipleXScale.rangeBand() / 2)
                    .attr("y", multipleYScale.rangeBand() + 25)
                    .style("text-anchor", "middle")
                    .style("font-size", 9)
                    .style("fill", function(d) {
                        if (d.type == "outcome")
                            return Database.outcomeColour;
                        else
                            return Database.factorColour;
                     })
                    .text(function(d) {
                        return Database.varNameDict[d.varName];
                    });

        // update state on the toolbar
        d3.select("#current-state text")
            .text("Temporal Trends of " + state);
	},
    clear: function() {
        var self = this;

        self.svg.selectAll("*").remove();
        d3.select("#current-state text")
            .text("Click on a state to see its detailed temporal trend.");
    }
}