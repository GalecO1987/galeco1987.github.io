// script.js
data.nodes.forEach(node => {
    node.partnerships.forEach(partnerId => {
        const partner = data.nodes.find(n => n.id === partnerId);
        if (partner) {
            data.links.push({ source: node.id, target: partnerId });
        } else {
            console.warn(`Partner ${partnerId} dla ${node.id} nie został znaleziony.`);
        }
    });
});

const width = window.innerWidth;
const height = window.innerHeight;

const radiusScale = d3.scaleSqrt()
.domain([0, d3.max(data.nodes, d => d.members)])
.range([10, 50]);

const svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);

const g = svg.append("g");

let simulation = d3.forceSimulation(data.nodes)
.force("link", d3.forceLink(data.links).id(d => d.id).distance(d => {
    return d.source.partnerships.includes(d.target.id) ? 30 : 150; // Krótsze połączenia dla partnerstw
}))
.force("charge", d3.forceManyBody().strength(-1500))
.force("center", d3.forceCenter(width / 2, height / 2))
.force("collision", d3.forceCollide().radius(d => radiusScale(d.members) + 5));

let freezeTimer; // Dodajemy zmienną do przechowywania timera

function drawGraph(filteredNodes, filteredLinks) {
    g.selectAll(".nodes").remove();
    g.selectAll(".links").remove();
    g.selectAll(".labels").remove();

    const newLinks = filteredLinks.filter(l =>
    filteredNodes.some(n => n.id === l.source.id) &&
    filteredNodes.some(n => n.id === l.target.id)
    );

    // Kluczowe: Ustawiamy nodes i links PRZED restartem symulacji
    simulation.nodes(filteredNodes);
    simulation.force("link").links(newLinks);

    // Tworzymy elementy, ale nie dodajemy ich jeszcze do DOM
    const newLink = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(newLinks, d => d.source.id + "-" + d.target.id)
    .enter().append("line")
    .attr("class", "link");

    const newNode = g.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(filteredNodes, d => d.id)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", d => radiusScale(d.members))
    .attr("fill", d => getNodeColor(d))
    .on("click", handleNodeClick)
    .on("mouseover", handleNodeMouseOver)
    .on("mouseout", handleNodeMouseOut);

    const newLabels = g.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(filteredNodes, d => d.id)
    .enter().append("text")
    .attr("class", "node-label")
    .text(d => d.id);

    // Funkcja tick - aktualizuje pozycje
    simulation.on("tick", () => {
        newLink
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

        newNode
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

        newLabels
        .attr("x", d => d.x)
        .attr("y", d => d.y - radiusScale(d.members) - 5);
    });


    simulation.alpha(1).restart(); //Teraz restartujemy symulację

    // Wyczyść poprzedni timer, jeśli istnieje
    clearTimeout(freezeTimer);

    // Ustaw nowy timer, który zatrzyma symulację po 1 sekundzie
    freezeTimer = setTimeout(() => {
        simulation.stop();
        // simulation.alpha(0); //  Nie musimy już ustawiać alpha na 0. stop() wystarczy
    }, 1000);

}


let initialZoom = 0.09;
let initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(initialZoom).translate(-width / 2, -height / 2);

const zoom_handler = d3.zoom()
.scaleExtent([0.1, 8])
.on("zoom", (event) => {
    g.attr("transform", event.transform);
});

svg.call(zoom_handler).call(zoom_handler.transform, initialTransform);

svg.on("mousemove", (event) => {
    let [x, y] = d3.pointer(event, g.node());
    x = Math.round(x);
    y = Math.round(y);
    const correctedY = height - y;
    d3.select("#coords").text(`X: ${x}, Y: ${correctedY}`);
});

d3.select("#resetButton").on("click", () => {
    svg.transition().duration(750).call(zoom_handler.transform, initialTransform);
});

function getNodeColor(node) {
    const boostScale = d3.scaleLinear()
    .domain([0, 10, 20, 30])
    .range(["#f0f0f0", "#ffeb3b", "#ff9800", "#ff0000"]);
    return boostScale(node.boosts);
}

let currentlyHighlighted = null;
let blinkingNode = null;


