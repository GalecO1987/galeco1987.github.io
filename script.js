// === GLOBALNE ZMIENNE I KONFIGURACJA ===
const serverTableBody = d3.select("#serverTableBody");
const visibleServerCountSpan = d3.select("#visibleServerCount");
const serverTableHeaders = d3.selectAll("#serverTable th.sortable");
const dataVersionSelector = d3.select("#dataVersionSelector");
const dataVersionSelectorMobile = d3.select("#dataVersionSelectorMobile");
const loadedDataDateSpan = d3.select("#loadedDataDate");
const serverCountSpan = d3.select("#serverCount");
const searchInput = d3.select("#searchInput");
const tooltip = d3.select(".tooltip");
const svg = d3.select("body").append("svg");
const g = svg.append("g");
const serverInfoPanel = d3.select("#serverInfo");

let currentSortKey = 'members';
let currentSortDirection = 'desc';
let currentFilteredNodes = [];
let currentDataSet = { nodes: [], links: [] };
let minDateObj, maxDateObj;
let dateRange = 0;
let simulation;
let zoom_handler;
let initialTransform;
let currentlyHighlighted = null;
let blinkingNode = null;
let hoveredTableRowNodeId = null;
let freezeTimer;
let resizeTimer;
let radiusScale;

const availableDataVersions = [
    { date: "2025-05-01", file: "data/data-2025-05-01.js", label: "1 maja 2025" },
    { date: "2025-04-01", file: "data/data-2025-04-01.js", label: "1 kwietnia 2025" }
];

// === FUNKCJE POMOCNICZE ===

function convertDateFormat(dateString) {
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        return dateString;
    }
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }
    if (typeof dateString !== 'string' || !dateString.includes(" ")) {
        return dateString;
    }
    const parts = dateString.split(" ");
    if (parts.length !== 3) return dateString;
    const [day, monthName, year] = parts;
    const month = [
        "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
        "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
    ].indexOf(monthName.toLowerCase()) + 1;
    if (month === 0) return dateString;
    const numericDay = !isNaN(parseInt(day)) ? parseInt(day) : 0;
    const numericYear = !isNaN(parseInt(year)) ? parseInt(year) : 0;
    if (numericDay === 0 || numericYear === 0) return dateString;
    return `${String(numericDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${numericYear}`;
}

function formatDate(dateObj) {
    if (!dateObj || isNaN(dateObj)) return "-";
    try {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        if (year < 1970 || year > 2100) return "-";
        return `${day}-${month}-${year}`;
    } catch (e) {
        return "-";
    }
}

function getNodeColor(node) {
    const boostScale = d3.scaleLinear()
    .domain([0, 10, 20, 30])
    .range(["#f0f0f0", "#ffeb3b", "#ff9800", "#ff0000"])
    .clamp(true);
    return boostScale(node.boosts || 0);
}

// === LOGIKA ŁADOWANIA DANYCH ===

function loadDataVersion(versionInfo) {
    console.log(`Ładowanie danych z: ${versionInfo.file}`);
    loadedDataDateSpan.text("Ładowanie...");
    serverCountSpan.text("...");
    serverTableBody.html("<tr><td colspan='4'>Ładowanie danych...</td></tr>");
    if (simulation) simulation.stop();
    g.selectAll("*").remove();

    const oldScript = document.getElementById('dynamicDataScript');
    if (oldScript) oldScript.remove();
    delete window.loadedDataSet;

    const script = document.createElement('script');
    script.id = 'dynamicDataScript';
    script.src = versionInfo.file;
    script.async = true;

    script.onload = () => {
        console.log(`Pomyślnie załadowano: ${versionInfo.file}`);
        if (window.loadedDataSet) {
            initializeVisualization(window.loadedDataSet, versionInfo);
            delete window.loadedDataSet;
            script.remove();
        } else {
            console.error("Błąd: Plik danych załadowany, ale obiekt window.loadedDataSet nie został znaleziony.");
            loadedDataDateSpan.text("Błąd ładowania!");
        }
    };
    script.onerror = (error) => {
        console.error(`Błąd ładowania skryptu: ${versionInfo.file}`, error);
        loadedDataDateSpan.text("Błąd ładowania!");
    };
    document.body.appendChild(script);
}

function populateDataVersionSelector(selectedVersionFile) {
    const options = availableDataVersions.map(v =>
    `<option value="${v.file}" ${v.file === selectedVersionFile ? 'selected' : ''}>${v.label}</option>`
    ).join('');
    dataVersionSelector.html(options);
    dataVersionSelectorMobile.html(options);
}

function handleDataVersionChange() {
    const selectedFile = d3.select(this).property("value");
    const selectedVersion = availableDataVersions.find(v => v.file === selectedFile);
    if (selectedVersion) {
        if (this.id === 'dataVersionSelector') {
            dataVersionSelectorMobile.property('value', selectedFile);
        } else {
            dataVersionSelector.property('value', selectedFile);
        }
        loadDataVersion(selectedVersion);
    }
}

// === GŁÓWNA FUNKCJA INICJALIZACYJNA ===

