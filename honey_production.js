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

function draw_totalprod_line_chart(g, data, line, x_scale, y_scale, color, state) {
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

function draw_priceperlb_line_chart(g, data, line, x_scale, y_scale, color, state) {
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
        .attr("y", y_scale(data[data.length - 1].priceperlb))
        .text(state)
}

function navigate() {
    var element = document.getElementById("navigator");
    switch (element.innerText) {
        case "Overview":
            display_overview()
            element.innerText = "Next (totalprod)";
            break;
        case "Next (totalprod)":
            element.innerText = "Next (priceperlb)";
            location.href = "totalprod.html"
            break;
        case "Next (priceperlb)":
            location.href = "priceperlb.html"
            break;
    }
}

function display_overview() {
    var svg = d3.select("svg"),
        margin = { top: 150, right: 80, bottom: 30, left: 100 },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append('text')
        .attr('class', 'barsEndlineText')
        .attr('text-anchor', 'middle')
        .attr("x", width / 2)
        .attr("y", height / 2)
        .text("Honey Production in US")

}

function display_priceperlb() {
    // todo: take the num as input
    num_top_state_by_totalprod = 7
    num_bottom_state_by_totalprod = 2

    var colors = ["red", "yellow", "green", "blue", "pink", "grey", "orange", "brown", "purple"]

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
        .y(function (d) { return y(d.priceperlb); });

    d3.csv("honeyproduction.csv", function (db) {
        var state_data = parse_state_data(db)

        sorted_state_totalprod = sort_state_by_totalprod(state_data)

        data = state_data["ND"]

        x.domain(d3.extent(db, function (d) {
            return d.year;
        }));

        // todo: the domain range is incorrect
        var range = d3.extent(data, function (d) { return d.priceperlb; })
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
            .text("Avg. price per lb");

        // get the list of states by totalprod
        var keys = Object.keys(sorted_state_totalprod);
        var sorted_state_name_totalprod = keys.map(function (v) { return sorted_state_totalprod[v]; });

        var color_idx = 0
        // plot bottom two states by totalprod
        for (var i = 0; i < num_bottom_state_by_totalprod; i++) {
            draw_priceperlb_line_chart(g, state_data[sorted_state_name_totalprod[i]],
                line, x, y, colors[color_idx++], sorted_state_name_totalprod[i])
        }

        // plot top seven states by totalprod
        // todo: unknown entry at the end
        for (var i = 1; i <= num_top_state_by_totalprod; i++) {
            state_name = sorted_state_name_totalprod[sorted_state_name_totalprod.length - 1 - i]
            draw_priceperlb_line_chart(g, state_data[state_name], line, x, y, colors[color_idx++], state_name)
        }
    }
    )
}

function display_totalprod() {
    // todo: take the num as input
    num_top_state_by_totalprod = 7
    num_bottom_state_by_totalprod = 2

    var colors = ["red", "yellow", "green", "blue", "pink", "grey", "orange", "brown", "purple"]

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

        sorted_state_totalprod = sort_state_by_totalprod(state_data)

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

        // get the list of states by totalprod
        var keys = Object.keys(sorted_state_totalprod);
        var sorted_state_name_totalprod = keys.map(function (v) { return sorted_state_totalprod[v]; });

        var color_idx = 0
        // plot bottom two states by totalprod
        for (var i = 0; i < num_bottom_state_by_totalprod; i++) {
            draw_totalprod_line_chart(g, state_data[sorted_state_name_totalprod[i]],
                line, x, y, colors[color_idx++], sorted_state_name_totalprod[i])
        }

        // plot top seven states by totalprod
        // todo: unknown entry at the end
        for (var i = 1; i <= num_top_state_by_totalprod; i++) {
            state_name = sorted_state_name_totalprod[sorted_state_name_totalprod.length - 1 - i]
            draw_totalprod_line_chart(g, state_data[state_name], line, x, y, colors[color_idx++], state_name)
        }
    }
    )
}