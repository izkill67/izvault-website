(() => {
  const $ = (id) => document.getElementById(id);
  const tabs = [...document.querySelectorAll('[data-profile-tab]')];
  const panels = [...document.querySelectorAll('[data-profile-panel]')];
  const key = 'readvault_preferences_v2';
  const defaults = { hideHold:false, hideDone:false, hidePlan:false, hideDropped:false, view:'grid', theme:'dark' };
  const prefs = Object.assign({}, defaults, JSON.parse(localStorage.getItem(key) || '{}'));
  function save(){ localStorage.setItem(key, JSON.stringify(prefs)); apply(); }
  function apply(){
    document.body.dataset.theme = prefs.theme;
    document.body.classList.toggle('list-preferred', prefs.view === 'list');
    document.querySelectorAll('[data-pref]').forEach(el => el.classList.toggle('on', !!prefs[el.dataset.pref]));
    const map = {hideHold:'On Hold',hideDone:'Completed',hidePlan:'Plan to Read',hideDropped:'Dropped'};
    document.querySelectorAll('.card[data-status]').forEach(card => {
      const s = card.dataset.status;
      const hide = Object.entries(map).some(([k,v]) => prefs[k] && s === v);
      card.hidden = hide;
    });
  }
  function show(name){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.profileTab === name));
    panels.forEach(p => p.classList.toggle('active', p.dataset.profilePanel === name));
  }
  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.profileTab)));
  document.querySelectorAll('[data-pref]').forEach(el => {
    el.addEventListener('click', () => { prefs[el.dataset.pref] = !prefs[el.dataset.pref]; save(); });
  });
  const view = $('profileViewMode'); if(view){ view.value = prefs.view; view.addEventListener('change', e => { prefs.view=e.target.value; save(); }); }
  const theme = $('profileTheme'); if(theme){ theme.value = prefs.theme; theme.addEventListener('change', e => { prefs.theme=e.target.value; save(); }); }
  const clear = $('clearPreferences'); if(clear){ clear.addEventListener('click', () => { Object.assign(prefs, defaults); save(); }); }
  apply();
  window.ReadVaultProfile = { show, prefs, save, apply };
})();
