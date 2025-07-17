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
    exitCompareMode();
}

function drawServerHistoryChart(serverIds, dataType = 'members', useSpecialColors = false) {
    const chartContainer = secondServerToCompare ? d3.select("#comparison-chart-container") : d3.select("#chart-container");
    const chartDiv = secondServerToCompare ? chartContainer : serverInfoChart;

    chartDiv.html("");
    chartContainer.classed("hidden", true);

    if (!Array.isArray(serverIds) || serverIds.length === 0) return;

    if (secondServerToCompare) {
        chartContainer.html(`
        <h3 class="section-divider">Historia:</h3>
        <div id="chart-controls-compare"></div>
        <div id="serverInfo-chart-compare"></div>
        `);
        d3.select("#chart-controls").clone(true).each(function() {
            d3.select("#chart-controls-compare").node().appendChild(this);
        });
    }
    const finalChartDiv = secondServerToCompare ? d3.select("#serverInfo-chart-compare") : serverInfoChart;

    const allHistoryData = [];
    const dateParser = d3.timeParse("%Y-%m-%d");
    const key = dataType === 'partnerships' ? 'partnerships' : dataType;

    for (const [date, dataSet] of allData.entries()) {
        serverIds.forEach(serverId => {
            const serverData = dataSet.nodes.find(node => node.id === serverId);
            const value = serverData ? (dataType === 'partnerships' ? (serverData.partnerships || []).length : (serverData[key] || 0)) : null;
            allHistoryData.push({ id: serverId, date: dateParser(date), value: value });
        });
    }

    if (allHistoryData.length === 0) return;

    const groupedData = d3.groups(allHistoryData, d => d.id);
    groupedData.forEach(group => group[1].sort((a, b) => a.date - b.date));

    if (useSpecialColors && groupedData.length === 2) {
        const [series1, series2] = [groupedData[0][1], groupedData[1][1]];
        const series2ValuesByDate = new Map(series2.map(d => [d.date.getTime(), d.value]));

        series1.forEach(d1 => {
            const d2Value = series2ValuesByDate.get(d1.date.getTime());
            if (d1.value !== null && d1.value === d2Value) {
                d1.sharedValue = true;
                const d2 = series2.find(d => d.date.getTime() === d1.date.getTime());
                if (d2) d2.sharedValue = true;
            }
        });
    }

    if (groupedData.every(group => group[1].length < 2)) return;

    chartContainer.classed("hidden", false);
    const controls = secondServerToCompare ? d3.select("#chart-controls-compare") : d3.select("#chart-controls");
    controls.selectAll('.chart-toggle-btn').classed('active', false);
    controls.select(`.chart-toggle-btn[data-chart="${dataType}"]`).classed('active', true);

    const margin = {top: 5, right: 15, bottom: 25, left: 40};
    const containerWidth = finalChartDiv.node().getBoundingClientRect().width;
    const pointWidth = 60;
    const maxPoints = d3.max(groupedData, ([, data]) => data.length);
    const dynamicWidth = Math.max(containerWidth - margin.left - margin.right, maxPoints * pointWidth);
    const height = finalChartDiv.node().getBoundingClientRect().height - margin.top - margin.bottom;

    const chartSvg = finalChartDiv.append("svg")
    .attr("width", dynamicWidth + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    if (finalChartDiv.node().scrollWidth > containerWidth) {
        finalChartDiv.node().scrollLeft = finalChartDiv.node().scrollWidth - containerWidth;
    }

    const specialColorScale = d3.scaleOrdinal().domain(serverIds).range(["#e41a1c", "#377eb8"]);

    const defs = chartSvg.append("defs");
    const gradient = defs.append("linearGradient")
    .attr("id", "dual-color-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");
    gradient.append("stop").attr("offset", "50%").attr("stop-color", specialColorScale.range()[0]);
    gradient.append("stop").attr("offset", "50%").attr("stop-color", specialColorScale.range()[1]);


    const polishLocale = { "dateTime": "%A, %e %B %Y, %X", "date": "%d.%m.%Y", "time": "%H:%M:%S", "periods": ["AM", "PM"], "days": ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"], "shortDays": ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So"], "months": ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"], "shortMonths": ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"] };
    d3.timeFormatDefaultLocale(polishLocale);

    const x = d3.scaleTime().domain(d3.extent(allHistoryData, d => d.date)).range([0, dynamicWidth]);
    const validValues = allHistoryData.filter(d => d.value !== null);
    const yExtent = d3.extent(validValues, d => d.value);
    const yMin = yExtent[0] !== undefined ? yExtent[0] : 0;
    const yMax = yExtent[1] !== undefined ? yExtent[1] : 1;
    const yPadding = (yMax - yMin) * 0.15 || 1;
    const y = d3.scaleLinear().domain([Math.max(0, yMin - yPadding), yMax + yPadding]).range([height, 0]);

    chartSvg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b '%y")));
    chartSvg.append("g").call(d3.axisLeft(y).ticks(4));

    const tooltipLabelMap = { members: 'Członkowie', boosts: 'Boosty', partnerships: 'Partnerstwa' };

    groupedData.forEach(([id, data], i) => {
        const serverNode = currentDataSet.nodes.find(n => n.id === id);
        const serverColor = useSpecialColors ? specialColorScale(id) : (serverNode ? getNodeColor(serverNode) : '#ccc');

        const line = d3.line()
        .defined(d => d.value !== null && !isNaN(d.value))
        .x(d => x(d.date))
        .y(d => {
            const base_y = y(d.value);
            if (d.sharedValue) {
                return i === 0 ? base_y - 2 : base_y + 2;
            }
            return base_y;
        });

        chartSvg.append("path").datum(data).attr("class", "chart-line").attr("d", line).style("stroke", serverColor);
        chartSvg.selectAll(`.chart-point-${id.replace(/\s+/g, '-')}`).data(data.filter(d => d.value !== null)).join("circle").attr("class", `chart-point chart-point-${id.replace(/\s+/g, '-')}`)
        .attr("cx", d => x(d.date)).attr("cy", d => y(d.value)).attr("r", 4)
        .attr("fill", d => d.sharedValue ? "url(#dual-color-gradient)" : serverColor)
        .on("mouseover", (event, d) => {
            const dateLabel = d3.timeFormat("%d %B %Y")(d.date);
            let tooltipHtml = "";

            if (useSpecialColors) {
                tooltipHtml = `<strong>${dateLabel}</strong>`;
                if (d.sharedValue) {
                    groupedData.forEach(([serverId, seriesData]) => {
                        const pointOnThisDate = seriesData.find(p => p.date.getTime() === d.date.getTime());
                        if (pointOnThisDate && pointOnThisDate.value !== null) {
                            tooltipHtml += `<div class="shared-tooltip-item">
                            <span class="shared-swatch" style="background:${specialColorScale(serverId)};"></span>
                            <span>${serverId}: ${pointOnThisDate.value}</span>
                            </div>`;
                        }
                    });
                } else {
                    const valueLabel = tooltipLabelMap[dataType];
                    tooltipHtml += `<div class="shared-tooltip-item">
                    <span class="shared-swatch" style="background:${specialColorScale(d.id)};"></span>
                    <span>${d.id}: ${d.value}</span>
                    </div>`;
                }
            } else {
                const valueLabel = tooltipLabelMap[dataType];
                const serverColor = getNodeColor(currentDataSet.nodes.find(n => n.id === d.id));
                tooltipHtml = `<strong style="color: ${serverColor};">${d.id}</strong><br><strong>${dateLabel}</strong><br>${valueLabel}: ${d.value}`;
            }

            tooltip.style("display", "block").html(tooltipHtml);
        }).on("mousemove", (event) => {
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode.offsetWidth;
            let left = event.pageX + 15;
            if (left + tooltipWidth > window.innerWidth) { left = event.pageX - tooltipWidth - 15; }
            tooltip.style("left", left + "px").style("top", (event.pageY - 28) + "px");
        }).on("mouseout", () => { tooltip.style("display", "none"); });
    });
}

