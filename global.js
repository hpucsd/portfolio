console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// currentLink?.classList.add('current');

console.log(navLinks);

let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'contact/index.html', title: 'Contact' },
  { url: 'projects/index.html', title: 'Project' },
  { url: 'https://github.com/hpucsd', title: 'Github' },
  { url: 'resume/index.html', title: 'Resume' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home');


for (let p of pages) {

  let url = p.url;
  let title = p.title;

  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
  }

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host === location.host) {
    console.log('works')
  }

  console.log(location.pathname)
  console.log(a.pathname)

  if (a.pathname === location.pathname) {
    console.log('working')
  }

  if (url.startsWith('http')) {
    a.target = "_blank";
  }

  nav.append(a);

}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-switcher">
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
});


const savedColorScheme = localStorage.colorScheme;
if (savedColorScheme) {
  // If a preference exists, apply it
  setColorScheme(savedColorScheme);
  // Update the select dropdown to reflect the saved choice
  themeSwitcher.value = savedColorScheme;
} else {
  // If no preference is saved, set the default value to "auto"
  setColorScheme('auto');
  themeSwitcher.value = 'auto';
}