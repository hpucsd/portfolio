import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const titleElement = document.querySelector('.projects-title');

const projectsContainer = document.querySelector('.projects');

titleElement.textContent = `Projects (${projects.length})`;

renderProjects(projects, projectsContainer, 'h2')