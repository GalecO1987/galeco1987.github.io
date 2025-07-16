function resetMap() {
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
    serverInfoChart.html("");
    d3.select("#chart-container").classed("hidden", true);
}

function drawServerHistoryChart(serverId, dataType = 'members') {
    serverInfoChart.html("");
    d3.select("#chart-container").classed("hidden", true);

    const historyData = [];
    const dateParser = d3.timeParse("%Y-%m-%d");

    const dataKeyMap = {
        members: 'members',
        boosts: 'boosts',
        partnerships: 'partnerships'
    };
    const key = dataKeyMap[dataType];

    for (const [date, dataSet] of allData.entries()) {
        const serverData = dataSet.nodes.find(node => node.id === serverId);
        if (serverData) {
            let value = 0;
            if (dataType === 'partnerships') {
                value = (serverData.partnerships || []).length;
            } else {
                value = serverData[key] || 0;
            }
            historyData.push({
                date: dateParser(date),
                             value: value
            });
        }
    }

    historyData.sort((a, b) => a.date - b.date);

    if (historyData.length < 2) {
        return;
    }

    d3.select("#chart-container").classed("hidden", false);
    d3.selectAll('.chart-toggle-btn').classed('active', false);
    d3.select(`.chart-toggle-btn[data-chart="${dataType}"]`).classed('active', true);

    const margin = {top: 5, right: 15, bottom: 25, left: 40};
    const containerWidth = serverInfoChart.node().getBoundingClientRect().width;
    const pointWidth = 60;
    const dynamicWidth = Math.max(containerWidth - margin.left - margin.right, historyData.length * pointWidth);

    const height = serverInfoChart.node().getBoundingClientRect().height - margin.top - margin.bottom;

    const chartSvg = serverInfoChart.append("svg")
    .attr("width", dynamicWidth + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    if(serverInfoChart.node().scrollWidth > containerWidth) {
        serverInfoChart.node().scrollLeft = serverInfoChart.node().scrollWidth - containerWidth;
    }

    d3.select("#chart-controls").on("click", (event) => {
        const btn = event.target.closest('.chart-toggle-btn');
        if (!btn) return;
        const newDataType = btn.dataset.chart;
        drawServerHistoryChart(serverId, newDataType);
    });

    const polishLocale = {
        "dateTime": "%A, %e %B %Y, %X",
        "date": "%d.%m.%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"],
        "shortDays": ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So"],
        "months": ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"],
        "shortMonths": ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]
    };
    d3.timeFormatDefaultLocale(polishLocale);

    const x = d3.scaleTime()
    .domain(d3.extent(historyData, d => d.date))
    .range([0, dynamicWidth]);

    const [yMin, yMax] = d3.extent(historyData, d => d.value);
    const yPadding = (yMax - yMin) * 0.15 || 1;

    const y = d3.scaleLinear()
    .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
    .range([height, 0]);

    chartSvg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b '%y")));

    chartSvg.append("g")
    .call(d3.axisLeft(y).ticks(4));

    const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.value));

    const serverNode = currentDataSet.nodes.find(n => n.id === serverId);
    const serverColor = getNodeColor(serverNode);

    chartSvg.append("path")
    .datum(historyData)
    .attr("class", "chart-line")
    .attr("d", line)
    .style("stroke", serverColor);

    const tooltipLabelMap = {
        members: 'Członkowie',
        boosts: 'Boosty',
        partnerships: 'Partnerstwa'
    };

    chartSvg.selectAll(".chart-point")
    .data(historyData)
    .join("circle")
    .attr("class", "chart-point")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.value))
    .attr("r", 4)
    .attr("fill", serverColor)
    .on("mouseover", (event, d) => {
        const dateLabel = d3.timeFormat("%d %B %Y")(d.date);
        const valueLabel = tooltipLabelMap[dataType];
        tooltip.style("display", "block")
        .html(`<strong>${dateLabel}</strong><br>${valueLabel}: ${d.value}`);
    })
    .on("mousemove", (event) => {
        const tooltipNode = tooltip.node();
        const tooltipWidth = tooltipNode.offsetWidth;
        const windowWidth = window.innerWidth;
        let left = event.pageX + 15;
        if (left + tooltipWidth > windowWidth) {
            left = event.pageX - tooltipWidth - 15;
        }
        tooltip.style("left", left + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("display", "none");
    });
}


