let totalPoints = parseInt(localStorage.getItem('points')) || 0;
let totalReferrals = parseInt(localStorage.getItem('referrals')) || 0;
let completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');

function switchTab(tab) {
  ["wallet", "tasks"].forEach(t => {
    document.getElementById(`${t}Section`).classList.add("hidden");
    document.getElementById(`${t}Tab`).classList.remove("active");
  });

  document.getElementById(`${tab}Section`).classList.remove("hidden");
  document.getElementById(`${tab}Tab`).classList.add("active");
}

document.getElementById("walletTab").onclick = () => switchTab("wallet");
document.getElementById("tasksTab").onclick = () => switchTab("tasks");

function updatePointsDisplay() {
  document.getElementById("totalPoints").innerText = totalPoints;
  document.getElementById("totalReferrals").innerText = totalReferrals;
}

function setTaskCompleted(taskId, points) {
  completedTasks[taskId] = true;
  totalPoints += points;

  localStorage.setItem("points", totalPoints);
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));

  const buttons = document.querySelectorAll(`button[data-task="${taskId}"]`);
  buttons.forEach(btn => {
    btn.innerText = "Completed";
    btn.disabled = true;
  });

  updatePointsDisplay();
}

function handleTaskClick(taskId) {
  const taskMap = {
    telegram: {
      url: "https://t.me/nadwalletofficial",
      points: 100
    },
    twitterFollow: {
      url: "https://twitter.com/your_profile",
      points: 100
    },
    retweet: {
      url: "https://twitter.com/your_profile/status/your_tweet_id",
      points: 50
    }
  };

  const task = taskMap[taskId];
  if (!task || completedTasks[taskId]) return;

  window.open(task.url, "_blank");
  setTaskCompleted(taskId, task.points);
}

function setReferralLink() {
  const user = window.Telegram.WebApp.initDataUnsafe.user;
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

function getReferralFromURL() {
  const params = new URLSearchParams(window.location.search);
  const referrer = params.get('ref');
  if (referrer) {
    localStorage.setItem('referrer', referrer);
    console.log("Referral detected from:", referrer);
  }
}

function rewardReferrer() {
  const alreadyRewarded = localStorage.getItem('refRewarded');
  const referrer = localStorage.getItem('referrer');

  if (referrer && !alreadyRewarded) {
    localStorage.setItem('refRewarded', 'true');
    alert(`Thanks for joining! ${referrer} will receive 100 ND.`);
  }
}

async function registerUser() {
  const user = Telegram.WebApp.initDataUnsafe.user;
  if (!user) return;

  const res = await fetch('https://nad-wallet.onrender.com/register', {
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
    localStorage.setItem("userId", user.id); // CRITICAL: required for Telegram verification
  }

  console.log("Register response:", data);
}

async function verifyTelegramJoin() {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("User ID not found.");

  try {
    const res = await fetch('https://nad-wallet.onrender.com/verify-telegram-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId }),
    });

    const data = await res.json();
    if (data.success) {
      showToast("Telegram verified. +100 ND awarded.");
      setTaskCompleted("telegram", 100);
      document.getElementById("joinTelegram").style.display = "none";
      document.getElementById("verifyTelegram").style.display = "none";
    } else {
      alert("You haven't joined the channel yet.");
    }
  } catch (err) {
    console.error(err);
    alert("Verification failed.");
  }
}

// On Load
window.addEventListener('load', () => {
  Telegram.WebApp.ready();
  registerUser();
  setReferralLink();
  getReferralFromURL();
  rewardReferrer();
  updatePointsDisplay();

  // Set completed task buttons
  Object.keys(completedTasks).forEach(taskId => {
    const buttons = document.querySelectorAll(`button[data-task="${taskId}"]`);
    buttons.forEach(btn => {
      btn.innerText = "Completed";
      btn.disabled = true;
    });
  });
});

// Telegram task buttons
document.getElementById("joinTelegram").addEventListener("click", () => {
  window.open("https://t.me/nadwalletofficial", "_blank");
  document.getElementById("verifyTelegram").style.display = "inline-block";
});

document.getElementById("verifyTelegram").addEventListener("click", verifyTelegramJoin);

const API_BASE_URL = 'https://nad-wallet.onrender.com';

// Example usage:
fetch(`${API_BASE_URL}/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id, username, first_name })
});
