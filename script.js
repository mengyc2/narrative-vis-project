// --- script.js ---

// Create SVG canvas
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", 800)
  .attr("height", 500)
  .style("opacity", 1);

let currentScene = 0;
let globalData;

const countrySelect = d3.select("#country-select");

// Load data
d3.csv("https://raw.githubusercontent.com/mengyc2/narrative-vis-project/main/data/life-expectancy.csv").then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    d["Life expectancy"] = +d["Period life expectancy at birth"];
  });
  globalData = data;

  // Populate dropdown
  const countries = [...new Set(data.map(d => d.Entity))].sort();
  countrySelect.selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  countrySelect.property("value", "United States");

  renderScene();

  d3.select("#next").on("click", () => {
    currentScene = Math.min(currentScene + 1, 2);
    renderScene();
  });

  d3.select("#back").on("click", () => {
    currentScene = Math.max(currentScene - 1, 0);
    renderScene();
  });

  d3.select("#restart").on("click", () => {
    currentScene = 0;
    renderScene();
  });

  countrySelect.on("change", () => {
    renderScene();
  });
});

function renderScene() {
  svg.transition().duration(500).style("opacity", 0).on("end", () => {
    if (currentScene === 0) {
      showScene(countrySelect.property("value"));
    } else if (currentScene === 1) {
      showComparisonScene();
    } else if (currentScene === 2) {
      showAnnotationScene();
    }
    svg.transition().duration(500).style("opacity", 1);
  });
}

// Scene 1
function showScene(country) {
  svg.selectAll("*").remove();
  const data = globalData.filter(d => d.Entity === country);

  svg.append("text")
    .attr("x", 50)
    .attr("y", 40)
    .text(`Scene 1: Life Expectancy Over Time – ${country}`)
    .attr("class", "annotation");

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.Year)).range([60, 750]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d["Life expectancy"])])
    .range([450, 60]);

  const line = d3.line().x(d => x(d.Year)).y(d => y(d["Life expectancy"]));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  svg.append("g").attr("transform", "translate(0,450)").call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));
}

// Scene 2
function showComparisonScene() {
  svg.selectAll("*").remove();

  const countries = ["United States", countrySelect.property("value")];
  const filtered = globalData.filter(d => countries.includes(d.Entity));

  svg.append("text")
    .attr("x", 50)
    .attr("y", 40)
    .text(`Scene 2: Comparing ${countries.join(" and ")}`)
    .attr("class", "annotation");

  const x = d3.scaleLinear().domain(d3.extent(filtered, d => d.Year)).range([60, 750]);
  const y = d3.scaleLinear().domain([0, d3.max(filtered, d => d["Life expectancy"])])
    .range([450, 60]);

  const colors = d3.scaleOrdinal().domain(countries).range(["steelblue", "crimson"]);
  const line = d3.line().x(d => x(d.Year)).y(d => y(d["Life expectancy"]));

  countries.forEach(country => {
    const countryData = filtered.filter(d => d.Entity === country);
    svg.append("path")
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", colors(country))
      .attr("stroke-width", 2)
      .attr("d", line);
    svg.append("text")
      .attr("x", 700)
      .attr("y", y(countryData[countryData.length - 1]["Life expectancy"]))
      .attr("fill", colors(country))
      .text(country);
  });

  svg.append("g").attr("transform", "translate(0,450)").call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));
}

// Scene 3
function showAnnotationScene() {
  svg.selectAll("*").remove();

  const country = countrySelect.property("value");
  const data = globalData.filter(d => d.Entity === country);

  svg.append("text")
    .attr("x", 50)
    .attr("y", 40)
    .text(`Scene 3: Annotated - ${country}`)
    .attr("class", "annotation");

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.Year)).range([60, 750]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d["Life expectancy"])])
    .range([450, 60]);

  const line = d3.line().x(d => x(d.Year)).y(d => y(d["Life expectancy"]));
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 2)
    .attr("d", line);

  if (data.some(d => d.Year === 2020)) {
    const covidPoint = data.find(d => d.Year === 2020);
    svg.append("circle")
      .attr("cx", x(2020))
      .attr("cy", y(covidPoint["Life expectancy"]))
      .attr("r", 5)
      .attr("fill", "red");

    svg.append("text")
      .attr("x", x(2020) + 10)
      .attr("y", y(covidPoint["Life expectancy"]) - 10)
      .text("COVID-19 impact")
      .attr("fill", "red");
  }

  svg.append("g").attr("transform", "translate(0,450)").call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#eee")
    .style("padding", "5px")
    .style("border", "1px solid #aaa")
    .style("display", "none");

  svg.selectAll("circle.dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.Year))
    .attr("cy", d => y(d["Life expectancy"]))
    .attr("r", 3)
    .attr("fill", "black")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block").html(`Year: ${d.Year}<br>Life Expectancy: ${d["Life expectancy"]}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));
} 
