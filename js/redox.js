/**
 * Create the titration plot with the input values in the HTML form
 */
function plotRedoxTitration(){
    d3.selectAll("svg").selectAll("*").remove();

    // Assignment of variables
    let initialVolume = parseInt(document.getElementById("volumen-inicial").value);
    let totalAgregatedVolume = parseInt(document.getElementById("volumen-anadido").value);
    let agregatedStepVolume = parseFloat(document.getElementById("intervalos-adicion").value);
    let analyteStandardPotential = parseFloat(document.getElementById("potencial-analito").value);
    let titrantStandardPotential = parseFloat(document.getElementById("potencial-titulante").value);
    let analyteMolarity = document.getElementById("concentracion-analito").value;
    let titrantMolarity = document.getElementById("concentracion-titulante").value;

    // Compute titration
    const data = getDataRedoxSystem(
        initialVolume, totalAgregatedVolume, agregatedStepVolume, analyteStandardPotential, 
        titrantStandardPotential, analyteMolarity, titrantMolarity
    );

    // SVG Dimensions
    const width = 700;
    const height = 900;
    const padding = 20;

    // Scales
    const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d[0]))
    .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
    .domain([0, 2.0])
    .range([height - padding, padding]);
    
    // Make plot
    const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

    svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d[0]))
    .attr("cy", (d) => yScale(d[1]))
    .attr("r", (d) => 3)
    .attr("fill", "blue");
    
    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
    .attr("transform", "translate(0," + (height - padding) + ")")
    .call(xAxis.ticks(15));

    svg.append("g")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis.ticks(12));
}

/**
 * Return an array with the volume and pH values for the titration
 * @param {Number} initialVolume Initial volume of aliquot
 * @param {Number} totalAgregatedVolume Total titulant volume
 * @param {Number} agregatedStepVolume Volume added on each titration step
 * @param {Number} analyteStandardPotential Standard potential for analyte
 * @param {Number} titrantStandardPotential Standard potential for titrant
 * @param {Number} analyteMolarity Analyte molarity [mol/L]
 * @param {Number} titrantMolarity Titrant molarity [mol/L]
 * @returns {Array} Volume and E° values [Vol, pH] x number of points
 */
function getDataRedoxSystem(initialVolume, totalAgregatedVolume, agregatedStepVolume, analyteStandardPotential, titrantStandardPotential, analyteMolarity, titrantMolarity) {
    let nDecimals = 3 // number of decimals for the pH results

    let equivalenceVolume = (initialVolume*analyteMolarity)/titrantMolarity

    let stepVolume = 0 + agregatedStepVolume // volume on step i
    let stepE = 0 // E on step i

    let analyteOxConcentration = 0 // analyte oxidized concentration on step i
    let analyteRedConcentration = 0 // analyte reduced concentration on step i

    let titrantRedConcentration = 0 // titrant ruduced concentration on step i
    let titrantOxConcentration = 0 // titrant oxidized concentration on step i

    let dataSet = [] // Final array dataset

    let maxPoints = (totalAgregatedVolume*1.5)/agregatedStepVolume // Max number of points

    for (let i = 0; i < parseInt(maxPoints); i++) {
        if (stepVolume > 0 && stepVolume < equivalenceVolume) {
            // #################
            // # Initial point #
            // #################
            analyteOxConcentration = (analyteMolarity*initialVolume - titrantMolarity*stepVolume)/(initialVolume + stepVolume)
            analyteRedConcentration = (titrantMolarity*stepVolume)/(initialVolume + stepVolume)
            stepE = analyteStandardPotential - 0.0592*Math.log10(analyteOxConcentration/analyteRedConcentration)
            dataSet.push([stepVolume, stepE.toFixed(nDecimals)])
        } else if (stepVolume === equivalenceVolume) {
            // #####################
            // # Equivalence Point #
            // #####################
            stepE = (analyteStandardPotential + titrantStandardPotential)/2
            dataSet.push([stepVolume, stepE.toFixed(nDecimals)])
        } else if (stepVolume > equivalenceVolume && stepVolume <= totalAgregatedVolume) {
            // ###########################
            // # After Equivalence Point #
            // ###########################
            titrantRedConcentration = (titrantMolarity*stepVolume - analyteMolarity*initialVolume)/(initialVolume + stepVolume)
            titrantOxConcentration = (analyteMolarity*initialVolume)/(initialVolume + stepVolume)
            stepE = titrantStandardPotential - 0.0592*Math.log10(titrantOxConcentration/titrantRedConcentration)
            dataSet.push([stepVolume, stepE.toFixed(nDecimals)])
        } else if (stepVolume > totalAgregatedVolume) {
            break
        }
        stepVolume += agregatedStepVolume // Update step volume value
    }
    return dataSet
}
