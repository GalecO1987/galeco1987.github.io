function initializeVisualization(dataSet, versionInfo) {
    currentDataSet = dataSet;

    if (!currentDataSet.nodes) currentDataSet.nodes = [];
    if (!currentDataSet.links) currentDataSet.links = [];
    currentDataSet.links = [];

    const previousNodesById = new Map((previousDataSet.nodes || []).map(node => [node.id, node]));

    currentDataSet.nodes.forEach(node => {
        if (node.creationDate) { node.creationDate = convertDateFormat(node.creationDate); }
        else { node.creationDate = "??-??-????"; }
        node.members = Number(node.members) || 0;
        node.boosts = Number(node.boosts) || 0;

        const prevNode = previousNodesById.get(node.id);
        if(prevNode) {
            const membersDiff = node.members - (prevNode.members || 0);
            const boostsDiff = node.boosts - (prevNode.boosts || 0);

            node.memberTrend = membersDiff > 0 ? 'growth' : (membersDiff < 0 ? 'decline' : 'stable');
            node.boostTrend = boostsDiff > 0 ? 'growth' : (boostsDiff < 0 ? 'decline' : 'stable');
        } else {
            node.memberTrend = 'stable';
            node.boostTrend = 'stable';
        }

        if (!node.partnerships || !Array.isArray(node.partnerships)) { node.partnerships = []; }
        node.partnerships.forEach(partnerId => {
            const partner = currentDataSet.nodes.find(n => n.id === partnerId);
            if (partner) {
                const linkExists = currentDataSet.links.some(l =>
                (l.source === node.id && l.target === partnerId) || (l.source === partnerId && l.target === node.id) ||
                (l.source.id === node.id && l.target.id === partnerId) || (l.source.id === partnerId && l.target.id === node.id)
                );
                if (!linkExists) {
                    const newLink = { source: node.id, target: partnerId, weight: (node.members || 0) + (partner.members || 0) };
                    currentDataSet.links.push(newLink);
                }
            }
        });
    });

    currentDataSet.nodes.forEach(node => {
        let score = 0;
        (node.partnerships || []).forEach(partnerId => {
            const partner = currentDataSet.nodes.find(p => p.id === partnerId);
            if(partner) {
                score += partner.members;
            }
        });
        node.influenceScore = score;
    });

    initializeScales();
    updateColorLegend();
    calculateFilterRanges();
    initializeFilters();
    calculateRanks(currentDataSet.nodes);

    currentFilteredNodes = [...currentDataSet.nodes];
    currentlyHighlighted = null;
    blinkingNodes = [];
    hoveredTableRowNodeId = null;
    serverInfoPanel.style("display", "none");
    searchInput.property("value", "");
    currentSortKey = 'members';
    currentSortDirection = 'desc';

    updateServerTable(currentFilteredNodes);

    setupSVGAndView();
    setupSimulation();

    currentDataSet.nodes.forEach(node => {
        node.x = undefined;
        node.y = undefined;
        node.vx = undefined;
        node.vy = undefined;
        node.fx = null;
        node.fy = null;
    });
    drawGraph(currentDataSet.nodes, currentDataSet.links, 1, 1500);

    populateDataVersionSelector(versionInfo.file);
}

function initializeScales() {
    const maxBoosts = d3.max(currentDataSet.nodes, d => d.boosts || 0);

    if (maxBoosts > 0) {
        boostColorScale = d3.scaleLinear()
        .domain([
            0,
            Math.ceil(maxBoosts * 0.25),
                Math.ceil(maxBoosts * 0.5),
                Math.ceil(maxBoosts * 0.75),
                maxBoosts
        ])
        .range(['#f0f0f0', '#ffeb3b', '#ff9800', '#dc3545', '#8b0000'])
        .clamp(true);
    } else {
        boostColorScale = () => '#f0f0f0';
    }

    const now = currentDataDate;
    const oneYearAgo = new Date(new Date(now).setFullYear(now.getFullYear() - 1)).getTime();
    const twoYearsAgo = new Date(new Date(now).setFullYear(now.getFullYear() - 2)).getTime();
    const fourYearsAgo = new Date(new Date(now).setFullYear(now.getFullYear() - 4)).getTime();
    const sixYearsAgo = new Date(new Date(now).setFullYear(now.getFullYear() - 6)).getTime();

    ageColorScale = d3.scaleThreshold()
    .domain([oneYearAgo, twoYearsAgo, fourYearsAgo, sixYearsAgo].reverse())
    .range(['#410159', '#ad00fc', '#306aff', '#45d6ff', '#ffffff']);

    partnershipColorScale = d3.scaleThreshold()
    .domain([1, 5, 10, 15])
    .range(['#0b0c10', '#1f2833', '#3b8d99', '#66fcf1', '#ffffff']);

    const maxInfluence = d3.max(currentDataSet.nodes, d => d.influenceScore || 0);
    influenceColorScale = d3.scaleSequential(d3.interpolateInferno)
    .domain([0, maxInfluence > 0 ? maxInfluence : 1]);

    const maxLinkWeight = d3.max(currentDataSet.links, l => l.weight || 0);
    linkWeightScale = d3.scaleLinear().domain([0, maxLinkWeight]).range([1, 5]).clamp(true);
}