function initializeVisualization(dataSet, versionInfo) {
    console.log("Inicjalizacja wizualizacji dla:", versionInfo.label);
    currentDataSet = dataSet;

    if (!currentDataSet.nodes) currentDataSet.nodes = [];
    if (!currentDataSet.links) currentDataSet.links = [];
    currentDataSet.links = [];

    currentDataSet.nodes.forEach(node => {
        if (node.creationDate) { node.creationDate = convertDateFormat(node.creationDate); }
        else { node.creationDate = "??-??-????"; }
        node.members = Number(node.members) || 0;
        node.boosts = Number(node.boosts) || 0;
        if (!node.partnerships || !Array.isArray(node.partnerships)) { node.partnerships = []; }
        node.partnerships.forEach(partnerId => {
            const partner = currentDataSet.nodes.find(n => n.id === partnerId);
            if (partner) {
                const linkExists = currentDataSet.links.some(l =>
                (l.source === node.id && l.target === partnerId) || (l.source === partnerId && l.target === node.id) ||
                (l.source.id === node.id && l.target.id === partnerId) || (l.source.id === partnerId && l.target.id === node.id)
                );
                if (!linkExists) { currentDataSet.links.push({ source: node.id, target: partnerId }); }
            }
        });
    });
    console.log(`Przetworzono ${currentDataSet.nodes.length} węzłów i ${currentDataSet.links.length} linków.`);

    calculateFilterRanges();
    initializeFilters(); // To również podpina listenery do suwaków
    calculateRanks(currentDataSet.nodes);

    currentFilteredNodes = [...currentDataSet.nodes];
    currentlyHighlighted = null;
    blinkingNode = null;
    hoveredTableRowNodeId = null;
    serverInfoPanel.style("display", "none");
    searchInput.property("value", "");
    currentSortKey = 'members';
    currentSortDirection = 'desc';

    updateServerTable(currentFilteredNodes);
    loadedDataDateSpan.text(versionInfo.label);
    serverCountSpan.text(currentDataSet.nodes.length);

    setupSVGAndView();
    setupSimulation();

    currentDataSet.nodes.forEach(node => {
        node.x = undefined; node.y = undefined;
        node.vx = undefined; node.vy = undefined;
        node.fx = null; node.fy = null;
    });
    drawGraph(currentDataSet.nodes, currentDataSet.links, 1, 1500);

    populateDataVersionSelector(versionInfo.file);
}


// === FUNKCJE D3 I WIZUALIZACJI ===

function calculateFilterRanges() {
    const validDates = currentDataSet.nodes
    .map(d => {
        if (typeof d.creationDate !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(d.creationDate)) return null;
        const parts = d.creationDate.split("-"); const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const dateObj = new Date(dateStr); return !isNaN(dateObj.getTime()) ? dateObj : null;
    })
    .filter(dStr => dStr !== null);
    if (validDates.length > 0) {
        minDateObj = new Date(d3.min(validDates)); maxDateObj = new Date(d3.max(validDates));
        if (!(minDateObj instanceof Date) || isNaN(minDateObj)) minDateObj = new Date();
        if (!(maxDateObj instanceof Date) || isNaN(maxDateObj)) maxDateObj = new Date();
        if (minDateObj > maxDateObj) [minDateObj, maxDateObj] = [maxDateObj, minDateObj];
        dateRange = (maxDateObj - minDateObj) / (1000 * 60 * 60 * 24);
        if (isNaN(dateRange) || dateRange < 0) dateRange = 0;
    } else { minDateObj = new Date(); maxDateObj = new Date(); dateRange = 0; }
}

function setupSVGAndView() {
    const width = window.innerWidth; const height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    const maxMembersValue = d3.max(currentDataSet.nodes, d => d.members);
    const radiusDomain = maxMembersValue > 0 ? [0, maxMembersValue] : [0, 1];
    radiusScale = d3.scaleSqrt().domain(radiusDomain).range([10, 50]);
    initialZoom = 0.09;
    initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(initialZoom).translate(-width / 2, -height / 2);
    zoom_handler = d3.zoom().scaleExtent([0.1, 8]).on("zoom", (event) => { g.attr("transform", event.transform); });
    svg.call(zoom_handler).call(zoom_handler.transform, initialTransform);
    svg.on("click", (event) => {
        const clickedOnNode = event.target.closest('.node');
        const clickedOnServerInfo = event.target.closest('#serverInfo');
        const clickedOnLeftPanel = event.target.closest('#leftPanel');
        if (!clickedOnNode && !clickedOnServerInfo && !clickedOnLeftPanel) {
            if (currentlyHighlighted) {
                serverInfoPanel.style("display", "none");
                // *** DODANO: Usuń klasę przy kliknięciu tła ***
                document.body.classList.remove('mobile-info-active');
                // ------------------------------------------
                resetHighlight();
                currentlyHighlighted = null;
            }
        }
    });
}

function setupSimulation() {
    const width = window.innerWidth; const height = window.innerHeight;
    if (!currentDataSet || currentDataSet.nodes.length === 0) {
        simulation = { nodes: () => simulation, force: () => simulation, alpha: () => simulation, restart: () => {}, on: () => simulation, stop: () => {} }; return;
    }
    if (!radiusScale) { console.error("setupSimulation: radiusScale nie zdefiniowana!"); return; }
    simulation = d3.forceSimulation(currentDataSet.nodes)
    .force("link", d3.forceLink(currentDataSet.links).id(d => d.id).distance(d => {
        const sourceNode = typeof d.source === 'object' ? d.source : currentDataSet.nodes.find(n => n.id === d.source);
        const targetNode = typeof d.target === 'object' ? d.target : currentDataSet.nodes.find(n => n.id === d.target);
        if (sourceNode && targetNode && sourceNode.partnerships && targetNode.partnerships) {
            const isPartner = sourceNode.partnerships.includes(targetNode.id) || (targetNode.partnerships && targetNode.partnerships.includes(sourceNode.id));
            return isPartner ? 30 : 150;
        } return 150;
    }).strength(0.1))
    .force("charge", d3.forceManyBody().strength(-1500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => radiusScale(d.members || 0) + 5))
    .alphaDecay(0.0228).alphaMin(0.001)
    .on("tick", ticked);
}

