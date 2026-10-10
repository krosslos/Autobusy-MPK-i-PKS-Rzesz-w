(() => {
  const $ = id => document.getElementById(id);
  const input = $('numer'), list = $('list'), result = $('result'),
        count = $('count'), clearBtn = $('clear'), toast = $('toast');
  let carrier = localStorage.getItem('carrier') || 'MPK';
  let toastTimer;

  const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function splitModel(full) {
    const m = full.match(/^(.*?)\s*\((\d{4})\)\s*$/);
    return m ? { name: m[1], year: m[2] } : { name: full, year: '' };
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    toast.textContent = 'Skopiowano: ' + text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function render() {
    const data = TABOR[carrier];
    const q = input.value.trim();
    clearBtn.hidden = !q;

    const keys = Object.keys(data).sort((a, b) => a - b);
    const filtered = q ? keys.filter(k => k.startsWith(q)) : keys;

    // karta z dokładnym wynikiem
    if (q && data[q]) {
      const { name, year } = splitModel(data[q]);
      result.className = 'result';
      result.innerHTML =
        `<span class="label">${carrier} · nr taborowy</span>
         <span class="nr">${esc(q)}</span>
         <span class="model">${esc(name)}</span>
         ${year ? `<span class="year">Rok produkcji: ${esc(year)}</span>` : ''}
         <button class="btn" id="copyMain">Kopiuj nazwę</button>`;
      result.hidden = false;
      $('copyMain').onclick = () => copy(data[q]);
    } else if (q && !filtered.length) {
      result.className = 'result none';
      result.textContent = `Brak pojazdu o numerze ${q} w ${carrier}.`;
      result.hidden = false;
    } else {
      result.hidden = true;
    }

    count.textContent = `${carrier}: ${filtered.length} z ${keys.length} pojazdów`;
    list.innerHTML = filtered.map(k =>
      `<li class="item"><span class="n">${esc(k)}</span>
        <span class="m">${esc(data[k])}</span>
        <button data-k="${esc(k)}">Kopiuj</button></li>`).join('');
  }

  list.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]');
    if (b) copy(TABOR[carrier][b.dataset.k]);
  });

  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      carrier = t.dataset.carrier;
      localStorage.setItem('carrier', carrier);
      sync(); render();
    });
  });

  function sync() {
    document.querySelectorAll('.tab').forEach(t => {
      const on = t.dataset.carrier === carrier;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
  }

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    render();
  });
  clearBtn.addEventListener('click', () => { input.value = ''; render(); input.focus(); });

  sync(); render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
  }
})();
