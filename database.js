// get data by calling e.g. Database.data2013
var Database = {
	data: [[], [], [], []], // data[0] = 2013 ... data[3] = 2016
	HMLdata: [[], [], [], []],

	state: null,
	abbr: null,
	stateByRegions: [],
	numberOfStatesByRegions: [],
	regions: [],

	factorColour: "#f1a340",
	outcomeColour: "#9467bd",

	highColour: "#67bf5c",
	moderateColour: "#a2a2a2",
	lowColour: "#ed665d",

	varName: null,
	varNameDict: {
		"premDeath": "Premature death",
		"poorHealth": "Poor or fair health",
		"poorPhyHealth": "Poor physical health days",
		"poorMenHealth": "Poor mental health days",
		"lowBWeight": "Low birthweight",
		"smoking": "Adult smoking",
		"obesity": "Adult obesity",
		"inactivity": "Physical inactivity",
		"excessDrinking": "Excessive drinking",
		"drivingDeaths": "Alcohol-impaired driving deaths",
		"std": "Sexually transmitted infections",
		"teenBirths": "Teen births",
		"uninsured": "Uninsured",
		"primaryCare": "Primary care physicians",
		"dentists": "Dentists",
		"hospitalStays": "Preventable hospital stays",
		"diabetes": "Diabetic monitoring",
		"mamScreening": "Mammography screening",
		"HSgraduation": "High school graduation",
		"college": "Some college",
		"unemployment": "Unemployment",
		"childrenPoverty": "Children in poverty",
		"singleParent": "Single-parent children",
		"crime": "Violent crime"
	},

	currentYear: 2016,
	currentIndex: 3,

	getData: function() {
		var self = this;

		d3.csv("csv/2013_Rank_Data.csv", type, function(data2013) {
		d3.csv("csv/2014_Rank_Data.csv", type, function(data2014) {
		d3.csv("csv/2015_Rank_Data.csv", type, function(data2015) {
		d3.csv("csv/2016_Rank_Data.csv", type, function(data2016) {
		d3.csv("csv/states.csv", function(states) {

			self.data[0] = data2013;
			self.data[1] = data2014;
			self.data[2] = data2015;
			self.data[3] = data2016;

			// extract HML data
			$.extend(true, self.HMLdata[0], self.data[0]);
			$.extend(true, self.HMLdata[1], self.data[1]);
			$.extend(true, self.HMLdata[2], self.data[2]);
			$.extend(true, self.HMLdata[3], self.data[3]);
			self.processData();

			// extract state names and abbr
			self.state = data2016.map(function(d) {
				return d.state;
			});
			self.abbr = data2016.map(function(d) {
				return d.abbr;
			});

			// extract variable names
			self.varName = Object.keys(data2016[0]);
			self.varName.splice(self.varName.indexOf("state"), 1);
			self.varName.splice(self.varName.indexOf("abbr"), 1);

			// extract state by regions data
			var regions = d3.nest()
							.key(function(d) {
								return d.region;
							})
							.map(states);
			for (i in regions) {
				for (state in regions[i]) {
					var currentState = regions[i][state];
					self.stateByRegions.push(currentState);
				}
				self.numberOfStatesByRegions.push(regions[i].length);
				self.regions.push(i)
			}

			DotPlot.init(400, 650);
			ArcView.init(800, 375);
			SmallMultiples.init(800, 250);

		});
		});
		});
		});
		});

		function type(d) {
			for (key in d)
				if (key != "state" && key != "abbr")
					d[key] = +d[key];

			return d;
		}
	},
	processData: function() {
		var self = this;

		for (var i = 0; i < self.HMLdata.length; i++) {
			for (var j = 0; j < self.HMLdata[i].length; j++) {
				var state = self.HMLdata[i][j];
				for (key in state) {
					if (key != "state" && key != "abbr") {
						if (state[key] <= 17)
						state[key] = "H";
						else if (state[key] > 17 && state[key] <= 34)
							state[key] = "M";
						else
							state[key] = "L";
					}
				}
			}
		}

		for (var i = 0; i < self.HMLdata.length; i++) {
			self.HMLdata[i] = d3.nest()
								.key(function(d) {
									return d.abbr;
								})
								.map(self.HMLdata[i]);

			for (abbr in self.HMLdata[i]) {
				self.HMLdata[i][abbr] = self.HMLdata[i][abbr][0];
			}
		}
	},
	update: function(year, index) {
		var self = this;

		// year = currentYear, no need to update
		if (self.currentYear == year)
			return;

		DotPlot.update(index);
		// TODO: ArcView and SmallMultiples update

		self.currentYear = year;
		self.currentIndex = index;
	}
};