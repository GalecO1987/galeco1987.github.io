let currentTrendMetric = 'members';

function initSummaryPanel() {
    d3.select("#trend-rank-controls").selectAll(".trend-toggle-btn").on("click", function() {
        d3.selectAll(".trend-toggle-btn").classed("active", false);
        d3.select(this).classed("active", true);
        currentTrendMetric = d3.select(this).attr("data-trend");
        drawSummaryChart(currentTrendMetric);
        updateTrendRankings(currentTrendMetric);
        updateURLWithCurrentState();
    });

    if (window.innerWidth > 768) {
        drawSummaryChart(currentTrendMetric);
    }
}

function updateSummaryStats(visibleNodes) {
    const totalMembers = d3.sum(visibleNodes, d => d.members);
    const totalBoosts = d3.sum(visibleNodes, d => d.boosts);
    const totalPartnerships = d3.sum(visibleNodes, d => (d.partnerships || []).length);
    const avgMembers = visibleNodes.length > 0 ? Math.round(totalMembers / visibleNodes.length) : 0;

    d3.select("#stat-total-members").text(totalMembers);
    d3.select("#stat-avg-members").text(avgMembers);
    d3.select("#stat-total-boosts").text(totalBoosts);
    d3.select("#stat-total-partnerships").text(totalPartnerships);
}

function drawSummaryChart(metric) {
    const chartDiv = d3.select("#summary-chart");
    chartDiv.html("");

    const metricKeyMap = { members: 'members', boosts: 'boosts', partnerships: 'partnerships' };
    const key = metricKeyMap[metric];

    const historyData = [];
    const dateParser = d3.timeParse("%Y-%m-%d");

    for (const [date, dataSet] of allData.entries()) {
        if (dateParser(date) > currentDataDate) continue;
        let total = 0;
        if (key === 'partnerships') {
            total = d3.sum(dataSet.nodes, d => (d.partnerships || []).length);
        } else {
            total = d3.sum(dataSet.nodes, d => d[key] || 0);
        }
        historyData.push({ date: dateParser(date), value: total });
    }

    historyData.sort((a, b) => a.date - b.date);

    for (let i = 0; i < historyData.length; i++) {
        if (i > 0 && historyData[i].value !== null && historyData[i-1].value !== null) {
            const diff = historyData[i].value - historyData[i-1].value;
            historyData[i].diff = diff;
            historyData[i].trend = diff > 0 ? 'growth' : (diff < 0 ? 'decline' : 'stable');
        } else {
            historyData[i].diff = 0;
            historyData[i].trend = 'stable';
        }
    }

    if (historyData.length < 2) return;

    const margin = {top: 10, right: 15, bottom: 25, left: 50};
    const axisPadding = 25;
    const pointWidth = 60;
    const containerWidth = chartDiv.node().getBoundingClientRect().width;
    const dynamicWidth = Math.max(containerWidth - margin.left - margin.right, historyData.length * pointWidth);
    const height = chartDiv.node().getBoundingClientRect().height - margin.top - margin.bottom;

    chartDiv.html(`
    <div class="chart-wrapper">
    <svg class="y-axis-svg"></svg>
    <div class="scroll-container">
    <svg class="main-chart-svg"></svg>
    </div>
    </div>
    `);

    const yAxisSvg = chartDiv.select(".y-axis-svg").attr("width", margin.left).attr("height", height + margin.top + margin.bottom);
    const scrollContainer = chartDiv.select(".scroll-container");
    const mainChartSvg = scrollContainer.select(".main-chart-svg").attr("width", dynamicWidth + axisPadding * 2).attr("height", height + margin.top + margin.bottom);

    const gY = yAxisSvg.append("g").attr("transform", `translate(${margin.left - 1},${margin.top})`);
    const gMain = mainChartSvg.append("g").attr("transform", `translate(${axisPadding},${margin.top})`);

    const x = d3.scaleTime().domain(d3.extent(historyData, d => d.date)).range([0, dynamicWidth]);
    const [yMin, yMax] = d3.extent(historyData, d => d.value);
    const yPadding = (yMax - yMin) * 0.15 || 1;
    const y = d3.scaleLinear().domain([Math.max(0, yMin - yPadding), yMax + yPadding]).range([height, 0]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b '%y"));
    if (historyData.length > 1 && historyData.length <= 5) {
        xAxis.tickValues(historyData.map(d => d.date));
    } else {
        xAxis.ticks(Math.min(historyData.length, 10));
    }

    gMain.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

    gY.call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("~s")));

    const line = d3.line().x(d => x(d.date)).y(d => y(d.value));

    gMain.append("path").datum(historyData).attr("class", "chart-line").attr("d", line);

    const tooltipLabelMap = { members: 'Suma członków', boosts: 'Suma boostów', partnerships: 'Suma partnerstw' };

    gMain.selectAll(".chart-point").data(historyData).join("circle").attr("class", "chart-point")
    .attr("cx", d => x(d.date)).attr("cy", d => y(d.value)).attr("r", 4)
    .on("mouseover", (event, d) => {
        const dateLabel = d3.timeFormat("%d %B %Y")(d.date);
        const valueLabel = tooltipLabelMap[metric];
        const tooltipHtml = `<strong>${dateLabel}</strong><br>${valueLabel}: ${d.value} ${formatDelta(d.diff)}`;
        tooltip.style("display", "block").html(tooltipHtml);
    })
    .on("mousemove", (event) => {
        const tooltipNode = tooltip.node();
        const tooltipWidth = tooltipNode.offsetWidth;
        let left = event.pageX + 15;
        if (left + tooltipWidth > window.innerWidth) { left = event.pageX - tooltipWidth - 15; }
        tooltip.style("left", left + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("display", "none");
    });

    const trendSymbol = d3.symbol().type(d3.symbolTriangle).size(25);
    const trendFillColor = { growth: '#4CAF50', decline: '#f44336' };

    gMain.selectAll(".trend-indicator").data(historyData.filter(d => d.trend && d.trend !== 'stable'))
    .join("path").attr("d", trendSymbol).attr("class", "trend-indicator")
    .attr("fill", d => trendFillColor[d.trend])
    .attr("transform", d => `translate(${x(d.date)}, ${y(d.value) - 8}) ${d.trend === 'decline' ? 'rotate(180)' : 'rotate(0)'}`);

    const scrollNode = scrollContainer.node();
    if (scrollNode) {
        scrollNode.scrollLeft = scrollNode.scrollWidth - scrollNode.clientWidth;
    }
}