function handleNodeClick(event, d) {
    const clickedNodeData = currentDataSet.nodes.find(n => n.id === d.id); if (!clickedNodeData) return;

    if (currentlyHighlighted === clickedNodeData) {
        serverInfoPanel.style("display", "none");
        document.body.classList.remove('mobile-info-active');
        resetHighlight();
        currentlyHighlighted = null;
        return;
    }
    if (currentlyHighlighted) resetHighlight();

    currentlyHighlighted = clickedNodeData;
    serverInfoPanel.style("display", "block");
    document.body.classList.add('mobile-info-active');

    const partnershipsData = (clickedNodeData.partnerships || []).map(pId => currentDataSet.nodes.find(n => n.id === pId)).filter(p => p).sort((a, b) => (b.members || 0) - (a.members || 0));
    const serverColor = getNodeColor(clickedNodeData);
    d3.select("#serverInfo-name").style("color", serverColor).text(clickedNodeData.id);

    const previousNodeData = previousDataSet.nodes.find(n => n.id === clickedNodeData.id);

    const formatDelta = (delta) => {
        if (delta > 0) return `<span class="stat-delta positive">(+${delta})</span>`;
        if (delta < 0) return `<span class="stat-delta negative">(${delta})</span>`;
        return '';
    };

    let membersDeltaHtml = '', boostsDeltaHtml = '', partnershipsDeltaHtml = '';

    if (previousNodeData) {
        const membersDelta = (clickedNodeData.members || 0) - (previousNodeData.members || 0);
        membersDeltaHtml = formatDelta(membersDelta);
        const boostsDelta = (clickedNodeData.boosts || 0) - (previousNodeData.boosts || 0);
        boostsDeltaHtml = formatDelta(boostsDelta);
        const partnershipsDelta = (clickedNodeData.partnerships || []).length - (previousNodeData.partnerships || []).length;
        partnershipsDeltaHtml = formatDelta(partnershipsDelta);
    }

    const creationDateObj = parseDateString(clickedNodeData.creationDate);
    const serverInfoMembersDiv = d3.select("#serverInfo-members");
    serverInfoMembersDiv.selectAll("*").remove();

    serverInfoMembersDiv.append("div").attr('class', 'server-stat-line')
    .html(`<span class="stat-icon">🗓️</span><span class="stat-label">Data założenia:</span> ${formatDate(creationDateObj)}`);

    serverInfoMembersDiv.append("div").attr('class', 'server-stat-line')
    .html(`<span class="stat-icon">👥</span><span class="stat-label">Członkowie:</span> ${clickedNodeData.members || 0} ${membersDeltaHtml}`);

    d3.select("#serverInfo-boosts").attr('class', 'server-stat-line')
    .html(`<span class="stat-icon"><img src="images/boost-icon.png" alt="Boosty"></span><span class="stat-label">Boosty:</span> ${clickedNodeData.boosts || 0} ${boostsDeltaHtml}`);

    d3.select("#serverInfo-partnerships-count").attr('class', 'server-stat-line')
    .html(`<span class="stat-icon">🤝</span><span class="stat-label">Liczba partnerstw:</span> ${partnershipsData.length} ${partnershipsDeltaHtml}`);

    let partnershipsHtml = "";
    if (partnershipsData.length > 0) {
        partnershipsData.forEach(p => {
            const pCol = getNodeColor(p);
            const isVis = currentFilteredNodes.some(n => n.id === p.id);
            const partnerPartnershipCount = (p.partnerships || []).length;
            partnershipsHtml += `
            <li data-partner-id="${p.id}" data-visible="${isVis}">
            <span class="partner-name" style="color: ${isVis ? pCol : '#888'};">
            ${p.id} ${!isVis ? '<span style="font-size: 0.8em; color: #777;">[ukryty]</span>' : ''}
            </span>
            <span class="partner-stats">
            <span><span class="partner-icon">👥</span> ${p.members || 0}</span>
            <span><img src="images/boost-icon.png" alt="Boosty" class="partner-icon"> ${p.boosts || 0}</span>
            <span><span class="partner-icon">🤝</span> ${partnerPartnershipCount}</span>
            </span>
            </li>
            `;
        });
    } else {
        partnershipsHtml = `<li style="justify-content: center; background: none; color: #888;">Brak partnerstw</li>`;
    }
    d3.select("#serverInfo-partnerships-list").html(partnershipsHtml);

    drawServerHistoryChart(clickedNodeData.id, 'members');

    highlightNodeAndLinks(clickedNodeData);
    const scale = 0.6; const targetX = d.x || window.innerWidth / 2; const targetY = d.y || window.innerHeight / 2;
    const transform = d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2).scale(scale).translate(-targetX, -targetY);
    svg.transition().duration(750).call(zoom_handler.transform, transform);
    startBlinking(clickedNodeData);
}

