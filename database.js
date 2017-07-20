// get data by calling e.g. Database.data2013
var Database = {
	data: [[], [], []], // data[0] = 2013 ... data[2] = 2015
	HMLdata: [[], [], []],

	school: null,
	abbr: null,
	schoolByRegions: [],
	numberOfSchoolsByRegions: [],
	regions: [],

	factorColour: "#f1a340",
	outcomeColour: "#9467bd",

	highColour: "#67bf5c",
	moderateColour: "#a2a2a2",
	lowColour: "#ed665d",

	varName: null,
	varNameDict: {
		"ftEmployed" : "Full time employment",
    "ftGradschool" : "Graduate school",
    "ptEmployed" : "Part time employment",
    "gapYear" : "Took a gap year",
    "jobSearch" : "Job hunting",
    "careerFTE" : "Career Svcs FTE",
    "careerServices" : "No. of services offered",
    "orgsRecruiting" : "No. of companies recruiting",
    "operatingBudget" :	"Career Svcs. budget",
    "employerPartners" : "Career Svcs. partners",
    "totalCostAttendance" :	"Total tuition & board",
    "pellGrants" : "No. of pell grants",
    "graduatingClassSize" :	"Graduating class size",
    "totalSchoolSize" :	"Total student population",
    "totalRevenue" : "Total school revenue",
    "retentionRate" : "Undergrad retention rate",
    "studentFacultyRatio" :	"Student/Faculty ratio",
    "graduationRate" : "Graduation rate",
    "financialAidFirst" : "Financial aid to freshmen",
    "financialAidAll" : "Financial aid to all",
    "fulltimeFaculty" : "Full time faculty",
    "numberApplicants" : "Number of applicants",
    "admitRate" : "Rate of admission",
    "admitYield" : "Yield on admissions",
	},

	currentYear: 2015,
	currentIndex: 2,

	getData: function() {
		var self = this;

		d3.csv("csv/libarts2013.csv", type, function(data2013) {
		d3.csv("csv/libarts2014.csv", type, function(data2014) {
		d3.csv("csv/libarts.csv", type, function(data2015) {
		d3.csv("csv/schools.csv", function(schools) {

			self.data[0] = data2013;
			self.data[1] = data2014;
			self.data[2] = data2015;

			// extract HML data
			$.extend(true, self.HMLdata[0], self.data[0]);
			$.extend(true, self.HMLdata[1], self.data[1]);
			$.extend(true, self.HMLdata[2], self.data[2]);
			// $.extend(true, self.HMLdata[3], self.data[3]);
			self.processData();

			// extract school names and abbr
			self.school = data2015.map(function(d) {
				return d.school;
			});
			self.abbr = data2015.map(function(d) {
				return d.abbr;
			});

			// extract variable names
			self.varName = Object.keys(data2015[0]);
			self.varName.splice(self.varName.indexOf("school"), 1);
			self.varName.splice(self.varName.indexOf("abbr"), 1);

			// extract schools by regions data
			var regions = d3.nest()
							.key(function(d) {
								return d.region;
							})
							.map(schools);
			for (i in regions) {
				for (school in regions[i]) {
					var currentSchool = regions[i][school];
					self.schoolByRegions.push(currentSchool);
				}
				self.numberOfSchoolsByRegions.push(regions[i].length);
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
				if (key != "school" && key != "abbr")
					d[key] = +d[key];

			return d;
		}
	},
	processData: function() {
		var self = this;

		for (var i = 0; i < self.HMLdata.length; i++) {
			for (var j = 0; j < self.HMLdata[i].length; j++) {
				var school = self.HMLdata[i][j];
				for (key in school) {
					if (key != "school" && key != "abbr") {
						if (school[key] <= 17)
						school[key] = "H";
						else if (school[key] > 17 && school[key] <= 34)
							school[key] = "M";
						else
							school[key] = "L";
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
