const svg = d3.select('#map');
const width = +svg.attr('width');
const height = +svg.attr('height');

const projection = d3.geoEquirectangular()
    .scale(160)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

let visitedCountries = new Set();
const tooltip = d3.select('#tooltip');
const searchInput = document.getElementById('search');
const toggleReadOnlyButton = document.getElementById('toggle-readonly');
let isReadOnly = false;

// Add zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
        if (!isReadOnly) {
            svg.selectAll('g').attr('transform', event.transform);
        }
    });

svg.call(zoom);

function resetZoom() {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
}

function updateMap() {
    d3.selectAll('.country')
        .classed('visited', false)
        .classed('not-visited', true);

    visitedCountries.forEach(country => {
        d3.selectAll('.country')
            .filter(d => d.properties && d.properties.name === country)
            .classed('visited', true)
            .classed('not-visited', false);
    });
}

function loadStateFromServer() {
    fetch('/load')
        .then(response => response.json())
        .then(data => {
            visitedCountries = new Set(data.visitedCountries || []);
            updateMap();
        })
        .catch(error => console.error('Error loading state:', error));
}

function saveStateToServer() {
    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitedCountries: Array.from(visitedCountries) })
    }).then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Error saving state:', error));
}

function toggleReadOnlyMode() {
    isReadOnly = !isReadOnly;
    toggleReadOnlyButton.textContent = isReadOnly ? 'Modo Solo Lectura' : 'Modo Editable';
    toggleReadOnlyButton.className = isReadOnly ? 'readonly' : 'editable';
}

d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson').then(data => {
    const countries = data.features.map(d => d.properties.name);

    new Awesomplete(searchInput, {
        list: countries
    });

    const mapGroup = svg.append('g');

    mapGroup.selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'country not-visited')
        .on('click', function(event, d) {
            if (!isReadOnly) {
                const countryName = d.properties.name;

                if (visitedCountries.has(countryName)) {
                    visitedCountries.delete(countryName);
                } else {
                    visitedCountries.add(countryName);
                }
                updateMap();
            }
        })
        .on('mouseover', function(event, d) {
            if (!isReadOnly) {
                tooltip.style('display', 'block')
                    .style('left', (event.pageX + 5) + 'px')
                    .style('top', (event.pageY + 5) + 'px')
                    .text(d.properties.name);
                d3.select(this).classed('hovered', true);
            }
        })
        .on('mouseout', function() {
            if (!isReadOnly) {
                tooltip.style('display', 'none');
                d3.select(this).classed('hovered', false);
            }
        });

    loadStateFromServer();

    searchInput.addEventListener('awesomplete-selectcomplete', (event) => {
        if (!isReadOnly) {
            const countryName = event.text.value;
            const countryElement = mapGroup.selectAll('path').filter(d => d.properties.name === countryName);

            if (countryElement.node()) {
                countryElement.classed('hovered', true);

                const bbox = countryElement.node().getBBox();
                const scale = Math.min(8, Math.min(width / bbox.width, height / bbox.height));
                const translate = [
                    width / 2 - scale * (bbox.x + bbox.width / 2),
                    height / 2 - scale * (bbox.y + bbox.height / 2)
                ];

                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                );
            }
        }
    });

    searchInput.addEventListener('input', () => {
        if (!searchInput.value.trim() && !isReadOnly) {
            resetZoom();
            mapGroup.selectAll('path').classed('hovered', false);
        }
    });
});

document.getElementById('save').addEventListener('click', saveStateToServer);
document.getElementById('refresh').addEventListener('click', () => {
    if (!isReadOnly) {
        loadStateFromServer();
        alert('Map refreshed!');
    }
});

document.getElementById('reset-zoom').addEventListener('click', resetZoom);
toggleReadOnlyButton.addEventListener('click', toggleReadOnlyMode);