function handleNodeClick(event, d) {
    const clickedNodeData = currentDataSet.nodes.find(n => n.id === d.id);
    if (!clickedNodeData) return;

    if (isCompareModeActive) {
        if (clickedNodeData.id !== firstServerToCompare.id) {
            secondServerToCompare = clickedNodeData;
            displayComparison(firstServerToCompare, secondServerToCompare);
            isCompareModeActive = false;
        }
        return;
    }

    if (currentlyHighlighted === clickedNodeData) {
        serverInfoPanel.style("display", "none");
        document.body.classList.remove('mobile-info-active');
        resetHighlight();
        currentlyHighlighted = null;
        return;
    }

    resetHighlight();
    exitCompareMode();

    currentlyHighlighted = clickedNodeData;
    displaySingleServer(clickedNodeData);

    const scale = 0.6; const targetX = d.x || window.innerWidth / 2; const targetY = d.y || window.innerHeight / 2;
    const transform = d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2).scale(scale).translate(-targetX, -targetY);
    svg.transition().duration(750).call(zoom_handler.transform, transform);
    startBlinking([clickedNodeData]);
}

function displaySingleServer(nodeData) {
    serverInfoPanel.style("display", "block");
    document.body.classList.add('mobile-info-active');
    d3.select("#single-server-view").classed("hidden", false);
    d3.select("#comparison-view").classed("hidden", true);
    d3.select("#comparison-prompt").classed("hidden", true);

    const partnershipsData = (nodeData.partnerships || []).map(pId => currentDataSet.nodes.find(n => n.id === pId)).filter(p => p).sort((a, b) => (b.members || 0) - (a.members || 0));
    d3.select("#serverInfo-name").style("color", getNodeColor(nodeData)).text(nodeData.id);
    d3.select("#serverInfo-stats").html(generateServerStatsHTML(nodeData));

    let partnershipsHtml = "";
    if (partnershipsData.length > 0) {
        partnershipsData.forEach(p => {
            const pCol = getNodeColor(p);
            const isVis = currentFilteredNodes.some(n => n.id === p.id);
            partnershipsHtml += `
            <li data-partner-id="${p.id}" data-visible="${isVis}">
            <span class="partner-name" style="color: ${isVis ? pCol : '#888'};">
            ${p.id} ${!isVis ? '<span style="font-size: 0.8em; color: #777;">[ukryty]</span>' : ''}
            </span>
            <span class="partner-stats">
            <span><span class="partner-icon">👥</span> ${p.members || 0}</span>
            <span><img src="images/boost-icon.png" alt="Boosty" class="partner-icon"> ${p.boosts || 0}</span>
            <span><span class="partner-icon">🤝</span> ${(p.partnerships || []).length}</span>
            </span></li>`;
        });
    } else {
        partnershipsHtml = `<li style="justify-content: center; background: none; color: #888;">Brak partnerstw</li>`;
    }
    d3.select("#serverInfo-partnerships-list").html(partnershipsHtml);

    drawServerHistoryChart([nodeData.id], 'members', false);
    highlightNodeAndLinks(nodeData);
}

