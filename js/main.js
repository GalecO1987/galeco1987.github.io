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
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const understandButton = document.getElementById('understandButton');
    if (overlay && understandButton) {
        overlay.classList.add('visible');
        understandButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }, { once: true });
    }

    loadAllData();

    serverTableHeaders.on("click", handleSortClick);
    searchInput.on("input", updateTableFilter);

    d3.selectAll("#resetButton, #resetButtonMobile").on("click", () => {
        document.body.classList.remove('mobile-info-active');
        resetMap();
    });

    d3.select("#closeServerInfo").on("click", () => {
        serverInfoPanel.style("display", "none");
        document.body.classList.remove('mobile-info-active');
        if (currentlyHighlighted) {
            resetHighlight();
            currentlyHighlighted = null;
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
