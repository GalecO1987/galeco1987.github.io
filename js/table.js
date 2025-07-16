function updateTableFilter() {
    if (!currentFilteredNodes) return;
    const searchTerm = searchInput.node() ? searchInput.property("value").toLowerCase() : "";
    updateServerTable(currentFilteredNodes, searchTerm);
}

function calculateRanks(nodes) {
    if (!nodes || nodes.length === 0) return; const nodesToSort = nodes.map(n => ({...n}));
    const sortByMembers = [...nodesToSort].sort((a, b) => (b.members || 0) - (a.members || 0)); sortByMembers.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.memberRank = index + 1; });
    const sortByBoosts = [...nodesToSort].sort((a, b) => (b.boosts || 0) - (a.boosts || 0)); sortByBoosts.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.boostRank = index + 1; });
    const sortByPartnerships = [...nodesToSort].sort((a, b) => (b.partnerships || []).length - (a.partnerships || []).length); sortByPartnerships.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.partnershipRank = index + 1; });
    const sortByCreationDate = [...nodesToSort].sort((a, b) => (parseDateString(a.creationDate) || new Date(8.64e15)) - (parseDateString(b.creationDate) || new Date(8.64e15)));
    sortByCreationDate.forEach((node, index) => { const originalNode = nodes.find(n => n.id === node.id); if (originalNode) originalNode.creationDateRank = index + 1; });
}

function updateServerTable(nodesForTable, searchTerm = "") {
    const nodesToDisplay = nodesForTable.filter(node => node.id.toLowerCase().includes(searchTerm));
    const sortedNodes = [...nodesToDisplay].sort((a, b) => {
        let valA, valB;
        switch (currentSortKey) {
            case 'id':
                valA = a.id.toLowerCase(); valB = b.id.toLowerCase();
                break;
            case 'creationDate':
                valA = parseDateString(a.creationDate); valB = parseDateString(b.creationDate);
                if (valA === null) valA = (currentSortDirection === 'asc' ? new Date(8.64e15) : new Date(-8.64e15));
                if (valB === null) valB = (currentSortDirection === 'asc' ? new Date(8.64e15) : new Date(-8.64e15));
                break;
            case 'members': valA = a.members || 0; valB = b.members || 0; break;
            case 'boosts': valA = a.boosts || 0; valB = b.boosts || 0; break;
            case 'partnerships': valA = (a.partnerships || []).length; valB = (b.partnerships || []).length; break;
            default: return 0;
        }
        if (currentSortDirection === 'asc') {
            return typeof valA === 'string' ? valA.localeCompare(valB) : (valA instanceof Date ? valA - valB : valA - valB);
        } else {
            return typeof valA === 'string' ? valB.localeCompare(valA) : (valB instanceof Date ? valB - valA : valB - valA);
        }
    });

    serverTableBody.html("");
    visibleServerCountSpan.text(sortedNodes.length);

    serverTableHeaders.each(function() {
        const h = d3.select(this);
        const sk = h.attr('data-sort-by');
        const as = h.select('.sort-arrow');
        if (!as.node() || h.classed('non-sortable')) return;
        if (sk === currentSortKey) {
            h.classed('sorted', true);
            as.text(currentSortDirection === 'asc' ? '▲' : '▼');
        } else {
            h.classed('sorted', false);
            as.text('');
        }
    });

    sortedNodes.forEach((node, index) => {
        const row = serverTableBody.append("tr").datum(node).classed("table-row-highlighted-search", false);
        row.append("td").text(`#${index + 1}`);
        row.append("td").text(node.id).attr("title", node.id);
        row.append("td").text(formatDate(parseDateString(node.creationDate)));
        row.append("td").html(`<span>👥 ${node.members || 0}</span>`);
        row.append("td").html(`<span style="display:inline-flex; align-items:center;"><img src="images/boost-icon.png" style="height:1em; margin-right: 5px;"> ${node.boosts || 0}</span>`);
        row.append("td").html(`<span>🤝 ${(node.partnerships || []).length}</span>`);

        row.on("click", (event, d) => {
            const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id);
            if (nodeOnMap) { handleNodeClick(event, nodeOnMap); } else { searchServer(d.id); }
        });
        row.on("mouseover", (event, d) => {
            hoveredTableRowNodeId = d.id;
            const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id);
            if (nodeOnMap) highlightHovered(nodeOnMap, true);
        });
            row.on("mouseout", (event, d) => {
                if (hoveredTableRowNodeId === d.id) hoveredTableRowNodeId = null;
                const nodeOnMap = currentFilteredNodes.find(n => n.id === d.id);
                if (nodeOnMap) highlightHovered(nodeOnMap, false);
            });
    });
}

function handleSortClick(event) {
    const header = d3.select(this); const sortKey = header.attr('data-sort-by'); if (!sortKey) return;
    if (sortKey === currentSortKey) { currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc'; } else { currentSortKey = sortKey; currentSortDirection = 'desc'; }
    const searchTerm = searchInput.node() ? searchInput.property("value").toLowerCase() : "";
    updateServerTable(currentFilteredNodes, searchTerm);
}
