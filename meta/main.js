let data = [];
let commits = []
let selectedCommits = [];

let xScale;
let yScale;

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 20 };

let commitProgress = 100
let timeScale;
let commitMaxTime;
let filteredCommits = []

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  console.log(commits);
  displayStats();
  updateScatterplot(commits);
  brushSelector();

  timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
  commitMaxTime = timeScale.invert(commitProgress);

  updateFileVisualization(commits)
}

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/hpucsd/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
      });

      return ret;
    });
}

function displayStats() {
  // Process commits first
  processCommits();

  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Function to append dt and dd inside a div
  function addStat(term, value) {
    const row = dl.append('div').attr('class', 'stat-row');
    row.append('dt').html(term);
    row.append('dd').text(value);
  }

  // Add stats
  addStat('Total <abbr title="Lines of code">LOC</abbr>', data.length);
  addStat('Total commits', commits.length);

  const maxDepth = d3.max(data, (d) => d.depth);
  addStat('Maximum depth', maxDepth);

  const avgDepth = d3.mean(data, (d) => d.depth).toFixed(2);
  addStat('Average depth', avgDepth);

  const numFiles = d3.group(data, (d) => d.file).size;
  addStat('Number of files', numFiles);

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
  );
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]).toFixed(2);
  addStat('Average File Length', averageFileLength);

  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  addStat('Max Work Period', maxPeriod);
}

function createScatterplot() {
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

  const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1).classed('selected', true);;
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      //updateTooltipContent({}); // Clear tooltip content
      d3.select(event.currentTarget).style('fill-opacity', 0.7).classed('selected', isCommitSelected(event.currentTarget.__data__));
      updateTooltipVisibility(false);
    });

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);    

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

}

function updateScatterplot(filteredCommits) {

  d3.select('svg').remove();

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(filteredCommits, (d) => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  
  svg.selectAll('g').remove(); // clear the scatters in order to re-draw the filtered ones
  const dots = svg.append('g').attr('class', 'dots');

  // same as before

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // same as before

  dots.selectAll('circle').remove(); 
  dots.selectAll('circle').data(filteredCommits).join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 1)
        .classed('selected', isCommitSelected(commit)); // Apply selection class
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event, commit) => {
      //updateTooltipContent({}); // Clear tooltip content
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7)
        .classed('selected', isCommitSelected(commit));
      updateTooltipVisibility(false);
    });

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);    

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));


  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
    // same as before
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
  const svg = document.querySelector('svg');
  // Create brush
  d3.select(svg).call(d3.brush());

  // Raise dots and everything after overlay
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();

  // Update brush initialization to listen for events
  d3.select(svg).call(d3.brush().on('start brush end', brushed));
}

let brushSelection = null;

function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        let x = xScale(commit.date);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });

  updateSelection();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));

  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

const timeSlider = document.getElementById('timeSlider');
const selectedTime = d3.select('#selectedTime');

function updateTimeDisplay() {
  commitProgress = Number(timeSlider.value);
  commitMaxTime = timeScale.invert(commitProgress);

  selectedTime.text(commitMaxTime.toLocaleString());
  
  filterCommitsByTime(); // Filter commits based on time
  updateScatterplot(filteredCommits); // Update the scatterplot with the filtered commits

  //updateFileVisualization();
}

function filterCommitsByTime() {
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}

timeSlider.addEventListener('input', () => {
  updateTimeDisplay();
  brushSelector();
  updateFileVisualization(filteredCommits);
});

function updateFileVisualization(filteredCommits) {
  // Obtain the file names and associated lines from the filtered commits
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({ name, lines }));

  files = d3.sort(files, (d) => -d.lines.length);
  // Clear existing file visualization to re-render
  d3.select('.files').selectAll('div').remove();

  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  // Select the file visualization container and bind data
  let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');

  // Append filename inside <dt> wrapped in <code> and add total line count in <small>
  filesContainer.append('dt')
                .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  // Append line visualization inside <dd> as individual divs
  filesContainer.append('dd')
                .attr('class', 'line-container') // Add class for styling
                .selectAll('div')
                .data(d => d.lines)
                .enter()
                .append('div')
                .attr('class', 'line')
                .style('background', d => fileTypeColors(d.type)); // Apply color scale based on line type
}

let NUM_ITEMS = 100; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 30; // Feel free to change
let VISIBLE_COUNT = 10; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
  renderItems(startIndex);
});

function renderItems(startIndex) {
  // Clear things off
  itemsContainer.selectAll('div').remove();
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  // TODO: how should we update the scatterplot (hint: it's just one function call)
  updateScatterplot(newCommitSlice);

  // Re-bind the commit data to the container and represent each using a div
  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .each(function(commit, index) {
      // Create a dummy narrative for each commit
      const commitDate = new Date(commit.datetime).toLocaleString("en", { dateStyle: "full", timeStyle: "short" });
      const commitLink = commit.url;
      const linesChanged = commit.totalLines;
      const filesChanged = d3.rollups(commit.lines, D => D.length, d => d.file).length;

      // Dummy narrative text
      const narrativeText = `
        <p>
          On ${commitDate}, I made
          <a href="${commitLink}" target="_blank">
            ${index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a>. I edited ${linesChanged} lines across ${filesChanged} files. Then I looked over all I had made, and I saw that it was very good.
        </p>
        <hr style="border: 1px solid #ccc; margin: 20px 0;"> <!-- Divider -->
      `;
      
      // Insert the narrative and divider into the div
      d3.select(this).html(narrativeText);
    })
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

renderItems(0)