function updateTrendRankings(metric = currentTrendMetric) {
    const tableBody = d3.select("#trend-rank-table-body");
    tableBody.html("");

    const diffs = currentDataSet.nodes.map(node => {
        const prevNode = previousDataSet.nodes.find(p => p.id === node.id);
        if (!prevNode) {
            return { id: node.id, membersDiff: 0, boostsDiff: 0, partnershipsDiff: 0 };
        }
        return {
            id: node.id,
            membersDiff: (node.members || 0) - (prevNode.members || 0),
                                           boostsDiff: (node.boosts || 0) - (prevNode.boosts || 0),
                                           partnershipsDiff: (node.partnerships || []).length - (prevNode.partnerships || []).length
        };
    });

    const metricKeyMap = {
        members: 'membersDiff',
        boosts: 'boostsDiff',
        partnerships: 'partnershipsDiff'
    };
    const diffKey = metricKeyMap[metric];

    const sorted = diffs.filter(d => d[diffKey] !== 0).sort((a, b) => b[diffKey] - a[diffKey]);

    if (sorted.length === 0) {
        const row = tableBody.append("tr");
        row.append("td")
        .attr("colspan", 3)
        .style("text-align", "center")
        .text("Brak zmian w tym miesiącu");
        return;
    }

    sorted.forEach((d, i) => {
        const serverNode = currentDataSet.nodes.find(n => n.id === d.id);
        if (!serverNode) return;

        const diff = d[diffKey];
        const row = tableBody.append("tr");

        row.append("td").text(`${i + 1}.`);

        const serverNameSpan = row.append("td")
        .append("span")
        .attr("class", "server-name")
        .style("color", getNodeColor(serverNode))
        .text(d.id)
        .on("click", () => {
            searchServer(d.id);
            summaryPanel.classed("temporarily-hidden", true);
        });

        if (currentColoringMode === 'trend') {
            const strokeColors = { growth: '#66bb6a', decline: '#ef5350', stable: 'transparent' };
            const strokeColor = strokeColors[serverNode.boostTrend];
            serverNameSpan
            .style("-webkit-text-stroke", `0.3px ${strokeColor}`)
            .style("text-stroke", `0.3px ${strokeColor}`);
        } else {
            serverNameSpan
            .style("-webkit-text-stroke", null)
            .style("text-stroke", null);
        }

        row.append("td")
        .attr("class", `trend-value ${diff > 0 ? 'positive' : 'negative'}`)
        .text(diff > 0 ? `+${diff}` : diff);
    });
}