function drawGraph(nodesToDraw, linksToDraw, initialAlpha = 1, stopDelay = 1000) {
    g.selectAll("*").remove();
    if (!simulation || !nodesToDraw || nodesToDraw.length === 0) return;
    if (!radiusScale) { console.error("drawGraph: radiusScale nie zdefiniowana!"); return; }

    const filteredNodeIds = new Set(nodesToDraw.map(n => n.id));
    const validLinks = currentDataSet.links.filter(l => {
        const sourceId = l.source?.id || l.source; const targetId = l.target?.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    nodesToDraw.forEach(node => { node.fx = null; node.fy = null; });

    simulation.nodes(nodesToDraw);
    if (simulation.force("link")) { simulation.force("link").links(validLinks); }

    const link = g.append("g").attr("class", "links").selectAll("line")
    .data(validLinks, d => `${d.source?.id || d.source}-${d.target?.id || d.target}`)
    .join("line").attr("class", "link");
    const node = g.append("g").attr("class", "nodes").selectAll("circle")
    .data(nodesToDraw, d => d.id)
    .join("circle").attr("class", "node").attr("r", d => radiusScale(d.members || 0))
    .attr("fill", d => getNodeColor(d)).on("click", handleNodeClick)
    .on("mouseover", handleNodeMouseOver).on("mouseout", handleNodeMouseOut);
    const label = g.append("g").attr("class", "labels").selectAll("text")
    .data(nodesToDraw, d => d.id)
    .join("text").attr("class", "node-label").text(d => d.id);

    simulation.alpha(initialAlpha).restart();

    clearTimeout(freezeTimer);
    if (stopDelay > 0 && simulation.stop) {
        freezeTimer = setTimeout(() => {
            console.log(`Zatrzymywanie symulacji po ${stopDelay}ms.`);
            simulation.stop();
        }, stopDelay);
    } else if (stopDelay <= 0 && simulation.stop) {
        console.log("Natychmiastowe zatrzymywanie symulacji.");
        simulation.stop();
    }
}

function ticked() {
    if (!radiusScale) return;
    g.selectAll(".node")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
    g.selectAll(".link")
    .filter(d => d.source && d.target)
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);
    g.selectAll(".node-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y - radiusScale(d.members || 0) - 5);
}

// === OBSŁUGA INTERAKCJI ===

function resetMap() {
    console.log("Resetowanie mapy (pełny reset)...");
    if (zoom_handler && initialTransform) { svg.transition().duration(750).call(zoom_handler.transform, initialTransform); }
    initializeFilters();
    if (currentlyHighlighted) { resetHighlight(); currentlyHighlighted = null; serverInfoPanel.style("display", "none"); }
    searchInput.property("value", "");
    currentSortKey = 'members'; currentSortDirection = 'desc';
    if(currentDataSet && currentDataSet.nodes){
        calculateRanks(currentDataSet.nodes);
        currentFilteredNodes = [...currentDataSet.nodes];
        updateServerTable(currentFilteredNodes);
        currentDataSet.nodes.forEach(node => { node.fx = null; node.fy = null; node.x = undefined; node.y = undefined; node.vx = undefined; node.vy = undefined; });
        drawGraph(currentDataSet.nodes, currentDataSet.links, 1, 1000);
    } else { currentFilteredNodes = []; updateServerTable([]); g.selectAll("*").remove(); }
}

function handleNodeClick(event, d) {
    const clickedNodeData = currentDataSet.nodes.find(n => n.id === d.id); if (!clickedNodeData) return;

    if (currentlyHighlighted === clickedNodeData) {
        serverInfoPanel.style("display", "none");
        // *** DODANO: Usuń klasę przy zamykaniu przez ponowne kliknięcie ***
        document.body.classList.remove('mobile-info-active');
        // -----------------------------------------------------------
        resetHighlight();
        currentlyHighlighted = null;
        return;
    }
    if (currentlyHighlighted) resetHighlight();

    currentlyHighlighted = clickedNodeData;
    serverInfoPanel.style("display", "block"); // Pokazuje panel (CSS zadba o resztę)
    // *** DODANO: Dodaj klasę do body, aby przełączyć widok na mobile ***
    document.body.classList.add('mobile-info-active');
    // ------------------------------------------------------------

    // Reszta funkcji bez zmian...
    const partnershipsData = (clickedNodeData.partnerships || []).map(pId => currentDataSet.nodes.find(n => n.id === pId)).filter(p => p).sort((a, b) => (b.members || 0) - (a.members || 0));
    const serverColor = getNodeColor(clickedNodeData); d3.select("#serverInfo-name").style("color", serverColor).text(clickedNodeData.id);
    const serverInfoMembersDiv = d3.select("#serverInfo-members"); serverInfoMembersDiv.selectAll("*").remove();
    calculateRanks(currentDataSet.nodes);
    serverInfoMembersDiv.append("div").text(`Data założenia: ${clickedNodeData.creationDate}`);
    serverInfoMembersDiv.append("div").text(`Członkowie: ${clickedNodeData.members || 0} (miejsce #${clickedNodeData.memberRank || '?'})`);
    d3.select("#serverInfo-boosts").text(`Boosty: ${clickedNodeData.boosts || 0} (miejsce #${clickedNodeData.boostRank || '?'})`);
    d3.select("#serverInfo-partnerships-count").text(`Liczba partnerstw: ${partnershipsData.length} (miejsce #${clickedNodeData.partnershipRank || '?'})`);
    let partnershipsHtml = "";
    if(partnershipsData.length > 0){
        partnershipsData.forEach(p => {
            const pCol = getNodeColor(p);
            const isVis = currentFilteredNodes.some(n => n.id === p.id);
            const boostIconHtml = `<img src="images/boost-icon.png" alt="Boosty" style="height: 1em; width: auto; vertical-align: middle; margin: 0 2px;">`;
            const partnerPartnershipCount = (p.partnerships || []).length;
            partnershipsHtml += `<li style="color:${isVis?pCol:'#888'};cursor:${isVis?'pointer':'default'};" data-partner-id="${p.id}" data-visible="${isVis}">
            ${p.id} (👥 ${p.members||0}, ${boostIconHtml} ${p.boosts||0}, 🤝 ${partnerPartnershipCount})
            ${!isVis?' [ukryty]':''}</li>`;
        });
    } else { partnershipsHtml="<li>Brak partnerstw</li>"; }
    d3.select("#serverInfo-partnerships-list").html(partnershipsHtml);
    highlightNodeAndLinks(clickedNodeData);
    const scale = 0.6; const targetX = d.x || window.innerWidth / 2; const targetY = d.y || window.innerHeight / 2;
    const transform = d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2).scale(scale).translate(-targetX, -targetY);
    svg.transition().duration(750).call(zoom_handler.transform, transform);
    startBlinking(clickedNodeData);
}

function searchServer(serverId) {
    const serverNodeData = currentDataSet.nodes.find(n => n.id === serverId); if (!serverNodeData) { console.error("Nie znaleziono serwera o ID: "+serverId); return; }
    const serverNodeOnMap = currentFilteredNodes.find(n => n.id === serverId);
    if (!serverNodeOnMap) {
        console.warn("Wyszukany serwer jest ukryty przez filtry suwaków.");
        const scale = 0.75; const targetX = serverNodeData.x || window.innerWidth/2; const targetY = serverNodeData.y || window.innerHeight/2;
        const transform = d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2).scale(scale).translate(-targetX, -targetY);
        svg.transition().duration(750).call(zoom_handler.transform, transform);
        highlightTableRow(serverId, true); setTimeout(() => highlightTableRow(serverId, false), 2000);
        return;
    }
    handleNodeClick(null, serverNodeOnMap);
}

