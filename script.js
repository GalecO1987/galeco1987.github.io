const serverTableBody = d3.select("#serverTableBody");
const visibleServerCountSpan = d3.select("#visibleServerCount");
const serverTableHeaders = d3.selectAll("#serverTable th.sortable");

let currentSortKey = 'members';
let currentSortDirection = 'desc';
let currentFilteredNodes = [];

function convertDateFormat(dateString) {
    const [day, monthName, year] = dateString.split(" ");
    const month = [
        "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
        "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
    ].indexOf(monthName) + 1;
    if (month === 0) return dateString; // Return original if month not found
    return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

// Ensure data is loaded before processing
if (typeof data !== 'undefined' && data.nodes) {
    data.nodes.forEach(node => {
        node.creationDate = convertDateFormat(node.creationDate);
        if (node.partnerships && Array.isArray(node.partnerships)) {
            node.partnerships.forEach(partnerId => {
                const partner = data.nodes.find(n => n.id === partnerId);
                if (partner) {
                    // Ensure links array exists
                    if (!data.links) {
                        data.links = [];
                    }
                    data.links.push({ source: node.id, target: partnerId });
                } else {
                    console.warn(`Partner ${partnerId} dla ${node.id} nie został znaleziony.`);
                }
            });
        } else {
            node.partnerships = []; // Ensure partnerships is an array if missing or invalid
        }
    });
    // Ensure links array exists even if no partnerships were found
    if (!data.links) {
        data.links = [];
    }

} else {
    console.error("Dane serwerów (data.nodes) nie zostały załadowane!");
    // Handle error appropriately, maybe display a message to the user
    data = { nodes: [], links: [] }; // Fallback to empty data
}


let minDateObj, maxDateObj;
let dateRange = 0;

// Recalculate date range based on potentially modified data
const validDates = data.nodes
.map(d => d.creationDate.split("-").reverse().join("-"))
.filter(dStr => !isNaN(new Date(dStr))); // Filter out invalid dates

if (validDates.length > 0) {
    minDateObj = new Date(d3.min(validDates));
    maxDateObj = new Date(d3.max(validDates));
    if (minDateObj && maxDateObj && !isNaN(minDateObj) && !isNaN(maxDateObj)) {
        dateRange = (maxDateObj - minDateObj) / (1000 * 60 * 60 * 24);
    } else {
        minDateObj = new Date(); // Fallback
        maxDateObj = new Date(); // Fallback
        dateRange = 0;
        console.warn("Could not determine valid date range.");
    }
} else {
    minDateObj = new Date(); // Fallback
    maxDateObj = new Date(); // Fallback
    dateRange = 0;
    console.warn("No valid creation dates found in data.");
}


const width = window.innerWidth;
const height = window.innerHeight;

// Ensure there are members data before setting domain
const maxMembersValue = d3.max(data.nodes, d => d.members);
const radiusDomain = maxMembersValue > 0 ? [0, maxMembersValue] : [0, 1]; // Prevent domain [0, 0]

const radiusScale = d3.scaleSqrt()
.domain(radiusDomain)
.range([10, 50]); // Min/max radius

const svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);

const g = svg.append("g");

// Initialize simulation only if nodes exist
let simulation;
if (data.nodes.length > 0) {
    simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(d => {
        const sourceNode = typeof d.source === 'object' ? d.source : data.nodes.find(n => n.id === d.source);
        const targetNode = typeof d.target === 'object' ? d.target : data.nodes.find(n => n.id === d.target);
        // Check if nodes and partnerships exist before accessing
        if (sourceNode && targetNode && sourceNode.partnerships && targetNode.partnerships) {
            return sourceNode.partnerships.includes(targetNode.id) ? 30 : 150;
        }
        return 150;
    }).strength(0.1)) // Optional: adjust link strength
    .force("charge", d3.forceManyBody().strength(-1500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => radiusScale(d.members || 0) + 5)) // Use 0 if members is undefined
    .alphaDecay(0.0228) // Default alpha decay
    .alphaMin(0.001); // Default alpha min
} else {
    console.warn("No nodes to simulate.");
    // Create a dummy simulation or handle this case appropriately
    simulation = { nodes: () => simulation, force: () => simulation, alpha: () => simulation, restart: () => {}, on: () => simulation, stop: () => {} }; // Dummy object
}


let freezeTimer;