function updateColorLegend() {
    const legendBoosts = colorLegend.select(".legend-boosts");
    const legendAge = colorLegend.select(".legend-age").classed('horizontal-legend', true);
    const legendPartnerships = colorLegend.select(".legend-partnerships").classed('horizontal-legend', true);
    const legendInfluence = colorLegend.select(".legend-influence");

    legendBoosts.html("");
    legendAge.html("");
    legendPartnerships.html("");
    legendInfluence.html("");

    legendBoosts.append('div').attr('class', 'legend-title').text('Boosty');
    const boostDomain = boostColorScale.domain ? boostColorScale.domain() : [0];
    const boostRange = boostColorScale.range ? boostColorScale.range() : ['#f0f0f0'];
    legendBoosts.append('div')
    .attr('class', 'legend-gradient-bar')
    .style('background', `linear-gradient(to right, ${boostRange.join(', ')})`);
    const boostLabelsHtml = boostDomain.map(d => `<span>${d}</span>`).join('');
    legendBoosts.append('div')
    .attr('class', 'legend-gradient-labels')
    .html(boostLabelsHtml);

    legendAge.append('div').attr('class', 'legend-title').text('Wiek serwera');
    const ageRange = ageColorScale.range();
    const ageLabels = ["< 1 roku", "1-2 lat", "2-4 lat", "4-6 lat", "> 6 lat"];
    ageRange.slice().reverse().forEach((color, i) => {
        const item = legendAge.append('div').attr('class', 'legend-item');
        item.append('span').attr('class', 'legend-swatch').style('background-color', color);
        item.append('span').text(ageLabels[i]);
    });

    legendPartnerships.append('div').attr('class', 'legend-title').text('Partnerstwa');
    const partnershipDomain = partnershipColorScale.domain();
    const partnershipRange = partnershipColorScale.range();
    partnershipRange.forEach((color, i) => {
        let label = "";
        if (i === 0) {
            label = "0";
        } else if (i === partnershipRange.length - 1) {
            label = `≥ ${partnershipDomain[i - 1]}`;
        } else {
            const min = partnershipDomain[i - 1];
            const max = partnershipDomain[i] - 1;
            label = (min === max) ? `${min}` : `${min}-${max}`;
        }
        const item = legendPartnerships.append('div').attr('class', 'legend-item');
        item.append('span').attr('class', 'legend-swatch').style('background-color', color);
        item.append('span').text(label);
    });

    legendInfluence.append('div').attr('class', 'legend-title').text('Wpływ (suma członków partnerów)');
    const influenceDomain = influenceColorScale.domain();
    const gradientColors = d3.range(0, 1.01, 0.1).map(t => d3.interpolateInferno(t));
    legendInfluence.append('div')
    .attr('class', 'legend-gradient-bar')
    .style('background', `linear-gradient(to right, ${gradientColors.join(', ')})`);
    legendInfluence.append('div')
    .attr('class', 'legend-gradient-labels')
    .html(`<span>0</span><span>${Math.round(influenceDomain[1])}</span>`);

}

function updateNodeColors() {
    const nodes = g.selectAll(".node");
    const labels = g.selectAll(".node-label");

    if (currentColoringMode === 'trend') {
        const fillColors = { growth: '#2e7d32', decline: '#c62828', stable: '#333' };
        const strokeColors = { growth: '#66bb6a', decline: '#ef5350', stable: '#ccc' };

        nodes.transition().duration(500)
        .attr("fill", d => fillColors[d.memberTrend])
        .attr("stroke", d => strokeColors[d.boostTrend])
        .attr("stroke-width", d => d.boostTrend === 'stable' ? 1 : 3);

        labels.transition().duration(500)
        .attr("fill", d => fillColors[d.memberTrend])
        .attr("stroke", d => strokeColors[d.boostTrend])
        .attr("stroke-width", d => d.boostTrend === 'stable' ? 0.5 : 1);

    } else {
        nodes.transition().duration(500)
        .attr("fill", d => getNodeColor(d))
        .attr("stroke", null)
        .attr("stroke-width", null);

        labels.transition().duration(500)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5);
    }

    if (currentlyHighlighted && !secondServerToCompare) {
        d3.select("#serverInfo-name").style("color", getNodeColor(currentlyHighlighted));
        d3.select("#serverInfo-partnerships-list").selectAll('li').each(function() {
            const li = d3.select(this);
            const partnerId = li.attr('data-partner-id');
            const partnerNode = currentDataSet.nodes.find(n => n.id === partnerId);
            if (partnerNode) {
                const isVisible = li.attr('data-visible') === 'true';
                li.select('.partner-name').style('color', isVisible ? getNodeColor(partnerNode) : '#888');
            }
        });
    }
}


