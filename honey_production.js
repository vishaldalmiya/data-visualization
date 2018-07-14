function parse_state_data(data) {
    var state_db = {}
    for (d in data) {
        if (!(data[d].state in state_db)) {
            state_db[data[d].state] = []
        }
        state_db[data[d].state].push(data[d])
    }
    return state_db
}

function honey_production_dv() {
    var svg = d3.select("svg"),
        margin = { top: 20, right: 80, bottom: 30, left: 100 },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var line = d3.line()
        //.curve(d3.curveBasis)
        .x(function (d) { return x(d.year); })
        .y(function (d) { return y(d.totalprod); });

    d3.csv("honeyproduction.csv", function (db) {
        var state_data = parse_state_data(db)

        data = state_data["CA"]

        x.domain(d3.extent(data, function (d) {
            console.log(d.state)
            console.log(d.totalprod)
            console.log(d.year)
            return d.year;
        }));
        y.domain(d3.extent(data, function (d) { return d.totalprod; }));

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .select(".domain")
            .remove();

        g.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Total productions (lbs)");

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            // .attr("stroke-linejoin", "bevel")
            // .attr("stroke-linecap", "bevel")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        data = state_data["ND"]
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "red")
            // .attr("stroke-linejoin", "bevel")
            // .attr("stroke-linecap", "bevel")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    }
    )
}