function drawGraph(nodesToDraw, linksToDraw, initialAlpha = 1, stopDelay = 1000) {
    g.selectAll("*").remove(); // Clear previous elements more reliably

    if (!simulation || nodesToDraw.length === 0) {
        console.log("Skipping graph drawing: No simulation or nodes.");
        return; // Don't draw if no simulation or nodes
    }

    const filteredNodeIds = new Set(nodesToDraw.map(n => n.id));
    const validLinks = linksToDraw.filter(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    simulation.nodes(nodesToDraw);
    simulation.force("link").links(validLinks);

    const link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(validLinks, d => `${d.source.id || d.source}-${d.target.id || d.target}`)
    .join("line") // Use join for enter/update/exit
    .attr("class", "link");

    const node = g.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodesToDraw, d => d.id)
    .join("circle") // Use join
    .attr("class", "node")
    .attr("r", d => radiusScale(d.members || 0))
    .attr("fill", d => getNodeColor(d))
    .on("click", handleNodeClick)
    .on("mouseover", handleNodeMouseOver)
    .on("mouseout", handleNodeMouseOut);

    const label = g.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(nodesToDraw, d => d.id)
    .join("text") // Use join
    .attr("class", "node-label")
    .text(d => d.id);

    simulation.on("tick", () => {
        link
        .filter(d => d.source && d.target) // Ensure source and target are resolved
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

        node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

        label
        .attr("x", d => d.x)
        .attr("y", d => d.y - radiusScale(d.members || 0) - 5); // Adjust label position based on radius
    });

    simulation.alpha(initialAlpha).restart();

    clearTimeout(freezeTimer);

    if (stopDelay > 0) {
        freezeTimer = setTimeout(() => {
            if (simulation) simulation.stop(); // Check if simulation exists
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


function resetMap() {
    svg.transition().duration(750).call(zoom_handler.transform, initialTransform); // Animate zoom reset
    initializeFilters();

    if (currentlyHighlighted) {
        resetHighlight();
        currentlyHighlighted = null;
        toggleLeftPanelAndServerInfo(false);
    }

    searchInput.property("value", "");
    // No searchResults div to hide anymore

    currentSortKey = 'members';
    currentSortDirection = 'desc';

    calculateRanks(data.nodes);
    currentFilteredNodes = [...data.nodes];
    updateServerTable(currentFilteredNodes);

    // Reset node positions for full restart effect
    data.nodes.forEach(node => {
        node.x = undefined;
        node.y = undefined;
        node.vx = undefined;
        node.vy = undefined;
    });

    drawGraph(data.nodes, data.links, 1, 1000);
}


d3.select("#resetButton").on("click", resetMap);

function getNodeColor(node) {
    const boostScale = d3.scaleLinear()
    .domain([0, 10, 20, 30]) // Consider adjusting domain based on actual boost max/distribution
    .range(["#f0f0f0", "#ffeb3b", "#ff9800", "#ff0000"])
    .clamp(true); // Clamp to prevent colors outside the range
    return boostScale(node.boosts || 0); // Default to 0 if boosts undefined
}

let currentlyHighlighted = null;
let blinkingNode = null;
let hoveredTableRowNodeId = null; // Track node ID hovered in table


function toggleLeftPanelAndServerInfo(showServerInfo) {
    const serverInfo = d3.select("#serverInfo");
    if (showServerInfo) {
        serverInfo.style("display", "block");
    } else {
        serverInfo.style("display", "none");
    }
}

function handleNodeClick(event, d) {
    const serverInfo = d3.select("#serverInfo");
    const clickedNodeData = data.nodes.find(n => n.id === d.id); // Get full data
    if (!clickedNodeData) return;

    if (currentlyHighlighted === clickedNodeData) {
        serverInfo.style("display", "none");
        resetHighlight(); // Reset highlight includes stopping blink
        currentlyHighlighted = null;
        toggleLeftPanelAndServerInfo(false);
        return;
    }

    if (currentlyHighlighted) {
        resetHighlight(); // Reset previous highlight
    }

    currentlyHighlighted = clickedNodeData; // Store the data object
    serverInfo.style("display", "block");
    toggleLeftPanelAndServerInfo(true);

    const partnershipsData = clickedNodeData.partnerships
    .map(partnerId => data.nodes.find(n => n.id === partnerId))
    .filter(partner => partner) // Ensure partner exists
    .sort((a, b) => (b.members || 0) - (a.members || 0)); // Sort by members safely

    const serverColor = getNodeColor(clickedNodeData);
    d3.select("#serverInfo-name").style("color", serverColor).text(clickedNodeData.id);

    const serverInfoMembers = d3.select("#serverInfo-members");
    serverInfoMembers.selectAll("*").remove();
    serverInfoMembers.append("div").text(`Data założenia: ${clickedNodeData.creationDate}`);

    calculateRanks(data.nodes); // Use global ranks for display
    serverInfoMembers.append("div").text(`Członkowie: ${clickedNodeData.members || 0} (miejsce #${clickedNodeData.memberRank || '?'})`);
    d3.select("#serverInfo-boosts").text(`Boosty: ${clickedNodeData.boosts || 0} (miejsce #${clickedNodeData.boostRank || '?'})`);
    d3.select("#serverInfo-partnerships-count").text(`Liczba partnerstw: ${partnershipsData.length} (miejsce #${clickedNodeData.partnershipRank || '?'})`);
    calculateRanks(currentFilteredNodes); // Recalculate ranks for current view (for table)

    let partnershipsHtml = "";
    partnershipsData.forEach(partner => {
        const partnerColor = getNodeColor(partner);
        partnershipsHtml += `<li style="color: ${partnerColor}; cursor: pointer;" data-partner-id="${partner.id}">
        ${partner.id} (Członkowie: ${partner.members || 0}, Boosty: ${partner.boosts || 0})
        </li>`;
    });
    d3.select("#serverInfo-partnerships-list").html(partnershipsHtml);

    highlightNodeAndLinks(clickedNodeData); // Highlight using the stored data

    // Center map on the node (use position from the node passed in 'd', which is from the simulation)
    const scale = 0.6;
    const targetX = d.x || width / 2;
    const targetY = d.y || height / 2;
    const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-targetX, -targetY);

    svg.transition().duration(750).call(zoom_handler.transform, transform);
    startBlinking(clickedNodeData); // Start blinking using stored data
}

function searchServer(serverId) {
    // Find node data from the main dataset
    const serverNodeData = data.nodes.find(n => n.id === serverId);
    if (!serverNodeData) {
        console.error("Nie znaleziono serwera o ID: " + serverId);
        return;
    }

    // Find the corresponding node currently in the simulation (if it exists)
    const serverNodeOnMap = currentFilteredNodes.find(n => n.id === serverId);

    if (!serverNodeOnMap) {
        console.warn("Wyszukany serwer jest ukryty przez aktywne filtry.");
        // Optionally center the view where it might be, but don't select it
        const scale = 0.75;
        const targetX = serverNodeData.x || width / 2; // Use last known or center
        const targetY = serverNodeData.y || height / 2;
        const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-targetX, -targetY);
        svg.transition().duration(750).call(zoom_handler.transform, transform);
        return;
    }

    // If found on map, center and click it
    const scale = 0.75;
    const targetX = serverNodeOnMap.x || width / 2;
    const targetY = serverNodeOnMap.y || height / 2;
    const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-targetX, -targetY);

    svg.transition().duration(750).call(zoom_handler.transform, transform);
    handleNodeClick(null, serverNodeOnMap); // Pass the node from the simulation
}

function highlightNodeAndLinks(d) { // d is the node data object
    const connectedNodeIds = new Set();
    connectedNodeIds.add(d.id);

    data.links.forEach(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        if (sourceId === d.id) connectedNodeIds.add(targetId);
        if (targetId === d.id) connectedNodeIds.add(sourceId);
    });

        // Apply styles only to nodes currently rendered
        g.selectAll(".node")
        .classed("dimmed", n => !connectedNodeIds.has(n.id))
        .style("stroke", n => n.id === d.id ? "white" : (connectedNodeIds.has(n.id) ? "lightblue" : "none"))
        .style("stroke-width", n => connectedNodeIds.has(n.id) ? 2 : 0);

        g.selectAll(".link")
        .classed("hidden", l => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            return !(connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId));
        })
        .classed("hovered", false); // Remove general hover from links

        g.selectAll(".node-label")
        .classed("hidden", label => !connectedNodeIds.has(label.id));
}

function highlightHovered(d, isHovering) { // Function for hover effect only
    if (!d) return;
    const nodeElement = g.selectAll(".node").filter(node => node.id === d.id);
    const connectedLinks = g.selectAll(".link").filter(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        return sourceId === d.id || targetId === d.id;
    });

    if (isHovering) {
        nodeElement.classed("table-hovered", true); // Use CSS class for hover
        connectedLinks.classed("hovered", true);
    } else {
        nodeElement.classed("table-hovered", false);
        // Only remove link hover if not part of the main highlight
        if (!currentlyHighlighted || (l => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            return !(currentlyHighlighted.partnerships.includes(targetId) && sourceId === currentlyHighlighted.id ||
            currentlyHighlighted.partnerships.includes(sourceId) && targetId === currentlyHighlighted.id)
        })) { // Basic check if link is part of highlight
            connectedLinks.classed("hovered", false);
        }
        // If an item is currently selected, reapply its highlight state
        if(currentlyHighlighted){
            highlightNodeAndLinks(currentlyHighlighted);
        }

    }
}


function resetHighlight() {
    g.selectAll(".node")
    .classed("dimmed", false)
    .classed("table-hovered", false) // Remove table hover class
    .style("stroke", "none")
    .style("stroke-width", 0);

    g.selectAll(".link")
    .classed("hidden", false)
    .classed("hovered", false); // Remove link hover class

    g.selectAll(".node-label")
    .classed("hidden", false);

    stopBlinking();
}

