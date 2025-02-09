import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const titleElement = document.querySelector('.projects-title');

const projectsContainer = document.querySelector('.projects');

if (projects.length == 1) {
    titleElement.textContent = `${projects.length} Project`;
} else {
    titleElement.textContent = `${projects.length} Projects`;
}

renderProjects(projects, projectsContainer, 'h2')

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

//let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// let arc = arcGenerator({
//     startAngle: 0,
//     endAngle: 2 * Math.PI,
//   });

// d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');

let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

let total = data.reduce((sum, d) => sum + d.value, 0);

let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(100);

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let svg = d3.select('svg');

// Clear previous chart before rendering
svg.selectAll('path').remove();

arcData.forEach((d, idx) => {
  svg.append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(idx))
    .on('mouseover', function() {
      d3.selectAll('path').style('opacity', 0.5);
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.selectAll('path').style('opacity', 1);
    });
});

let legend = d3.select('.legend');
legend.selectAll('*').remove(); // Clear previous legend

data.forEach((d, idx) => {
  legend.append('li')
    .attr('style', `--color:${colors(idx)}`)
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  let query = event.target.value.toLowerCase();
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });
  renderProjects(filteredProjects, document.querySelector('.projects-container'), 'h2');
  renderPieChart(filteredProjects);
});

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => ({ value: count, label: year }));
  let newArcData = sliceGenerator(newData);

  svg.selectAll('path').remove();
  legend.selectAll('*').remove();

  newArcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .on('mouseover', function() {
        d3.selectAll('path').style('opacity', 0.5);
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.selectAll('path').style('opacity', 1);
      });
  });

  newData.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}
