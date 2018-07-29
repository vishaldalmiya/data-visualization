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

// todo - d3.transition()
// todo - check the criterias mentioned by Dr. Hart

// todo - increase the font size and color for the information in map
// todo - try to add name and total production for lowest and highest
// todo - add annotations
// todo - fix the text for price per lb
// todo - add the about page 
// todo - clean up the tooltip
// todo - disable prev & next
// todo - remove comma from the year
// todo - add in map info its cummulative from ..-.. years

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
            sum_totalprod += state_db[state][idx].totalprod
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
}

function display_map() {
    var sorted_state_totalprod = {},
        max_totalprod = 0,
        min_totalprod = Infinity

    d3.csv("honeyproduction.csv", function (db) {
        db.forEach(function (d) {
            d['totalprod'] = +d['totalprod']
        });

        var state_db = parse_state_data(db)

        for (state in state_db) {
            sum_totalprod = 0
            for (idx in state_db[state]) {
                sum_totalprod += state_db[state][idx].totalprod
            }
            sorted_state_totalprod[state] = sum_totalprod

            if (sum_totalprod > max_totalprod) {
                max_totalprod = sum_totalprod
            }

            if (sum_totalprod < min_totalprod) {
                min_totalprod = sum_totalprod
            }
        }
    })

    var { width, height, g, svg, margin } = setup_svg();

    var state_id_name = d3.map();

    var path = d3.geoPath();

    var x = d3.scaleLinear()
        .domain([1, 10])
        .rangeRound([600, 860]);

    var color = d3.scaleThreshold()
        .range(d3.schemeBlues[9]);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,40)");

    d3.queue()
        .defer(d3.json, "https://d3js.org/us-10m.v1.json")
        .defer(d3.tsv, "us-state-names.tsv", function (d) {
            state_id_name[d.id] = d.code;
        })
        .await(ready);

    function ready(error, us) {
        if (error) throw error;

        var keys = Object.keys(sorted_state_totalprod);
        var values = keys.map(function (v) { return sorted_state_totalprod[v]; });

        color.domain(values)
        svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("fill", function (d) {
                return color(sorted_state_totalprod[state_id_name[+d.id]]);
            })
            .attr("d", path)
            .append("title")
            .text(function (d) {
                return state_id_name[+d.id] + ": " + sorted_state_totalprod[state_id_name[+d.id]];
            });

        svg.selectAll("text")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("svg:text")
            .text(function (d) {
                if (state_id_name[+d.id] == "ND" || state_id_name[+d.id] == "SC") {
                    return state_id_name[+d.id] + ": " + sorted_state_totalprod[state_id_name[+d.id]];
                }
            })
            .attr("x", function (d) {
                return path.centroid(d)[0];
            })
            .attr("y", function (d) {
                return path.centroid(d)[1];
            })
            .attr("text-anchor", "middle")
            .attr('font-size', '11pt');
        // svg.append("path")
        //     .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
        //     .attr("class", "states")
        //     .attr("d", path);
    }
}

function display_chart(field_x, field_y, x_label, y_label) {
    get_filter_info();

    var { width, height, g, svg, margin } = setup_svg();

    d3.csv("honeyproduction.csv", function (db) {
        db.forEach(function (d) {
            d[field_x] = new Date(d[field_x], 0, 0);
            d[field_y] = +d[field_y];
            d['totalprod'] = +d['totalprod']
        });

        var state_data = parse_state_data(db)

        sorted_state_totalprod = sort_state_by_totalprod(state_data)

        var { x_scale, y_scale, color_scale } = setup_scale(width, height, db, field_x, field_y);

        var line = d3.line()
            .x(function (d) { return x_scale(d[field_x]); })
            .y(function (d) { return y_scale(d[field_y]); });

        display_axis(g, height, width, margin, x_scale, y_scale, x_label, y_label);

        // get the list of states by totalprod
        var { filtered_state_name, i } = get_filtered_state();

        color_scale.domain(filtered_state_name)

        // plot bottom two & top seven states states by totalprod
        for (var i = 0; i < filtered_state_name.length; i++) {
            var state_name = filtered_state_name[i]
            add_tooltip(g, state_name, state_data[state_name], x_scale, field_x, y_scale, field_y);
            draw_line_chart(g, state_data[state_name],
                line, x_scale, y_scale, color_scale(state_name), field_x, field_y)
        }

        display_legend(svg, color_scale, width, height);

        // adding annotations
        add_annotation(field_y, g, x_scale, y_scale);
    }
    )
}

function add_annotation(field_y, g, x_scale, y_scale) {
    var x_data, y_data, text;
    if (field_y == "totalprod") {
        x_data = new Date(2006, 0, 0);
        y_data = 46410000;
        text = "Year: 2006 marked as year of Colony Collapse Disorder ";
    }
    else {
        x_data = new Date(2003, 0, 0);
        y_data = 2.5;
        text = "Year: 2003 OK & OC ceased production ";
    }
    g.append('text')
        .attr('class', 'barsEndlineText')
        .attr('text-anchor', 'middle')
        .attr("x", x_scale(x_data))
        .attr("y", y_scale(y_data))
        .text(text);
    g.append("line")
        .style("stroke", "black")
        .style("stroke-dasharray", ("2, 2"))
        .attr("x1", x_scale(x_data))
        .attr("y1", y_scale(y_data))
        .attr("x2", x_scale(x_data))
        .attr("y2", y_scale(0));
}

function add_tooltip(g, state_name, state_data, x_scale, field_x, y_scale, field_y) {
    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    g.selectAll("dot")
        .data(state_data)
        .enter().append("circle")
        .attr("fill", "#F1F3F3")
        .attr('fill-opacity', 0)
        .attr("r", 5)
        .attr("cx", function (d) { return x_scale(d[field_x]); })
        .attr("cy", function (d) { return y_scale(d[field_y]); })
        .on("mouseover", function (d) {
            div.transition()
                .duration(10)
                .style("opacity", .9);
            div.html(
                "<strong>state : </strong>" + state_name + "<br/>" +
                "<strong>" + field_x + ": </strong>" + d[field_x] + "<br/>" +
                "<strong>" + field_y + ": </strong>" + d[field_y])
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(10)
                .style("opacity", 0);
        });
}

function get_filter_info() {
    num_top_state_by_totalprod = 7;
    num_bottom_state_by_totalprod = 2;
}

function setup_scale(width, height, db, field_x, field_y) {
    var color_scale = d3.scaleOrdinal(d3.schemeCategory10);
    var x_scale = d3.scaleTime()
        .range([0, width]);
    var y_scale = d3.scaleLinear()
        .rangeRound([height, 0]);

    x_scale.domain(d3.extent(db, function (d) {
        return d[field_x];
    }));

    y_scale.domain([0, d3.max(db, function (d) {
        return d[field_y];
    })]);

    return { x_scale, y_scale, color_scale };
}

function get_filtered_state() {
    var keys = Object.keys(sorted_state_totalprod);
    var sorted_state_name_totalprod = keys.map(function (v) { return sorted_state_totalprod[v]; });
    var filtered_state_name = [];

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
        top: 20, right: 80,
        bottom: 30, left: 100
    },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    return { width, height, g, svg, margin };
}

function display_axis(g, height, width, margin, x_scale, y_scale, x_label, y_label) {
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x_scale));

    g.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + 30) + ")")
        .style("text-anchor", "end")
        .text(x_label);

    g.append("g")
        .call(d3.axisLeft(y_scale))

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -80)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
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

