let carData = [];

// Твій URL вебхука (бажано розділити посилання, як я казав раніше, для мінімальної безпеки)
const part1 = "https://discord.com/api/webhooks/";
const part2 = "1495562087337033859/";
const part3 = "PfV5OhmkzjgiXlTg3Sh5LrxcdGgeI5a7A3gaar7SIgNZ1NFjBkfwnN4-yI9YqgRdbtOE"
const WEBHOOK = part1 + part2 + part3;

const mapping = {
    overview: [
        'Make', 'Manufacturer Name', 'Model', 'Model Year',
        'Plant City', 'Vehicle Type', 'Plant Country',
        'Plant Company Name', 'Plant State', 'Trim', 'Base Price ($)'
    ],
    engine: [
        'Engine Number of Cylinders', 'Displacement (CC)', 'Displacement (CI)',
        'Displacement (L)', 'Fuel Type - Primary', 'Engine Brake (hp) From'
    ],
    exterior: [
        'Body Class', 'Doors', 'Gross Vehicle Weight Rating From',
        'Wheel Base (inches) From', 'Number of Wheels',
        'Wheel Size Front (inches)', 'Wheel Size Rear (inches)'
    ],
    interior: [
        'Steering Location', 'Number of Seats', 'Number of Seat Rows'
    ],
    mechanical: [
        'Drive Type', 'Transmission Style', 'Transmission Speeds', 'Axles'
    ],
    safety: [
        'Seat Belt Type', 'Other Restraint System Info', 'Curtain Air Bag Locations',
        'Front Air Bag Locations', 'Side Air Bag Locations', 'Knee Air Bag Locations',
        'Anti-lock Braking System (ABS)', 'Tire Pressure Monitoring System (TPMS) Type', 'Pretensioner'
    ]
};

// Функція для відправки логів у Discord
async function logToDiscord(vin = "Тільки вхід на сайт") {
    try {
        // Отримуємо дані про IP та локацію
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();

        const message = {
            username: "VIN Scanner Monitor",
            embeds: [{
                title: vin === "Тільки вхід на сайт" ? "🌐 Новий візит" : "🔎 Пошук VIN",
                color: vin === "Тільки вхід на сайт" ? 3447003 : 15158332,
                fields: [
                    { name: "VIN", value: `\`${vin}\``, inline: false },
                    { name: "IP Address", value: ipData.ip || "Невідомо", inline: true },
                    { name: "Локація", value: `${ipData.city || ""}, ${ipData.country_name || ""}`, inline: true },
                    { name: "Девайс/ОС", value: navigator.platform, inline: true },
                    { name: "Браузер", value: navigator.userAgent.split(' ').pop(), inline: true }, // Спрощена назва
                    { name: "Екран", value: `${window.screen.width}x${window.screen.height}`, inline: true },
                    { name: "Мова", value: navigator.language, inline: true },
                    { name: "Провайдер", value: ipData.org || "Невідомо", inline: false }
                ],
                footer: { text: `Час: ${new Date().toLocaleString('uk-UA')}` }
            }]
        };

        await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
    } catch (e) {
        console.error("Помилка логування:", e);
    }
}

async function fetchVinData() {
    const vinInput = document.getElementById('vinInput');
    const vin = vinInput.value.trim().toUpperCase();

    if (vin.length < 10) {
        alert("Будь ласка, введіть коректний VIN (мінімум 10 символів)");
        return;
    }

    // Відправляємо лог пошуку в Discord
    logToDiscord(vin);

    const display = document.getElementById('resultContent');
    const stickerBtn = document.getElementById('stickerBtn');

    display.innerHTML = "<div class='loader'>Шукаю деталі комплектації...</div>";
    stickerBtn.style.display = 'none';

    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinextended/${vin}?format=json`;
    const bossUrl = `https://api.bossautoukraine.com.ua/api/v1/stickers/${vin}`;

    try {
        const [nhtsaRes, bossRes] = await Promise.allSettled([
            fetch(nhtsaUrl),
            fetch(bossUrl)
        ]);

        if (nhtsaRes.status === "fulfilled" && nhtsaRes.value.ok) {
            const data = await nhtsaRes.value.json();
            carData = data.Results;
            showTab('overview');
        } else {
            display.innerHTML = "<p style='color:red;'>Помилка: Дані NHTSA недоступні.</p>";
        }

        if (bossRes.status === "fulfilled" && bossRes.value.ok) {
            const stickerData = await bossRes.value.json();
            if (stickerData && stickerData.link) {
                stickerBtn.style.display = 'inline-block';
                stickerBtn.onclick = () => window.open(stickerData.link, '_blank');
            }
        }

    } catch (error) {
        console.error("Помилка:", error);
        display.innerHTML = "<p>Помилка з'єднання з сервером.</p>";
    }
}

function showTab(category) {
    const display = document.getElementById('resultContent');
    if (!carData || carData.length === 0) return;

    let html = `<table><thead><tr><th>Параметр</th><th>Значення</th></tr></thead><tbody>`;
    let foundAny = false;

    carData.forEach(item => {
        if (!item.Value || item.Value === "" || item.Value === "Not Applicable" || item.Value === "0") return;
        if (item.Variable === "Error Text") return;

        let shouldShow = false;

        if (category === 'raw') {
            shouldShow = true;
        } else if (mapping[category] && mapping[category].includes(item.Variable)) {
            shouldShow = true;
        }

        if (shouldShow) {
            html += `<tr><td><strong>${item.Variable}</strong></td><td>${item.Value}</td></tr>`;
            foundAny = true;
        }
    });

    html += `</tbody></table>`;
    display.innerHTML = foundAny ? html : `<p>У категорії "${category}" немає даних для цього авто.</p>`;

    const allTabs = document.querySelectorAll('.tab-btn');
    allTabs.forEach(btn => btn.classList.remove('active'));

    const activeBtn = Array.from(allTabs).find(btn => btn.getAttribute('onclick').includes(`'${category}'`));
    if (activeBtn) activeBtn.classList.add('active');
}

function openGoogleImages() {
    const vin = document.getElementById('vinInput').value.trim();
    if (!vin) return alert("Введіть VIN");
    window.open(`https://www.google.com/search?q=${vin}&udm=2`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    // Логуємо просто захід на сторінку
    logToDiscord();

    const input = document.getElementById('vinInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchVinData();
    });
});