function highlightTableRow(nodeId, highlight = true) {
    serverTableBody.selectAll('tr').filter(rowData => rowData && rowData.id === nodeId).classed('table-row-highlighted-search', highlight);
}
// CSS: tr.table-row-highlighted-search td { background-color: rgba(100, 180, 255, 0.3); }

function highlightNodeAndLinks(d) {
    if (!d) return; const connectedNodeIds = new Set([d.id]); (d.partnerships || []).forEach(pId => connectedNodeIds.add(pId)); currentDataSet.nodes.forEach(n => { if((n.partnerships || []).includes(d.id)) connectedNodeIds.add(n.id); });
    const visibleNodeIds = new Set(currentFilteredNodes.map(n => n.id));
    g.selectAll(".node").classed("dimmed", n => visibleNodeIds.has(n.id) && !connectedNodeIds.has(n.id)).style("stroke", n => n.id === d.id ? "white" : null).style("stroke-width", n => n.id === d.id ? 2 : null);
    g.selectAll(".link").classed("hidden", l => { const srcId = l.source?.id||l.source; const tgtId = l.target?.id||l.target; return !visibleNodeIds.has(srcId) || !visibleNodeIds.has(tgtId) || !(connectedNodeIds.has(srcId) && connectedNodeIds.has(tgtId)); }).classed("hovered", false);
    g.selectAll(".node-label").classed("hidden", lbl => !(visibleNodeIds.has(lbl.id) && connectedNodeIds.has(lbl.id)));
}

function highlightHovered(d, isHovering) {
    if (!d) return; const nodeElement = g.selectAll(".node").filter(node => node && node.id === d.id);
    const connectedLinks = g.selectAll(".link").filter(l => { const srcId=l.source?.id||l.source; const tgtId=l.target?.id||l.target; return srcId === d.id || tgtId === d.id; });
    if (isHovering) { nodeElement.classed("table-hovered", true); connectedLinks.classed("hovered", true); }
    else { nodeElement.classed("table-hovered", false); connectedLinks.classed("hovered", false); if (currentlyHighlighted) { highlightNodeAndLinks(currentlyHighlighted); } else { resetHighlight(); } }
    d3.selectAll("#serverTableBody tr").filter(rd => rd && rd.id === d.id).classed("table-row-hovered", isHovering);
    if (currentlyHighlighted) { highlightInServerInfoPanel(d.id, isHovering); }
}

function highlightInServerInfoPanel(nodeId, highlight) {
    if (!currentlyHighlighted) return; const weight = highlight ? "bold" : "normal";
    d3.select("#serverInfo-name").style("font-weight", nodeId === currentlyHighlighted.id ? weight : "normal");
    d3.select("#serverInfo-partnerships-list").selectAll("li").filter(function() { return d3.select(this).attr("data-partner-id") === nodeId; }).style("font-weight", weight);
}

function resetHighlight() {
    g.selectAll(".node").classed("dimmed", false).classed("table-hovered", false).style("stroke", null).style("stroke-width", null);
    g.selectAll(".link").classed("hidden", false).classed("hovered", false);
    g.selectAll(".node-label").classed("hidden", false);
    stopBlinking();
}

function startBlinking(nodeData) {
    stopBlinking(); blinkingNode = nodeData; blink();
    function blink() { if (!blinkingNode || blinkingNode.id !== nodeData.id || !radiusScale) return; const node = g.selectAll(".node").filter(d => d && d.id === nodeData.id); if (!node.empty()) { const r = radiusScale(nodeData.members || 0); node.transition("blinking").duration(500).attr("r", r*0.7).transition("blinking").duration(500).attr("r", r).on("end", blink); } else { blinkingNode = null; } }
}

function stopBlinking() {
    if (blinkingNode) { const node = g.selectAll(".node").filter(d => d && d.id === blinkingNode.id); if (!node.empty() && radiusScale) { node.interrupt("blinking").transition("stopBlinking").duration(100).attr("r", radiusScale(blinkingNode.members || 0)); } blinkingNode = null; }
}

function handleNodeMouseOver(event, d) {
    if (!d) return;
    if (event && event.target.tagName === 'circle') {
        const tooltip = d3.select(".tooltip"); const fullDataNode = currentDataSet.nodes.find(n => n.id === d.id);
        if(fullDataNode){ calculateRanks(currentDataSet.nodes); tooltip.style("display", "block").html(`<strong>${fullDataNode.id}</strong><br>Data założenia: ${fullDataNode.creationDate}<br>Członkowie: ${fullDataNode.members || 0} (#${fullDataNode.memberRank||'?'})<br>Boosty: ${fullDataNode.boosts || 0} (#${fullDataNode.boostRank||'?'})<br>Partnerstwa: ${(fullDataNode.partnerships||[]).length} (#${fullDataNode.partnershipRank||'?'})`).style("left", (event.pageX+10)+"px").style("top",(event.pageY-28)+"px"); }
        else { tooltip.style("display", "none"); }
    }
    highlightHovered(d, true);
}

function handleNodeMouseOut(event, d) {
    if (!d) return; d3.select(".tooltip").style("display", "none"); highlightHovered(d, false);
}


// === FILTRY ===

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

function updateRangeSliderVisual(minInput, maxInput) {
    if (!minInput.node() || !maxInput.node()) return; const container = minInput.node().parentNode; const fill = container.querySelector('.range-fill'); if (!fill) return;
    const minVal = +minInput.property("value"); const maxVal = +maxInput.property("value"); const minAttr = +minInput.attr("min"); const maxAttr = +maxInput.attr("max");
    if (maxAttr <= minAttr) { fill.style.left = `0%`; fill.style.width = minVal > minAttr ? `0%` : `100%`; return; }
    const range = maxAttr - minAttr; const minPercent = Math.max(0, Math.min(100, ((minVal - minAttr) / range) * 100)); const maxPercent = Math.max(0, Math.min(100, ((maxVal - minAttr) / range) * 100));
    fill.style.left = `${minPercent}%`; fill.style.width = `${Math.max(0, maxPercent - minPercent)}%`;
}

function initializeFilters() {
    if (!currentDataSet || currentDataSet.nodes.length === 0) return;
    const dateMaxVal = Math.round(dateRange >= 0 ? dateRange : 0);
    dateFilterMin.attr("min", 0).attr("max", dateMaxVal).property("value", 0); dateFilterMax.attr("min", 0).attr("max", dateMaxVal).property("value", dateMaxVal);
    dateValue.select(".min-value").text(`min: ${formatDate(minDateObj)}`); dateValue.select(".max-value").text(`max: ${formatDate(maxDateObj)}`);
    updateRangeSliderVisual(dateFilterMin, dateFilterMax);
    dateFilterMin.on("input", null).on("input", handleDateFilterInput); dateFilterMax.on("input", null).on("input", handleDateFilterInput);

    const maxMembers = d3.max(currentDataSet.nodes, d => d.members) || 0;
    memberFilterMin.attr("min", 0).attr("max", maxMembers).property("value", 0); memberFilterMax.attr("min", 0).attr("max", maxMembers).property("value", maxMembers);
    memberValue.select(".min-value").text(`min: 0`); memberValue.select(".max-value").text(`max: ${maxMembers}`);
    updateRangeSliderVisual(memberFilterMin, memberFilterMax);
    memberFilterMin.on("input", null).on("input", handleGenericFilterInput); memberFilterMax.on("input", null).on("input", handleGenericFilterInput);

    const maxBoosts = d3.max(currentDataSet.nodes, d => d.boosts) || 0;
    boostFilterMin.attr("min", 0).attr("max", maxBoosts).property("value", 0); boostFilterMax.attr("min", 0).attr("max", maxBoosts).property("value", maxBoosts);
    boostValue.select(".min-value").text(`min: 0`); boostValue.select(".max-value").text(`max: ${maxBoosts}`);
    updateRangeSliderVisual(boostFilterMin, boostFilterMax);
    boostFilterMin.on("input", null).on("input", handleGenericFilterInput); boostFilterMax.on("input", null).on("input", handleGenericFilterInput);

    const maxPartnerships = d3.max(currentDataSet.nodes, d => (d.partnerships || []).length) || 0;
    partnershipFilterMin.attr("min", 0).attr("max", maxPartnerships).property("value", 0); partnershipFilterMax.attr("min", 0).attr("max", maxPartnerships).property("value", maxPartnerships);
    partnershipValue.select(".min-value").text(`min: 0`); partnershipValue.select(".max-value").text(`max: ${maxPartnerships}`);
    updateRangeSliderVisual(partnershipFilterMin, partnershipFilterMax);
    partnershipFilterMin.on("input", null).on("input", handleGenericFilterInput); partnershipFilterMax.on("input", null).on("input", handleGenericFilterInput);

    d3.selectAll('.range-slider-container').on('click', null).on('click', handleTrackClick);
}

function handleGenericFilterInput(event) {
    const input = d3.select(this); const isMin = input.classed("range-min");
    const container = input.node().parentNode; const minInput = d3.select(container).select(".range-min"); const maxInput = d3.select(container).select(".range-max");
    const valueDisplay = d3.select(container.parentNode).select("p.filter-value-display");
    let minVal = +minInput.property("value"); let maxVal = +maxInput.property("value");
    const minAttr = +minInput.attr("min"); const maxAttr = +maxInput.attr("max");
    const minSeparation = maxAttr > minAttr ? 1 : 0;
    if (isMin) { minVal = Math.min(minVal, maxVal - minSeparation); minInput.property("value", minVal); }
    else { maxVal = Math.max(maxVal, minVal + minSeparation); maxInput.property("value", maxVal); }
    valueDisplay.select(".min-value").text(`min: ${minVal}`); valueDisplay.select(".max-value").text(`max: ${maxVal}`);
    updateRangeSliderVisual(minInput, maxInput);
    updateFilters();
}

function handleDateFilterInput(event) {
    const input = d3.select(this); const isMin = input.classed("range-min");
    const container = input.node().parentNode; const minInput = d3.select(container).select(".range-min"); const maxInput = d3.select(container).select(".range-max");
    let minDays = +minInput.property("value"); let maxDays = +maxInput.property("value");
    const minAttr = +minInput.attr("min"); const maxAttr = +maxInput.attr("max");
    const minSeparation = maxAttr > minAttr ? 1 : 0;
    if (isMin) { minDays = Math.min(minDays, maxDays - minSeparation); minInput.property("value", minDays); }
    else { maxDays = Math.max(maxDays, minDays + minSeparation); maxInput.property("value", maxDays); }
    const baseMinDate = (minDateObj instanceof Date && !isNaN(minDateObj)) ? new Date(minDateObj) : new Date(0);
    const selectedMinDateObj = new Date(baseMinDate); if (!isNaN(minDays) && minDays >= 0) selectedMinDateObj.setDate(baseMinDate.getDate() + minDays); selectedMinDateObj.setHours(0, 0, 0, 0);
    const selectedMaxDateObj = new Date(baseMinDate); if (!isNaN(maxDays) && maxDays >= 0) selectedMaxDateObj.setDate(baseMinDate.getDate() + maxDays); selectedMaxDateObj.setHours(23, 59, 59, 999);
    dateValue.select(".min-value").text(`min: ${formatDate(selectedMinDateObj)}`); dateValue.select(".max-value").text(`max: ${formatDate(selectedMaxDateObj)}`);
    updateRangeSliderVisual(minInput, maxInput);
    updateFilters();
}

function handleTrackClick(event) {
    // *** POPRAWIONA FUNKCJA ***
    if (event.target.type === 'range') return;

    const container = event.currentTarget;
    const minInput = d3.select(container).select(".range-min");
    const maxInput = d3.select(container).select(".range-max");
    const track = container.querySelector('.range-track');

    if (!minInput.node() || !maxInput.node() || !track) return;

    // Identyfikuj typ filtra na podstawie ID inputów
    const inputId = minInput.attr('id') || maxInput.attr('id');
    // Użyj bardziej precyzyjnych ID, jeśli istnieją (np. dateFilterMin, memberFilterMin)
    const isDateFilter = inputId && inputId.toLowerCase().includes('datefilter');
    const targetHandler = isDateFilter ? handleDateFilterInput : handleGenericFilterInput;

    const rect = track.getBoundingClientRect();
    const clickX = event.clientX;
    const trackStart = rect.left;
    const trackWidth = rect.width;
    const clickRatio = Math.max(0, Math.min(1, (clickX - trackStart) / trackWidth));

    const minAttr = +minInput.attr("min");
    const maxAttr = +maxInput.attr("max");
    const range = maxAttr - minAttr;
    const clickedValue = Math.round(minAttr + clickRatio * range);

    const currentMinVal = +minInput.property("value");
    const currentMaxVal = +maxInput.property("value");
    const distToMin = Math.abs(clickedValue - currentMinVal);
    const distToMax = Math.abs(clickedValue - currentMaxVal);
    const minSeparation = range > 0 ? 1 : 0;

    let targetInputNode = null;

    if (distToMin <= distToMax) {
        const newMinVal = Math.min(clickedValue, currentMaxVal - minSeparation);
        minInput.property("value", newMinVal);
        targetInputNode = minInput.node();
    } else {
        const newMaxVal = Math.max(clickedValue, currentMinVal + minSeparation);
        maxInput.property("value", newMaxVal);
        targetInputNode = maxInput.node();
    }

    // Wywołaj programistycznie zdarzenie 'input', które uruchomi odpowiedni handler
    if (targetInputNode) {
        targetInputNode.dispatchEvent(new Event('input', { bubbles: true }));
    }
}


function getAppliedFilters() {
    const baseMinDate = (minDateObj instanceof Date && !isNaN(minDateObj)) ? new Date(minDateObj) : new Date(0);
    const minDaysValue = dateFilterMin.node() ? +dateFilterMin.property("value") : 0;
    const maxDaysValue = dateFilterMax.node() ? +dateFilterMax.property("value") : (dateRange >= 0 ? dateRange : 0);
    const selectedMinDate = new Date(baseMinDate); if (!isNaN(minDaysValue) && minDaysValue >=0 ) selectedMinDate.setDate(baseMinDate.getDate() + minDaysValue); selectedMinDate.setHours(0,0,0,0);
    const selectedMaxDate = new Date(baseMinDate); if (!isNaN(maxDaysValue) && maxDaysValue >= 0) selectedMaxDate.setDate(baseMinDate.getDate() + maxDaysValue); selectedMaxDate.setHours(23,59,59,999);
    const finalMaxDate = selectedMaxDate < selectedMinDate ? new Date(selectedMinDate.getTime() + 86399999) : selectedMaxDate;
    return {
        minDate: selectedMinDate, maxDate: finalMaxDate,
        minMembers: memberFilterMin.node() ? +memberFilterMin.property("value") : 0,
        maxMembers: memberFilterMax.node() ? +memberFilterMax.property("value") : Infinity,
        minBoosts: boostFilterMin.node() ? +boostFilterMin.property("value") : 0,
        maxBoosts: boostFilterMax.node() ? +boostFilterMax.property("value") : Infinity,
        minPartnerships: partnershipFilterMin.node() ? +partnershipFilterMin.property("value") : 0,
        maxPartnerships: partnershipFilterMax.node() ? +partnershipFilterMax.property("value") : Infinity,
        searchTerm: searchInput.node() ? searchInput.property("value").toLowerCase() : ""
    };
}

