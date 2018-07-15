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

function get_sorted_hash(inputHash) {
    var resultHash = {};

    var keys = Object.keys(inputHash);
    keys.sort(function (a, b) {
        return inputHash[a] - inputHash[b]
    }).reverse().forEach(function (k) {
        resultHash[k] = inputHash[k];
    });
    return resultHash;
}

function sort_state_by_totalprod(state_db) {
    state_totalprod = {}
    for (state in state_db) {
        sum_totalprod = 0
        for (idx in state_db[state]) {
            sum_totalprod += parseInt(state_db[state][idx].totalprod)
        }
        state_totalprod[sum_totalprod] = state
    }
    return get_sorted_hash(state_totalprod)
}

function draw_line_chart(g, data, line, x_scale, y_scale, color, state) {
    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.0)
        .attr("d", line)

    g.append('text')
        .attr('class', 'barsEndlineText')
        .attr('text-anchor', 'middle')
        .attr("x", x_scale(data[data.length - 1].year))
        .attr("y", y_scale(data[data.length - 1].totalprod))
        .text(state)
}

function honey_production_dv() {
    num_top_state_by_totalprod = 7
    num_bottom_state_by_totalprod = 2

    var svg = d3.select("svg"),
        margin = { top: 150, right: 80, bottom: 30, left: 100 },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var line = d3.line()
        .x(function (d) { return x(d.year); })
        .y(function (d) { return y(d.totalprod); });

    d3.csv("honeyproduction.csv", function (db) {
        var state_data = parse_state_data(db)

        state_totalprod = sort_state_by_totalprod(state_data)

        data = state_data["ND"]

        x.domain(d3.extent(db, function (d) {
            return d.year;
        }));

        // todo: the domain range is incorrect
        var range = d3.extent(data, function (d) { return d.totalprod; })
        range[0] = 0
        console.log(range)
        y.domain(range);


        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .select(".domain")
            .text("Year")
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

        draw_line_chart(g, data, line, x, y, "steelblue", "ND")
        data = state_data["CA"]
        draw_line_chart(g, data, line, x, y, "red", "CA")
    }
    )
}