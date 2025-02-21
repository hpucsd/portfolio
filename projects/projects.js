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

//Lab 5

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

let total = 0;

for (let d of data) {
  total += d;
}

let angle = 0;
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);

for (let d of data) {
  let endAngle = angle + (d.value / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

let arcs = arcData.map((d) => arcGenerator(d));

let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcs.forEach((arc, idx) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr("fill", colors(idx)); // Fill in the attribute for fill color via indexing the colors variable
});

let legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
})

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {

  let newSVG = d3.select('svg'); 
  newSVG.selectAll('path').remove();
  let newLegend = d3.select('.legend')
  newLegend.selectAll('li').remove();

  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
    
  let total = 0;

  for (let d of data) {
    total += d;
  }

  let angle = 0;

  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);

  for (let d of data) {
    let endAngle = angle + (d / total) * 2 * Math.PI;
    newArcData.push({ startAngle: angle, endAngle });
    angle = endAngle;
  }

  let newArcs = newArcData.map((d) => arcGenerator(d));;
    
  // TODO: clear up paths and legends
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  newArcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr("fill", colors(idx)); // Fill in the attribute for fill color via indexing the colors variable
  });
  
  // update paths and legends, refer to steps 1.4 and 2.2
  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
  });
}

renderPieChart(projects)

let query = '';

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {

  // update query value
  query = event.target.value;

  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

let selectedIndex = -1;
let svg = d3.select('svg');
svg.selectAll('path').remove();
arcs.forEach((arc, i) => {
  svg
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(i))
    .on('click', () => {
    selectedIndex = selectedIndex === i ? -1 : i;

    svg
      .selectAll('path')
      .attr('class', (_, idx) => (
        idx === selectedIndex ? 'selected' : ''
    ));

    legend
      .selectAll('li')
      .attr('class', (_, idx) => (
        idx === selectedIndex ? 'selected' : ''
    ));
  });
});

if (selectedIndex === -1) {
  renderProjects(projects, projectsContainer, 'h2');
} else {
  //Fix this
  let filteredProjects = projects.filter(project => project.year === data[i].label ? -1 : data[i].label);
  console.log(selectedIndex);

  renderProjects(filteredProjects, projectsContainer, 'h2');
}