// Funkcja do przełączania widoczności
function toggleLeftPanelAndServerInfo(showServerInfo) {
    const serverInfo = d3.select("#serverInfo");
    const leftPanel = d3.select("#leftPanel");

    if (showServerInfo) {
        serverInfo.classed("visible", true);
        if (window.innerWidth <= 768) {
            leftPanel.classed("left-panel-hidden", true); // Dodaj klasę ukrywającą
        }
    } else {
        serverInfo.classed("visible", false);
        if (window.innerWidth <= 768) {
            leftPanel.classed("left-panel-hidden", false); // Usuń klasę ukrywającą
        }
    }
}

function handleNodeClick(event, d) {
    const serverInfo = d3.select("#serverInfo");

    if (currentlyHighlighted === d) {
        serverInfo.style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
        return;
    }

    resetHighlight();
    currentlyHighlighted = d;
    serverInfo.style("display", "block");

    // Dodaj/usuń klasę 'visible'
    toggleLeftPanelAndServerInfo(true);

    const sortedPartnerships = d.partnerships
    .map(partnerId => data.nodes.find(n => n.id === partnerId))
    .filter(partner => partner)
    .sort((a, b) => b.members - a.members);

    // ZMODYFIKOWANY fragment - wstawiamy dane do odpowiednich elementów
    const serverColor = getNodeColor(d);
    d3.select("#serverInfo-name").style("color", serverColor).text(d.id);
    d3.select("#serverInfo-members").style("color", serverColor).text(`Członkowie: ${d.members} (miejsce #${d.memberRank})`);
    d3.select("#serverInfo-boosts").style("color", serverColor).text(`Boosty: ${d.boosts} (miejsce #${d.boostRank})`);
    d3.select("#serverInfo-partnerships-count").style("color", serverColor).text(`Liczba partnerstw: ${sortedPartnerships.length} (miejsce #${d.partnershipRank})`);


    let partnershipsHtml = ""; // Zaczynamy od pustego stringa
    sortedPartnerships.forEach(partner => {
        const partnerColor = getNodeColor(partner);
        partnershipsHtml += `<li style="color: ${partnerColor};">
        ${partner.id} (Członkowie: ${partner.members}, Boosty: ${partner.boosts})
        </li>`;
    });
    d3.select("#serverInfo-partnerships-list").html(partnershipsHtml); // Wstawiamy listę

    highlightNodeAndLinks(d);

    const scale = 0.6;
    const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-d.x, -d.y);

    svg.transition().duration(750).call(zoom_handler.transform, transform);
    startBlinking(d);
}

function searchServer(serverId) {
    searchResults.style("display", "none");
    const serverNode = data.nodes.find(n => n.id === serverId);

    if (!serverNode) {
        console.error("Nie znaleziono serwera o ID: " + serverId);
        return;
    }

    const scale = 0.75;
    const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-serverNode.x, -serverNode.y);

    svg.transition().duration(750).call(zoom_handler.transform, transform);
    handleNodeClick(null, serverNode);

    //Przywracanie #bottomInfo po wyszukaniu
    // d3.select("#bottomInfo").style("transform", "none"); //Usunięto
}

function highlightNodeAndLinks(d) {
    const connectedNodeIds = new Set();
    connectedNodeIds.add(d.id);

    data.links.forEach(l => {
        if (l.source.id === d.id) {
            connectedNodeIds.add(l.target.id);
        }
        if (l.target.id === d.id) {
            connectedNodeIds.add(l.source.id);
        }
    });

    g.selectAll(".node").classed("dimmed", n => !connectedNodeIds.has(n.id));
    g.selectAll(".node").style("stroke-width", n => connectedNodeIds.has(n.id) ? 2 : 0);
    g.selectAll(".link").classed("hidden", l => !(connectedNodeIds.has(l.source.id) && connectedNodeIds.has(l.target.id)));
    g.selectAll(".node-label").classed("hidden", label => !connectedNodeIds.has(label.id));
}

function resetHighlight() {
    g.selectAll(".node")
    .classed("dimmed", false)
    .style("fill", n => getNodeColor(n))
    .style("stroke", "none")
    .style("stroke-width", 0);

    g.selectAll(".link").classed("hidden", false);
    g.selectAll(".node-label").classed("hidden", false);
    stopBlinking();
}

