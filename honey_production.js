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

    g.append('text')
        .attr('class', 'barsEndlineText')
        .attr('text-anchor', 'middle')
        .attr("x", x_scale(data[data.length - 1][field_x]))
        .attr("y", y_scale(data[data.length - 1][field_y]))
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

    console.log(d3.range(2, 10))

    var x = d3.scaleLinear()
        .domain([1, 10])
        .rangeRound([600, 860]);

    var color = d3.scaleThreshold()
        .range(d3.schemeBlues[9]);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,40)");

    // g.selectAll("rect")
    //     .data(color.range().map(function (d) {
    //         d = color.invertExtent(d);
    //         if (d[0] == null) d[0] = x.domain()[0];
    //         if (d[1] == null) d[1] = x.domain()[1];
    //         return d;
    //     }))
    //     .enter().append("rect")
    //     .attr("height", 8)
    //     .attr("x", function (d) { return x(d[0]); })
    //     .attr("width", function (d) { return x(d[1]) - x(d[0]); })
    //     .attr("fill", function (d) { return color(d[0]); });

    // g.append("text")
    //     .attr("class", "caption")
    //     .attr("x", x.range()[0])
    //     .attr("y", -6)
    //     .attr("fill", "#000")
    //     .attr("text-anchor", "start")
    //     .attr("font-weight", "bold")
    //     .text("Unemployment rate");

    // g.call(d3.axisBottom(x)
    //     .tickSize(13)
    //     .tickFormat(function (x, i) { return i ? x : x + "%"; })
    //     .tickValues(color.domain()))
    //     .select(".domain")
    //     .remove();

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
            .text(function (d) { return d.rate + "%"; });

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
            .attr("class", "states")
            .attr("d", path);
    }
}

function display_chart(field_x, field_y, x_label, y_label) {

    get_filter_info();

    var { width, height, g, svg, margin } = setup_svg();

    d3.csv("honeyproduction.csv", function (db) {
        db.forEach(function (d) {
            d[field_x] = +d[field_x];
            d[field_y] = +d[field_y];
            d['totalprod'] = +d['totalprod']
        });

        var state_data = parse_state_data(db)

        sorted_state_totalprod = sort_state_by_totalprod(state_data)

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
            add_tooltip(g, state_data[state_name], x_scale, field_x, y_scale, field_y);
            draw_line_chart(g, state_data[state_name],
                line, x_scale, y_scale, color_scale(state_name), field_x, field_y)
        }

        display_legend(svg, color_scale, width, height);

        const type = d3.annotationLabel

        const annotations = [{
            note: {
                label: "Year 2006 marked as year of colony disorder",
                bgPadding: 20,
                title: ""
            },
            //can use x, y directly instead of data
            data: { year: "2006", totalprod: 464101000 },
            className: "show-bg",
            dy: 137,
            dx: 162
        }]
    
        const makeAnnotations = d3.annotation()
            .editMode(true)
            //also can set and override in the note.padding property
            //of the annotation object
            .notePadding(15)
            .type(type)
            //accessors & accessorsInverse not needed
            //if using x, y in annotations JSON
            .accessors({
                x: d => x_scale(d.year),
                y: d => y_scale(d.to)
            })
            // .accessorsInverse({
            //     date: d => timeFormat(x.invert(d.x)),
            //     close: d => y.invert(d.y)
            // })
            .annotations(annotations)
    
        g.append('g')
            .attr("class", "annotation-group")
            .call(makeAnnotations)
    }
    )


}

function add_tooltip(g, state_data, x_scale, field_x, y_scale, field_y) {
    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    g.selectAll("dot")
        .data(state_data)
        .enter().append("circle")
        .attr("r", 2.5)
        .attr("cx", function (d) { return x_scale(d[field_x]); })
        .attr("cy", function (d) { return y_scale(d[field_y]); })
        .on("mouseover", function (d) {
            div.transition()
                .duration(10)
                .style("opacity", .9);
            div.html(d[field_x] + "<br/>" + d[field_y])
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
    // todo: check on this
    var x_scale = d3.scaleLinear()
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

    return { width, height, g, svg, margin };
}

function display_axis(g, height, x_scale, y_scale, x_label, y_label) {
    // todo: check why the label is not working
    g.append("g")
        .attr("class", "axis axis--x")
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

