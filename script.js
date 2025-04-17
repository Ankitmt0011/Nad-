let totalPoints = parseInt(localStorage.getItem('points')) || 0;
let totalReferrals = parseInt(localStorage.getItem('referrals')) || 0;
const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');

function switchTab(tab) {
  document.getElementById("walletSection").classList.add("hidden");
  document.getElementById("tasksSection").classList.add("hidden");

  document.getElementById("walletTab").classList.remove("active");
  document.getElementById("tasksTab").classList.remove("active");

  document.getElementById(tab + "Section").classList.remove("hidden");
  document.getElementById(tab + "Tab").classList.add("active");
}

document.getElementById("walletTab").onclick = () => switchTab("wallet");
document.getElementById("tasksTab").onclick = () => switchTab("tasks");

function completeTask(taskId) {
  if (completedTasks[taskId]) return;

  let points = 0;
  switch (taskId) {
    case "telegram":
  window.open("https://t.me/nadwalletofficial", "_blank");
  points = 100;
  break;
    case "twitterFollow":
  window.open("https://twitter.com/your_profile", "_blank");
  points = 100;
  break;
      case "retweet":
  window.open("https://twitter.com/your_profile/status/your_tweet_id", "_blank");
  points = 50;
  break;
  }

  totalPoints += points;
  completedTasks[taskId] = true;

  localStorage.setItem("points", totalPoints);
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));

  document.getElementById("totalPoints").innerText = totalPoints;

  const buttons = document.querySelectorAll(`button[onclick="completeTask('${taskId}')"]`);
  buttons.forEach((btn) => {
    btn.innerText = "Completed";
    btn.disabled = true;
  });
}

function setReferralLink() {
  const user = window.Telegram.WebApp.initDataUnsafe.user;
  const username = user?.username || user?.id || 'user';
  const refInput = document.getElementById('refLink');

  if (username) {
    const refLink = `https://t.me/nadwalletbot?start=${username}`;
    refInput.value = refLink;
  } else {
    refInput.value = 'Telegram user info not available';
  }
}

function copyReferralLink() {
  const refInput = document.getElementById('refLink');
  refInput.select();
  refInput.setSelectionRange(0, 99999); // For mobile

  navigator.clipboard.writeText(refInput.value).then(() => {
    showToast("Referral link copied!");
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#333';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '20px';
  toast.style.zIndex = '1000';
  toast.style.fontSize = '14px';
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
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
    console.log(`Awarding 100 ND to referrer: ${referrer}`);
    localStorage.setItem('refRewarded', 'true');
    alert(`Thanks for joining! ${referrer} will receive 100 ND.`);
  }
}

// On Page Load
window.addEventListener('load', () => {
  Telegram.WebApp.ready();
  setReferralLink();
  getReferralFromURL();
  rewardReferrer();

  document.getElementById("totalPoints").innerText = totalPoints;
  document.getElementById("totalReferrals").innerText = totalReferrals;

  Object.keys(completedTasks).forEach(taskId => {
    const buttons = document.querySelectorAll(`button[onclick="completeTask('${taskId}')"]`);
    buttons.forEach((btn) => {
      btn.innerText = "Completed";
      btn.disabled = true;
    });
  });
});
