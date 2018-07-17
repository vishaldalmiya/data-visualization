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

function draw_line_chart(g, data, line, x_scale, y_scale, color, field_x, field_y) {
    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.0)
        .attr("d", line)

    g.append('text')
        .attr('class', 'barsEndlineText')
        .attr('text-anchor', 'middle')
        .attr("x", x_scale(data[data.length - 1][field_x]))
        .attr("y", y_scale(data[data.length - 1][field_y]))
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
        .text("Overview: The following data set (source @ https://www.kaggle.com/jessicali9530/honey-production) consists of honey production supply and demand in US per state between years 1998 to 2012. In the year 2006 there was decline in the yield due to the loss of large number of hives resulting out of a phenomenon called Colony Collapse Disorder where disappearing workers bees cause the remaining hive colony to collapse. It was speculated that the hive diseases and pesticides were the root cause for this. 12 years post the incidence although there is recovery in the honey bees and their colonies, the US honey industry is mostly struggling. US which used to produce over half the honey consumed per year largely depends on honey imports to meet its demands now. The data is coming from National Agricultural Statistics Service (NASS). Some data cleaning was performed to get the final data used for the analysis. ")

}

function display_chart(field_x, field_y, x_label, y_label) {

    // todo: take the num as input
    get_filter_info();

    var { width, height, g, svg } = setup_svg();

    d3.csv("honeyproduction.csv", function (db) {
        var state_data = parse_state_data(db)

        sorted_state_totalprod = sort_state_by_totalprod(state_data)

        data = state_data["ND"]

        var { x_scale, y_scale, color_scale } = setup_scale(width, height, db, field_x, field_y);

        var line = d3.line()
            .x(function (d) { return x_scale(d[field_x]); })
            .y(function (d) { return y_scale(d[field_y]); });

        display_axis(g, height, x_scale, y_scale, x_label, y_label);

        // get the list of states by totalprod
        var { filtered_state_name, i } = get_filtered_state();

        color_scale.domain(filtered_state_name)

        // plot bottom two & top seven states states by totalprod
        for (var i = 0; i < filtered_state_name.length; i++) {
            var state_name = filtered_state_name[i]
            draw_line_chart(g, state_data[state_name],
                line, x_scale, y_scale, color_scale(state_name), field_x, field_y)
        }

        display_legend(svg, color_scale, width, height);
    }
    )
}

function get_filter_info() {
    num_top_state_by_totalprod = 7;
    num_bottom_state_by_totalprod = 2;
}

function setup_scale(width, height, db, field_x, field_y) {
    var color_scale = d3.scaleOrdinal(d3.schemeCategory10);
    var x_scale = d3.scaleLinear()
        .rangeRound([0, width]);
    var y_scale = d3.scaleLinear()
        .rangeRound([height, 0]);
    x_scale.domain(d3.extent(db, function (d) {
        return d[field_x];
    }));

    // todo: the domain range is incorrect
    var range = d3.extent(data, function (d) { return d[field_y]; });
    range[0] = 0;
    y_scale.domain(range);
    return { x_scale, y_scale, color_scale };
}

function get_filtered_state() {
    var keys = Object.keys(sorted_state_totalprod);
    var sorted_state_name_totalprod = keys.map(function (v) { return sorted_state_totalprod[v]; });
    var filtered_state_name = [];

    // todo: unknown entry at the end
    for (var i = 1; i <= num_top_state_by_totalprod; i++) {
        filtered_state_name.push(sorted_state_name_totalprod[sorted_state_name_totalprod.length - 1 - i]);
    }

    for (var i = 0; i < num_bottom_state_by_totalprod; i++) {
        filtered_state_name.push(sorted_state_name_totalprod[i]);
    }
    
    return { filtered_state_name, i };
}

function setup_svg() {
    var svg = d3.select("svg"), margin = {
        top: 150, right: 80,
        bottom: 30, left: 100
    },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    return { width, height, g, svg };
}

function display_axis(g, height, x_scale, y_scale, x_label, y_label) {
    // todo: check why the label is not working
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x_scale))
        .select(".domain")
        .text(x_label)
        .remove();

    g.append("g")
        .call(d3.axisLeft(y_scale))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text(y_label);
}

function display_legend(svg, color_scale, width, height) {
    var legendRectSize = 18;
    var legendSpacing = 4;
    var legend = svg.selectAll('.legend')
        .data(color_scale.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
            var legend_height = legendRectSize + legendSpacing;
            var offset = legend_height * color_scale.length / 2;
            var horz = width + 125;
            var vert = height / 2 + i * legend_height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });
    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', color_scale)
        .style('stroke', color_scale);
    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function (d) { return d; });
}

