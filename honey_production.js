function parse_totalprod(data) {
    var state_db = {}
    for (d in data) {
        if (data[d].state in state_db) {
            state_db[data[d].state]["totalprod"].push(data[d].totalprod)
            state_db[data[d].state]["year"].push(data[d].year)
        }
        else {
            state_db[data[d].state] = {"totalprod": [], "year": []}
        }
    }
    return state_db
}

function draw_line_chart(data) {

}

function set_up() {
    var height = 500
    var width = 960

    var canvas = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    var svg = d3.select("svg"),
        margin = { top: 20, right: 80, bottom: 30, left: 50 },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);

    var line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d) { return x(d.totalprod); })
        .y(function (d) { return y(d.year); });
}

function honey_production_dv() {


    d3.csv("honeyproduction.csv", function (data) {
        var totalprod = parse_totalprod(data)



        canvas.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("width", function (d, i) { return 200; })
            .attr("height", function (d) { return 10; })
            .attr("fill", "blue")
    }
    )
}