function startBlinking(nodeData) {
    stopBlinking(); // Stop any previous blinking
    blinkingNode = nodeData;
    blink();

    function blink() {
        if (!blinkingNode || blinkingNode.id !== nodeData.id) return; // Stop if node changed or cleared

        const node = g.selectAll(".node").filter(d => d.id === nodeData.id);
        if (!node.empty()) {
            const originalRadius = radiusScale(nodeData.members || 0);
            node.transition("blinking") // Named transition
            .duration(500)
            .attr("r", originalRadius * 0.7)
            .transition("blinking") // Chain the next part
            .duration(500)
            .attr("r", originalRadius)
            .on("end", blink); // Loop
        } else {
            blinkingNode = null; // Node disappeared
        }
    }
}

function stopBlinking() {
    if (blinkingNode) {
        const node = g.selectAll(".node").filter(d => d.id === blinkingNode.id);
        if (!node.empty()) {
            node.interrupt("blinking") // Interrupt the named transition
            .transition("stopBlinking") // Optional short transition back
            .duration(100)
            .attr("r", radiusScale(blinkingNode.members || 0));
        }
        blinkingNode = null;
    }
}


svg.on("click", (event) => {
    const clickedOnNode = event.target.closest('.node');
    const clickedOnServerInfo = event.target.closest('#serverInfo');
    const clickedOnLeftPanel = event.target.closest('#leftPanel');

    if (!clickedOnNode && !clickedOnServerInfo && !clickedOnLeftPanel) {
        if (currentlyHighlighted) {
            d3.select("#serverInfo").style("display", "none");
            resetHighlight();
            currentlyHighlighted = null;
            toggleLeftPanelAndServerInfo(false);
        }
    }
});



function handleNodeMouseOver(event, d) {
    // Show tooltip only if hovering the circle itself
    if (event && event.target.tagName === 'circle') {
        const tooltip = d3.select(".tooltip");
        const fullDataNode = data.nodes.find(n => n.id === d.id);
        calculateRanks(data.nodes); // Use global ranks
        tooltip.style("display", "block")
        .html(`
        <strong>${d.id}</strong><br>
        Data założenia: ${d.creationDate}<br>
        Członkowie: ${d.members || 0} (miejsce #${fullDataNode?.memberRank || '?'})<br>
        Boosty: ${d.boosts || 0} (miejsce #${fullDataNode?.boostRank || '?'})<br>
        Partnerstwa: ${(fullDataNode?.partnerships || []).length} (miejsce #${fullDataNode?.partnershipRank || '?'})
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
        calculateRanks(currentFilteredNodes); // Restore filtered ranks
    }

    // Apply hover effect only if nothing is selected OR hovering the selected item
    if (!currentlyHighlighted || currentlyHighlighted.id === d.id) {
        highlightHovered(d, true);
    }
    // Highlight corresponding table row if hovering over map node
    d3.selectAll("#serverTableBody tr").classed("table-row-hovered", rowData => rowData && rowData.id === d.id);
}

function handleNodeMouseOut(event, d) {
    d3.select(".tooltip").style("display", "none");

    // Remove hover effect if nothing is selected OR leaving the selected item
    if (!currentlyHighlighted || currentlyHighlighted.id === d.id) {
        highlightHovered(d, false);
    } else if (currentlyHighlighted) {
        // If leaving a different node while something else is selected,
        // simply re-apply the highlight for the selected node.
        highlightNodeAndLinks(currentlyHighlighted);
    }
    // Remove table row highlight
    d3.selectAll("#serverTableBody tr").classed("table-row-hovered", false);
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
    try {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.error("Error formatting date:", dateObj, e);
        return "-";
    }
}

function updateRangeSliderVisual(minInput, maxInput) {
    if (!minInput.node() || !maxInput.node()) return; // Exit if inputs don't exist
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
    const minPercent = range === 0 ? 0 : Math.max(0, Math.min(100, ((minVal - minAttr) / range) * 100));
    const maxPercent = range === 0 ? 100 : Math.max(0, Math.min(100, ((maxVal - minAttr) / range) * 100));


    fill.style.left = `${minPercent}%`;
    fill.style.width = `${maxPercent - minPercent}%`;
}

function initializeFilters() {
    // Date Filter
    const dateMaxVal = Math.round(dateRange >= 0 ? dateRange : 0); // Ensure non-negative
    dateFilterMin.attr("min", 0).attr("max", dateMaxVal).property("value", 0);
    dateFilterMax.attr("min", 0).attr("max", dateMaxVal).property("value", dateMaxVal);
    const initialMinDateStr = formatDate(minDateObj);
    const initialMaxDateStr = formatDate(maxDateObj);
    dateValue.select(".min-value").text(`min: ${initialMinDateStr}`);
    dateValue.select(".max-value").text(`max: ${initialMaxDateStr}`);
    updateRangeSliderVisual(dateFilterMin, dateFilterMax);
    dateFilterMin.on("input", handleDateFilterInput);
    dateFilterMax.on("input", handleDateFilterInput);

    // Member Filter
    const maxMembers = d3.max(data.nodes, d => d.members) || 0;
    memberFilterMin.attr("min", 0).attr("max", maxMembers).property("value", 0);
    memberFilterMax.attr("min", 0).attr("max", maxMembers).property("value", maxMembers);
    memberValue.select(".min-value").text(`min: 0`);
    memberValue.select(".max-value").text(`max: ${maxMembers}`);
    updateRangeSliderVisual(memberFilterMin, memberFilterMax);
    memberFilterMin.on("input", handleGenericFilterInput);
    memberFilterMax.on("input", handleGenericFilterInput);

    // Boost Filter
    const maxBoosts = d3.max(data.nodes, d => d.boosts) || 0;
    boostFilterMin.attr("min", 0).attr("max", maxBoosts).property("value", 0);
    boostFilterMax.attr("min", 0).attr("max", maxBoosts).property("value", maxBoosts);
    boostValue.select(".min-value").text(`min: 0`);
    boostValue.select(".max-value").text(`max: ${maxBoosts}`);
    updateRangeSliderVisual(boostFilterMin, boostFilterMax);
    boostFilterMin.on("input", handleGenericFilterInput);
    boostFilterMax.on("input", handleGenericFilterInput);

    // Partnership Filter
    const maxPartnerships = d3.max(data.nodes, d => (d.partnerships || []).length) || 0;
    partnershipFilterMin.attr("min", 0).attr("max", maxPartnerships).property("value", 0);
    partnershipFilterMax.attr("min", 0).attr("max", maxPartnerships).property("value", maxPartnerships);
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
        minVal = Math.min(minVal, +maxInput.property("value"));
        minInput.property("value", minVal);
    } else {
        maxVal = Math.max(maxVal, +minInput.property("value"));
        maxInput.property("value", maxVal);
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
        minDays = Math.min(minDays, +maxInput.property("value"));
        minInput.property("value", minDays);
    } else {
        maxDays = Math.max(maxDays, +minInput.property("value"));
        maxInput.property("value", maxDays);
    }

    const baseMinDate = new Date(minDateObj || Date.now()); // Use fallback if minDateObj is invalid
    const selectedMinDateObj = new Date(baseMinDate);
    selectedMinDateObj.setDate(baseMinDate.getDate() + minDays);
    selectedMinDateObj.setHours(0, 0, 0, 0);

    const selectedMaxDateObj = new Date(baseMinDate);
    selectedMaxDateObj.setDate(baseMinDate.getDate() + maxDays);
    selectedMaxDateObj.setHours(23, 59, 59, 999);

    dateValue.select(".min-value").text(`min: ${formatDate(selectedMinDateObj)}`);
    dateValue.select(".max-value").text(`max: ${formatDate(selectedMaxDateObj)}`);
    updateRangeSliderVisual(minInput, maxInput);
    updateFilters();
}


function updateFilters() {
    const currentFilterValues = getAppliedFilters();

    const filtered = data.nodes.filter(d => {
        let nodeDateObj;
        try {
            // Ensure the date format is DD-MM-YYYY before splitting
            const parts = d.creationDate.split('-');
            if (parts.length === 3) {
                nodeDateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // YYYY-MM-DD
            } else {
                throw new Error("Invalid date format");
            }
            if (isNaN(nodeDateObj)) throw new Error("Invalid date object");
            nodeDateObj.setHours(0, 0, 0, 0);
        } catch (e) {
            console.warn(`Invalid date format for node ${d.id}: ${d.creationDate}`, e);
            return false; // Exclude nodes with invalid dates
        }


        const minDateCompare = new Date(currentFilterValues.minDate); minDateCompare.setHours(0,0,0,0);
        const maxDateCompare = new Date(currentFilterValues.maxDate); maxDateCompare.setHours(23,59,59,999); // Use end of day for max date comparison


        return (
            nodeDateObj >= minDateCompare && nodeDateObj <= maxDateCompare &&
            (d.members || 0) >= currentFilterValues.minMembers && (d.members || 0) <= currentFilterValues.maxMembers &&
            (d.boosts || 0) >= currentFilterValues.minBoosts && (d.boosts || 0) <= currentFilterValues.maxBoosts &&
            (d.partnerships || []).length >= currentFilterValues.minPartnerships && (d.partnerships || []).length <= currentFilterValues.maxPartnerships
        );
    });

    currentFilteredNodes = [...filtered]; // Update the cache

    const filteredNodeIds = new Set(currentFilteredNodes.map(d => d.id));
    const filteredLinks = data.links.filter(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    calculateRanks(currentFilteredNodes);
    updateServerTable(currentFilteredNodes); // Update table with currently sorted filtered data

    // Redraw graph with filtered nodes/links
    drawGraph(currentFilteredNodes, filteredLinks, 0.1, 500);

    // Check if highlighted node is still visible
    if (currentlyHighlighted && !filteredNodeIds.has(currentlyHighlighted.id)) {
        d3.select("#serverInfo").style("display", "none");
        resetHighlight(); // Full reset needed if node disappears
        currentlyHighlighted = null;
        toggleLeftPanelAndServerInfo(false);
    } else if (currentlyHighlighted) {
        // Re-apply highlight to the node (using potentially updated data/position)
        const stillVisibleNode = currentFilteredNodes.find(n => n.id === currentlyHighlighted.id);
        if(stillVisibleNode) {
            highlightNodeAndLinks(currentlyHighlighted); // Highlight based on stored data
            // Ensure blinking continues if it was active
            if(blinkingNode && blinkingNode.id === currentlyHighlighted.id){
                startBlinking(currentlyHighlighted);
            }
        } else {
            // Should not happen due to the outer if, but safety check
            d3.select("#serverInfo").style("display", "none");
            resetHighlight();
            currentlyHighlighted = null;
            toggleLeftPanelAndServerInfo(false);
        }
    }
}

const searchInput = d3.select("#searchInput");
// const searchResults = d3.select("#searchResults"); // No longer needed

// Removed moveLeftPanel function

searchInput.on("input", () => {
    const searchTerm = searchInput.property("value").toLowerCase();
    const currentFilters = getAppliedFilters();

    // Filter nodes based on BOTH current filters AND search term
    const filteredAndSearchedNodes = data.nodes.filter(node => {
        let nodeDateObj;
        try {
            const parts = node.creationDate.split('-');
            if (parts.length === 3) {
                nodeDateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else { throw new Error("Invalid date format"); }
            if (isNaN(nodeDateObj)) throw new Error("Invalid date object");
            nodeDateObj.setHours(0, 0, 0, 0);
        } catch (e) { return false; } // Exclude if date is invalid

        const minDateCompare = new Date(currentFilters.minDate); minDateCompare.setHours(0,0,0,0);
        const maxDateCompare = new Date(currentFilters.maxDate); maxDateCompare.setHours(23,59,59,999);

        const matchesSearch = node.id.toLowerCase().includes(searchTerm);
        const matchesFilters = (
            nodeDateObj >= minDateCompare && nodeDateObj <= maxDateCompare &&
            (node.members || 0) >= currentFilters.minMembers && (node.members || 0) <= currentFilters.maxMembers &&
            (node.boosts || 0) >= currentFilters.minBoosts && (node.boosts || 0) <= currentFilters.maxBoosts &&
            (node.partnerships || []).length >= currentFilters.minPartnerships && (node.partnerships || []).length <= currentFilters.maxPartnerships
        );

        return matchesSearch && matchesFilters;
    });

    currentFilteredNodes = [...filteredAndSearchedNodes]; // Update the cache
    calculateRanks(currentFilteredNodes);
    updateServerTable(currentFilteredNodes); // Update the table with the filtered results

    // No suggestion dropdown logic needed anymore
});

function getAppliedFilters() {
    // Ensure minDateObj and maxDateObj are valid before proceeding
    const baseMinDate = (minDateObj instanceof Date && !isNaN(minDateObj)) ? minDateObj : new Date();
    const baseMaxDate = (maxDateObj instanceof Date && !isNaN(maxDateObj)) ? maxDateObj : new Date();
    const currentMinDays = dateFilterMin.property("value");
    const currentMaxDays = dateFilterMax.property("value");


    const selectedMinDate = new Date(baseMinDate);
    selectedMinDate.setDate(baseMinDate.getDate() + Number(currentMinDays));


    const selectedMaxDate = new Date(baseMinDate); // Start from min date base
    selectedMaxDate.setDate(baseMinDate.getDate() + Number(currentMaxDays));


    return {
        minDate: selectedMinDate,
        maxDate: selectedMaxDate,
        minMembers: +memberFilterMin.property("value"),
        maxMembers: +memberFilterMax.property("value"),
        minBoosts: +boostFilterMin.property("value"),
        maxBoosts: +boostFilterMax.property("value"),
        minPartnerships: +partnershipFilterMin.property("value"),
        maxPartnerships: +partnershipFilterMax.property("value")
    };
}


function calculateRanks(nodes) {
    if (!nodes || nodes.length === 0) return; // Do nothing if no nodes

    const nodesToSort = [...nodes]; // Create a mutable copy

    // --- Calculate Ranks ---
    const sortByMembers = [...nodesToSort].sort((a, b) => (b.members || 0) - (a.members || 0));
    sortByMembers.forEach((node, index) => node.memberRank = index + 1);

    const sortByBoosts = [...nodesToSort].sort((a, b) => (b.boosts || 0) - (a.boosts || 0));
    sortByBoosts.forEach((node, index) => node.boostRank = index + 1);

    const sortByPartnerships = [...nodesToSort].sort((a, b) => (b.partnerships || []).length - (a.partnerships || []).length);
    sortByPartnerships.forEach((node, index) => node.partnershipRank = index + 1);

    const sortByCreationDate = [...nodesToSort].sort((a, b) => {
        let dateA, dateB;
        try { dateA = new Date(a.creationDate.split("-").reverse().join("-")); } catch { dateA = new Date(0); } // Fallback date
        try { dateB = new Date(b.creationDate.split("-").reverse().join("-")); } catch { dateB = new Date(0); }
        if (isNaN(dateA)) dateA = new Date(0);
        if (isNaN(dateB)) dateB = new Date(0);
        return dateA - dateB; // Ascending date sort
    });
    sortByCreationDate.forEach((node, index) => node.creationDateRank = index + 1);
}


function updateServerTable(nodesToDisplay) {
    const sortedNodes = [...nodesToDisplay];

    // Sort based on current key and direction
    sortedNodes.sort((a, b) => {
        let valA, valB;
        switch (currentSortKey) {
            case 'id':
                valA = a.id.toLowerCase();
                valB = b.id.toLowerCase();
                break;
            case 'members':
                valA = a.members || 0;
                valB = b.members || 0;
                break;
            case 'boosts':
                valA = a.boosts || 0;
                valB = b.boosts || 0;
                break;
            case 'partnerships':
                valA = (a.partnerships || []).length;
                valB = (b.partnerships || []).length;
                break;
            default: return 0;
        }

        if (currentSortDirection === 'asc') {
            return typeof valA === 'string' ? valA.localeCompare(valB) : valA - valB;
        } else {
            return typeof valA === 'string' ? valB.localeCompare(valA) : valB - valA;
        }
    });

    serverTableBody.html(""); // Clear existing rows
    visibleServerCountSpan.text(sortedNodes.length); // Update count

    // Update sort indicators in headers
    serverTableHeaders.each(function() {
        const header = d3.select(this);
        const sortKey = header.attr('data-sort-by');
        const arrowSpan = header.select('.sort-arrow');
        if (sortKey === currentSortKey) {
            header.classed('sorted', true);
            arrowSpan.text(currentSortDirection === 'asc' ? '▲' : '▼');
        } else {
            header.classed('sorted', false);
            arrowSpan.text('');
        }
    });

    // Add new rows
    sortedNodes.forEach(node => {
        const row = serverTableBody.append("tr")
        .datum(node); // Attach node data to the row element

        row.append("td").text(node.id).attr("title", node.id);
        row.append("td").text(node.members || 0);
        row.append("td").text(node.boosts || 0);
        row.append("td").text((node.partnerships || []).length);

        // Row click handler
        row.on("click", (event, d) => { // Use d passed by d3 which is the datum
            const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id);
            if (nodeOnMap) {
                handleNodeClick(event, nodeOnMap); // Use the node object from the simulation if available
            } else {
                searchServer(d.id); // Otherwise, use searchServer which handles non-visible nodes
            }
            // No search results div to hide
        });

        // Row hover handlers for map interaction
        row.on("mouseover", (event, d) => {
            hoveredTableRowNodeId = d.id; // Store hovered ID
            const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id);
            if (nodeOnMap) {
                highlightHovered(nodeOnMap, true); // Highlight node on map
            }
            row.classed("table-row-hovered", true); // Add visual hover to row
        });

        row.on("mouseout", (event, d) => {
            hoveredTableRowNodeId = null; // Clear hovered ID
            const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id);
            if (nodeOnMap) {
                // Only remove hover if not currently highlighted
                if (!currentlyHighlighted || currentlyHighlighted.id !== d.id) {
                    highlightHovered(nodeOnMap, false); // Remove highlight from map
                }
            }
            row.classed("table-row-hovered", false); // Remove visual hover from row
            // Reapply main highlight if exists
            if(currentlyHighlighted) {
                highlightNodeAndLinks(currentlyHighlighted);
            }
        });
    });
}


function handleSortClick(event) {
    const header = d3.select(this);
    const sortKey = header.attr('data-sort-by');
    if (!sortKey) return;

    if (sortKey === currentSortKey) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortKey = sortKey;
        currentSortDirection = 'desc'; // Default to descending for new column
    }
    updateServerTable(currentFilteredNodes); // Re-render table with new sort order
}


document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const understandButton = document.getElementById('understandButton');

    if (overlay && understandButton) {
        overlay.classList.add('visible');
        understandButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        });
    } else {
        console.warn("Overlay or understandButton not found.");
    }

    const serverCountSpan = document.querySelector("#serverCount");
    if(serverCountSpan) serverCountSpan.textContent = data.nodes.length;

    initializeFilters(); // Initialize filters first
    calculateRanks(data.nodes); // Calculate initial global ranks
    currentFilteredNodes = [...data.nodes]; // Set initial filtered nodes
    updateServerTable(currentFilteredNodes); // Populate table with initial data/sort

    // Draw the initial graph only if nodes exist
    if (data.nodes.length > 0) {
        drawGraph(data.nodes, data.links, 1, 1000);
    } else {
        console.warn("Initial graph not drawn because there are no nodes.");
    }


    serverTableHeaders.on("click", handleSortClick);

    d3.select("#closeServerInfo").on("click", () => {
        d3.select("#serverInfo").style("display", "none");
        if (currentlyHighlighted) {
            resetHighlight();
            currentlyHighlighted = null;
        }
        toggleLeftPanelAndServerInfo(false);
    });

    d3.select("#serverInfo-partnerships-list").on("click", (event) => {
        const target = event.target.closest('li');
        if (target) {
            const partnerId = target.dataset.partnerId;
            if (partnerId) {
                searchServer(partnerId); // Use searchServer for consistent handling
            }
        }
    });


    d3.select("#serverInfo-partnerships-list")
    .on("mouseover", (event) => {
        const target = event.target.closest('li');
        if (target) {
            const partnerId = target.dataset.partnerId;
            const partnerNode = currentFilteredNodes.find(node => node.id === partnerId);
            if (partnerNode) {
                highlightHovered(partnerNode, true); // Use hover function
                d3.select(target).style("font-weight", "bold");
            }
        }
    })
    .on("mouseout", (event) => {
        const target = event.target.closest('li');
        if (target) {
            const partnerId = target.dataset.partnerId;
            const partnerNode = currentFilteredNodes.find(node => node.id === partnerId);
            if (partnerNode) {
                // Only remove hover if not currently highlighted
                if (!currentlyHighlighted || currentlyHighlighted.id !== partnerId) {
                    highlightHovered(partnerNode, false); // Use hover function
                }
                d3.select(target).style("font-weight", "normal");
                // Re-apply main highlight if necessary
                if(currentlyHighlighted) {
                    highlightNodeAndLinks(currentlyHighlighted);
                }
            }
        }
    });

    // Click outside search input no longer needed for dropdown
    // document.addEventListener('click', (event) => {
    //     // ... (removed logic for hiding search results)
    // });
});

function handleResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);

    if (simulation && simulation.force("center")) {
        simulation.force("center").x(newWidth / 2).y(newHeight / 2);
        simulation.alpha(0.1).restart(); // Gently restart simulation on resize
    }
}

let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250);
});
