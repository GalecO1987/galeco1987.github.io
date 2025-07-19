const serverTableBody = d3.select("#serverTableBody");
const visibleServerCountSpan = d3.select("#visibleServerCount");
const serverTableHeaders = d3.selectAll("#serverTable th.sortable");
const dataVersionSelector = d3.select("#dataVersionSelector");
const dataVersionSelectorMobile = d3.select("#dataVersionSelectorMobile");
const searchInput = d3.select("#searchInput");
const tooltip = d3.select(".tooltip");
const serverInfoPanel = d3.select("#serverInfo");
const serverInfoChart = d3.select("#serverInfo-chart");
const summaryPanel = d3.select("#summaryPanel");
const svg = d3.select("body").append("svg");
const g = svg.append("g");

const dateFilterMin = d3.select("#dateFilterMin");
const dateFilterMax = d3.select("#dateFilterMax");
const dateValue = d3.select("#dateValue");
const memberFilterMin = d3.select("#memberFilterMin");
const memberFilterMax = d3.select("#memberFilterMax");
const memberValue = d3.select("#memberValue");
const boostFilterMin = d3.select("#boostFilterMin");
const boostFilterMax = d3.select("#boostFilterMax");
const boostValue = d3.select("#boostValue");
const partnershipFilterMin = d3.select("#partnershipFilterMin");
const partnershipFilterMax = d3.select("#partnershipFilterMax");
const partnershipValue = d3.select("#partnershipValue");
const colorModeSelector = d3.select("#colorModeSelector");
const colorModeSelectorMobile = d3.select("#colorModeSelectorMobile");
const colorLegend = d3.select("#colorLegend");

let allData = new Map();
let currentDataSet = { nodes: [], links: [] };
let previousDataSet = { nodes: [], links: [] };
let currentDataDate;

let currentSortKey = 'members';
let currentSortDirection = 'desc';
let currentFilteredNodes = [];
let minDateObj, maxDateObj;
let dateRange = 0;
let simulation;
let zoom_handler;
let initialTransform;
let currentlyHighlighted = null;
let blinkingNodes = [];
let hoveredTableRowNodeId = null;
let freezeTimer;
let resizeTimer;
let radiusScale;
let linkWeightScale;
let boostColorScale, ageColorScale, partnershipColorScale, influenceColorScale;
let currentColoringMode = 'boosts';
let isCompareModeActive = false;
let firstServerToCompare = null;
let secondServerToCompare = null;
let wasSummaryPanelOpen = false;

const availableDataVersions = [
    { date: "2025-07-01", file: "data/data-2025-07-01.js", label: "1 lipca 2025" },
{ date: "2025-06-01", file: "data/data-2025-06-01.js", label: "1 czerwca 2025" },
{ date: "2025-05-01", file: "data/data-2025-05-01.js", label: "1 maja 2025" },
{ date: "2025-04-01", file: "data/data-2025-04-01.js", label: "1 kwietnia 2025" }
];

const defaultState = {
    filters: {
        dateMin: 0, dateMax: Infinity,
        memberMin: 0, memberMax: Infinity,
        boostMin: 0, boostMax: Infinity,
        partnershipMin: 0, partnershipMax: Infinity,
    },
    colorMode: 'boosts',
    dataVersion: availableDataVersions[0].file,
    selectedServer: null,
    chartType: 'members',
    sortKey: 'members',
    sortDirection: 'desc',
    searchTerm: '',
    trendMetric: 'members',
};
