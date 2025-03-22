const data = {
    nodes: [
        { id: "Puszysta Oaza", members: 281, boosts: 29, partnerships: [] },
        { id: "New Arctic Furries", members: 35, boosts: 0, partnerships: ["Futrzaki na Fali", "Nasze Futrzaste Grono"] },
        { id: "Kolorowa Zatoczka", members: 92, boosts: 0, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "New Foxing Town", "Futrzaste Miasto Pizzy", "Synowie ślimaka V2"] },
        { id: "Futrzasta Piwnica Przyjaźni", members: 102, boosts: 0, partnerships: [] },
        { id: "Polski Serwer Furry 2", members: 385, boosts: 0, partnerships: ["Futrzaki na Fali", "Futrzaste Miasto Pizzy", "New Foxing Town", "Planeta Futrzaków", "Viper's Pit", "Boykissers Heaven", "FutrzakOwO", "FurryBox", "FURRYWORLD", "Furaski", "Futrzasta Centrala"] },
        { id: "Futrzaste Miasto Pizzy", members: 823, boosts: 9, partnerships: ["Pyrkon Furries", "Futrzasta Oceania", "Kolorowa Zatoczka", "Futrzaki na Fali", "Planeta Futrzaków", "Polski Serwer Furry 2", "Boykissers Heaven", "Futrzasta Krypta", "New Foxing Town", "Viper's Pit", "Futrzasta Serwerownia", "Strawtilla's World", "Lisi cień", "Nasze Futrzaste Grono"] },
        { id: "FurHeaven", members: 584, boosts: 0, partnerships: ["Dolina Futer", "Yutan", "Futrzasta Centrala"] },
        { id: "Parrot Cafe", members: 527, boosts: 15, partnerships: ["New Foxing Town", "Pyrkon Furries", "BFSiP", "Boykissers Heaven"] },
        { id: "Furrasowy Hellfire", members: 399, boosts: 7, partnerships: ["Futrzaki na Fali", "Kolorowe Futra", "Night City Renascence", "Trójmiejskie Futra"] },
        { id: "Tajne Zgromadzenie Futrzaków", members: 1674, boosts: 28, partnerships: [] },
        { id: "Futrzasta Oceania", members: 230, boosts: 0, partnerships: ["Futrzaste Miasto Pizzy", "Strawtilla's World", "Smocza Przystań", "Liliowe futerka", "Boykissers Heaven", "Futrzaki na Fali", "Lisia Norka", "Furaski"] },
        { id: "New Foxing Town", members: 393, boosts: 14, partnerships: ["Planeta Futrzaków", "Pyrkon Furries", "Futrzaste Miasto Pizzy", "Viper's Pit", "Futrzaki na Fali", "Polski Serwer Furry 2", "Cs'owe Futerka", "Futrzasta Karczma", "Trójmiejskie Futra", "Parrot Cafe", "Boykissers Heaven", "Konfederacja Lisowska", "Kolorowa Zatoczka"] },
        { id: "Stacja Pandka", members: 769, boosts: 16, partnerships: ["Furasowa Republika", "Pyrkon Furries"] },
        { id: "Pyrkon Furries", members: 806, boosts: 1, partnerships: ["Gwiazdeczki Cosmiego", "Fragonia Factory", "Tayland", "Futrzaste Miasto Pizzy", "Parrot Cafe", "New Foxing Town", "Stacja Pandka", "Lisia Norka", "Futrzasty zakątek", "Night City Renascence", "FutrzakOwO", "FurryBox"] },
        { id: "Konfederacja Lisowska", members: 193, boosts: 3, partnerships: ["Planeta Futrzaków", "Nasze Futrzaste Grono", "New Foxing Town"] },
        { id: "Futrzasty Zakątek", members: 44, boosts: 0, partnerships: ["Futrzasta Kawiarnia"] },
        { id: "Tajemnicze Futrzaki", members: 87, boosts: 1, partnerships: [] },
        { id: "Lisia Norka", members: 319, boosts: 2, partnerships: ["FURRYWORLD", "Pyrkon Furries", "Furrasowe Arty", "Futrzaste Plemię", "Furaski", "Futrzasta Oceania", "Dolina Futer", "Futrzasty discord", "Furry obóz RP", "Futrzaki na Fali"] },
        { id: "Lazurowe Futerka", members: 38, boosts: 0, partnerships: [] },
        { id: "Tayland", members: 209, boosts: 3, partnerships: ["Pyrkon Furries", "Gwiazdeczki Cosmiego", "Fragonia Factory"] },
        { id: "Futrzasta Chatka", members: 190, boosts: 0, partnerships: ["Furrasowy kącik", "FurryBox", "FutrzakOwO", "Polskie Smoki", "Futrzasty obóz"] },
        { id: "Furry Night PL", members: 115, boosts: 0, partnerships: ["Furasowy Las", "Futrzaki na Fali", "Kolorowe Futra"] },
        { id: "Futrzasty zakątek", members: 342, boosts: 7, partnerships: ["Kemi's Furry Place", "Gwiazdeczki Cosmiego", "Pyrkon Furries"] },
        { id: "Furrysławia", members: 149, boosts: 0, partnerships: [] },
        { id: "Futerkowy Las", members: 51, boosts: 0, partnerships: ["Futrzasta Krypta"] },
        { id: "Futrzaki na Fali", members: 1711, boosts: 19, partnerships: ["Lisia Norka", "Trójmiejskie Futra", "Kolorowa Zatoczka", "Furry Night PL", "Furrasowy Hellfire", "Synowie ślimaka V2", "Futrzaste Miasto Pizzy", "Rzeczpospolita Furska", "Boykissers Heaven", "Smocza Przystań", "Viper's Pit", "New Foxing Town", "Futrzasty Serwer", "BFSiP", "New Arctic Furries", "Nasze Futrzaste Grono", "Liliowe futerka", "Futrzasta Oceania", "Krakersy", "Polski Serwer Furry 2"] },
        { id: "Planeta Futrzaków", members: 497, boosts: 3, partnerships: ["Kolorowa Zatoczka", "Futrzaste Miasto Pizzy", "Boykissers Heaven", "Polski Serwer Furry 2", "New Foxing Town", "Viper's Pit", "Synowie ślimaka V2", "Futrzasta Serwerownia", "Konfederacja Lisowska", "Nasze Futrzaste Grono"] },
        { id: "Night City Renascence", members: 90, boosts: 0, partnerships: ["Pyrkon Furries", "Furrasowy Hellfire"] },
        { id: "Boykissers Heaven", members: 834, boosts: 14, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "Rzeczpospolita Furska", "New Foxing Town", "Futrzaste Miasto Pizzy", "Viper's Pit", "BFSiP", "Nasze Futrzaste Grono", "Polski Serwer Furry 2", "Parrot Cafe", "Smocza Przystań", "Liliowe futerka", "Art Futerka", "Futrzasta Oceania"] },
        { id: "Futerkowa Przystań", members: 218, boosts: 2, partnerships: [] },
        { id: "Kolorowe Futra", members: 147, boosts: 0, partnerships: ["Furry Night PL", "Furrasowy Hellfire", "Rzeczpospolita Furska", "Viper's Pit"] },
        { id: "Nasze Futrzaste Grono", members: 208, boosts: 5, partnerships: ["Futrzasta Krypta", "Boykissers Heaven", "Futrzaste Miasto Pizzy", "Rzeczpospolita Furska", "Wilkowice", "Planeta Futrzaków", "Futrzana Piwnica", "New Arctic Furries", "Art Futerka", "Futrzaki na Fali", "Futrzasta Serwerownia", "Konfederacja Lisowska"] },
        { id: "Futrzana Dolina", members: 38, boosts: 0, partnerships: [] },
        { id: "Futrzasty Serwer", members: 89, boosts: 0, partnerships: ["Futrzaki na Fali"] },
        { id: "Norka Futrzaków", members: 192, boosts: 2, partnerships: [] },
        { id: "Liliowe futerka", members: 78, boosts: 0, partnerships: ["Boykissers Heaven", "Futrzaki na Fali", "Futrzasta Oceania", "F U R Y"] },
        { id: "Dragon's Party", members: 52, boosts: 2, partnerships: [] },
        { id: "Smocza Przystań", members: 118, boosts: 7, partnerships: ["Futrzaki na Fali", "Boykissers Heaven", "Futrzasta Oceania"] },
        { id: "CyberFutrzaki 2621", members: 90, boosts: 11, partnerships: [] },
        { id: "Futrzasta Serwerownia", members: 142, boosts: 0, partnerships: ["Futrzaste Miasto Pizzy", "Futrzasta Krypta", "Nasze Futrzaste Grono", "Planeta Futrzaków"] },
        { id: "BFSiP", members: 1840, boosts: 26, partnerships: ["FutrzakOwO", "Lisi cień", "World of Furries", "FURRYWORLD", "Dolina Futer", "Futrzaki na Fali", "Boykissers Heaven", "Parrot Cafe", "FurryBox", "Futrzasta Centrala"] },
        { id: "Futrzasta Krypta", members: 42, boosts: 0, partnerships: ["Futrzasta Serwerownia", "Futrzaste Miasto Pizzy", "Futrzana Piwnica", "Futerkowy Las", "Nasze Futrzaste Grono"] },
        { id: "Paw Paradise", members: 54, boosts: 0, partnerships: [] },
        { id: "Art Futerka", members: 179, boosts: 0, partnerships: ["Nasze Futrzaste Grono", "Boykissers Heaven"] },
        { id: "Futerka NSFW", members: 374, boosts: 1, partnerships: [] },
        { id: "Schronisko Bartisa", members: 53, boosts: 0, partnerships: [] },
        { id: "Futrzasta Norka", members: 932, boosts: 0, partnerships: [] },
        { id: "Futrzasta Sauna", members: 49, boosts: 1, partnerships: [] },
        { id: "FURRY VR - WRLD", members: 262, boosts: 2, partnerships: [] },
        { id: "Krakersy", members: 122, boosts: 4, partnerships: ["Futrzaki na Fali"] },
        { id: "Dolina Futer", members: 416, boosts: 0, partnerships: ["BFSiP", "FurHeaven", "Lisi cień", "Lisia Norka", "FurryBox", "FURRYWORLD"] },
        { id: "Yutan", members: 153, boosts: 0, partnerships: ["Futrzasty obóz", "Furrasolandia", "FurHeaven", "Lisi cień"] },
        { id: "Futrzasty obóz", members: 27, boosts: 0, partnerships: ["Futrzasta Chatka", "Yutan", "Fragonia Factory"] },
        { id: "Viper's Pit", members: 181, boosts: 0, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "New Foxing Town", "Futrzaste Miasto Pizzy", "Polski Serwer Furry 2", "Boykissers Heaven", "Kolorowe Futra"] },
        { id: "Furrasolandia", members: 66, boosts: 0, partnerships: ["Yutan"] },
        { id: "Strawtilla's World", members: 73, boosts: 0, partnerships: ["Fox Community", "Futrzasta Oceania", "Futrzaste Miasto Pizzy"] },
        { id: "FURREN TAG", members: 81, boosts: 0, partnerships: [] },
        { id: "Cs'owe Futerka", members: 108, boosts: 0, partnerships: ["Gwiezdne Futra", "New Foxing Town"] },
        { id: "Gwiezdne Futra", members: 32, boosts: 0, partnerships: ["Cs'owe Futerka"] },
        { id: "Carrie's Community", members: 38, boosts: 0, partnerships: [] },
        { id: "F U R Y", members: 25, boosts: 0, partnerships: ["Liliowe futerka"] },
        { id: "Trójmiejskie Futra", members: 125, boosts: 1, partnerships: ["Furrasowy Hellfire", "Futrzaki na Fali", "New Foxing Town"] },
        { id: "Furasowa Republika", members: 323, boosts: 7, partnerships: ["Stacja Pandka"] },
        { id: "Furzasta Karczma", members: 247, boosts: 6, partnerships: ["New Foxing Town"] },
        { id: "Gwiazdeczki Cosmiego", members: 390, boosts: 4, partnerships: ["Futrzasty zakątek", "Pyrkon Furries", "Tayland"] },
        { id: "Fragonia Factory", members: 122, boosts: 0, partnerships: ["Pyrkon Furries", "Tayland", "FURRYWORLD", "Futrzasty obóz", "Lisi cień"] },
        { id: "Futrzasta Kawiarnia", members: 46, boosts: 0, partnerships: ["Futrzasty Zakątek"] },
        { id: "FutrzakOwO", members: 128, boosts: 0, partnerships: ["FURRYWORLD", "Futrzasta Centrala", "Futerkowa wysepka", "Lisi cień", "Polskie Smoki", "Pyrkon Furries", "Futrzasta Chatka", "BFSiP", "Polski Serwer Furry 2"] },
        { id: "FurryBox", members: 139, boosts: 0, partnerships: ["World of Furries", "Lisi cień", "Futrzasta Centrala", "Polski Serwer Furry 2", "Futrzaste Plemię", "Furrasowy kącik", "Dolina Futer", "Polskie Smoki", "Furry Galaxy", "Pyrkon Furries", "BFSiP", "Futrzasta Chatka"] },
        { id: "FURRYWORLD", members: 109, boosts: 0, partnerships: ["Furry Galaxy", "Futrzasta Centrala", "Lisi Lasek", "FutrzakOwO", "BFSiP", "World of Furries", "Polski Serwer Furry 2", "Lisia Norka", "Furrasowe Arty", "Dolina Futer", "Fragonia Factory"] },
        { id: "Lisi cień", members: 514, boosts: 0, partnerships: ["Futrzaste Miasto Pizzy", "Yutan", "Dolina Futer", "Fragonia Factory", "FutrzakOwO", "FurryBox", "Futrzasta Centrala", "BFSiP"] },
        { id: "Furaski", members: 70, boosts: 0, partnerships: ["Lisia Norka", "Polski Serwer Furry 2", "Futrzasta Oceania", "Stary Londyn"] },
        { id: "Futrzasta Centrala", members: 206, boosts: 0, partnerships: ["FurHeaven", "Lisi cień", "BFSiP", "Polski Serwer Furry 2", "FutrzakOwO", "FurryBox", "FURRYWORLD", "Furtownia", "FUTERKOWO", "FuterkOwO"] },
        { id: "Polskie Smoki", members: 246, boosts: 0, partnerships: ["FurryBox", "Futrzasta Chatka", "FutrzakOwO"] },
        { id: "Furasowy Las", members: 23, boosts: 0, partnerships: ["Furry Night PL"] },
        { id: "Futrzana Piwnica", members: 38, boosts: 0, partnerships: ["Nasze Futrzaste Grono", "Futrzasta Krypta", "Fox Community"] },
        { id: "World of Furries", members: 66, boosts: 0, partnerships: ["Lisi cień", "BFSiP", "FURRYWORLD", "FurryBox", "Futerkowa wysepka"] },
        { id: "Fox Community", members: 46, boosts: 0, partnerships: ["Strawtilla's World", "Futrzana Piwnica"] },
        { id: "Futrzasta Kafejka Internetowa", members: 50, boosts: 0, partnerships: [] },
        { id: "Furry Galaxy", members: 186, boosts: 0, partnerships: ["FURRYWORLD", "FurryBox", "FUTERKOWO"] },
        { id: "Lisi Lasek", members: 48, boosts: 0, partnerships: ["FURRYWORLD"] },
        { id: "Synowie ślimaka V2", members: 64, boosts: 0, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "Kolorowa Zatoczka"] },
        { id: "Puszyste Ogonki", members: 203, boosts: 0, partnerships: [] },
        { id: "Furrasowe Arty", members: 36, boosts: 0, partnerships: ["Lisia Norka", "FURRYWORLD"] },
        { id: "Futrzaste Plemię", members: 83, boosts: 0, partnerships: ["Lisia Norka", "FurryBox"] },
        { id: "Futrzasty discord", members: 44, boosts: 0, partnerships: ["Lisia Norka"] },
        { id: "Furry obóz RP", members: 88, boosts: 0, partnerships: ["Lisia Norka"] },
        { id: "Rzeczpospolita Furska", members: 241, boosts: 2, partnerships: ["Nasze Futrzaste Grono", "Boykissers Heaven", "Futrzaki na Fali"] },
        { id: "Furrasowy kącik", members: 165, boosts: 0, partnerships: ["Futrzasta Chatka", "FurryBox"] },
        { id: "Futerkowa wysepka", members: 272, boosts: 0, partnerships: ["FutrzakOwO", "World of Furries"] },
        { id: "Kemi's Furry Place", members: 40, boosts: 0, partnerships: ["Futrzasty zakątek"]},
        { id: "Wilkowice", members: 83, boosts: 2, partnerships: ["Nasze Futrzaste Grono"]},
        { id: "Stary Londyn", members: 21, boosts: 0, partnerships: ["Furaski"]},
        { id: "Furtownia", members: 340, boosts: 14, partnerships: ["FURRYWORLD", "Futrzasta Centrala"]},
        { id: "FUTERKOWO", members: 31, boosts: 0, partnerships: ["Furry Galaxy", "Futrzasta Centrala"]},
        { id: "FuterkOwO", members: 38, boosts: 0, partnerships: ["Futrzasta Centrala"]},
        { id: "Futrzasta Karczma", members: 247, boosts: 6, partnerships: ["New Foxing Town", "Electron's Hub"]},
        { id: "Electron's Hub", members: 304, boosts: 7, partnerships: ["Futrzasta Karczma", "Gwiazdeczki Cosmiego"]}

    ],
    links: []
};

