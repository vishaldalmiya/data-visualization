function parse_totalprod(data) {
    var state_db = {}
    for (d in data) {
        if (data[d].state in state_db) {
            state_db[data[d].state].push(data[d].totalprod)
        }
        else {
            state_db[data[d].state] = []
        }
    }
    return state_db
}

function draw_line_chart(data) {

}

function honey_production_dv() {
    var height = 500
    var width = 500

    d3.csv("honeyproduction.csv", function (data) {
        var totalprod = parse_totalprod(data)

        var canvas = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)

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