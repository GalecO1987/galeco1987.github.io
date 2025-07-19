const loadScript = (file) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = file;
        script.async = true;
        script.onload = () => {
            if (window.loadedDataSet) {
                const data = window.loadedDataSet;
                window.loadedDataSet = null;
                script.remove();
                resolve(data);
            } else {
                script.remove();
                reject(new Error(`Błąd: Plik danych ${file} nie zdefiniował window.loadedDataSet.`));
            }
        };
        script.onerror = () => {
            script.remove();
            reject(new Error(`Błąd ładowania skryptu: ${file}`));
        };
        document.body.appendChild(script);
    });
};

async function loadAllData() {
    const promises = availableDataVersions.map(version => loadScript(version.file));
    const datasets = await Promise.all(promises);
    availableDataVersions.forEach((version, index) => {
        allData.set(version.date, datasets[index]);
    });
}


function loadDataVersion(versionInfo, isInitialLoad = false, onLoadCallback = null) {
    if (simulation) simulation.stop();
    g.selectAll("*").remove();

    const dataKey = versionInfo.date;
    currentDataSet = allData.get(dataKey);
    currentDataDate = new Date(dataKey);

    const currentIndex = availableDataVersions.findIndex(v => v.file === versionInfo.file);
    const previousIndex = currentIndex + 1;
    if (previousIndex < availableDataVersions.length) {
        const previousDataKey = availableDataVersions[previousIndex].date;
        previousDataSet = allData.get(previousDataKey);
    } else {
        previousDataSet = { nodes: [], links: [] };
    }

    initializeVisualization(currentDataSet, versionInfo);
    updateSummaryStats(currentDataSet.nodes);
    drawSummaryChart(currentTrendMetric);
    updateTrendRankings();

    if (!isInitialLoad) {
        dataVersionSelector.property('value', versionInfo.file);
        dataVersionSelectorMobile.property('value', versionInfo.file);
    }

    if (onLoadCallback) {
        onLoadCallback();
    }
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
        updateURLWithCurrentState();
    }
}