// ... (początek pliku script.js, wklej tutaj swoją zmienną 'data') ...

data.nodes.forEach(node => {
    node.partnerships.forEach(partnerId => {
        const partner = data.nodes.find(n => n.id === partnerId);
        if (partner) {
            data.links.push({ source: node.id, target: partnerId });
        } else {
            console.warn(`Partner ${partnerId} dla ${node.id} nie został znaleziony.`);
        }
    });
});

const width = window.innerWidth;
const height = window.innerHeight;

const radiusScale = d3.scaleSqrt()
.domain([0, d3.max(data.nodes, d => d.members)])
.range([10, 50]);

const svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);

const g = svg.append("g");

let simulation = d3.forceSimulation(data.nodes)
.force("link", d3.forceLink(data.links).id(d => d.id).distance(d => {
    return d.source.partnerships.includes(d.target.id) ? 30 : 150; // Krótsze połączenia dla partnerstw
}))
.force("charge", d3.forceManyBody().strength(-1500))
.force("center", d3.forceCenter(width / 2, height / 2))
.force("collision", d3.forceCollide().radius(d => radiusScale(d.members) + 5));

function drawGraph(filteredNodes, filteredLinks) {
    g.selectAll(".nodes").remove();
    g.selectAll(".links").remove();
    g.selectAll(".labels").remove();

    const newLinks = filteredLinks.filter(l =>
    filteredNodes.some(n => n.id === l.source.id) &&
    filteredNodes.some(n => n.id === l.target.id)
    );

    simulation.nodes(filteredNodes);
    simulation.force("link").links(newLinks);

    const newLink = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(newLinks, d => d.source.id + "-" + d.target.id)
    .enter().append("line")
    .attr("class", "link");

    const newNode = g.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(filteredNodes, d => d.id)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", d => radiusScale(d.members))
    .attr("fill", d => getNodeColor(d))
    .on("click", handleNodeClick)
    .on("mouseover", handleNodeMouseOver)
    .on("mouseout", handleNodeMouseOut);

    const newLabels = g.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(filteredNodes, d => d.id)
    .enter().append("text")
    .attr("class", "node-label")
    .text(d => d.id);

    simulation.on("tick", () => {
        newLink
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

        newNode
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

        newLabels
        .attr("x", d => d.x)
        .attr("y", d => d.y - radiusScale(d.members) - 5);
    });

    simulation.alpha(1).restart();
}

