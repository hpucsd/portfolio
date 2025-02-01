import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

async function loadLatestProjects() {
  const projectsContainer = document.querySelector('.projects');

  if (!projectsContainer) {
      console.error('Error: No container with class "projects" found in index.html');
      return;
  }

  try {
      const projects = await fetchJSON('./lib/projects.json');

      const latestProjects = projects.slice(0, 3);

      renderProjects(latestProjects, projectsContainer, 'h3');
  } catch (error) {
      console.error('Error loading latest projects:', error);
  }
}

loadLatestProjects();

const githubData = await fetchGithubData('giorgianicolaou');

const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }