let hostTeam = "";
let guestTeam = "";
let game_data = {};
let current_data = {};
let enableSimulation = true;
var simulation = null;
function create_svg(config) {
    let current_svg = d3.select("body").select("#svg-container").select("svg");
    if (current_svg.empty()) {
        return d3.select("body").select("#svg-container").append("svg")
            .attr("width", "100%")
            .attr("float", "left")
            .attr("viewBox", [0, 0, config.width, config.height]);
    }
    else {
        //current_svg.selectAll("*").remove();
        return current_svg
    }
}

// function delete_svg() {
//     let current_svg = d3.select("body").select("#svg-container").select("svg")
//     current_svg.remove()
// }


/**
 * 
 * @param {Object} data 
 * @param {svg} svg 
 * @param {Function} mouse_control 
 * @param {Object} config
 * Create the chart with data, svg, mouse_control_event
 */
function create_chart(data, svg, mouse_control, config) {
    let width = config.width;
    let height = config.height;
    let colors = config.colors;
    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));
    simulation = d3.forceSimulation();
    /* Add a simulation with forces, with default parameters*/
    simulation.nodes(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).strength(0.001))
        .force("charge", d3.forceManyBody().strength(-15))
        .force("center", d3.forceCenter(width / 2, height / 2));
    /* Remove all previous links and nodes from SVG,
       since we are going to create it again*/
    svg.selectAll("*").remove();
    /* Append the links and nodes from data to html svg */
    const link = svg.selectAll(".link")
        .data(links)
        .join("g")  // Join here means if no element selected, create the elements
        .attr("class", "link"); // Add attribute
    link
        .append("line")
        .attr("stroke", d => d.teammate ? "Green" : "Red")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => Math.sqrt(d.value));
    const node = svg.selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .attr("id", d => d.id)
        .call(mouse_control(simulation));
    node
        .append("circle")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("r", config.r)
        .attr("fill", d => d.hometeam ? colors[0] : colors[1])
        .append("title")
        .text(d => d.id);
    /* Add title to nodes */
    add_info(svg);
    /* Tick is an event which is called every time step.
       Update the positions of svg nodes and links from data
       where data's properties is updated by the simulation */
    simulation.on("tick", () => {
        link.select("line")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node.select('circle')
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        node.attr("cx", function (d) { return d.x = Math.max(config.r, Math.min(width - config.r, d.x)); })
            .attr("cy", function (d) { return d.y = Math.max(config.r, Math.min(height - config.r, d.y)); });
        /* Update nodes' name, infobox and infotext's position */
        node.select('.nodename')
            .attr("x", d => d.x - 3)
            .attr("y", d => d.y + 9);
        node.select('.nodeinfo-box')
            .attr("x", d => d.x - 3.5)
            .attr("y", d => d.y + 12.8);
        node.select('.nodeinfo')
            .attr("x", d => d.x - 3)
            .attr("y", d => d.y + 13.5)
            .selectAll('tspan')
            .attr("x", d => d.x - 2);
        link.select('.relinfo-box')
            .attr("x", d => 0.67 * d.source.x + 0.33 * d.target.x - 7)
            .attr("y", d => 0.67 * d.source.y + 0.33 * d.target.y - 0.5);
        link.select(".relinfo")
            .attr("x", d => 0.67 * d.source.x + 0.33 * d.target.x - 6)
            .attr("y", d => 0.67 * d.source.y + 0.33 * d.target.y)
            .selectAll('tspan')
            .attr("x", d => 0.67 * d.source.x + 0.33 * d.target.x - 6);

    });
    return;
}

var i18n = {
    cn_dict: {
        "point": "投篮",
        "3point": "三分",
        "ft": "罚篮",
        "rebound": "篮板",
        "assist": "助攻",
        "steal": "抢断",
        "block": "盖帽",
        "foul": "犯规",
        "turnover": "失误",

        "TryPt-AssistedBy": "被助攻",
        "TryPt-BlockedBy": "被盖帽",
        "Turnover-StolenBy": "被抢断",
        "FreeThrow-Fouler": "被送罚球",
        "Foul-Fouled": "被造犯规",
        "Enter-Replace": "被替换"
    },
    get_string(key) {
        str = this.cn_dict[key];
        if (str == undefined) str = key;
        return str;
    }
}