let initialZoom = 0.1;
let initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(initialZoom).translate(-width / 2, -height / 2);

const zoom_handler = d3.zoom()
.scaleExtent([0.1, 8])
.on("zoom", (event) => {
    g.attr("transform", event.transform);
});

svg.call(zoom_handler).call(zoom_handler.transform, initialTransform);

svg.on("mousemove", (event) => {
    let [x, y] = d3.pointer(event, g.node());
    x = Math.round(x);
    y = Math.round(y);
    const correctedY = height - y;
    d3.select("#coords").text(`X: ${x}, Y: ${correctedY}`);
});

d3.select("#resetButton").on("click", () => {
    svg.transition().duration(750).call(zoom_handler.transform, initialTransform);
});

function getNodeColor(node) {
    const boostScale = d3.scaleLinear()
    .domain([0, 10, 20, 30])
    .range(["#f0f0f0", "#ffeb3b", "#ff9800", "#ff0000"]);
    return boostScale(node.boosts);
}

let currentlyHighlighted = null;
let blinkingNode = null;


// ZMODYFIKOWANA funkcja do przełączania widoczności - teraz steruje też #bottomInfo
function toggleLeftPanelAndServerInfo(showServerInfo) {
    const serverInfo = d3.select("#serverInfo");
    const bottomInfo = d3.select("#bottomInfo"); // Dodajemy odwołanie do #bottomInfo

    if (showServerInfo) {
        serverInfo.classed("visible", true);
        // Ukryj #bottomInfo tylko na urządzeniach mobilnych
        if (window.innerWidth <= 768) {
            bottomInfo.style("display", "none");
        }
    } else {
        serverInfo.classed("visible", false);
        // Pokaż #bottomInfo tylko na urządzeniach mobilnych
        if (window.innerWidth <= 768) {
            bottomInfo.style("display", "flex"); // Przywróć domyślny styl (flex)
        }
    }
}