function displayComparison(server1, server2) {
    d3.select("#single-server-view").classed("hidden", true);
    d3.select("#comparison-view").classed("hidden", false);
    resetHighlight();
    highlightNodeAndLinks(null, [server1.id, server2.id], true);
    startBlinking([server1, server2]);

    const specialColorScale = d3.scaleOrdinal().domain([server1.id, server2.id]).range(["#e41a1c", "#377eb8"]);

    d3.select("#compare-col-1").html(`<h2 style="color:${specialColorScale(server1.id)};">${server1.id}</h2>`);
    d3.select("#compare-col-2").html(`<h2 style="color:${specialColorScale(server2.id)};">${server2.id}</h2> <button id="remove-comparison-btn" title="Zakończ porównanie">×</button>`);

    d3.select("#remove-comparison-btn").on("click", () => {
        const primaryServer = currentlyHighlighted;
        exitCompareMode();
        displaySingleServer(primaryServer);
        highlightNodeAndLinks(primaryServer);
        startBlinking([primaryServer]);
    });

    d3.select("#compare-stats-1").html(generateServerStatsHTML(server1));
    d3.select("#compare-stats-2").html(generateServerStatsHTML(server2));

    drawServerHistoryChart([server1.id, server2.id], 'members', true);
}

function generateServerStatsHTML(nodeData) {
    const previousNodeData = previousDataSet.nodes.find(n => n.id === nodeData.id);
    const formatDelta = (delta) => {
        if (delta > 0) return `<span class="stat-delta positive">(+${delta})</span>`;
        if (delta < 0) return `<span class="stat-delta negative">(${delta})</span>`;
        return '';
    };

    let membersDeltaHtml = '', boostsDeltaHtml = '', partnershipsDeltaHtml = '';
    if (previousNodeData) {
        membersDeltaHtml = formatDelta((nodeData.members || 0) - (previousNodeData.members || 0));
        boostsDeltaHtml = formatDelta((nodeData.boosts || 0) - (previousNodeData.boosts || 0));
        partnershipsDeltaHtml = formatDelta((nodeData.partnerships || []).length - (previousNodeData.partnerships || []).length);
    }
    const creationDateObj = parseDateString(nodeData.creationDate);

    return `
    <div class="server-stat-line"><span class="stat-icon">🗓️</span><span class="stat-label">Założono:</span> ${formatDate(creationDateObj)}</div>
    <div class="server-stat-line"><span class="stat-icon">👥</span><span class="stat-label">Członkowie:</span> ${nodeData.members || 0} ${membersDeltaHtml}</div>
    <div class="server-stat-line"><span class="stat-icon"><img src="images/boost-icon.png" alt="Boosty"></span><span class="stat-label">Boosty:</span> ${nodeData.boosts || 0} ${boostsDeltaHtml}</div>
    <div class="server-stat-line"><span class="stat-icon">🤝</span><span class="stat-label">Partnerstwa:</span> ${(nodeData.partnerships || []).length} ${partnershipsDeltaHtml}</div>
    `;
}

