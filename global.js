console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add('current');

console.log(navLinks);

let pages = [
  { url: '', title: 'Home' },
  { url: 'contacts/', title: 'Contact' },
  { url: 'projects/', title: 'Project' },
  { url: 'https://github.com/hpucsd', title: 'Github' },
  { url: 'resume/', title: 'Resume' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

// Create link and add it to nav
nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);

const ARE_WE_HOME = document.documentElement.classList.contains('home');

if (!ARE_WE_HOME && !url.startsWith('http')) {
  url = '../' + url;
}