function updateFilters() {
    if (!currentDataSet || !currentDataSet.nodes) return;
    const currentFilterValues = getAppliedFilters();

    const filteredForMap = currentDataSet.nodes.filter(d => {
        let nodeDateObj; try { if (typeof d.creationDate !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(d.creationDate)) throw 0; const p=d.creationDate.split('-'); nodeDateObj = new Date(`${p[2]}-${p[1]}-${p[0]}`); if (isNaN(nodeDateObj.getTime())) throw 0; nodeDateObj.setHours(12,0,0,0); } catch (e) { return false; }
        const nodeDt = new Date(nodeDateObj.getFullYear(), nodeDateObj.getMonth(), nodeDateObj.getDate());
        const minDt = new Date(currentFilterValues.minDate.getFullYear(), currentFilterValues.minDate.getMonth(), currentFilterValues.minDate.getDate());
        const maxDt = new Date(currentFilterValues.maxDate.getFullYear(), currentFilterValues.maxDate.getMonth(), currentFilterValues.maxDate.getDate());
        const dateMatch = nodeDt >= minDt && nodeDt <= maxDt;
        const memberMatch = (d.members || 0) >= currentFilterValues.minMembers && (d.members || 0) <= currentFilterValues.maxMembers;
        const boostMatch = (d.boosts || 0) >= currentFilterValues.minBoosts && (d.boosts || 0) <= currentFilterValues.maxBoosts;
        const partnershipMatch = (d.partnerships || []).length >= currentFilterValues.minPartnerships && (d.partnerships || []).length <= currentFilterValues.maxPartnerships;
        return dateMatch && memberMatch && boostMatch && partnershipMatch;
    });

    currentFilteredNodes = [...filteredForMap];
    const filteredNodeIds = new Set(currentFilteredNodes.map(d => d.id));
    const filteredLinks = currentDataSet.links.filter(l => {
        const sourceId = l.source?.id || l.source; const targetId = l.target?.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    updateServerTable(currentFilteredNodes, currentFilterValues.searchTerm);

    console.log("updateFilters: Rysowanie grafu z restartem symulacji (alpha=0.1, stop=250ms)");
    drawGraph(currentFilteredNodes, filteredLinks, 0.1, 250);

    if (currentlyHighlighted && !filteredNodeIds.has(currentlyHighlighted.id)) {
        serverInfoPanel.style("display", "none"); resetHighlight(); currentlyHighlighted = null;
    } else if (currentlyHighlighted) {
        highlightNodeAndLinks(currentlyHighlighted);
        if(blinkingNode && blinkingNode.id === currentlyHighlighted.id) startBlinking(currentlyHighlighted);
    }
}

searchInput.on("input", updateTableFilter);

function updateTableFilter() {
    if (!currentFilteredNodes) return;
    const searchTerm = searchInput.node() ? searchInput.property("value").toLowerCase() : "";
    updateServerTable(currentFilteredNodes, searchTerm);
}


// === TABELA SERWERÓW ===

function calculateRanks(nodes) {
    if (!nodes || nodes.length === 0) return; const nodesToSort = nodes.map(n => ({...n}));
    const sortByMembers = [...nodesToSort].sort((a, b) => (b.members || 0) - (a.members || 0)); sortByMembers.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.memberRank = index + 1; });
    const sortByBoosts = [...nodesToSort].sort((a, b) => (b.boosts || 0) - (a.boosts || 0)); sortByBoosts.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.boostRank = index + 1; });
    const sortByPartnerships = [...nodesToSort].sort((a, b) => (b.partnerships || []).length - (a.partnerships || []).length); sortByPartnerships.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.partnershipRank = index + 1; });
    const sortByCreationDate = [...nodesToSort].sort((a, b) => { let d1,d2; try{if(typeof a.creationDate!=='string'||!/^\d{2}-\d{2}-\d{4}$/.test(a.creationDate)) throw 0; const p=a.creationDate.split('-');d1=new Date(`${p[2]}-${p[1]}-${p[0]}`); if(isNaN(d1)) throw 0;}catch{d1=new Date(8.64e15);} try{if(typeof b.creationDate!=='string'||!/^\d{2}-\d{2}-\d{4}$/.test(b.creationDate)) throw 0; const p=b.creationDate.split('-');d2=new Date(`${p[2]}-${p[1]}-${p[0]}`); if(isNaN(d2)) throw 0;}catch{d2=new Date(8.64e15);} return d1-d2; });
    sortByCreationDate.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.creationDateRank = index + 1; });
}

function updateServerTable(nodesForTable, searchTerm = "") {
    const nodesToDisplay = nodesForTable.filter(node =>
    node.id.toLowerCase().includes(searchTerm)
    );
    const sortedNodes = [...nodesToDisplay].sort((a, b) => {
        let valA, valB; switch (currentSortKey) { case 'id': valA=a.id.toLowerCase(); valB=b.id.toLowerCase(); break; case 'members': valA=a.members||0; valB=b.members||0; break; case 'boosts': valA=a.boosts||0; valB=b.boosts||0; break; case 'partnerships': valA=(a.partnerships||[]).length; valB=(b.partnerships||[]).length; break; default: return 0; }
        if(currentSortDirection==='asc'){return typeof valA==='string'?valA.localeCompare(valB):valA-valB;}else{return typeof valA==='string'?valB.localeCompare(valA):valB-valA;}
    });
    serverTableBody.html("");
    visibleServerCountSpan.text(sortedNodes.length);
    serverTableHeaders.each(function() { const h=d3.select(this); const sk=h.attr('data-sort-by'); const as=h.select('.sort-arrow'); if(!as.node())return; if(sk===currentSortKey){h.classed('sorted',true); as.text(currentSortDirection==='asc'?'▲':'▼');}else{h.classed('sorted',false); as.text('');} });
    sortedNodes.forEach(node => {
        const row = serverTableBody.append("tr").datum(node).classed("table-row-highlighted-search", false);
        row.append("td").text(node.id).attr("title", node.id);
        row.append("td").text(node.members || 0);
        row.append("td").text(node.boosts || 0);
        row.append("td").text((node.partnerships || []).length);
        row.on("click", (event, d) => { const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id); if (nodeOnMap) { handleNodeClick(event, nodeOnMap); } else { searchServer(d.id); } });
        row.on("mouseover", (event, d) => { hoveredTableRowNodeId = d.id; const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id); if (nodeOnMap) highlightHovered(nodeOnMap, true); });
        row.on("mouseout", (event, d) => { if (hoveredTableRowNodeId === d.id) hoveredTableRowNodeId = null; const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id); if (nodeOnMap) highlightHovered(nodeOnMap, false); });
    });
}

