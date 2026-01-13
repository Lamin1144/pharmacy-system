// ------------------ DATA STORAGE ------------------
let medicines = JSON.parse(localStorage.getItem("medicines")) || [];
let sales = JSON.parse(localStorage.getItem("sales")) || [];

// ------------------ SECTION SWITCH ------------------
function showSection(id) {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";

    if (id === "stock") displayStock();
    if (id === "sales") {
        loadSaleMedicines();
        displaySales();
    }
    if (id === "report") {
        generateDailyReport();
    }
}

// ------------------ ADD MEDICINE ------------------
function addMedicine() {
    let med = {
        name: document.getElementById("name").value,
        batch: document.getElementById("batch").value,
        qty: parseInt(document.getElementById("qty").value),
        price: parseFloat(document.getElementById("price").value),
        expiry: document.getElementById("expiry").value
    };

    if (!med.name || !med.batch || !med.qty || !med.price || !med.expiry) {
        alert("Please fill all fields");
        return;
    }

    medicines.push(med);
    localStorage.setItem("medicines", JSON.stringify(medicines));

    alert("Medicine added successfully");

    document.getElementById("name").value = "";
    document.getElementById("batch").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("price").value = "";
    document.getElementById("expiry").value = "";
}

// ------------------ DISPLAY STOCK WITH ALERTS ------------------
function displayStock() {
    let stockList = document.getElementById("stockList");
    stockList.innerHTML = "";

    let today = new Date();

    medicines.forEach((m, index) => {
        let expiryDate = new Date(m.expiry);
        let rowClass = "";

        // Expiry alerts
        if (expiryDate < today) rowClass = "expired";
        else if ((expiryDate - today) / (1000*60*60*24) <= 7) rowClass = "warning";

        // Low stock
        let qtyDisplay = m.qty;
        if (m.qty <= 100) qtyDisplay = `${m.qty} ⚠️ Low`;

        stockList.innerHTML += `
        <tr class="${rowClass}">
            <td>${m.name}</td>
            <td>${m.batch}</td>
            <td>${qtyDisplay}</td>
            <td>Le ${m.price.toLocaleString()}</td>
            <td>${m.expiry}</td>
            <td><button onclick="deleteMedicine(${index})">Delete</button></td>
        </tr>`;
    });
}

// ------------------ DELETE MEDICINE ------------------
function deleteMedicine(index) {
    if (confirm("Are you sure you want to delete this medicine?")) {
        medicines.splice(index, 1);
        localStorage.setItem("medicines", JSON.stringify(medicines));
        displayStock();
    }
}

// ------------------ SALES FUNCTIONS ------------------

// Load medicines in sales dropdown (exclude expired)
function loadSaleMedicines() {
    let select = document.getElementById("saleMedicine");
    select.innerHTML = "";

    let today = new Date();

    medicines.forEach(m => {
        let expiryDate = new Date(m.expiry);
        if (expiryDate >= today && m.qty > 0) {
            select.innerHTML += `<option value="${m.name}">${m.name}</option>`;
        }
    });

    if (select.innerHTML === "") {
        select.innerHTML = `<option value="">No available medicine</option>`;
    }
}

// Sell medicine
function sellMedicine() {
    let medName = document.getElementById("saleMedicine").value;
    let qtySold = parseInt(document.getElementById("saleQty").value);

    if (!qtySold || qtySold <= 0) {
        alert("Enter a valid quantity");
        return;
    }

    let med = medicines.find(m => m.name === medName);

    if (!med || qtySold > med.qty) {
        alert("Not enough stock");
        return;
    }

    med.qty -= qtySold;

    let sale = {
        name: medName,
        qty: qtySold,
        total: qtySold * med.price,
        date: new Date().toLocaleDateString()
    };

    sales.push(sale);

    localStorage.setItem("medicines", JSON.stringify(medicines));
    localStorage.setItem("sales", JSON.stringify(sales));

    document.getElementById("saleQty").value = "";

    displayStock();
    displaySales();
}

// Display sales records
function displaySales() {
    let salesList = document.getElementById("salesList");
    salesList.innerHTML = "";

    sales.forEach(s => {
        salesList.innerHTML += `
        <tr>
            <td>${s.name}</td>
            <td>${s.qty}</td>
            <td>Le ${s.total.toLocaleString()}</td>
            <td>${s.date}</td>
        </tr>`;
    });
}

// ------------------ DAILY SALES REPORT ------------------
function generateDailyReport() {
    let today = new Date().toLocaleDateString();
    let reportList = document.getElementById("dailyReportList");
    reportList.innerHTML = "";

    let todaySales = sales.filter(s => s.date === today);

    if (todaySales.length === 0) {
        reportList.innerHTML = `<tr><td colspan="4">No sales today</td></tr>`;
        return;
    }

    todaySales.forEach(s => {
        reportList.innerHTML += `
        <tr>
            <td>${s.name}</td>
            <td>${s.qty}</td>
            <td>Le ${s.total.toLocaleString()}</td>
            <td>${s.date}</td>
        </tr>`;
    });
}
