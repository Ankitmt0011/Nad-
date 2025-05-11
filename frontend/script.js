let totalPoints = 0;
let totalReferrals = 0;
let completedTasks = {};

const API_BASE = 'https://nad-wallet.onrender.com/api';

const taskMap = {
  telegram1: {
    id: "telegram1",
    url: "https://t.me/nadwalletofficial",
    points: 100,
    channel: "@nadwalletofficial"
  },
  telegram2: {
    id: "telegram2",
    url: "https://t.me/anotherchannel",
    points: 100,
    channel: "@anotherchannel"
  },
  twitterFollow1: {
    id: "twitterFollow1",
    url: "https://x.com/Nadwallet",
    points: 100
  },
  retweet: {
    id: "retweet",
    url: "https://x.com/monad_xyz/status/1912174239194415250",
    points: 50
  }
};

function switchTab(tab) {
  ["wallet", "tasks"].forEach(t => {
    document.getElementById(`${t}Section`).classList.add("hidden");
    document.getElementById(`${t}Tab`).classList.remove("active");
  });
  document.getElementById(`${tab}Section`).classList.remove("hidden");
  document.getElementById(`${tab}Tab`).classList.add("active");
}

function updatePointsDisplay() {
  document.getElementById("totalPoints").innerText = totalPoints;
  document.getElementById("totalReferrals").innerText = totalReferrals;
}

function markTaskCompletedUI(taskId) {
  const buttons = document.querySelectorAll(`button[data-task="${taskId}"]`);
  buttons.forEach(btn => {
    btn.innerText = "Completed";
    btn.disabled = true;
  });
}

async function setTaskCompleted(taskId, points) {
  completedTasks[taskId] = true;
  totalPoints += points;
  localStorage.setItem("points", totalPoints);
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  markTaskCompletedUI(taskId);
  updatePointsDisplay();

  const userId = localStorage.getItem("userId");
  if (!userId) return;

  await fetch(`${API_BASE}/tasks/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, taskId, points })
  });
}

function handleTaskClick(taskId) {
  const task = taskMap[taskId];
  if (!task || completedTasks[taskId]) return;
  window.open(task.url, "_blank");
  setTaskCompleted(taskId, task.points);
}

async function verifyTelegramJoin(taskId) {
  const task = taskMap[taskId];
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("User ID not found.");

  const res = await fetch(`${API_BASE}/tasks/verify-telegram-join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, task: taskId, channel: task.channel })
  });

  const data = await res.json();
  if (data.success) {
    showToast(`${taskId} verified. +${task.points} ND awarded.`);
    setTaskCompleted(taskId, task.points);
    document.getElementById(`${taskId}-join`).style.display = "none";
    document.getElementById(`${taskId}-verify`).style.display = "none";
  } else {
    alert(data.message || "Verification failed.");
  }
}

function setReferralLink() {
  const user = Telegram.WebApp.initDataUnsafe.user;
  const username = user?.username || user?.id;
  const refLink = `https://t.me/nadwalletbot?start=${username}`;
  document.getElementById('refLink').value = refLink;
}

function copyReferralLink() {
  const refInput = document.getElementById('refLink');
  refInput.select();
  refInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(refInput.value).then(() => showToast("Referral link copied!"));
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    background: '#333', color: '#fff', padding: '10px 20px',
    borderRadius: '20px', zIndex: '1000', fontSize: '14px'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

async function registerUser() {
  const user = Telegram.WebApp.initDataUnsafe.user;
  if (!user) return;

  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: user.id,
      username: user.username,
      first_name: user.first_name
    })
  });

  const data = await res.json();
  if (data.success) {
    localStorage.setItem("userId", user.id);
  }
}

async function fetchUserData(userId) {
  const res = await fetch(`${API_BASE}/users/user-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });

  const data = await res.json();
  if (data.success) {
    totalPoints = data.data.points || 0;
    completedTasks = data.data.completedTasks || {};
    updatePointsDisplay();

    Object.keys(completedTasks).forEach(taskId => {
      if (completedTasks[taskId]) {
        markTaskCompletedUI(taskId);
        const verifyBtn = document.getElementById(`${taskId}-verify`);
        if (verifyBtn) verifyBtn.style.display = "none";
      }
    });
  }
}

window.addEventListener('load', () => {
  Telegram.WebApp.ready();
  registerUser();
  setReferralLink();

  const userId = Telegram.WebApp.initDataUnsafe.user?.id;
  if (userId) fetchUserData(userId);

  ["telegram1", "telegram2"].forEach(taskId => {
    const task = taskMap[taskId];
    const joinBtn = document.getElementById(`${taskId}-join`);
    const verifyBtn = document.getElementById(`${taskId}-verify`);

    if (joinBtn) {
      joinBtn.addEventListener("click", () => {
        window.open(task.url, "_blank");
        verifyBtn.style.display = "inline-block";
      });
    }

    if (verifyBtn) {
      verifyBtn.addEventListener("click", () => verifyTelegramJoin(taskId));
    }
  });

  document.querySelector(`button[data-task="twitterFollow1"]`)?.addEventListener("click", () => {
    handleTaskClick("twitterFollow1");
  });

  document.querySelector(`button[data-task="retweet"]`)?.addEventListener("click", () => {
    handleTaskClick("retweet");
  });
});
