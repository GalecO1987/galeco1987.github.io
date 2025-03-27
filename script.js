function convertDateFormat(dateString) {
    const [day, monthName, year] = dateString.split(" ");
    const month = [
        "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
        "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
    ].indexOf(monthName) + 1;
    return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

data.nodes.forEach(node => {
    node.creationDate = convertDateFormat(node.creationDate);
    node.partnerships.forEach(partnerId => {
        const partner = data.nodes.find(n => n.id === partnerId);
        if (partner) {
            data.links.push({ source: node.id, target: partnerId });
        } else {
            console.warn(`Partner ${partnerId} dla ${node.id} nie został znaleziony.`);
        }
    });
});

let minDateObj, maxDateObj;
let dateRange = 0;

minDateObj = new Date(d3.min(data.nodes, d => d.creationDate.split("-").reverse().join("-")));
maxDateObj = new Date(d3.max(data.nodes, d => d.creationDate.split("-").reverse().join("-")));
dateRange = (maxDateObj - minDateObj) / (1000 * 60 * 60 * 24);

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
    return d.source.partnerships.includes(d.target.id) ? 30 : 150;
}))
.force("charge", d3.forceManyBody().strength(-1500))
.force("center", d3.forceCenter(width / 2, height / 2))
.force("collision", d3.forceCollide().radius(d => radiusScale(d.members) + 5));

let freezeTimer;

function drawGraph(filteredNodes, filteredLinks, initialAlpha = 1, stopDelay = 1000) {
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

    simulation.alpha(initialAlpha).restart();

    clearTimeout(freezeTimer);

    if (stopDelay > 0) {
        freezeTimer = setTimeout(() => {
            simulation.stop();
        }, stopDelay);
    }
}


let initialZoom = 0.09;
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


function toggleLeftPanelAndServerInfo(showServerInfo) {
    const serverInfo = d3.select("#serverInfo");
    const leftPanel = d3.select("#leftPanel");

    if (showServerInfo) {
        serverInfo.style("display", "block");
        if (window.innerWidth <= 768) {
            leftPanel.classed("left-panel-hidden", true);
        }
    } else {
        serverInfo.style("display", "none");
        if (window.innerWidth <= 768) {
            leftPanel.classed("left-panel-hidden", false);
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
        return;
    }

    resetHighlight();
    currentlyHighlighted = d;
    serverInfo.style("display", "block");

    toggleLeftPanelAndServerInfo(true);

    const sortedPartnerships = d.partnerships
    .map(partnerId => data.nodes.find(n => n.id === partnerId))
    .filter(partner => partner)
    .sort((a, b) => b.members - a.members);

    const serverColor = getNodeColor(d);
    d3.select("#serverInfo-name").style("color", serverColor).text(d.id);

    const serverInfoMembers = d3.select("#serverInfo-members");
    serverInfoMembers.selectAll("*").remove();
    serverInfoMembers.append("div").text(`Data założenia: ${d.creationDate}`);
    serverInfoMembers.append("div").text(`Członkowie: ${d.members} (miejsce #${d.memberRank})`);

    d3.select("#serverInfo-boosts").text(`Boosty: ${d.boosts} (miejsce #${d.boostRank})`);
    d3.select("#serverInfo-partnerships-count").text(`Liczba partnerstw: ${sortedPartnerships.length} (miejsce #${d.partnershipRank})`);


    let partnershipsHtml = "";
    sortedPartnerships.forEach(partner => {
        const partnerColor = getNodeColor(partner);
        partnershipsHtml += `<li style="color: ${partnerColor};">
        ${partner.id} (Członkowie: ${partner.members}, Boosty: ${partner.boosts})
        </li>`;
    });
    d3.select("#serverInfo-partnerships-list").html(partnershipsHtml);

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
    g.selectAll(".node") // Nadaj obramowanie tylko podświetlonym
    .style("stroke", n => connectedNodeIds.has(n.id) ? "white" : "none")
    .style("stroke-width", n => connectedNodeIds.has(n.id) ? 2 : 0);
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
        .interrupt() // Przerwij trwającą animację migania
        .transition()
        .duration(200)
        .attr("r", d => radiusScale(d.members)); // Przywróć normalny promień
        blinkingNode = null;
    }
}


svg.on("click", (event) => {
    if (!event.target.closest('.node') && !event.target.closest('#serverInfo') && !event.target.closest('#leftPanel')) {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
    }
});



