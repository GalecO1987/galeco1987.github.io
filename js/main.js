function handleResize() {
    const newWidth = window.innerWidth; const newHeight = window.innerHeight;
    svg.attr("width", newWidth).attr("height", newHeight);
    if (simulation && simulation.force("center")) { simulation.force("center").x(newWidth / 2).y(newHeight / 2); }
    if (initialZoom) { initialTransform = d3.zoomIdentity.translate(newWidth / 2, newHeight / 2).scale(initialZoom).translate(-newWidth / 2, -height / 2); }
}

function handleColorModeChange() {
    const selectedMode = d3.select(this).property("value");
    currentColoringMode = selectedMode;

    if (this.id === 'colorModeSelector') {
        colorModeSelectorMobile.property('value', selectedMode);
    } else {
        colorModeSelector.property('value', selectedMode);
    }

    colorLegend.selectAll('.legend-section').classed('hidden', true);
    colorLegend.select('.legend-' + selectedMode).classed('hidden', false);

    updateNodeColors();
    updateTrendRankings();
    updateURLWithCurrentState();
}

document.addEventListener('DOMContentLoaded', async () => {
    const polishLocale = { "dateTime": "%A, %e %B %Y, %X", "date": "%d.%m.%Y", "time": "%H:%M:%S", "periods": ["AM", "PM"], "days": ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"], "shortDays": ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So"], "months": ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"], "shortMonths": ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"] };
    d3.timeFormatDefaultLocale(polishLocale);

    const overlay = document.getElementById('overlay');
    const understandButton = document.getElementById('understandButton');

    await loadAllData();

    const initialState = getStateFromURL();
    const versionToLoad = availableDataVersions.find(v => v.file === initialState.dataVersion) || availableDataVersions[0];

    loadDataVersion(versionToLoad, true);
    initSummaryPanel();

    if (overlay && understandButton) {
        overlay.classList.add('visible');
        understandButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                applyState(initialState);
            }, 500);
        }, { once: true });
    } else {
        applyState(initialState);
    }

    serverTableHeaders.on("click", handleSortClick);
    searchInput.on("input", updateTableFilter);

    d3.selectAll("#resetButton, #resetButtonMobile").on("click", () => {
        document.body.classList.remove('mobile-info-active');
        document.body.classList.remove('mobile-summary-active');
        resetMap();
    });

    d3.select("#showSummaryMobile").on("click", () => {
        document.body.classList.add("mobile-summary-active");
        drawSummaryChart(currentTrendMetric);
    });
    d3.select("#closeSummaryPanelMobile").on("click", () => document.body.classList.remove("mobile-summary-active"));

    d3.select("#closeServerInfo").on("click", () => {
        serverInfoPanel.style("display", "none");
        document.body.classList.remove('mobile-info-active');
        if (currentlyHighlighted) {
            resetHighlight();
            currentlyHighlighted = null;
        }
        exitCompareMode();
        if (wasSummaryPanelOpen) {
            summaryPanel.classed("temporarily-hidden", false);
            wasSummaryPanelOpen = false;
        }
        updateURLWithCurrentState();
    });

    d3.select("#compare-button").on("click", () => {
        if(isCompareModeActive) {
            exitCompareMode();
            if(currentlyHighlighted) {
                highlightNodeAndLinks(currentlyHighlighted);
            }
        } else {
            enterCompareMode();
        }
    });

    d3.select("#serverInfo").on("click", (event) => {
        const btn = event.target.closest('.chart-toggle-btn');
        if (!btn) return;

        const newDataType = btn.dataset.chart;
        const serverIds = [];
        let useSpecialColors = false;

        if (secondServerToCompare) {
            serverIds.push(firstServerToCompare.id, secondServerToCompare.id);
            useSpecialColors = true;
        } else if (currentlyHighlighted) {
            serverIds.push(currentlyHighlighted.id);
        }

        if (serverIds.length > 0) {
            drawServerHistoryChart(serverIds, newDataType, useSpecialColors);
            updateURLWithCurrentState();
        }
    });

    d3.select("#serverInfo-partnerships-list").on("click", (event) => {
        const targetLi = event.target.closest('li');
        if (targetLi) {
            const partnerId = targetLi.dataset.partnerId;
            const isVisible = targetLi.dataset.visible === 'true';
            if (partnerId && isVisible) {
                d3.selectAll("#serverTableBody tr").classed("table-row-hovered", false);
                searchServer(partnerId);
            }
        }
    });

    d3.select("#serverInfo-partnerships-list")
    .on("mouseover", (event) => {
        const targetLi = event.target.closest('li');
        if (!targetLi) return;
        const partnerId = targetLi.dataset.partnerId;
        if (!partnerId) return;
        const partnerNodeData = currentDataSet.nodes.find(n => n.id === partnerId);
        if (partnerNodeData) {
            highlightHovered(partnerNodeData, true);
        }
    })
    .on("mouseout", (event) => {
        const targetLi = event.target.closest('li');
        if (!targetLi) return;
        const partnerId = targetLi.dataset.partnerId;
        if (!partnerId) return;
        const partnerNodeData = currentDataSet.nodes.find(n => n.id === partnerId);
        if (partnerNodeData) {
            highlightHovered(partnerNodeData, false);
        }
    });

    dataVersionSelector.on("change", function() {
        document.body.classList.remove('mobile-info-active');
        handleDataVersionChange.call(this);
    });
    dataVersionSelectorMobile.on("change", function() {
        document.body.classList.remove('mobile-info-active');
        handleDataVersionChange.call(this);
    });

    colorModeSelector.on("change", handleColorModeChange);
    colorModeSelectorMobile.on("change", handleColorModeChange);

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });
});