function add_info(svg) {
    /* Add node id */
    svg.selectAll(".node")
        .append("text")
        .attr("class", "nodename")
        .attr("font-size", 7)
        .attr("font-family", "Times New Roman")
        .text(d => d.name.split(" - ")[0]);
    /* Add node info box */
    let info_box = svg.selectAll(".node").append("rect").attr("class", "nodeinfo-box")
        .attr("visibility", "hidden").attr("stroke", "gray").attr("height", 66).attr("width", 30)
        .attr("rx", 3).attr("ry", 3)
        .attr("fill-opacity", 0.1);
    /* Add node info text */
    let node_info_meta = [
        "point",
        "3point",
        "ft",
        "rebound",
        "assist",
        "steal",
        "block",
        "foul",
        "turnover"]
    let info_text = svg.selectAll(".node")
        .append("text").attr("class", "nodeinfo")
        .attr("visibility", "hidden")
        .attr("font-size", 6)
        .attr("font-family", "Times New Roman");
    for (var i in node_info_meta) {
        info_text.append("tspan").attr("text-anchor", "left").attr("dy", 7)
            .text(d => i18n.get_string(node_info_meta[i]) + ":" + d.info[node_info_meta[i]]);
    }



    let link_info_meta = [
        "TryPt-AssistedBy",
        "TryPt-BlockedBy",
        "Turnover-StolenBy",
        "FreeThrow-Fouler",
        "Foul-Fouled",
        "Enter-Replace"
    ]
    function calc_dy(d, key) {
        if (d.info[key] == undefined) return 0;
        return 6;
    }
    function calc_text(d, key) {
        if (d.info[key] == undefined) return "";
        return i18n.get_string(key) + ":" + i18n.get_string(d.info[key]);
    }
    function calc_height(d) {
        let height = 0;
        for (let i in link_info_meta) {
            if (d.info[link_info_meta[i]] != undefined) height += 6.5
        }
        return height + 2
    }
    /* Add link info */
    let rel_box = svg.selectAll(".link").append("rect").attr("class", "relinfo-box")
        .attr("visibility", "hidden").attr("stroke", "gray").attr("height", calc_height).attr("width", 33)
        .attr("data-src", d => d.source.id)
        .attr("rx", 3).attr("ry", 3)
        .attr("fill-opacity", 0.1);
    let rel_text = svg.selectAll(".link")
        .append("text").attr("class", "relinfo")
        .attr("data-src", d => d.source.id)
        .attr("visibility", "hidden")
        .attr("font-size", 6)
        .attr("font-family", "Times New Roman");
    for (var i in link_info_meta) {
        rel_text.append("tspan").attr("text-anchor", "left").attr("dy", d => calc_dy(d, link_info_meta[i]))
            .text(d => calc_text(d, link_info_meta[i]));
    }


    svg.selectAll(".node").select("circle")
        .on('click',
            d => {
                d3.select("#" + d.id).selectAll(".nodeinfo,.nodeinfo-box").attr("visibility", d.show_info ? "hidden" : "visible");
                d3.selectAll(".link").selectAll("[data-src=" + d.id + "]")
                    .attr("visibility", d.show_info ? "hidden" : "visible");
                d.show_info = !d.show_info;

            });
}

/**
 * 
 * 
 */
