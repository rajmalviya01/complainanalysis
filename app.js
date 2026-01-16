// ================= FIREBASE =================
firebase.initializeApp({
  apiKey: "AIzaSyAdectBb79TVJQN_4hD5uJ-PxMilywAca8",
  authDomain: "complain-ca487.firebaseapp.com",
  projectId: "complain-ca487",
  storageBucket: "complain-ca487.appspot.com"
});

const db = firebase.firestore();

// ================= UTILITIES =================
const $ = id => document.getElementById(id);
let currentUser = null;

function showLoader() {
  $("globalLoader").style.display = "flex";
}

function hideLoader() {
  setTimeout(() => {
    $("globalLoader").style.display = "none";
  }, 300);
}

function show(page) {
  ["authPage", "studentPage", "authorityPage"].forEach(p =>
    $(p).classList.add("hidden")
  );
  $(page).classList.remove("hidden");
}

// ================= PRIORITY ENGINE =================
function calculatePriority(title, desc, category) {
  const text = (title + " " + desc).toLowerCase();

  const high = [
    "fire","shock","electric","gas","leak","burst",
    "danger","unsafe","blood","accident","collapse"
  ];

  const medium = [
    "water","fan","light","power","broken",
    "not working","noise","damage"
  ];

  for (let k of high) if (text.includes(k)) return "High";
  for (let k of medium) if (text.includes(k)) return "Medium";

  if (category === "Safety" || category === "Infrastructure") {
    return "Medium";
  }

  return "Low";
}

function upgradePriorityByTime(priority, createdAt) {
  if (!createdAt) return priority;

  const days =
    (Date.now() - createdAt.toDate().getTime()) /
    (1000 * 60 * 60 * 24);

  if (days > 7) return "High";
  if (days > 3 && priority === "Low") return "Medium";

  return priority;
}

function getBg(c) {
  if (c.status === "Resolved") return "bg-green-200";
  if (c.priority === "High") return "bg-red-200";
  if (c.priority === "Medium") return "bg-yellow-200";
  return "bg-gray-200";
}

// ================= MODAL =================
function openModal(c, time) {
  $("mTitle").innerText = c.title;
  $("mCategory").innerText = c.category;
  $("mPriority").innerText = c.priority;
  $("mStatus").innerText = c.status;
  $("mStudent").innerText = c.studentName;
  $("mStudentId").innerText = c.studentId;
  $("mDesc").innerText = c.desc;
  $("mTime").innerText = time;

  $("complaintModal").classList.remove("hidden");
}

function closeModal() {
  $("complaintModal").classList.add("hidden");
}

// ================= SIGNUP =================
$("signupBtn").onclick = async () => {
  const name = $("nameInput").value.trim();
  const schoolId = $("schoolIdInput").value.trim();
  const role = $("roleSelect").value;

  if (!name || !schoolId) return alert("Fill all fields");

  showLoader();
  const q = await db.collection("users")
    .where("schoolId", "==", schoolId)
    .where("role", "==", role)
    .get();

  if (!q.empty) {
    hideLoader();
    return alert("User already exists");
  }

  await db.collection("users").add({ name, schoolId, role });
  hideLoader();
  alert("Signup successful");
};

// ================= LOGIN =================
$("loginBtn").onclick = async () => {
  const schoolId = $("schoolIdInput").value.trim();
  const role = $("roleSelect").value;

  if (!schoolId) return alert("Enter School ID");

  showLoader();
  const q = await db.collection("users")
    .where("schoolId", "==", schoolId)
    .where("role", "==", role)
    .get();

  if (q.empty) {
    hideLoader();
    return alert("User not found");
  }

  currentUser = q.docs[0].data();

  if (role === "student") {
    show("studentPage");
    await loadStudentComplaints();
  } else {
    show("authorityPage");
    await loadAllComplaints();
  }

  hideLoader();
};

// ================= LOGOUT =================
$("logoutStudent").onclick =
$("logoutAuthority").onclick = () => {
  currentUser = null;
  show("authPage");
};

// ================= SUBMIT COMPLAINT =================
$("submitComplaintBtn").onclick = async () => {
  const title = $("cTitle").value.trim();
  const desc = $("cDesc").value.trim();
  const category = $("cCategory").value;

  if (!title || !desc) return alert("Fill all fields");

  const priority = calculatePriority(title, desc, category);

  showLoader();
  await db.collection("complaints").add({
    title,
    desc,
    category,
    priority,
    status: "Pending",
    studentName: currentUser.name,
    studentId: currentUser.schoolId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  $("cTitle").value = "";
  $("cDesc").value = "";

  hideLoader();
  await loadStudentComplaints();
};

// ================= STUDENT COMPLAINTS =================
async function loadStudentComplaints() {
  const table = $("studentComplaintTable");
  table.innerHTML = "";

  showLoader();
  const q = await db.collection("complaints")
    .where("studentId", "==", currentUser.schoolId)
    .orderBy("createdAt", "desc")
    .get();

  if (q.empty) {
    table.innerHTML =
      `<tr><td colspan="5" class="p-3 text-center">No complaints</td></tr>`;
    hideLoader();
    return;
  }

  q.forEach(d => {
    let c = d.data();
    c.priority = upgradePriorityByTime(c.priority, c.createdAt);

    const time = c.createdAt?.toDate().toLocaleString() || "-";
    const bg = getBg(c);

    const row = document.createElement("tr");
    row.className = "cursor-pointer";
    row.innerHTML = `
      <td class="border p-2 ${bg}">${c.title}</td>
      <td class="border p-2 ${bg}">${c.category}</td>
      <td class="border p-2 ${bg}">${c.priority}</td>
      <td class="border p-2 ${bg}">${c.status}</td>
      <td class="border p-2 ${bg}">${time}</td>
    `;
    row.onclick = () => openModal(c, time);
    table.appendChild(row);
  });

  hideLoader();
}

// ================= AUTHORITY COMPLAINTS =================
async function loadAllComplaints() {
  $("activeComplaintTable").innerHTML = "";
  $("resolvedComplaintTable").innerHTML = "";

  showLoader();
  const q = await db.collection("complaints")
    .orderBy("createdAt", "desc")
    .get();

  q.forEach(d => {
    let c = d.data();
    c.priority = upgradePriorityByTime(c.priority, c.createdAt);

    const time = c.createdAt?.toDate().toLocaleString() || "-";
    const bg = getBg(c);

    const row = document.createElement("tr");
    row.className = "cursor-pointer";
    row.innerHTML = `
      <td class="border p-2 ${bg}">${c.title}</td>
      <td class="border p-2 ${bg}">${c.category}</td>
      <td class="border p-2 ${bg}">${c.priority}</td>
      <td class="border p-2 ${bg}">${c.status}</td>
      <td class="border p-2 ${bg}">${c.studentName}</td>
      <td class="border p-2 ${bg}">${time}</td>
      ${
        c.status !== "Resolved"
          ? `<td class="border p-2">
               <button class="bg-green-600 text-white px-2 rounded">
                 Resolve
               </button>
             </td>`
          : ""
      }
    `;

    row.onclick = () => openModal(c, time);

    if (c.status !== "Resolved") {
      row.querySelector("button").onclick = async e => {
        e.stopPropagation();
        await db.collection("complaints")
          .doc(d.id)
          .update({ status: "Resolved" });
        loadAllComplaints();
      };
      $("activeComplaintTable").appendChild(row);
    } else {
      $("resolvedComplaintTable").appendChild(row);
    }
  });

  hideLoader();
}