function handleSortClick(event) {
    const header = d3.select(this); const sortKey = header.attr('data-sort-by'); if (!sortKey) return;
    if (sortKey === currentSortKey) { currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc'; } else { currentSortKey = sortKey; currentSortDirection = 'desc'; }
    const searchTerm = searchInput.node() ? searchInput.property("value").toLowerCase() : "";
    updateServerTable(currentFilteredNodes, searchTerm);
}

// === OBSŁUGA ZDARZEŃ GLOBALNYCH ===

function handleResize() {
    const newWidth = window.innerWidth; const newHeight = window.innerHeight;
    svg.attr("width", newWidth).attr("height", newHeight);
    if (simulation && simulation.force("center")) { simulation.force("center").x(newWidth / 2).y(newHeight / 2); }
    if (initialZoom) { initialTransform = d3.zoomIdentity.translate(newWidth / 2, newHeight / 2).scale(initialZoom).translate(-newWidth / 2, -newHeight / 2); }
}

// === INICJALIZACJA PRZY STARCIE STRONY ===

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM załadowany.");
    const overlay = document.getElementById('overlay');
    const understandButton = document.getElementById('understandButton');
    if (overlay && understandButton) {
        overlay.classList.add('visible');
        understandButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }, { once: true });
    }
    if (availableDataVersions.length > 0) {
        const latestVersion = availableDataVersions[0];
        loadDataVersion(latestVersion);
    } else {
        console.error("Brak zdefiniowanych wersji danych!");
        loadedDataDateSpan.text("Brak danych");
        serverCountSpan.text("0");
        initializeVisualization({ nodes: [], links: [] }, { label: "Brak danych", file: "" });
    }

    // --- Podpięcie Event Listenerów ---
    serverTableHeaders.on("click", handleSortClick);

    // Listener dla resetButton - DODANO usuwanie klasy
    d3.select("#resetButton").on("click", () => {
        document.body.classList.remove('mobile-info-active'); // Usuń klasę przy resecie
        resetMap(); // Wywołaj istniejącą funkcję reset
    });

    // Listener dla przycisku zamknięcia #serverInfo
    d3.select("#closeServerInfo").on("click", () => {
        serverInfoPanel.style("display", "none");
        document.body.classList.remove('mobile-info-active'); // Usuń klasę
        if (currentlyHighlighted) {
            resetHighlight();
            currentlyHighlighted = null;
        }
    });

    // Listener dla kliknięcia na partnera w panelu info
    d3.select("#serverInfo-partnerships-list").on("click", (event) => {
        const targetLi = event.target.closest('li');
        if (targetLi) {
            const partnerId = targetLi.dataset.partnerId;
            const isVisible = targetLi.dataset.visible === 'true';
            if (partnerId && isVisible) {
                // Usuń podświetlenie hover z głównej tabeli przed wyszukaniem
                d3.selectAll("#serverTableBody tr").classed("table-row-hovered", false);
                // Nie usuwamy klasy mobile-info-active, bo od razu pokazujemy info o partnerze
                searchServer(partnerId); // Wyszukaj i kliknij partnera
            } else if (partnerId && !isVisible) {
                console.log(`Partner ${partnerId} jest ukryty przez filtry.`);
            }
        }
    });

    // Listener dla hover na partnerach w panelu info
    d3.select("#serverInfo-partnerships-list")
    .on("mouseover", (event) => {
        const targetLi = event.target.closest('li');
        if (!targetLi) return;
        const partnerId = targetLi.dataset.partnerId;
        if (!partnerId) return;
        // Znajdź dane partnera, nawet jeśli jest ukryty na mapie
        const partnerNodeData = currentDataSet.nodes.find(n => n.id === partnerId);
        if (partnerNodeData) {
            highlightHovered(partnerNodeData, true); // Podświetl w tabeli i/lub na mapie
        }
    })
    .on("mouseout", (event) => {
        const targetLi = event.target.closest('li');
        if (!targetLi) return;
        const partnerId = targetLi.dataset.partnerId;
        if (!partnerId) return;
        const partnerNodeData = currentDataSet.nodes.find(n => n.id === partnerId);
        if (partnerNodeData) {
            highlightHovered(partnerNodeData, false); // Zdejmij podświetlenie
        }
    });

    // Listenery dla selektorów wersji - DODANO usuwanie klasy
    dataVersionSelector.on("change", function() { // Użyj 'function', aby 'this' działało
        document.body.classList.remove('mobile-info-active');
        handleDataVersionChange.call(this); // Wywołaj handler w kontekście selecta
    });
    dataVersionSelectorMobile.on("change", function() { // Użyj 'function'
        document.body.classList.remove('mobile-info-active');
        handleDataVersionChange.call(this); // Wywołaj handler w kontekście selecta
    });

    // Listener resize
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });

}); // Koniec DOMContentLoaded