function enterCompareMode() {
    isCompareModeActive = true;
    firstServerToCompare = currentlyHighlighted;
    d3.select("#comparison-prompt").classed("hidden", false);
    d3.select("#compare-button").text("Anuluj");
    highlightNodeAndLinks(firstServerToCompare, [], true);
}

function exitCompareMode() {
    isCompareModeActive = false;
    firstServerToCompare = null;
    secondServerToCompare = null;
    stopBlinking();
    d3.select("#single-server-view").classed("hidden", false);
    d3.select("#comparison-view").classed("hidden", true);
    d3.select("#comparison-prompt").classed("hidden", true);
    d3.select("#compare-button").text("[+] Porównaj");
    d3.select("#comparison-chart-container").html("").classed("hidden", true);
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

function highlightNodeAndLinks(d, additionalIds = [], noDim = false) {
    if (!d && additionalIds.length === 0) return;
    const mainId = d ? d.id : null;
    const highlightIds = new Set([mainId, ...additionalIds].filter(Boolean));
    let connectedNodeIds = new Set(highlightIds);
    if (d) {
        (d.partnerships || []).forEach(pId => connectedNodeIds.add(pId));
        currentDataSet.nodes.forEach(n => { if((n.partnerships || []).includes(d.id)) connectedNodeIds.add(n.id); });
    }

    const visibleNodeIds = new Set(currentFilteredNodes.map(n => n.id));
    g.selectAll(".node").classed("dimmed", n => !noDim && visibleNodeIds.has(n.id) && !connectedNodeIds.has(n.id))
    .style("stroke", n => highlightIds.has(n.id) ? "white" : null)
    .style("stroke-width", n => highlightIds.has(n.id) ? 2 : null);

    g.selectAll(".link").classed("hidden", l => {
        if (noDim) return false;
        const srcId = l.source?.id||l.source; const tgtId = l.target?.id||l.target;
        return !visibleNodeIds.has(srcId) || !visibleNodeIds.has(tgtId) || !(connectedNodeIds.has(srcId) && connectedNodeIds.has(tgtId));
    }).classed("hovered", false);

    g.selectAll(".node-label").classed("hidden", lbl => !noDim && !(visibleNodeIds.has(lbl.id) && connectedNodeIds.has(lbl.id)));
}

function highlightHovered(d, isHovering) {
    if (!d) return;
    const nodeElement = g.selectAll(".node").filter(node => node && node.id === d.id);
    const connectedLinks = g.selectAll(".link").filter(l => (l.source?.id || l.source) === d.id || (l.target?.id || l.target) === d.id);

    if (isHovering) {
        nodeElement.classed("table-hovered", true);
        connectedLinks.classed("hovered", true);
    } else {
        nodeElement.classed("table-hovered", false);
        connectedLinks.classed("hovered", false);
        if (currentlyHighlighted) {
            const noDimming = isCompareModeActive || !!secondServerToCompare;
            highlightNodeAndLinks(currentlyHighlighted, secondServerToCompare ? [secondServerToCompare.id] : [], noDimming);
        } else {
            resetHighlight();
        }
    }
    d3.selectAll("#serverTableBody tr").filter(rd => rd && rd.id === d.id).classed("table-row-hovered", isHovering);
    if (currentlyHighlighted) {
        d3.select("#serverInfo-partnerships-list").selectAll("li").classed("partner-hovered", function() {
            return isHovering && d3.select(this).attr("data-partner-id") === d.id;
        });
    }
}

function resetHighlight() {
    g.selectAll(".node").classed("dimmed", false).classed("table-hovered", false).style("stroke", null).style("stroke-width", null);
    g.selectAll(".link").classed("hidden", false).classed("hovered", false);
    g.selectAll(".node-label").classed("hidden", false);
    stopBlinking();
}

function startBlinking(nodesToBlink) {
    stopBlinking();
    blinkingNodes = nodesToBlink;
    if (blinkingNodes.length === 0) return;

    function blink() {
        if (blinkingNodes.length === 0 || !radiusScale) return;

        const transitions = [];
        blinkingNodes.forEach(nodeData => {
            const node = g.selectAll(".node").filter(d => d.id === nodeData.id);
            if(!node.empty()) {
                const r = radiusScale(nodeData.members || 0);
                const t = node.transition("blinking").duration(500).attr("r", r * 0.7).transition("blinking").duration(500).attr("r", r);
                transitions.push(t.end());
            }
        });

        if (transitions.length > 0) {
            Promise.all(transitions).then(() => {
                if (blinkingNodes.length > 0) {
                    blink();
                }
            }).catch(() => {});
        }
    }
    blink();
}

function stopBlinking() {
    if (blinkingNodes.length > 0) {
        blinkingNodes.forEach(nodeData => {
            const node = g.selectAll(".node").filter(d => d && d.id === nodeData.id);
            if (!node.empty() && radiusScale) {
                node.interrupt("blinking").transition("stopBlinking").duration(100).attr("r", radiusScale(nodeData.members || 0));
            }
        });
    }
    blinkingNodes = [];
}

function handleNodeMouseOver(event, d) {
    if (!d || !event || event.target.tagName !== 'circle') return;
    const tooltip = d3.select(".tooltip");
    const fullDataNode = currentDataSet.nodes.find(n => n.id === d.id);
    if (fullDataNode) {
        tooltip.html(`
        <div class="tooltip-title" style="color: ${getNodeColor(fullDataNode)};">${fullDataNode.id}</div>
        <div class="tooltip-stat"><span class="tooltip-icon">🗓️</span><span class="tooltip-label">Data założenia:</span> ${formatDate(parseDateString(fullDataNode.creationDate))}</div>
        <div class="tooltip-stat"><span class="tooltip-icon">👥</span><span class="tooltip-label">Członkowie:</span> ${fullDataNode.members || 0}</div>
        <div class="tooltip-stat"><span class="tooltip-icon"><img src="images/boost-icon.png" alt="Boosty"></span><span class="tooltip-label">Boosty:</span> ${fullDataNode.boosts || 0}</div>
        <div class="tooltip-stat"><span class="tooltip-icon">🤝</span><span class="tooltip-label">Partnerstwa:</span> ${(fullDataNode.partnerships || []).length}</div>
        `).style("display", "block");
        const tooltipNode = tooltip.node();
        let left = event.pageX + 15, top = event.pageY + 15;
        if (left + tooltipNode.offsetWidth > window.innerWidth) { left = event.pageX - tooltipNode.offsetWidth - 15; }
        if (top + tooltipNode.offsetHeight > window.innerHeight) { top = event.pageY - tooltipNode.offsetHeight - 15; }
        tooltip.style("left", left + "px").style("top", top + "px");
    } else {
        tooltip.style("display", "none");
    }
    highlightHovered(d, true);
}

function handleNodeMouseOut(event, d) {
    if (!d) return;
    d3.select(".tooltip").style("display", "none");
    highlightHovered(d, false);
}