function calculateFilterRanges() {
    const validDates = currentDataSet.nodes
    .map(d => parseDateString(d.creationDate))
    .filter(d => d !== null);
    if (validDates.length > 0) {
        minDateObj = new Date(d3.min(validDates));
        maxDateObj = new Date(d3.max(validDates));
        if (!(minDateObj instanceof Date) || isNaN(minDateObj)) minDateObj = new Date();
        if (!(maxDateObj instanceof Date) || isNaN(maxDateObj)) maxDateObj = new Date();
        if (minDateObj > maxDateObj)[minDateObj, maxDateObj] = [maxDateObj, minDateObj];
        dateRange = (maxDateObj - minDateObj) / (1000 * 60 * 60 * 24);
        if (isNaN(dateRange) || dateRange < 0) dateRange = 0;
    } else {
        minDateObj = new Date();
        maxDateObj = new Date();
        dateRange = 0;
    }
}

function setupSVGAndView() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    const maxMembersValue = d3.max(currentDataSet.nodes, d => d.members);
    const radiusDomain = maxMembersValue > 0 ? [0, maxMembersValue] : [0, 1];
    radiusScale = d3.scaleSqrt().domain(radiusDomain).range([10, 50]);
    initialZoom = 0.09;
    initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(initialZoom).translate(-width / 2, -height / 2);
    zoom_handler = d3.zoom().scaleExtent([0.1, 8]).on("zoom", (event) => {
        g.attr("transform", event.transform);
    });
    svg.call(zoom_handler).call(zoom_handler.transform, initialTransform);
    svg.on("click", (event) => {
        const clickedOnNode = event.target.closest('.node');
        const clickedOnServerInfo = event.target.closest('#serverInfo');
        const clickedOnLeftPanel = event.target.closest('#leftPanel');
        if (!clickedOnNode && !clickedOnServerInfo && !clickedOnLeftPanel) {
            if (currentlyHighlighted) {
                serverInfoPanel.style("display", "none");
                document.body.classList.remove('mobile-info-active');
                resetHighlight();
                currentlyHighlighted = null;
                exitCompareMode();
                if (wasSummaryPanelOpen) {
                    summaryPanel.classed("temporarily-hidden", false);
                    wasSummaryPanelOpen = false;
                }
                updateURLWithCurrentState();
            }
        }
    });
}

function setupSimulation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!currentDataSet || currentDataSet.nodes.length === 0) {
        simulation = {
            nodes: () => simulation,
            force: () => simulation,
                alpha: () => simulation,
                restart: () => {},
                on: () => simulation,
                stop: () => {}
        };
        return;
    }
    if (!radiusScale) {
        return;
    }
    simulation = d3.forceSimulation(currentDataSet.nodes)
    .force("link", d3.forceLink(currentDataSet.links).id(d => d.id).distance(150).strength(0.1))
    .force("charge", d3.forceManyBody().strength(-1500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => radiusScale(d.members || 0) + 5))
    .alphaDecay(0.0228).alphaMin(0.001)
    .on("tick", ticked);
}

function drawGraph(nodesToDraw, linksToDraw, initialAlpha = 1, stopDelay = 1000) {
    g.selectAll("*").remove();
    if (!simulation || !nodesToDraw || nodesToDraw.length === 0) return;
    if (!radiusScale) { return; }

    const filteredNodeIds = new Set(nodesToDraw.map(n => n.id));
    const validLinks = currentDataSet.links.filter(l => {
        const sourceId = l.source?.id || l.source;
        const targetId = l.target?.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    nodesToDraw.forEach(node => { node.fx = null; node.fy = null; });

    simulation.nodes(nodesToDraw);
    if (simulation.force("link")) {
        simulation.force("link").links(validLinks);
    }

    const link = g.append("g").attr("class", "links").selectAll("line")
    .data(validLinks, d => `${d.source?.id || d.source}-${d.target?.id || d.target}`)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", d => linkWeightScale(d.weight));

    const node = g.append("g").attr("class", "nodes").selectAll("circle")
    .data(nodesToDraw, d => d.id)
    .join("circle").attr("class", "node").attr("r", d => radiusScale(d.members || 0))
    .on("click", handleNodeClick)
    .on("mouseover", handleNodeMouseOver).on("mouseout", handleNodeMouseOut);

    updateNodeColors();

    const label = g.append("g").attr("class", "labels").selectAll("text")
    .data(nodesToDraw, d => d.id)
    .join("text").attr("class", "node-label").text(d => d.id);

    simulation.alpha(initialAlpha).restart();

    clearTimeout(freezeTimer);
    if (stopDelay > 0 && simulation.stop) {
        freezeTimer = setTimeout(() => {
            simulation.stop();
        }, stopDelay);
    } else if (stopDelay <= 0 && simulation.stop) {
        simulation.stop();
    }
}

function ticked() {
    if (!radiusScale) return;
    g.selectAll(".node").attr("cx", d => d.x).attr("cy", d => d.y);
    g.selectAll(".link").filter(d => d.source && d.target).attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    g.selectAll(".node-label").attr("x", d => d.x).attr("y", d => d.y - radiusScale(d.members || 0) - 5);
}