function handleNodeMouseOver(event, d) {
    if (event.target.tagName === 'circle') {
        const tooltip = d3.select(".tooltip");
        tooltip.style("display", "block")
        .html(`
        <strong>${d.id}</strong><br>
        Data założenia: ${d.creationDate}<br>
        Członkowie: ${d.members} (miejsce #${d.memberRank})<br>
        Boosty: ${d.boosts} (miejsce #${d.boostRank})<br>
        Partnerstwa: ${d.partnerships.length} (miejsce #${d.partnershipRank})
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    }

    if (currentlyHighlighted && currentlyHighlighted.id === d.id) {
        const serverInfo = d3.select("#serverInfo");
        serverInfo.select("h2").style("font-weight", "bold");
        serverInfo.select("#serverInfo-members").style("font-weight", "bold");
        serverInfo.select("#serverInfo-boosts").style("font-weight", "bold");
        serverInfo.select("#serverInfo-partnerships-count").style("font-weight", "bold");
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

    // Dodaj obramowanie hover tylko jeśli węzeł nie jest aktualnie kliknięty
    g.selectAll(".node")
    .filter(n => connectedNodeIds.has(n.id) && (!currentlyHighlighted || n.id !== currentlyHighlighted.id))
    .style("stroke", "lightblue")
    .style("stroke-width", 2);

    // Specjalne traktowanie dla aktualnie klikniętego węzła (jeśli istnieje) podczas hoveru
    if(currentlyHighlighted && d.id === currentlyHighlighted.id) {
        g.selectAll(".node").filter(n => n.id === d.id)
        .style("stroke", "lightblue") // Zmień kolor obramowania na hover
        .style("stroke-width", 2);
    }


    g.selectAll(".link")
    .style("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "lightblue" : "#999")
    .style("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 2 : 1);
}

function handleNodeMouseOut(event, d) {
    d3.select(".tooltip").style("display", "none");

    if (currentlyHighlighted && currentlyHighlighted.id === d.id) {
        const serverInfo = d3.select("#serverInfo");
        serverInfo.select("h2").style("font-weight", "normal");
        serverInfo.select("#serverInfo-members").style("font-weight", "normal");
        serverInfo.select("#serverInfo-boosts").style("font-weight", "normal");
        serverInfo.select("#serverInfo-partnerships-count").style("font-weight", "normal");
    }

    // Przywróć style linków
    g.selectAll(".link").style("stroke", "#999").style("stroke-width", 1);

    // Usuń obramowanie hover ze wszystkich węzłów oprócz aktualnie klikniętego
    g.selectAll(".node")
    .filter(n => !currentlyHighlighted || n.id !== currentlyHighlighted.id)
    .style("stroke", "none").style("stroke-width", 0);

    // Przywróć styl obramowania dla aktualnie klikniętego węzła (jeśli istnieje)
    if (currentlyHighlighted) {
        g.selectAll(".node").filter(n => n.id === currentlyHighlighted.id)
        .style("stroke", "white") // Kolor obramowania dla klikniętego
        .style("stroke-width", 2);
        // Upewnij się, że linki powiązane z klikniętym węzłem nie są ukryte
        highlightNodeAndLinks(currentlyHighlighted);
    } else {
        // Jeśli nic nie jest kliknięte, upewnij się, że wszystkie linki są widoczne
        g.selectAll(".link").classed("hidden", false);
    }
}


const dateFilterMin = d3.select("#dateFilterMin");
const dateFilterMax = d3.select("#dateFilterMax");
const dateValue = d3.select("#dateValue");

const memberFilterMin = d3.select("#memberFilterMin");
const memberFilterMax = d3.select("#memberFilterMax");
const memberValue = d3.select("#memberValue");

const boostFilterMin = d3.select("#boostFilterMin");
const boostFilterMax = d3.select("#boostFilterMax");
const boostValue = d3.select("#boostValue");

const partnershipFilterMin = d3.select("#partnershipFilterMin");
const partnershipFilterMax = d3.select("#partnershipFilterMax");
const partnershipValue = d3.select("#partnershipValue");


function formatDate(dateObj) {
    if (!dateObj || isNaN(dateObj)) return "-";
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
}

function updateRangeSliderVisual(minInput, maxInput) {
    const container = minInput.node().parentNode;
    const fill = container.querySelector('.range-fill');
    if (!fill) return;

    const minVal = +minInput.property("value");
    const maxVal = +maxInput.property("value");
    const minAttr = +minInput.attr("min");
    const maxAttr = +minInput.attr("max");

    if (maxAttr === minAttr) {
        fill.style.left = `0%`;
        fill.style.width = `100%`;
        return;
    }

    const range = maxAttr - minAttr;
    const minPercent = ((minVal - minAttr) / range) * 100;
    const maxPercent = ((maxVal - minAttr) / range) * 100;

    fill.style.left = `${minPercent}%`;
    fill.style.width = `${maxPercent - minPercent}%`;
}

function initializeFilters() {
    const dateMaxVal = Math.round(dateRange);
    dateFilterMin.attr("max", dateMaxVal).attr("value", 0);
    dateFilterMax.attr("max", dateMaxVal).attr("value", dateMaxVal);
    dateFilterMin.property("value", 0);
    dateFilterMax.property("value", dateMaxVal);
    const initialMinDateStr = formatDate(minDateObj);
    const initialMaxDateStr = formatDate(maxDateObj);
    dateValue.select(".min-value").text(`min: ${initialMinDateStr}`);
    dateValue.select(".max-value").text(`max: ${initialMaxDateStr}`);
    updateRangeSliderVisual(dateFilterMin, dateFilterMax);
    dateFilterMin.on("input", handleDateFilterInput);
    dateFilterMax.on("input", handleDateFilterInput);

    const maxMembers = d3.max(data.nodes, d => d.members) || 0;
    memberFilterMin.attr("max", maxMembers).attr("value", 0);
    memberFilterMax.attr("max", maxMembers).attr("value", maxMembers);
    memberFilterMin.property("value", 0);
    memberFilterMax.property("value", maxMembers);
    memberValue.select(".min-value").text(`min: 0`);
    memberValue.select(".max-value").text(`max: ${maxMembers}`);
    updateRangeSliderVisual(memberFilterMin, memberFilterMax);
    memberFilterMin.on("input", handleGenericFilterInput);
    memberFilterMax.on("input", handleGenericFilterInput);

    const maxBoosts = d3.max(data.nodes, d => d.boosts) || 0;
    boostFilterMin.attr("max", maxBoosts).attr("value", 0);
    boostFilterMax.attr("max", maxBoosts).attr("value", maxBoosts);
    boostFilterMin.property("value", 0);
    boostFilterMax.property("value", maxBoosts);
    boostValue.select(".min-value").text(`min: 0`);
    boostValue.select(".max-value").text(`max: ${maxBoosts}`);
    updateRangeSliderVisual(boostFilterMin, boostFilterMax);
    boostFilterMin.on("input", handleGenericFilterInput);
    boostFilterMax.on("input", handleGenericFilterInput);

    const maxPartnerships = d3.max(data.nodes, d => d.partnerships.length) || 0;
    partnershipFilterMin.attr("max", maxPartnerships).attr("value", 0);
    partnershipFilterMax.attr("max", maxPartnerships).attr("value", maxPartnerships);
    partnershipFilterMin.property("value", 0);
    partnershipFilterMax.property("value", maxPartnerships);
    partnershipValue.select(".min-value").text(`min: 0`);
    partnershipValue.select(".max-value").text(`max: ${maxPartnerships}`);
    updateRangeSliderVisual(partnershipFilterMin, partnershipFilterMax);
    partnershipFilterMin.on("input", handleGenericFilterInput);
    partnershipFilterMax.on("input", handleGenericFilterInput);
}

function handleGenericFilterInput(event) {
    const input = d3.select(event.target);
    const isMin = input.classed("range-min");
    const container = input.node().parentNode;
    const minInput = d3.select(container).select(".range-min");
    const maxInput = d3.select(container).select(".range-max");
    const valueDisplay = d3.select(container.parentNode).select("p");

    let minVal = +minInput.property("value");
    let maxVal = +maxInput.property("value");

    if (isMin) {
        if (minVal > maxVal) {
            minInput.property("value", maxVal);
            minVal = maxVal;
        }
    } else {
        if (maxVal < minVal) {
            maxInput.property("value", minVal);
            maxVal = minVal;
        }
    }

    valueDisplay.select(".min-value").text(`min: ${minVal}`);
    valueDisplay.select(".max-value").text(`max: ${maxVal}`);
    updateRangeSliderVisual(minInput, maxInput);
    updateFilters();
}


function handleDateFilterInput(event) {
    const input = d3.select(event.target);
    const isMin = input.classed("range-min");
    const container = input.node().parentNode;
    const minInput = d3.select(container).select(".range-min");
    const maxInput = d3.select(container).select(".range-max");

    let minDays = +minInput.property("value");
    let maxDays = +maxInput.property("value");

    if (isMin) {
        if (minDays > maxDays) {
            minInput.property("value", maxDays);
            minDays = maxDays;
        }
    } else {
        if (maxDays < minDays) {
            maxInput.property("value", minDays);
            maxDays = minDays;
        }
    }

    const selectedMinDateObj = new Date(minDateObj);
    selectedMinDateObj.setDate(minDateObj.getDate() + minDays);
    selectedMinDateObj.setHours(0, 0, 0, 0);

    const selectedMaxDateObj = new Date(minDateObj);
    selectedMaxDateObj.setDate(minDateObj.getDate() + maxDays);
    selectedMaxDateObj.setHours(23, 59, 59, 999);

    dateValue.select(".min-value").text(`min: ${formatDate(selectedMinDateObj)}`);
    dateValue.select(".max-value").text(`max: ${formatDate(selectedMaxDateObj)}`);
    updateRangeSliderVisual(minInput, maxInput);
    updateFilters();
}


function updateFilters() {
    const minDays = +dateFilterMin.property("value");
    const maxDays = +dateFilterMax.property("value");
    const selectedMinDateObj = new Date(minDateObj);
    selectedMinDateObj.setDate(minDateObj.getDate() + minDays);
    selectedMinDateObj.setHours(0, 0, 0, 0);

    const selectedMaxDateObj = new Date(minDateObj);
    selectedMaxDateObj.setDate(minDateObj.getDate() + maxDays);
    selectedMaxDateObj.setHours(23, 59, 59, 999);

    const minMembers = +memberFilterMin.property("value");
    const maxMembers = +memberFilterMax.property("value");

    const minBoosts = +boostFilterMin.property("value");
    const maxBoosts = +boostFilterMax.property("value");

    const minPartnerships = +partnershipFilterMin.property("value");
    const maxPartnerships = +partnershipFilterMax.property("value");

    memberValue.select(".min-value").text(`min: ${minMembers}`);
    memberValue.select(".max-value").text(`max: ${maxMembers}`);
    boostValue.select(".min-value").text(`min: ${minBoosts}`);
    boostValue.select(".max-value").text(`max: ${maxBoosts}`);
    partnershipValue.select(".min-value").text(`min: ${minPartnerships}`);
    partnershipValue.select(".max-value").text(`max: ${maxPartnerships}`);
    dateValue.select(".min-value").text(`min: ${formatDate(selectedMinDateObj)}`);
    dateValue.select(".max-value").text(`max: ${formatDate(selectedMaxDateObj)}`);


    const filteredNodes = data.nodes.filter(d => {
        const nodeDateObj = new Date(d.creationDate.split("-").reverse().join("-"));
        nodeDateObj.setHours(0, 0, 0, 0);
        const minDateCompare = new Date(selectedMinDateObj);
        minDateCompare.setHours(0,0,0,0);
        const maxDateCompare = new Date(selectedMaxDateObj);
        maxDateCompare.setHours(0,0,0,0);

        return (
            nodeDateObj >= minDateCompare && nodeDateObj <= maxDateCompare &&
            d.members >= minMembers && d.members <= maxMembers &&
            d.boosts >= minBoosts && d.boosts <= maxBoosts &&
            d.partnerships.length >= minPartnerships && d.partnerships.length <= maxPartnerships
        );
    });

    const filteredNodeIds = new Set(filteredNodes.map(d => d.id));
    const filteredLinks = data.links.filter(l =>
    filteredNodeIds.has(l.source.id) && filteredNodeIds.has(l.target.id)
    );

    calculateRanks(filteredNodes);

    drawGraph(filteredNodes, filteredLinks, 0, 0); // Użyj niskiej alfy (0.3) i pozwól naturalnie wygasnąć (0ms stopDelay)

    if (currentlyHighlighted && !filteredNodeIds.has(currentlyHighlighted.id)) {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
    } else if (currentlyHighlighted) {
        highlightNodeAndLinks(currentlyHighlighted);
    }
}

const searchInput = d3.select("#searchInput");
const searchResults = d3.select("#searchResults");

function moveLeftPanel(up) {
    const leftPanel = d3.select("#leftPanel");
    if (window.innerWidth <= 768) {
        if (up) {
            const searchResultsHeight = searchResults.node().offsetHeight;
            leftPanel.style("transform", `translateY(-${searchResultsHeight}px)`);
        } else {
            leftPanel.style("transform", "none");
        }
    }
}

searchInput.on("input", () => {
    const searchTerm = searchInput.property("value").toLowerCase();
    const results = data.nodes.filter(node => node.id.toLowerCase().includes(searchTerm));

    if (searchTerm === "" || results.length === 0) {
        searchResults.style("display", "none");
        moveLeftPanel(false);
    } else {
        searchResults.style("display", "block");
        searchResults.html("");

        results.forEach(result => {
            const resultDiv = searchResults.append("div");
            resultDiv.text(result.id);
            resultDiv.on("click", () => {
                searchInput.property("value", result.id);
                searchResults.style("display", "none");
                moveLeftPanel(false);
                searchServer(result.id);
            });
        });
        moveLeftPanel(true);
    }
});

function calculateRanks(nodes) {
    const membersRank = [...nodes].sort((a, b) => b.members - a.members);
    membersRank.forEach((node, index) => {
        node.memberRank = index + 1;
    });

    const boostsRank = [...nodes].sort((a, b) => b.boosts - a.boosts);
    boostsRank.forEach((node, index) => {
        node.boostRank = index + 1;
    });

    const partnershipsRank = [...nodes].sort((a, b) => b.partnerships.length - a.partnerships.length);
    partnershipsRank.forEach((node, index) => {
        node.partnershipRank = index + 1;
    });

    const creationDateRank = [...nodes].sort((a, b) => {
        return new Date(a.creationDate.split("-").reverse().join("-")) - new Date(b.creationDate.split("-").reverse().join("-"));
    });

    creationDateRank.forEach((node, index) => {
        node.creationDateRank = index + 1;
    })
}

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
    document.querySelector("#serverCount").textContent = serverCount;


    initializeFilters();
    calculateRanks(data.nodes);
    drawGraph(data.nodes, data.links, 1, 1000); // Początkowe rysowanie z pełną alfą i zatrzymaniem po 1s
    // updateFilters(); // Usunięto, bo drawGraph jest wywoływane powyżej

    d3.select("#closeServerInfo").on("click", () => {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
    });

    d3.select("#serverInfo-partnerships-list").on("mouseover", (event) => {
        const target = event.target;

        if (target.tagName === 'LI') {
            const serverName = target.textContent.split(" (")[0].trim();
            const hoveredNode = data.nodes.find(node => node.id === serverName);

            if (hoveredNode) {
                handleNodeMouseOver(event, hoveredNode);
                d3.select(target).style("font-weight", "bold");

                if (currentlyHighlighted) {
                    g.selectAll(".link")
                    .filter(l => (l.source.id === hoveredNode.id && l.target.id === currentlyHighlighted.id) || (l.target.id === hoveredNode.id && l.source.id === currentlyHighlighted.id) )
                    .style("stroke", "lightblue")
                    .style("stroke-width", 2);
                    g.selectAll(".node")
                    .filter(n => n.id === hoveredNode.id)
                    .style("stroke", "lightblue")
                    .style("stroke-width", 2);
                }
            }
        }
    });

    d3.select("#serverInfo-partnerships-list").on("mouseout", (event) => {
        const target = event.target;
        if (target.tagName === 'LI') {
            const serverName = target.textContent.split(" (")[0].trim();
            const hoveredNode = data.nodes.find(node => node.id === serverName);

            if (hoveredNode) {
                handleNodeMouseOut(event, hoveredNode);
                d3.select(target).style("font-weight", "normal");

                if (currentlyHighlighted) {
                    highlightNodeAndLinks(currentlyHighlighted);
                }
            }
        }
    });

    d3.select("#serverInfo").on("mouseover", (event) => {
        if (event.target.closest("#serverInfo-partnerships-list") === null && currentlyHighlighted) {
            g.selectAll(".node").filter(n => n.id === currentlyHighlighted.id)
            .style("stroke", "lightblue").style("stroke-width", 2);
        }
    });

    d3.select("#serverInfo").on("mouseout", (event) => {
        if (event.target.closest("#serverInfo-partnerships-list") === null && currentlyHighlighted) {
            g.selectAll(".node").filter(n => n.id === currentlyHighlighted.id)
            .style("stroke", "white").style("stroke-width", 2);
        }
    });


    d3.select("#serverInfo-partnerships-list").on("click", (event) => {
        const target = event.target;

        if(target.tagName === "LI"){
            const serverName = target.textContent.split(" (")[0].trim();
            const clickedNode = data.nodes.find(node => node.id === serverName);

            if(clickedNode){
                handleNodeClick(event, clickedNode);
            }
        }
    });
    document.addEventListener('click', (event) => {
        if (!searchInput.node().contains(event.target) && !searchResults.node().contains(event.target)) {
            searchResults.style('display', 'none');
            moveLeftPanel(false);
        }
    });
});

function handleResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    // Nie restartujemy timera przy resize, pozwalamy symulacji działać lub być zatrzymaną
    // Ewentualnie można dodać łagodny restart, jeśli jest zatrzymana:
    // if (simulation.alpha() < simulation.alphaMin()) {
    //     simulation.alpha(0.1).restart();
    // }
}

window.addEventListener("resize", handleResize);
