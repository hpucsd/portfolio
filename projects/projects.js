import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

renderProjects(projects, projectsContainer, 'h2')