function handleNodeClick(event, d) {
    const serverInfo = d3.select("#serverInfo");

    if (currentlyHighlighted === d) {
        serverInfo.style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
        // Jeśli zamykamy panel, pokaż #leftPanel (tylko na mobile)
        if (window.innerWidth <= 768) {
            d3.select("#leftPanel").style("display", "flex");
        }
        return;
    }

    resetHighlight();
    currentlyHighlighted = d;
    serverInfo.style("display", "block");

    // Dodaj/usuń klasę 'visible' w zależności od tego, czy panel jest widoczny
    toggleLeftPanelAndServerInfo(true);
    // Jeśli otwieramy panel, ukryj #leftPanel (tylko na mobile)
    if (window.innerWidth <= 768) {
        d3.select("#leftPanel").style("display", "none");
    }

    const sortedPartnerships = d.partnerships
    .map(partnerId => data.nodes.find(n => n.id === partnerId))
    .filter(partner => partner) // Filtruj na wypadek, gdyby partner nie istniał
    .sort((a, b) => b.members - a.members);

    let partnershipsHtml = `<p>Liczba partnerstw: ${sortedPartnerships.length}</p><ul>`;
    sortedPartnerships.forEach(partner => {
        const partnerColor = getNodeColor(partner);
        partnershipsHtml += `<li style="color: ${partnerColor};">
        ${partner.id} (Członkowie: ${partner.members}, Boosty: ${partner.boosts})
        </li>`;
    });
    partnershipsHtml += "</ul>";

    const serverColor = getNodeColor(d);

    serverInfo.html(`
    <h3>Serwer:</h3>
    <h2 style="color: ${serverColor};">${d.id}</h2>
    <p style="color: ${serverColor};">Członkowie: ${d.members}</p>
    <p style="color: ${serverColor};">Boosty: ${d.boosts}</p>
    <h3>Partnerstwa:</h3>
    ${partnershipsHtml}
    `);

    highlightNodeAndLinks(d);

    const scale = 0.6;
    const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-d.x, -d.y);

    svg.transition().duration(750).call(zoom_handler.transform, transform);
    startBlinking(d);
}

