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

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

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
let arcs = arcData.map((d) => arcGenerator(d));

for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

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

let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
  
    // Filter projects based on the search query
    let filteredProjects = projects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query);
    });
  
    // Update the displayed projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
    
    // Re-render the pie chart with filtered projects
    renderPieChart(filteredProjects);
});

function renderPieChart(projectsGiven) {
    let newSVG = d3.select('svg'); 
    newSVG.selectAll('path').remove();
    
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
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData)
    let newArcs = newArcData.map((d) => arcGenerator(d));

    for (let d of data) {
        let endAngle = angle + (d / total) * 2 * Math.PI;
        arcData.push({ startAngle: angle, endAngle });
        angle = endAngle;
    }

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    

    newArcs.forEach((arc, idx) => {
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
  }

  searchInput.addEventListener('change', (event) => {
    let filteredProjects = setQuery(event.target.value);
    // re-render legends and pie chart when event triggers
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });