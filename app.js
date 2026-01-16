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
  const l = document.getElementById("globalLoader");
  l.style.display = "flex";
}

function hideLoader() {
  const l = document.getElementById("globalLoader");
  setTimeout(() => {
    l.style.display = "none";
  }, 300); // 👈 forces visibility
}

function show(page) {
  ["authPage", "studentPage", "authorityPage"].forEach(p =>
    $(p).classList.add("hidden")
  );
  $(page).classList.remove("hidden");
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

  try {
    showLoader();
    const q = await db.collection("users")
      .where("schoolId", "==", schoolId)
      .where("role", "==", role)
      .get();

    if (!q.empty) return alert("User already exists");

    await db.collection("users").add({ name, schoolId, role });
    alert("Signup successful");

    $("nameInput").value = "";
    $("schoolIdInput").value = "";

  } catch (e) {
    alert(e.message);
  } finally {
    hideLoader();
  }
};

// ================= LOGIN =================
$("loginBtn").onclick = async () => {
  const schoolId = $("schoolIdInput").value.trim();
  const role = $("roleSelect").value;

  if (!schoolId) return alert("Enter School ID");

  try {
    showLoader();
    const q = await db.collection("users")
      .where("schoolId", "==", schoolId)
      .where("role", "==", role)
      .get();

    if (q.empty) return alert("User not found");

    currentUser = q.docs[0].data();

    if (role === "student") {
      show("studentPage");
      await loadStudentComplaints();
    } else {
      show("authorityPage");
      await loadAllComplaints();
    }

    $("nameInput").value = "";
    $("schoolIdInput").value = "";

  } catch (e) {
    alert(e.message);
  } finally {
    hideLoader();
  }
};

// ================= LOGOUT =================
$("logoutStudent").onclick = $("logoutAuthority").onclick = () => {
  currentUser = null;
  show("authPage");
};

// ================= SUBMIT COMPLAINT =================
$("submitComplaintBtn").onclick = async () => {
  if (!currentUser) return alert("Not logged in");

  try {
    showLoader();

    await db.collection("complaints").add({
      title: $("cTitle").value.trim(),
      desc: $("cDesc").value.trim(),
      category: $("cCategory").value,
      priority: $("cPriority").value,
      status: "Pending",
      studentName: currentUser.name,
      studentId: currentUser.schoolId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    $("cTitle").value = "";
    $("cDesc").value = "";

    await loadStudentComplaints();
    alert("Complaint submitted");

  } catch (e) {
    alert(e.message);
  } finally {
    hideLoader();
  }
};

// ================= STUDENT COMPLAINTS =================
async function loadStudentComplaints() {
  const table = $("studentComplaintTable");
  table.innerHTML = "";

  try {
    showLoader();
    const q = await db.collection("complaints")
      .where("studentId", "==", currentUser.schoolId)
      .orderBy("createdAt", "desc")
      .get();

    if (q.empty) {
      table.innerHTML =
        `<tr><td colspan="5" class="p-3 text-center">No complaints</td></tr>`;
      return;
    }

    q.forEach(d => {
      const c = d.data();
      const time = c.createdAt?.toDate?.().toLocaleString() || "-";
      const bg =
        c.priority === "High" ? "bg-red-200" :
        c.priority === "Medium" ? "bg-yellow-200" :
        "bg-green-200";

      const row = document.createElement("tr");
      row.className = "cursor-pointer hover:bg-gray-100";
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

  } finally {
    hideLoader();
  }
}

// ================= AUTHORITY COMPLAINTS =================
async function loadAllComplaints() {
  $("activeComplaintTable").innerHTML = "";
  $("resolvedComplaintTable").innerHTML = "";

  try {
    showLoader();
    const q = await db.collection("complaints")
      .orderBy("createdAt", "desc")
      .get();

    q.forEach(d => {
      const c = d.data();
      const time = c.createdAt?.toDate?.().toLocaleString() || "-";
      const bg =
        c.priority === "High" ? "bg-red-200" :
        c.priority === "Medium" ? "bg-yellow-200" :
        "bg-green-200";

      const row = document.createElement("tr");
      row.className = "cursor-pointer hover:bg-gray-100";
      row.innerHTML = `
        <td class="border p-2 ${bg}">${c.title}</td>
        <td class="border p-2 ${bg}">${c.category}</td>
        <td class="border p-2 ${bg}">${c.priority}</td>
        <td class="border p-2 ${bg}">${c.status}</td>
        <td class="border p-2 ${bg}">${c.studentName}</td>
        <td class="border p-2 ${bg}">${time}</td>
        ${c.status !== "Resolved"
          ? `<td class="border p-2">
               <button class="bg-green-600 text-white px-2 rounded">Resolve</button>
             </td>`
          : ""}
      `;

      row.onclick = () => openModal(c, time);

      if (c.status !== "Resolved") {
        row.querySelector("button").onclick = async (e) => {
          e.stopPropagation();
          showLoader();
          await db.collection("complaints").doc(d.id)
            .update({ status: "Resolved" });
          await loadAllComplaints();
          hideLoader();
        };
        $("activeComplaintTable").appendChild(row);
      } else {
        $("resolvedComplaintTable").appendChild(row);
      }
    });

  } finally {
    hideLoader();
  }
}
