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
    if (!dateObj || isNaN(dateObj.getTime())) return "-";
    try {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        if (year < 1970 || year > 2100) return "-";
        return `${day}.${month}.${year}`;
    } catch (e) {
        return "-";
    }
}

function getNodeColor(node, mode) {
    const effectiveMode = mode || currentColoringMode;
    switch (effectiveMode) {
        case 'boosts':
            return boostColorScale ? boostColorScale(node.boosts || 0) : '#ccc';
        case 'age':
            const date = parseDateString(node.creationDate);
            return ageColorScale && date ? ageColorScale(date.getTime()) : '#ccc';
        case 'partnerships':
            const partnershipCount = (node.partnerships || []).length;
            return partnershipColorScale ? partnershipColorScale(partnershipCount) : '#ccc';
        case 'influence':
            return influenceColorScale ? influenceColorScale(node.influenceScore || 0) : '#ccc';
        case 'trend':
            const fillColors = { growth: '#2e7d32', decline: '#c62828', stable: '#333' };
            return fillColors[node.memberTrend] || '#333';
        default:
            return '#ccc';
    }
}

function parseDateString(dateStr_DDMMYYYY) {
    if (typeof dateStr_DDMMYYYY !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(dateStr_DDMMYYYY)) {
        return null;
    }
    const parts = dateStr_DDMMYYYY.split('-');
    const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return !isNaN(dateObj.getTime()) ? dateObj : null;
}

function sanitizeForClass(id) {
    if (typeof id !== 'string') return '';
    return id.replace(/[^a-zA-Z0-9-]/g, '_');
}

function getStateFromURL() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const state = JSON.parse(JSON.stringify(defaultState));

    if (params.has('data')) state.dataVersion = params.get('data');
    if (params.has('color')) state.colorMode = params.get('color');
    if (params.has('server')) state.selectedServer = params.get('server');
    if (params.has('chart')) state.chartType = params.get('chart');
    if (params.has('sort')) state.sortKey = params.get('sort');
    if (params.has('dir')) state.sortDirection = params.get('dir');
    if (params.has('q')) state.searchTerm = params.get('q');
    if (params.has('trend')) state.trendMetric = params.get('trend');

    if (params.has('dmin')) state.filters.dateMin = +params.get('dmin');
    if (params.has('dmax')) state.filters.dateMax = +params.get('dmax');
    if (params.has('mmin')) state.filters.memberMin = +params.get('mmin');
    if (params.has('mmax')) state.filters.memberMax = +params.get('mmax');
    if (params.has('bmin')) state.filters.boostMin = +params.get('bmin');
    if (params.has('bmax')) state.filters.boostMax = +params.get('bmax');
    if (params.has('pmin')) state.filters.partnershipMin = +params.get('pmin');
    if (params.has('pmax')) state.filters.partnershipMax = +params.get('pmax');

    return state;
}