function mouse_control() {
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

let config = {
    width: 600, height: 300, colors: ["LightGray", "DimGray"], r: 5
};

function display_game(game_id) {
    function display_data(data) {
        data.nodes = data.players;
        data.links = data.relations;
        game_data = data;
        fill_player_list()
        current_data = {
            nodes: [], links: []
        };
        //let svg = create_svg(config);
        //create_chart(data, svg, mouse_control, config);
        // let svg_list = d3.select("body").select("#svg-container").selectAll('svg');
        // if(svg_list.length >= 2){
        //     delete_svg()
        // }
    }
    axios.get("http://127.0.0.1/api/game", {
        params: { id: game_id }
    }).then(res => display_data(res.data.data))
}

function redisplay(node) {
    let name = $(node).attr("value");
    //console.log(name)
    if ($(node).attr('checked') !== 'checked') {
        $(node).attr('checked', true)
        for (let i in game_data.nodes) {
            if (name === game_data.nodes[i].id) {
                current_data.nodes.push(game_data.nodes[i]);
                break;
            }
        }
        current_data.links = [];
        let all_ids = current_data.nodes.map(node => node.id);
        for (let i in game_data.links) {
            if (all_ids.includes(game_data.links[i].source) && all_ids.includes(game_data.links[i].target)) {
                current_data.links.push(game_data.links[i]);
            }
        }
    }
    else {
        $(node).removeAttr('checked')
        for (let i = current_data.nodes.length - 1; i >= 0; i--) {
            if (name === current_data.nodes[i].id) {
                current_data.nodes.splice(i, 1);
                break;
            }
        }
        for (let i = current_data.links.length - 1; i >= 0; i--) {
            if (current_data.links[i].source === name || current_data.links[i].target === name) {
                current_data.links.splice(i, 1);
                // console.log(i)
            }
        }
        // console.log(current_data.links)
    }

    let svg = create_svg(config);
    create_chart(current_data, svg, mouse_control, config);
}

function fill_player_list() {
    let players = game_data.nodes;
    d3.select("body").select("#playerMenu").selectAll("*").remove()
    for (let i in players) {
        d3.select("body").select("#playerMenu").append("label")
            .attr("class", "dropdown-item")
            .text(players[i].name)
            .append("input")
            .attr("type", "checkbox")
            .attr("onclick", "redisplay(this)")
            .attr("value", players[i].id);
    }
}

function get_game_list() {
    function fill_game_list(data) {
        let games = data.games;
        d3.select("body").select("#gameMenu").selectAll("*").remove()
        for (let i in games) {
            d3.select("body").select("#gameMenu").append("button")
                .attr("class", "dropdown-item")
                .attr("type", "button")
                .attr("onclick", "display_game(this.value)")
                .text(games[i])
                .attr("value", games[i]);
        }
        // let svg_list = d3.select("body").select("#svg-container").selectAll('svg');
        // if(svg_list.length >= 2){
        //     delete_svg()
        // }
    }
    axios.get("http://127.0.0.1/api/gameList", {
        params: {
            host_team: hostTeam,
            guest_team: guestTeam
        }
    }).then(res => fill_game_list(res.data.data))
}

function fill_teams() {
    let teams = ["HOU", "SAS", "DAL", "MEM", "NOP", "GSW", "LAC", "SAC", "PHX", "LAL",
        "OKC", "POR", "UTA", "DEN", "MIN", "TOR", "BOS", "NYK", "BKN", "PHI",
        "MIA", "ATL", "CHA", "WAS", "ORL", "CLE", "IND", "DET", "CHI", "MIL"];
    for (let i in teams) {
        d3.select("body").select("#hostMenu").append("button")
            .attr("class", "dropdown-item")
            .attr("type", "button")
            .attr("onclick", "set_host_team(this.value)")
            .text(teams[i])
            .attr("value", teams[i]);
        d3.select("body").select("#guestMenu").append("button")
            .attr("class", "dropdown-item")
            .attr("type", "button")
            .attr("onclick", "set_guest_team(this.value)")
            .text(teams[i])
            .attr("value", teams[i]);
    }

}
function set_host_team(name) {
    console.log(name)
    hostTeam = name;
    let host_button = d3.select("body").select("#hostButton");
    host_button.text("主队：" + name);
}
function set_guest_team(name) {
    guestTeam = name;
    $("#guestButton").text("客队：" + name);
    //guest_button.text(name);
}
display_game("20181016-BOS-PHI");
fill_teams();