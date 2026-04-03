let carData = [];

async function fetchVinData() {
    const vin = document.getElementById('vinInput').value;
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinextended/${vin}?format=json`;

    try {
        const response = await fetch(url);
        const json = await response.json();
        carData = json.Results;
        showTab('overview');
    } catch (error) {
        alert("Error fetching data. Check your VIN.");
    }
}

function showTab(category) {
    const display = document.getElementById('resultContent');

    const mapping = {
        overview: ['Make', 'Model', 'Model Year', 'Plant City', 'Vehicle Type'],
        engine: ['Engine Number of Cylinders', 'Displacement (L)', 'Fuel Type - Primary', 'Engine Model'],
        safety: ['ABS', 'Air Bag Loc Front', 'Traction Control', 'Electronic Stability Control (ESC)'],
        mechanical: ['Drive Type', 'Transmission Speeds', 'Transmission Style', 'Brake System Type']
    };

    let html = `<table><tr><th>Feature</th><th>Value</th></tr>`;
    let foundAny = false;

    carData.forEach(item => {
        if (!item.Value || item.Value === "" || item.Value === "Not Applicable") return;

        let shouldShow = false;
        if (category === 'raw') shouldShow = true;
        else if (mapping[category] && mapping[category].includes(item.Variable)) shouldShow = true;

        if (shouldShow) {
            html += `<tr><td><strong>${item.Variable}</strong></td><td>${item.Value}</td></tr>`;
            foundAny = true;
        }
    });

    html += `</table>`;
    display.innerHTML = foundAny ? html : "<p>No specific data found for this category.</p>";

    const allButtons = document.querySelectorAll('.tab-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = Array.from(allButtons).find(btn => btn.getAttribute('onclick').includes(category));
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}