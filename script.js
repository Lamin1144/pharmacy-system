// -------------------- Firebase Setup --------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// -------------------- LOGIN --------------------
function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Redirect based on role
      db.collection("users").doc(userCredential.user.uid).get().then(doc => {
        const role = doc.data().role;
        if(role === "Admin") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      });
    })
    .catch(error => {
      document.getElementById("loginError").innerText = error.message;
    });
}

// -------------------- DASHBOARD --------------------
auth.onAuthStateChanged(user => {
  if (!user) {
    if(window.location.pathname.includes("dashboard.html") || window.location.pathname.includes("index.html")) {
      window.location.href = "login.html";
    }
  } else {
    if(window.location.pathname.includes("dashboard.html")) {
      loadDashboard();
    }
  }
});

async function loadDashboard() {
  const medicineSnapshot = await db.collection('medicines').get();
  const salesSnapshot = await db.collection('sales')
                                .where('date', '==', new Date().toISOString().split('T')[0])
                                .get();

  let totalStockValue = 0;
  let expiredCount = 0;
  let lowStockCount = 0;

  const today = new Date().toISOString().split('T')[0];

  const medicineTableBody = document.querySelector('#medicineTable tbody');
  medicineTableBody.innerHTML = '';

  medicineSnapshot.forEach(doc => {
    const med = doc.data();
    totalStockValue += med.quantity * med.price;
    if(med.expiryDate < today) expiredCount++;
    if(med.quantity <= 5) lowStockCount++;

    medicineTableBody.innerHTML += `
      <tr>
        <td>${med.name}</td>
        <td>${med.quantity}</td>
        <td>${med.price}</td>
        <td>${med.expiryDate}</td>
      </tr>
    `;
  });

  document.getElementById('totalStock').innerText = 'Le ' + totalStockValue;
  document.getElementById('expiredCount').innerText = expiredCount;
  document.getElementById('lowStockCount').innerText = lowStockCount;

  // Sales today
  let todaysSalesAmount = 0;
  const salesTableBody = document.querySelector('#salesTable tbody');
  salesTableBody.innerHTML = '';
  salesSnapshot.forEach(doc => {
    const sale = doc.data();
    todaysSalesAmount += sale.totalAmount;
    salesTableBody.innerHTML += `
      <tr>
        <td>${sale.medicineName}</td>
        <td>${sale.quantitySold}</td>
        <td>${sale.totalAmount}</td>
        <td>${sale.date}</td>
      </tr>
    `;
  });
  document.getElementById('todaysSales').innerText = 'Le ' + todaysSalesAmount;
}

// -------------------- ADD MEDICINE --------------------
function addMedicine() {
  const name = document.getElementById("medName").value;
  const quantity = parseInt(document.getElementById("medQuantity").value);
  const price = parseInt(document.getElementById("medPrice").value);
  const expiryDate = document.getElementById("medExpiry").value;

  if(!name || !quantity || !price || !expiryDate) {
    alert("Please fill all fields");
    return;
  }

  db.collection("medicines").add({
    name,
    quantity,
    price,
    expiryDate
  }).then(() => {
    alert("Medicine added!");
    loadDashboard();
  });
}

// -------------------- SELL MEDICINE --------------------
function sellMedicine() {
  const medicineName = document.getElementById("sellMedName").value;
  const quantitySold = parseInt(document.getElementById("sellQuantity").value);

  if(!medicineName || !quantitySold) {
    alert("Please fill all fields");
    return;
  }

  // Get medicine from Firestore
  db.collection("medicines").where("name", "==", medicineName).get()
    .then(snapshot => {
      if(snapshot.empty) {
        alert("Medicine not found");
        return;
      }
      const doc = snapshot.docs[0];
      const med = doc.data();
      if(quantitySold > med.quantity) {
        alert("Not enough stock");
        return;
      }

      const newQuantity = med.quantity - quantitySold;
      const totalAmount = quantitySold * med.price;

      // Update medicine stock
      db.collection("medicines").doc(doc.id).update({ quantity: newQuantity });

      // Add to sales
      db.collection("sales").add({
        medicineName,
        quantitySold,
        totalAmount,
        date: new Date().toISOString().split('T')[0]
      }).then(() => {
        alert("Sale recorded!");
        loadDashboard();
      });
    });
}
