window.addEventListener('DOMContentLoaded', () => {
  // ===== Stałe (jak w Twoim kalkulatorze) =====
  const SKLADKA_EMERYTALNA_UOP = 0.0976;
  const SKLADKA_RENTOWA_UOP    = 0.0150;
  const SKLADKA_CHOROBOWA_UOP  = 0.0245;
  const SUMA_SPOL_UOP = SKLADKA_EMERYTALNA_UOP + SKLADKA_RENTOWA_UOP + SKLADKA_CHOROBOWA_UOP;

  const KUP_MIESIECZNIE_UOP = 250.00;
  const WSP_URL_2025 = 20.75;

  const SKLADKA_EMERYTALNA_ZLEC = 0.0976;
  const SKLADKA_RENTOWA_ZLEC    = 0.0150;
  const SKLADKA_CHOR_ZLEC_DOBR  = 0.0245;

  const KUP_ZLEC_PROC = 0.20;
  const ZDROW_PROC    = 0.09;
  const PIT_STAWKA    = 0.12;

  const PPK_PROC      = 0.02;
  const KWOTA_ZMN     = 300.00;
  const L4_PROC       = 0.80;

  const STAWKI_NOCNE_2025 = {
    "Styczeń":5.55,"Luty":5.83,"Marzec":5.55,"Kwiecień":5.55,"Maj":5.83,"Czerwiec":5.83,
    "Lipiec":5.07,"Sierpień":5.83,"Wrzesień":5.30,"Październik":5.07,"Listopad":6.48,"Grudzień":5.83
  };

  // ===== Helpers =====
  const PLN = n => new Intl.NumberFormat('pl-PL', { style:'currency', currency:'PLN' }).format(isFinite(n)?n:0);
  const clean = v => (v ?? '').toString().trim().replace(/,/g,'.');
  const num = id => parseFloat(clean(document.getElementById(id).value)) || 0;
  const int = id => parseInt(num(id)) || 0;
  const setText = (id, val) => document.getElementById(id).textContent = val;
  const li = (k,v) => `<li><span>${k}</span><strong>${PLN(v)}</strong></li>`;

  // Zamiana przecinków na kropki LIVE we wszystkich inputach
  document.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp=>{
    inp.addEventListener('input', function(){
      if (this.value.includes(',')) this.value = this.value.replace(/,/g,'.');
    });
  });

  // Wypełnij listę miesięcy
  const selectM = document.getElementById('uop_miesiac');
  if (selectM && !selectM.options.length) {
    Object.keys(STAWKI_NOCNE_2025).forEach(m=>{
      const o=document.createElement('option');
      o.value=o.textContent=m;
      if(m==='Lipiec') o.selected=true;
      selectM.appendChild(o);
    });
  }

  // ===== UoP =====
  const calcUop = () => {
    const tryb = (document.querySelector('input[name="uop_tryb"]:checked')||{}).value || 'godz';
    const stawkaKwota = num('uop_stawka_kwota');
    const zmDz  = int('uop_zm_dz');
    const zmNoc = int('uop_zm_noc');
    const dlZm  = int('uop_dl_zm');
    const premia = num('uop_premia');
    const ngDz = int('uop_ng_dz');
    const ngNoc = int('uop_ng_noc');
    const ngNoc100 = int('uop_ng_noc_100');
    const dniL4 = int('uop_l4');
    const dniUrl = int('uop_urlop');
    const miesiac = (document.getElementById('uop_miesiac')||{}).value || 'Lipiec';

    const ppk  = (document.getElementById('uop_ppk')||{}).checked || false;
    const pit0 = (document.getElementById('uop_pit0')||{}).checked || false;
    const darow = num('uop_darowizny');
    const internet = num('uop_internet');
    const ulgaDziecko = num('uop_dziecko');

    // Godziny standardowe i stawka godz.
    const godzStandard = (zmDz + zmNoc) * dlZm;
    let kwotaBruttoUmowy = 0, stawkaH = 0;
    if (tryb === 'godz') {
      stawkaH = stawkaKwota;
      kwotaBruttoUmowy = godzStandard * stawkaH;
    } else {
      kwotaBruttoUmowy = stawkaKwota;
      stawkaH = godzStandard > 0 ? kwotaBruttoUmowy / godzStandard : 0;
    }

    // Dodatki i nadgodziny
    const dodatekNoc = (zmNoc * dlZm) * (STAWKI_NOCNE_2025[miesiac] || 0);
    const wynNG = (ngDz * stawkaH * 1.5) + (ngNoc * stawkaH * 1.5) + (ngNoc100 * stawkaH * 2.0);

    const wynZaPrace = kwotaBruttoUmowy + premia + dodatekNoc + wynNG;

    // Ekwiwalent urlopowy
    const ekwiwalent = (wynZaPrace > 0 && dniUrl > 0) ? (wynZaPrace / WSP_URL_2025) * dniUrl : 0;

    // Podstawy, składki, chorobowe
    const podstawaSpol = wynZaPrace + ekwiwalent;

    const chorobowe = (dniL4 > 0 && kwotaBruttoUmowy > 0)
      ? ((kwotaBruttoUmowy * (1 - SUMA_SPOL_UOP)) / 30) * dniL4 * L4_PROC
      : 0;

    const bruttoUop = podstawaSpol + chorobowe;

    const em = podstawaSpol * SKLADKA_EMERYTALNA_UOP;
    const re = podstawaSpol * SKLADKA_RENTOWA_UOP;
    const ch = podstawaSpol * SKLADKA_CHOROBOWA_UOP;
    const spoleczne = em + re + ch;

    const podstawaZdrow = (podstawaSpol - spoleczne) + chorobowe;
    const zdrow = podstawaZdrow * ZDROW_PROC;

    const ppkKw = ppk ? bruttoUop * PPK_PROC : 0;

    // Podatek
    const ulgiOdDochod = darow + internet;
    const podstawaOpodPrzed = bruttoUop - spoleczne - KUP_MIESIECZNIE_UOP - ulgiOdDochod;
    const podstawaOpod = podstawaOpodPrzed > 0 ? Math.floor(podstawaOpodPrzed) : 0;

    let zaliczka = 0;
    if (!pit0) {
      let pod = (podstawaOpod * PIT_STAWKA) - KWOTA_ZMN;
      pod -= ulgaDziecko;
      zaliczka = pod > 0 ? Math.floor(pod) : 0;
    }

    const sumaPotr = spoleczne + zdrow + zaliczka + ppkKw;
    const netto = bruttoUop - sumaPotr;

    // Wyniki
    const potrHTML = [
      li('Składka emerytalna', em),
      li('Składka rentowa', re),
      li('Składka chorobowa', ch),
      li('Składka zdrowotna', zdrow),
      li('PPK (prac.)', ppkKw),
    ].join('');
    const podsHTML = [
      li('Przychód (brutto)', bruttoUop),
      li('Podstawa ZUS', podstawaSpol),
      li('Podstawa składki zdrow.', podstawaZdrow),
      li('Podstawa opodatkowania', podstawaOpodPrzed),
      li('Zaliczka na podatek (PIT)', zaliczka),
    ].join('');

    const uop_potr = document.getElementById('uop_potr');
    const uop_pods = document.getElementById('uop_pods');
    if (uop_potr) uop_potr.innerHTML = potrHTML;
    if (uop_pods) uop_pods.innerHTML = podsHTML;
    setText('uop_suma_potr', PLN(sumaPotr));
    setText('uop_netto', PLN(netto));
  };

  // ===== Zlecenie =====
  const calcZlec = () => {
    const tryb = (document.querySelector('input[name="z_tryb"]:checked')||{}).value || 'godz';
    const stawkaKwota = num('z_stawka_kwota');
    const zmian = int('z_zmian');
    const dl = int('z_dl_zm');

    const student = (document.getElementById('z_student')||{}).checked || false;
    const chorDob  = (document.getElementById('z_chor')||{}).checked || false;
    const pit0     = (document.getElementById('z_pit0')||{}).checked || false;
    const pit2     = (document.getElementById('z_pit2')||{}).checked || false;

    const godz = zmian * dl;
    const brutto = (tryb === 'godz') ? (stawkaKwota * godz) : stawkaKwota;

    if (brutto <= 0 || !isFinite(brutto)) {
      const z_pods = document.getElementById('z_pods');
      if (z_pods) z_pods.innerHTML = li('Komunikat', 0);
      setText('z_netto','—');
      (document.getElementById('z_potr')||{}).innerHTML = '';
      return;
    }

    if (student) {
      (document.getElementById('z_potr')||{}).innerHTML = '';
      const z_pods = document.getElementById('z_pods');
      if (z_pods) z_pods.innerHTML = [
        li('Przychód (brutto)', brutto),
        li('Podstawa ZUS', 0),
        li('Podstawa zdrow.', 0),
        li('Podstawa opodatkowania', 0),
        li('Zaliczka PIT', 0)
      ].join('');
      setText('z_netto', PLN(brutto));
      return;
    }

    const podstawaZUS = brutto;
    const em = podstawaZUS * SKLADKA_EMERYTALNA_ZLEC;
    const re = podstawaZUS * SKLADKA_RENTOWA_ZLEC;
    const ch = chorDob ? (podstawaZUS * SKLADKA_CHOR_ZLEC_DOBR) : 0;
    const spoleczne = em + re + ch;

    const podstawaZdrow = brutto - spoleczne;
    const zdrow = podstawaZdrow * ZDROW_PROC;

    let zaliczka = 0, podstawaOpodPrzed = 0;
    if (!pit0) {
      const kup = (brutto - spoleczne) * KUP_ZLEC_PROC;
      podstawaOpodPrzed = brutto - spoleczne - kup;
      const podstawaOpod = podstawaOpodPrzed > 0 ? Math.floor(podstawaOpodPrzed) : 0;
      let pod = podstawaOpod * PIT_STAWKA;
      if (pit2) pod -= KWOTA_ZMN;
      zaliczka = pod > 0 ? Math.floor(pod) : 0;
    }

    const sumaPotr = spoleczne + zdrow + zaliczka;
    const netto = brutto - sumaPotr;

    const z_potr = document.getElementById('z_potr');
    const z_pods = document.getElementById('z_pods');
    if (z_potr) z_potr.innerHTML = [
      li('Składka emerytalna', em),
      li('Składka rentowa', re),
      li('Składka chorobowa', ch),
      li('Składka zdrowotna', zdrow)
    ].join('');
    if (z_pods) z_pods.innerHTML = [
      li('Przychód (brutto)', brutto),
      li('Podstawa ZUS', podstawaZUS),
      li('Podstawa zdrow.', podstawaZdrow),
      li('Podstawa opodatkowania', podstawaOpodPrzed),
      li('Zaliczka PIT', zaliczka)
    ].join('');
    setText('z_netto', PLN(netto));
  };

  // Zdarzenia
  const uopBtn = document.getElementById('uop_calc');
  const zBtn = document.getElementById('z_calc');
  if (uopBtn) uopBtn.addEventListener('click', calcUop);
  if (zBtn) zBtn.addEventListener('click', calcZlec);

  // Opcjonalnie: Enter przelicza aktywną zakładkę
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') {
      const uopPanel = document.getElementById('tab-uop');
      if (uopPanel && uopPanel.classList.contains('active')) calcUop();
      else calcZlec();
    }
  });
});