function searchServer(serverId) {
    searchResults.style("display", "none");
    const serverNode = data.nodes.find(n => n.id === serverId);

    if (!serverNode) {
        console.error("Nie znaleziono serwera o ID: " + serverId);
        return;
    }

    const scale = 0.75;
    const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-serverNode.x, -serverNode.y);

    svg.transition().duration(750).call(zoom_handler.transform, transform);
    handleNodeClick(null, serverNode);
}

function highlightNodeAndLinks(d) {
    const connectedNodeIds = new Set();
    connectedNodeIds.add(d.id);

    data.links.forEach(l => {
        if (l.source.id === d.id) {
            connectedNodeIds.add(l.target.id);
        }
        if (l.target.id === d.id) {
            connectedNodeIds.add(l.source.id);
        }
    });

    g.selectAll(".node").classed("dimmed", n => !connectedNodeIds.has(n.id));
    g.selectAll(".node").style("stroke-width", n => connectedNodeIds.has(n.id) ? 2 : 0);
    g.selectAll(".link").classed("hidden", l => !(connectedNodeIds.has(l.source.id) && connectedNodeIds.has(l.target.id)));
    g.selectAll(".node-label").classed("hidden", label => !connectedNodeIds.has(label.id));
}

function resetHighlight() {
    g.selectAll(".node")
    .classed("dimmed", false)
    .style("fill", n => getNodeColor(n))
    .style("stroke", "none")
    .style("stroke-width", 0);

    g.selectAll(".link").classed("hidden", false);
    g.selectAll(".node-label").classed("hidden", false);
    stopBlinking();
}

