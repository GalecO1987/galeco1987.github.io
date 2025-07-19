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
    updateURLWithCurrentState();
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
    updateURLWithCurrentState();
}

function handleTrackClick(event) {
    if (event.target.type === 'range') return;
    const container = event.currentTarget;
    const minInput = d3.select(container).select(".range-min");
    const maxInput = d3.select(container).select(".range-max");
    const track = container.querySelector('.range-track');
    if (!minInput.node() || !maxInput.node() || !track) return;
    const inputId = minInput.attr('id') || maxInput.attr('id');
    const isDateFilter = inputId && inputId.toLowerCase().includes('datefilter');
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
        let nodeDateObj = parseDateString(d.creationDate);
        if (!nodeDateObj) return false;
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
    updateSummaryStats(currentFilteredNodes);
    updateTrendRankings(currentTrendMetric);

    const filteredNodeIds = new Set(currentFilteredNodes.map(d => d.id));
    const filteredLinks = currentDataSet.links.filter(l => {
        const sourceId = l.source?.id || l.source; const targetId = l.target?.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
    updateServerTable(currentFilteredNodes, currentFilterValues.searchTerm);
    drawGraph(currentFilteredNodes, filteredLinks, 0.1, 250);
    if (currentlyHighlighted && !filteredNodeIds.has(currentlyHighlighted.id)) {
        serverInfoPanel.style("display", "none"); resetHighlight(); currentlyHighlighted = null;
    } else if (currentlyHighlighted) {
        highlightNodeAndLinks(currentlyHighlighted);
        if(blinkingNodes.length > 0 && blinkingNodes[0].id === currentlyHighlighted.id) startBlinking([currentlyHighlighted]);
    }
}