function updateURLWithCurrentState() {
    const currentState = {
        filters: {
            dateMin: +dateFilterMin.property('value'), dateMax: +dateFilterMax.property('value'),
            memberMin: +memberFilterMin.property('value'), memberMax: +memberFilterMax.property('value'),
            boostMin: +boostFilterMin.property('value'), boostMax: +boostFilterMax.property('value'),
            partnershipMin: +partnershipFilterMin.property('value'), partnershipMax: +partnershipFilterMax.property('value'),
        },
        colorMode: currentColoringMode,
        dataVersion: dataVersionSelector.property('value'),
        selectedServer: currentlyHighlighted ? currentlyHighlighted.id : null,
        chartType: currentlyHighlighted ? (d3.select('#chart-controls .active, #chart-controls-compare .active').attr('data-chart') || 'members') : 'members',
        sortKey: currentSortKey,
        sortDirection: currentSortDirection,
        searchTerm: searchInput.property('value'),
        trendMetric: currentTrendMetric,
    };

    const params = new URLSearchParams();

    if (currentState.dataVersion !== defaultState.dataVersion) params.set('data', currentState.dataVersion);
    if (currentState.colorMode !== defaultState.colorMode) params.set('color', currentState.colorMode);
    if (currentState.selectedServer) params.set('server', currentState.selectedServer);
    if (currentState.chartType !== defaultState.chartType && currentState.selectedServer) params.set('chart', currentState.chartType);
    if (currentState.sortKey !== defaultState.sortKey) params.set('sort', currentState.sortKey);
    if (currentState.sortDirection !== defaultState.sortDirection) params.set('dir', currentState.sortDirection);
    if (currentState.searchTerm !== defaultState.searchTerm) params.set('q', currentState.searchTerm);
    if (currentState.trendMetric !== defaultState.trendMetric) params.set('trend', currentState.trendMetric);

    if (currentState.filters.dateMin !== defaultState.filters.dateMin) params.set('dmin', currentState.filters.dateMin);
    if (currentState.filters.dateMax !== +dateFilterMax.attr('max')) params.set('dmax', currentState.filters.dateMax);
    if (currentState.filters.memberMin !== defaultState.filters.memberMin) params.set('mmin', currentState.filters.memberMin);
    if (currentState.filters.memberMax !== +memberFilterMax.attr('max')) params.set('mmax', currentState.filters.memberMax);
    if (currentState.filters.boostMin !== defaultState.filters.boostMin) params.set('bmin', currentState.filters.boostMin);
    if (currentState.filters.boostMax !== +boostFilterMax.attr('max')) params.set('bmax', currentState.filters.boostMax);
    if (currentState.filters.partnershipMin !== defaultState.filters.partnershipMin) params.set('pmin', currentState.filters.partnershipMin);
    if (currentState.filters.partnershipMax !== +partnershipFilterMax.attr('max')) params.set('pmax', currentState.filters.partnershipMax);

    const hash = params.toString();
    if (hash) {
        history.replaceState(null, '', '#' + hash);
    } else {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
}

function applyState(state) {
    const isDefaultState = JSON.stringify(state) === JSON.stringify(defaultState);
    if (isDefaultState) {
        return;
    }

    colorModeSelector.property('value', state.colorMode);
    colorModeSelectorMobile.property('value', state.colorMode);
    handleColorModeChange.call(colorModeSelector.node());

    currentSortKey = state.sortKey;
    currentSortDirection = state.sortDirection;
    searchInput.property('value', state.searchTerm);

    if (state.trendMetric !== defaultState.trendMetric) {
        d3.select(`#trend-rank-controls .trend-toggle-btn[data-trend="${state.trendMetric}"]`).dispatch('click');
    }

    dateFilterMin.property('value', state.filters.dateMin);
    dateFilterMax.property('value', state.filters.dateMax === Infinity ? +dateFilterMax.attr('max') : state.filters.dateMax);
    memberFilterMin.property('value', state.filters.memberMin);
    memberFilterMax.property('value', state.filters.memberMax === Infinity ? +memberFilterMax.attr('max') : state.filters.memberMax);
    boostFilterMin.property('value', state.filters.boostMin);
    boostFilterMax.property('value', state.filters.boostMax === Infinity ? +boostFilterMax.attr('max') : state.filters.boostMax);
    partnershipFilterMin.property('value', state.filters.partnershipMin);
    partnershipFilterMax.property('value', state.filters.partnershipMax === Infinity ? +partnershipFilterMax.attr('max') : state.filters.partnershipMax);

    d3.selectAll('#filterPanel input[type="range"]').dispatch('input');

    if (state.selectedServer) {
        setTimeout(() => {
            const serverNode = currentDataSet.nodes.find(n => n.id === state.selectedServer);
            if (serverNode) {
                handleNodeClick(null, serverNode, state.chartType);
            }
        }, 500);
    }
}