function startBlinking(nodeData) {
    blinkingNode = nodeData;
    blink();

    function blink() {
        if (blinkingNode === nodeData) {
            const node = g.selectAll(".node").filter(d => d.id === nodeData.id);
            if (!node.empty()) {
                node.transition()
                .duration(500)
                .attr("r", d => radiusScale(d.members) - 10)
                .transition()
                .duration(500)
                .attr("r", d => radiusScale(d.members))
                .on("end", blink);
            } else {
                blinkingNode = null;
            }
        }
    }
}

function stopBlinking() {
    if (blinkingNode) {
        g.selectAll(".node")
        .filter(d => d.id === blinkingNode.id)
        .transition()
        .duration(200)
        .attr("r", d => radiusScale(d.members));
        blinkingNode = null;
    }
}

svg.on("click", (event) => {
    // Zmodyfikowane zdarzenie click, aby zamykało #serverInfo
    if (!g.node().contains(event.target) && !d3.select("#serverInfo").node().contains(event.target) && !d3.select("#leftPanel").node().contains(event.target)) {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
        // Jeśli zamykamy panel, pokaż #leftPanel i bottomInfo(tylko na mobile)
        if (window.innerWidth <= 768) {
            d3.select("#leftPanel").style("display", "flex");
            d3.select("#bottomInfo").style("display", "flex"); // Dodano
        }
    }
});

