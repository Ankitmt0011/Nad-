const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe.user?.id;
const BACKEND_URL = 'https://nad-wallet.onrender.com';

// Sections
const walletSection = document.getElementById('walletSection');
const tasksSection = document.getElementById('tasksSection');
const walletTab = document.getElementById('walletTab');
const tasksTab = document.getElementById('tasksTab');

// Score
const totalPointsEl = document.getElementById('totalPoints');
const totalReferralsEl = document.getElementById('totalReferrals');

// Buttons
const joinMainTelegramBtn = document.getElementById('joinTelegram');
const verifyMainTelegramBtn = document.getElementById('verifyTelegram');
const joinSecondTelegramBtn = document.getElementById('joinTelegram2');
const twitterFollowBtn = document.getElementById('twitterFollow');
const retweetBtn = document.getElementById('retweet');

// Referral
const refLinkInput = document.getElementById('refLink');

// Tabs
walletTab.onclick = () => {
  walletSection.classList.remove('hidden');
  tasksSection.classList.add('hidden');
  walletTab.classList.add('active');
  tasksTab.classList.remove('active');
};

tasksTab.onclick = () => {
  tasksSection.classList.remove('hidden');
  walletSection.classList.add('hidden');
  tasksTab.classList.add('active');
  walletTab.classList.remove('active');
};

// Referral link
const refLink = `https://t.me/NadwalletBot?start=${userId}`;
refLinkInput.value = refLink;

function copyReferralLink() {
  navigator.clipboard.writeText(refLinkInput.value);
  alert('Referral link copied!');
}

async function fetchUserData() {
  const res = await fetch(`${BACKEND_URL}/user/${userId}`);
  const data = await res.json();
  totalPointsEl.textContent = data.totalPoints || 0;
  totalReferralsEl.textContent = data.referrals || 0;

  // Update task buttons
  if (data.tasks?.telegramMain) setCompleted(joinMainTelegramBtn);
  if (data.tasks?.telegramSecond) setCompleted(joinSecondTelegramBtn);
  if (data.tasks?.twitterFollow) setCompleted(twitterFollowBtn);
  if (data.tasks?.retweet) setCompleted(retweetBtn);
}

function setCompleted(button) {
  button.disabled = true;
  button.textContent = 'Completed';
}

function openLink(link) {
  window.open(link, '_blank');
}

joinMainTelegramBtn.onclick = () => {
  openLink('https://t.me/Nadwallet');
  verifyMainTelegramBtn.style.display = 'inline-block';
};

verifyMainTelegramBtn.onclick = async () => {
  const res = await fetch(`${BACKEND_URL}/verify-telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  const data = await res.json();
  if (data.success) {
    setCompleted(joinMainTelegramBtn);
    verifyMainTelegramBtn.style.display = 'none';
    fetchUserData();
  } else {
    alert('Please join the Telegram channel first.');
  }
};

joinSecondTelegramBtn.onclick = async () => {
  openLink('https://t.me/NadwalletGroup');
  const res = await fetch(`${BACKEND_URL}/complete-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, task: 'telegramSecond' })
  });
  const data = await res.json();
  if (data.success) {
    setCompleted(joinSecondTelegramBtn);
    fetchUserData();
  } else {
    alert('You may have already completed this task.');
  }
};

twitterFollowBtn.onclick = async () => {
  openLink('https://x.com/Nadwallet');
  const res = await fetch(`${BACKEND_URL}/complete-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, task: 'twitterFollow' })
  });
  const data = await res.json();
  if (data.success) {
    setCompleted(twitterFollowBtn);
    fetchUserData();
  } else {
    alert('You may have already completed this task.');
  }
};

retweetBtn.onclick = async () => {
  openLink('https://x.com/monad_xyz/status/1912174239194415250');
  const res = await fetch(`${BACKEND_URL}/complete-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, task: 'retweet' })
  });
  const data = await res.json();
  if (data.success) {
    setCompleted(retweetBtn);
    fetchUserData();
  } else {
    alert('You may have already completed this task.');
  }
};

// Initial fetch
fetchUserData();