function startBlinking(nodeData) {
    blinkingNode = nodeData;
    blink();

    function blink() {
        if (blinkingNode === nodeData) {
            const node = g.selectAll(".node").filter(d => d.id === nodeData.id);
            if (!node.empty()) {
                node.transition()
                .duration(500)
                .attr("r", d => radiusScale(d.members) - 10)
                .transition()
                .duration(500)
                .attr("r", d => radiusScale(d.members))
                .on("end", blink);
            } else {
                blinkingNode = null;
            }
        }
    }
}

function stopBlinking() {
    if (blinkingNode) {
        g.selectAll(".node")
        .filter(d => d.id === blinkingNode.id)
        .transition()
        .duration(200)
        .attr("r", d => radiusScale(d.members));
        blinkingNode = null;
    }
}

svg.on("click", (event) => {
    // Zmodyfikowane zdarzenie click, aby zamykało #serverInfo, gdy kliknięcie jest poza nim *i* poza #leftPanel
    if (!g.node().contains(event.target) && !d3.select("#serverInfo").node().contains(event.target) && !d3.select("#leftPanel").node().contains(event.target)) {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
    }
});



function handleNodeMouseOver(event, d) {
    // Warunek, żeby dymek wyświetlał się tylko przy najechaniu na *kółka*
    if (event.target.tagName === 'circle') {
        const tooltip = d3.select(".tooltip");
        tooltip.style("display", "block")
        .html(`
        <strong>${d.id}</strong><br>
        Członkowie: ${d.members} (miejsce #${d.memberRank})<br>
        Boosty: ${d.boosts} (miejsce #${d.boostRank})<br>
        Partnerstwa: ${d.partnerships.length} (miejsce #${d.partnershipRank})
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    }
    const serverInfo = d3.select("#serverInfo");
    serverInfo.selectAll("li").style("font-weight", "normal");

    // ZMIEŃ: Pogrubiamy TYLKO jeśli najechany serwer jest tym samym, co wyświetlany w panelu
    if (currentlyHighlighted && currentlyHighlighted.id === d.id) {
        serverInfo.selectAll("h2, p").style("font-weight", "bold");
    }


    const listItem = serverInfo.selectAll("li")
    .filter(function () {
        return this.textContent.trim().startsWith(d.id);
    });

    if (!listItem.empty()) {
        listItem.style("font-weight", "bold");
    }

    const connectedNodeIds = new Set();
    connectedNodeIds.add(d.id);

    data.links.forEach(l => {
        if (l.source.id === d.id) {
            connectedNodeIds.add(l.target.id);
        }
        if (l.target.id === d.id) {
            connectedNodeIds.add(l.source.id);
        }
    });

    g.selectAll(".node")
    .filter(n => connectedNodeIds.has(n.id))
    .style("stroke", "lightblue")
    .style("stroke-width", 2);

    g.selectAll(".link")
    .style("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "lightblue" : "#999")
    .style("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 2 : 1);
}

function handleNodeMouseOut(event, d) {
    d3.select(".tooltip").style("display", "none");

    const serverInfo = d3.select("#serverInfo");
    serverInfo.selectAll("li").style("font-weight", "normal");
    //ZMIEŃ: Usuwamy pogrubienie z całego wiersza
    serverInfo.selectAll("h2, p").style("font-weight", "normal"); // Dodano selektor 'p'

    g.selectAll(".link").style("stroke", "#999").style("stroke-width", 1);
    g.selectAll(".node").style("stroke", "none").style("stroke-width", 0);
}

const memberFilter = d3.select("#memberFilter");
const boostFilter = d3.select("#boostFilter");
const memberValue = d3.select("#memberValue");
const boostValue = d3.select("#boostValue");

// Dodajemy nowe zmienne dla filtra partnerstw
const partnershipFilter = d3.select("#partnershipFilter");
const partnershipValue = d3.select("#partnershipValue");

memberFilter.attr("max", d3.max(data.nodes, d => d.members));
boostFilter.attr("max", d3.max(data.nodes, d => d.boosts));

// Ustawiamy max dla filtra partnerstw
partnershipFilter.attr("max", d3.max(data.nodes, d => d.partnerships.length));

memberFilter.on("input", updateFilters);
boostFilter.on("input", updateFilters);
// Dodajemy event listener dla filtra partnerstw
partnershipFilter.on("input", updateFilters);

function updateFilters() {
    const minMembers = +memberFilter.property("value");
    const minBoosts = +boostFilter.property("value");
    const minPartnerships = +partnershipFilter.property("value");  //Pobierz wartość filtra partnerstw

    memberValue.text(minMembers);
    boostValue.text(minBoosts);
    partnershipValue.text(minPartnerships); // Wyświetl wartość filtra partnerstw

    const filteredNodes = data.nodes.filter(d =>
    d.members >= minMembers &&
    d.boosts >= minBoosts &&
    d.partnerships.length >= minPartnerships // Dodaj warunek filtrowania partnerstw
    );


    const filteredNodeIds = new Set(filteredNodes.map(d => d.id));
    const filteredLinks = data.links.filter(l =>
    filteredNodeIds.has(l.source.id) && filteredNodeIds.has(l.target.id)
    );

    // WAŻNE: Przelicz rankingi *po* filtrowaniu
    calculateRanks(filteredNodes);

    drawGraph(filteredNodes, filteredLinks);


    if (currentlyHighlighted) {
        resetHighlight();
        currentlyHighlighted = null;
        d3.select("#serverInfo").style("display", "none");
    }
}

const searchInput = d3.select("#searchInput");
const searchResults = d3.select("#searchResults");

searchInput.on("input", () => {
    const searchTerm = searchInput.property("value").toLowerCase();
    const results = data.nodes.filter(node => node.id.toLowerCase().includes(searchTerm));

    if (searchTerm === "" || results.length === 0) {
        searchResults.style("display", "none");
        //Przywróć #bottomInfo na miejsce, gdy nie ma podpowiedzi
        // d3.select("#bottomInfo").style("transform", "none"); // Usunięte

    } else {
        searchResults.style("display", "block");
        searchResults.html("");

        results.forEach(result => {
            const resultDiv = searchResults.append("div");
            resultDiv.text(result.id);
            resultDiv.on("click", () => {
                searchServer(result.id);
            });
        });

        // Przesuń #bottomInfo w dół, gdy są podpowiedzi //Usunięte
        // Oblicz wysokość #searchResults
        // const searchResultsHeight = searchResults.node().offsetHeight; //Usunięto
        // Przesuń #bottomInfo o tę wysokość + jakiś margines (np. 10px)
        // d3.select("#bottomInfo").style("transform", `translateY(${searchResultsHeight + 10}px)`); //Usunięto

    }
});

// Nowa funkcja do obliczania rankingów
function calculateRanks(nodes) {
    // Ranking członków
    const membersRank = [...nodes].sort((a, b) => b.members - a.members);
    membersRank.forEach((node, index) => {
        node.memberRank = index + 1;
    });

    // Ranking boostów
    const boostsRank = [...nodes].sort((a, b) => b.boosts - a.boosts);
    boostsRank.forEach((node, index) => {
        node.boostRank = index + 1;
    });

    // Ranking partnerstw (używamy .length, bo partnerships to tablica)
    const partnershipsRank = [...nodes].sort((a, b) => b.partnerships.length - a.partnerships.length);
    partnershipsRank.forEach((node, index) => {
        node.partnershipRank = index + 1;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const understandButton = document.getElementById('understandButton');

    overlay.classList.add('visible');

    understandButton.addEventListener('click', () => {
        overlay.style.opacity = '0'; // Poprawiono tutaj
        setTimeout(() => {
            overlay.remove();
        }, 500);
    });

    const serverCount = data.nodes.length;
    document.querySelector("#dataDate div:first-child").textContent = `Liczba serwerów: ${serverCount}`;

    // Najpierw oblicz rankingi, *potem* rysuj graf
    calculateRanks(data.nodes);
    drawGraph(data.nodes, data.links);

    //Dodajemy event listener dla przycisku zamykania #serverInfo i przywracanie bottomInfo
    d3.select("#closeServerInfo").on("click", () => {
        d3.select("#serverInfo").style("display", "none");
        currentlyHighlighted = null;
        resetHighlight();
        toggleLeftPanelAndServerInfo(false);
        //Przywracanie bottomInfo
        // d3.select("#bottomInfo").style("transform", "none"); //Usunięto

    });

    // ****************************************
    // **  DODANY FRAGMENT - OBSŁUGA HOVERA  **
    // ****************************************
    d3.select("#serverInfo-partnerships-list").on("mouseover", (event) => {
        const target = event.target;

        // Sprawdzamy, czy najechano na element 'li'
        if (target.tagName === 'LI') {
            const serverName = target.textContent.split(" (")[0].trim();
            const hoveredNode = data.nodes.find(node => node.id === serverName);

            if (hoveredNode) {
                // Symulacja najechania myszką na okrąg
                handleNodeMouseOver(event, hoveredNode);
                // Dodatkowo, jeśli mamy zaznaczony serwer, to pogrubiamy tekst w liście tak samo jak po kliknięciu
                if (currentlyHighlighted) {
                    highlightNodeAndLinks(currentlyHighlighted);
                }


            }
        }
    });

    d3.select("#serverInfo-partnerships-list").on("mouseout", (event) => {
        const target = event.target;
        if (target.tagName === 'LI') {
            const serverName = target.textContent.split(" (")[0].trim();
            const hoveredNode = data.nodes.find(node => node.id === serverName);

            if (hoveredNode) {
                // Symulacja zjechania myszką z okręgu
                handleNodeMouseOut(event, hoveredNode);

                // Przywróć stan zaznaczenia, jeśli jakiś serwer był kliknięty.
                if (currentlyHighlighted) {
                    highlightNodeAndLinks(currentlyHighlighted);
                }
            }
        }
    });

    // Dodatkowo, obsługa hovera na głównych informacjach o serwerze (poza listą partnerstw)
    d3.select("#serverInfo").on("mouseover", (event) => {

        // Sprawdz, czy najechano na element, który zawiera informacje *główne* o serwerze
        // a nie na listę partnerstw.
        if (event.target.closest("#serverInfo-partnerships-list") === null && currentlyHighlighted) {
            // Symulujemy najechanie na *kliknięty* node
            handleNodeMouseOver(event, currentlyHighlighted);
            highlightNodeAndLinks(currentlyHighlighted); // Upewnij się, że podświetlenie jest włączone
        }

    });

    d3.select("#serverInfo").on("mouseout", (event) => {
        if (event.target.closest("#serverInfo-partnerships-list") === null && currentlyHighlighted) {
            handleNodeMouseOut(event, currentlyHighlighted);
            highlightNodeAndLinks(currentlyHighlighted); // Przywracamy podświetlenie po zjechaniu
        }
    });

    // *************************************
    // **  DODANY FRAGMENT - OBSŁUGA CLICKA **
    // *************************************

    d3.select("#serverInfo-partnerships-list").on("click", (event) => {
        const target = event.target;

        if(target.tagName === "LI"){
            const serverName = target.textContent.split(" (")[0].trim();
            const clickedNode = data.nodes.find(node => node.id === serverName);

            if(clickedNode){
                handleNodeClick(event, clickedNode); // Wywołujemy taką samą funkcję jak przy kliknięciu na okrąg
            }
        }
    });


});

// Funkcja do obsługi zmiany orientacji/rozmiaru okna
function handleResize() {
    // Pobierz nowe wymiary okna
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    // Zaktualizuj atrybuty SVG
    svg.attr("width", newWidth).attr("height", newHeight);

    // Zaktualizuj środek sił
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));

    // Wyczyść timer, aby zapobiec zatrzymaniu symulacji podczas resize
    clearTimeout(freezeTimer);

    // Uruchom ponownie symulację (bez .restart(), bo nodes i links są aktualne)
    simulation.alpha(1);

    // Ustaw timer, aby zatrzymać symulację po zmianie rozmiaru okna
    freezeTimer = setTimeout(() => {
        simulation.stop();
    }, 1000);
}

// Nasłuchuj zdarzenia resize i wywołuj handleResize
window.addEventListener("resize", handleResize);
