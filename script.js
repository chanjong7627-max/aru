// Settings behavior: hotel-specific persistence, toggles, sliders, search
const DEFAULTS = {
	roomService: false,
	housekeeping: false,
	dnd: false,
	lighting: 'reading',
	temperature: 22,
	blinds: 50,
	concierge: true,
	spaReserved: false,
	housekeepingTime: ''
};

function loadSettings() {
	const raw = localStorage.getItem('aru_settings');
	let s = raw ? JSON.parse(raw) : {};
	return Object.assign({}, DEFAULTS, s);
}

function saveSettings(settings) {
	localStorage.setItem('aru_settings', JSON.stringify(settings));
}

function applySettingsToUI() {
	const s = loadSettings();
	// toggles (named data-key toggles)
	document.querySelectorAll('[data-key]').forEach(el => {
		const key = el.getAttribute('data-key');
		if (key === 'dndToggle') el.classList.toggle('on', !!s.dnd);
		if (key === 'conciergeToggle') el.classList.toggle('on', !!s.concierge);
	});

	// quick buttons
	document.querySelectorAll('.quick.toggle-btn').forEach(btn => {
		const k = btn.getAttribute('data-key');
		if (!k) return;
		btn.classList.toggle('on', !!s[k]);
	});

	// segmented lighting
	const seg = document.querySelectorAll('.segmented button');
	seg.forEach(b => b.classList.toggle('active', b.getAttribute('data-value') === s.lighting));

	// ranges
	const temp = document.getElementById('temperatureRange');
	const blinds = document.getElementById('blindsRange');
	if (temp) temp.value = s.temperature;
	if (blinds) blinds.value = s.blinds;

	// update visible range labels
	updateRangeDisplays();

	applyTheme('auto');
}

function applyTheme(theme) {
	const app = document.querySelector('.app-container');
	if (!app) return;
	if (theme === 'dark') {
		app.style.background = '#070713';
		app.style.color = '#eee';
	} else if (theme === 'light') {
		app.style.background = 'var(--aru-paper)';
		app.style.color = '#111';
	} else {
		// auto: follow prefers-color-scheme
		const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		app.style.background = prefersDark ? '#070713' : 'var(--aru-paper)';
		app.style.color = prefersDark ? '#eee' : '#111';
	}
}

// UI interactions
function setupSettingsListeners() {
	// generic toggle elements
	document.querySelectorAll('.setting-row .toggle, .toggle[data-key]').forEach(t => {
		t.addEventListener('click', (e) => {
			const el = e.currentTarget;
			el.classList.toggle('on');
			persistFromUI();
		});
	});

	// quick toggle buttons (removed from UI)

	// segmented (lighting)
	document.querySelectorAll('.segmented button').forEach(b => b.addEventListener('click', () => {
		document.querySelectorAll('.segmented button').forEach(x => x.classList.remove('active'));
		b.classList.add('active');
		persistFromUI();
	}));

	// ranges (temperature / blinds)
	['temperatureRange','blindsRange'].forEach(id => {
		const el = document.getElementById(id);
		if (!el) return;
		el.addEventListener('input', (e) => { updateRangeDisplays(); persistFromUI(); });
	});

	// search removed from UI — no-op

	// save & reset
	const saveBtn = document.getElementById('saveSettings');
	if (saveBtn) saveBtn.addEventListener('click', () => { persistFromUI(); alert('설정이 저장되었습니다.'); });
	const resetBtn = document.getElementById('resetSettings');
	if (resetBtn) resetBtn.addEventListener('click', () => { if (confirm('모든 설정을 기본값으로 복원하겠습니까?')) { localStorage.removeItem('aru_settings'); applySettingsToUI(); } });

	const restoreBtn = document.getElementById('restoreBtn');
	if (restoreBtn) restoreBtn.addEventListener('click', () => { if (confirm('앱 설정 초기화 진행?')) { localStorage.removeItem('aru_settings'); applySettingsToUI(); } });
}

function updateRangeDisplays() {
	const temp = document.getElementById('temperatureRange');
	const blinds = document.getElementById('blindsRange');
	const tLabel = document.getElementById('tempValue');
	const bLabel = document.getElementById('blindsValue');
	if (temp && tLabel) tLabel.innerText = temp.value + '°C';
	if (blinds && bLabel) bLabel.innerText = blinds.value + '%';
}

function persistFromUI() {
	const s = loadSettings();
	// quick keys
	document.querySelectorAll('.quick.toggle-btn').forEach(btn => {
		const k = btn.getAttribute('data-key');
		if (!k) return;
		s[k] = btn.classList.contains('on');
	});

	// toggles
	const dndToggle = document.querySelector('[data-key="dndToggle"]');
	const conciergeToggle = document.querySelector('[data-key="conciergeToggle"]');
	if (dndToggle) s.dnd = dndToggle.classList.contains('on');
	if (conciergeToggle) s.concierge = conciergeToggle.classList.contains('on');

	// segmented lighting
	const lightingBtn = document.querySelector('.segmented button.active');
	if (lightingBtn) s.lighting = lightingBtn.getAttribute('data-value');

	// ranges
	const temp = document.getElementById('temperatureRange');
	const blinds = document.getElementById('blindsRange');
	if (temp) s.temperature = Number(temp.value);
	if (blinds) s.blinds = Number(blinds.value);

	saveSettings(s);
	// reflect small UI changes if needed
	applySettingsToUI();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
	applySettingsToUI();
	setupSettingsListeners();
	// booking buttons removed (service section deleted)
});

// Avatar upload & persistence (settings)
function initAvatar() {
	const avatarImg = document.getElementById('avatarImg');
	const headerImg = document.getElementById('headerAvatarImg');
	const placeholder = document.getElementById('avatarPlaceholder');
	const stored = localStorage.getItem('aru_avatar');
	if (stored) {
		if (avatarImg) avatarImg.src = stored;
		if (headerImg) headerImg.src = stored;
		if (placeholder) placeholder.style.display = 'none';
	} else {
		// use header default if present, leave settings placeholder visible
		if (headerImg && !headerImg.src) headerImg.src = 'https://i.pravatar.cc/100?u=sh';
	}

	const wrap = document.getElementById('avatarWrap');
	const input = document.getElementById('avatarInput');
	if (wrap && input) {
		wrap.classList.add('editable');
		wrap.addEventListener('click', () => input.click());
		input.addEventListener('change', (e) => {
			const f = e.target.files && e.target.files[0];
			if (!f) return;
			const reader = new FileReader();
			reader.onload = () => {
				const data = reader.result;
				localStorage.setItem('aru_avatar', data);
				if (avatarImg) avatarImg.src = data;
				if (headerImg) headerImg.src = data;
				if (placeholder) placeholder.style.display = 'none';
			};
			reader.readAsDataURL(f);
		});
	}
}

// run avatar init after DOM ready
document.addEventListener('DOMContentLoaded', initAvatar);

// Optional: expose for console debugging
window._aru_settings = { load: loadSettings, save: saveSettings, apply: applySettingsToUI };
