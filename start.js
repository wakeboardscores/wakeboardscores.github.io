$(function(){
	// create layout
	$("#content").css("width", 1280)

	$("#left").css("display", "inline-block")
						.css("width", 400)
						.css("height", 650)
						.css("vertical-align", "top");
	$("#right").css("display", "inline-block")
						.css("width", 800)
						.css("height", 650)
						.css("vertical-align", "top");

	$("#dot-plot").css("width", 400)
						.css("height", 650)
						.addClass("ui-widget-content ui-corner-all noselection");
	$("#small-multiples").css("display", "inline-block")
						.css("width", 800)
						.css("height", 250)
						.addClass("ui-widget-content ui-corner-all noselection");
	$("#arc-view").css("display", "inline-block")
						.css("width", 800)
						.css("height", 375)
						.addClass("ui-widget-content ui-corner-all noselection");

	// adjust toolbar width
	$("#right .toolbar").css("width", 800)
						.css("height", 20);
	$("#left .toolbar").css("width", 400)
						.css("height", 20);

	// adjust toolbar svg width
	d3.select("#legend")
		.attr("width", 370)
		.attr("height", 20);
	d3.select("#year-select")
		.attr("width", 770)
		.attr("height", 20);
	d3.select("#current-state")
		.attr("width", 770)
		.attr("height", 20);

	// add svg
	$("#dot-plot").append("<svg id='dp-svg'></svg>");
	$("#small-multiples").append("<svg id='sm-svg'></svg>");
	$("#arc-view").append("<svg id='av-svg'></svg>");

	// buttons
	$("#init-dot-plot").click(function() {
		DotPlot.changePlot();
	});
	$("#combine-circles").click(function() {
		ArcView.changeCircles();
	});
	$("#clear-small-multiples").click(function() {
		SmallMultiples.clear();
	})

	Database.getData();
});