function handleNodeMouseOver(event, d) {
    const tooltip = d3.select(".tooltip");
    tooltip.style("display", "block")
    .html(`
    <strong>${d.id}</strong><br>
    Członkowie: ${d.members}<br>
    Boosty: ${d.boosts}
    `)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 28) + "px");

    const serverInfo = d3.select("#serverInfo");
    serverInfo.selectAll("li").style("font-weight", "normal");
    const listItem = serverInfo.selectAll("li")
    .filter(function() {
        return this.textContent.trim().startsWith(d.id);
    });

    if (!listItem.empty()) {
        listItem.style("font-weight", "bold");
    }

    const connectedNodeIds = new Set();
    connectedNodeIds.add(d.id);

    data.links.forEach(l => {
        if (l.source.id === d.id) {
            connectedNodeIds.add(l.target.id);
        }
        if (l.target.id === d.id) {
            connectedNodeIds.add(l.source.id);
        }
    });

    g.selectAll(".node")
    .filter(n => connectedNodeIds.has(n.id))
    .style("stroke", "lightblue")
    .style("stroke-width", 2);

    g.selectAll(".link")
    .style("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "lightblue" : "#999")
    .style("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 2 : 1);
}

function handleNodeMouseOut(event, d) {
    d3.select(".tooltip").style("display", "none");

    const serverInfo = d3.select("#serverInfo");
    serverInfo.selectAll("li").style("font-weight", "normal");
    serverInfo.selectAll("h2").style("font-weight", "normal");

    g.selectAll(".link").style("stroke", "#999").style("stroke-width", 1);
    g.selectAll(".node").style("stroke", "none").style("stroke-width", 0);
}

const memberFilter = d3.select("#memberFilter");
const boostFilter = d3.select("#boostFilter");
const memberValue = d3.select("#memberValue");
const boostValue = d3.select("#boostValue");

memberFilter.attr("max", d3.max(data.nodes, d => d.members));
boostFilter.attr("max", d3.max(data.nodes, d => d.boosts));

memberFilter.on("input", updateFilters);
boostFilter.on("input", updateFilters);

function updateFilters() {
    const minMembers = +memberFilter.property("value");
    const minBoosts = +boostFilter.property("value");

    memberValue.text(minMembers);
    boostValue.text(minBoosts);

    const filteredNodes = data.nodes.filter(d => d.members >= minMembers && d.boosts >= minBoosts);
    const filteredNodeIds = new Set(filteredNodes.map(d => d.id));
    const filteredLinks = data.links.filter(l =>
    filteredNodeIds.has(l.source.id) && filteredNodeIds.has(l.target.id)
    );

    drawGraph(filteredNodes, filteredLinks);

    if (currentlyHighlighted) {
        resetHighlight();
        currentlyHighlighted = null;
        d3.select("#serverInfo").style("display", "none");
    }
}

const searchInput = d3.select("#searchInput");
const searchResults = d3.select("#searchResults");

searchInput.on("input", () => {
    const searchTerm = searchInput.property("value").toLowerCase();
    const results = data.nodes.filter(node => node.id.toLowerCase().includes(searchTerm));

    if (searchTerm === "" || results.length === 0) {
        searchResults.style("display", "none");
    } else {
        searchResults.style("display", "block");
        searchResults.html("");

        results.forEach(result => {
            const resultDiv = searchResults.append("div");
            resultDiv.text(result.id);
            resultDiv.on("click", () => {
                searchServer(result.id);
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const understandButton = document.getElementById('understandButton');

    overlay.classList.add('visible');

    understandButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    });

    const serverCount = data.nodes.length;
    document.querySelector("#dataDate div:first-child").textContent = `Liczba serwerów: ${serverCount}`;

    drawGraph(data.nodes, data.links);

    // Dodajemy event listener dla przycisku zamykania #serverInfo
    d3.select("#closeServerInfo").on("click", () => {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
        if (window.innerWidth <= 768) {
            d3.select("#leftPanel").style("display", "flex");
            d3.select("#bottomInfo").style("display", "flex");
        }
    });
});

// Funkcja do obsługi zmiany orientacji/rozmiaru okna
function handleResize() {
    // Pobierz nowe wymiary okna
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    // Zaktualizuj atrybuty SVG
    svg.attr("width", newWidth).attr("height", newHeight);

    // Zaktualizuj środek sił
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));

    // Uruchom ponownie symulację
    simulation.alpha(1).restart();
}

// Nasłuchuj zdarzenia resize i wywołuj handleResize
window.addEventListener("resize", handleResize);