function searchServer(serverId) {
    const serverNodeData = currentDataSet.nodes.find(n => n.id === serverId); if (!serverNodeData) { return; }
    const serverNodeOnMap = currentFilteredNodes.find(n => n.id === serverId);
    if (!serverNodeOnMap) {
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

function highlightNodeAndLinks(d) {
    if (!d) return; const connectedNodeIds = new Set([d.id]); (d.partnerships || []).forEach(pId => connectedNodeIds.add(pId)); currentDataSet.nodes.forEach(n => { if((n.partnerships || []).includes(d.id)) connectedNodeIds.add(n.id); });
    const visibleNodeIds = new Set(currentFilteredNodes.map(n => n.id));
    g.selectAll(".node").classed("dimmed", n => visibleNodeIds.has(n.id) && !connectedNodeIds.has(n.id)).style("stroke", n => n.id === d.id ? "white" : null).style("stroke-width", n => n.id === d.id ? 2 : null);
    g.selectAll(".link").classed("hidden", l => { const srcId = l.source?.id||l.source; const tgtId = l.target?.id||l.target; return !visibleNodeIds.has(srcId) || !visibleNodeIds.has(tgtId) || !(connectedNodeIds.has(srcId) && connectedNodeIds.has(tgtId)); }).classed("hovered", false);
    g.selectAll(".node-label").classed("hidden", lbl => !(visibleNodeIds.has(lbl.id) && connectedNodeIds.has(lbl.id)));
}

function highlightHovered(d, isHovering) {
    if (!d) return;

    const nodeElement = g.selectAll(".node").filter(node => node && node.id === d.id);
    const connectedLinks = g.selectAll(".link").filter(l => {
        const srcId = l.source?.id || l.source;
        const tgtId = l.target?.id || l.target;
        return srcId === d.id || tgtId === d.id;
    });

    if (isHovering) {
        nodeElement.classed("table-hovered", true);
        connectedLinks.classed("hovered", true);
    } else {
        nodeElement.classed("table-hovered", false);
        connectedLinks.classed("hovered", false);
        if (currentlyHighlighted) {
            highlightNodeAndLinks(currentlyHighlighted);
        } else {
            resetHighlight();
        }
    }

    d3.selectAll("#serverTableBody tr")
    .filter(rd => rd && rd.id === d.id)
    .classed("table-row-hovered", isHovering);

    if (currentlyHighlighted) {
        const isMainServer = d.id === currentlyHighlighted.id;
        d3.select("#serverInfo-name").style("font-weight", isMainServer && isHovering ? "bold" : "bold");
        d3.select("#serverInfo-partnerships-list")
        .selectAll("li")
        .classed("partner-hovered", function() {
            const partnerId = d3.select(this).attr("data-partner-id");
            return isHovering && partnerId === d.id;
        });
    }
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
        const tooltip = d3.select(".tooltip");
        const fullDataNode = currentDataSet.nodes.find(n => n.id === d.id);

        if (fullDataNode) {
            const creationDateObj = parseDateString(fullDataNode.creationDate);
            const tooltipHtml = `
            <div class="tooltip-title" style="color: ${getNodeColor(fullDataNode)};">${fullDataNode.id}</div>
            <div class="tooltip-stat">
            <span class="tooltip-icon">🗓️</span>
            <span class="tooltip-label">Data założenia:</span> ${formatDate(creationDateObj)}
            </div>
            <div class="tooltip-stat">
            <span class="tooltip-icon">👥</span>
            <span class="tooltip-label">Członkowie:</span> ${fullDataNode.members || 0}
            </div>
            <div class="tooltip-stat">
            <span class="tooltip-icon">
            <img src="images/boost-icon.png" alt="Boosty">
            </span>
            <span class="tooltip-label">Boosty:</span> ${fullDataNode.boosts || 0}
            </div>
            <div class="tooltip-stat">
            <span class="tooltip-icon">🤝</span>
            <span class="tooltip-label">Partnerstwa:</span> ${(fullDataNode.partnerships || []).length}
            </div>
            `;

            tooltip.html(tooltipHtml).style("display", "block");

            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode.offsetWidth;
            const tooltipHeight = tooltipNode.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let left = event.pageX + 15;
            let top = event.pageY + 15;

            if (left + tooltipWidth > windowWidth) {
                left = event.pageX - tooltipWidth - 15;
            }
            if (top + tooltipHeight > windowHeight) {
                top = event.pageY - tooltipHeight - 15;
            }

            tooltip.style("left", left + "px").style("top", top + "px");

        } else {
            tooltip.style("display", "none");
        }
    }

    highlightHovered(d, true);
}

function handleNodeMouseOut(event, d) {
    if (!d) return; d3.select(".tooltip").style("display", "none"); highlightHovered(d, false);
}
