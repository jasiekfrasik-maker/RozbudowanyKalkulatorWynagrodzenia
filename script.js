window.addEventListener('DOMContentLoaded', () => {

// ===== Stałe (jak w Twoim kodzie) =====
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

// ===== Pomocnicze =====
const PLN = n => (new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:2}).format(n||0));
const num = id => parseFloat((document.getElementById(id).value||'').toString().replace(',','.')) || 0;
const int = id => parseInt(num(id));
const set = (id, val) => document.getElementById(id).textContent = val;
const li = (k,v) => `<li><span>${k}</span><strong>${PLN(v)}</strong></li>`;

// wypełnij listę miesięcy
const selectM = document.getElementById('uop_miesiac');
Object.keys(STAWKI_NOCNE_2025).forEach((m,i)=> {
  const o=document.createElement('option'); o.value=o.textContent=m;
  if(m==='Lipiec') o.selected=true; selectM.appendChild(o);
});

// ===== UOP =====
document.getElementById('uop_calc').addEventListener('click', ()=>{
  const tryb = document.querySelector('input[name="uop_tryb"]:checked').value; // 'godz' | 'mies'
  const stawkaKwota = num('uop_stawka_kwota');
  const zmDz = int('uop_zm_dz');
  const zmNoc = int('uop_zm_noc');
  const dlZm = int('uop_dl_zm');
  const premia = num('uop_premia');

  const ngDz = int('uop_ng_dz');
  const ngNoc = int('uop_ng_noc');
  const ngNoc100 = int('uop_ng_noc_100');

  const dniL4 = int('uop_l4');
  const dniUrl = int('uop_urlop');
  const miesiac = document.getElementById('uop_miesiac').value;

  const ppk = document.getElementById('uop_ppk').checked;
  const pit0 = document.getElementById('uop_pit0').checked;
  const darow = num('uop_darowizny');
  const internet = num('uop_internet');
  const ulgaDziecko = num('uop_dziecko');

  // wyliczenie wynagrodzenia podstawowego i stawki/h
  const godzStandard = (zmDz+zmNoc)*dlZm;
  let kwotaBruttoUmowy = 0, stawkaH = 0;
  if(tryb==='godz'){
    stawkaH = stawkaKwota;
    kwotaBruttoUmowy = godzStandard * stawkaH;
  } else {
    kwotaBruttoUmowy = stawkaKwota;
    stawkaH = godzStandard>0 ? kwotaBruttoUmowy/godzStandard : 0;
  }

  const dodatekNoc = (zmNoc*dlZm) * STAWKI_NOCNE_2025[miesiac];
  const wynagrodzenieNG = (ngDz*stawkaH*1.5) + (ngNoc*stawkaH*1.5) + (ngNoc100*stawkaH*2.0);

  const wynZaPrace = kwotaBruttoUmowy + premia + dodatekNoc + wynagrodzenieNG;

  const ekwiwalent = (wynZaPrace>0 && dniUrl>0) ? (wynZaPrace/WSP_URL_2025)*dniUrl : 0;
  const podstawaSpol = wynZaPrace + ekwiwalent;

  const chorobowe = (dniL4>0 && kwotaBruttoUmowy>0)
    ? ((kwotaBruttoUmowy*(1-SUMA_SPOL_UOP))/30)*dniL4*L4_PROC
    : 0;

  const bruttoUop = podstawaSpol + chorobowe;

  const em = podstawaSpol * SKLADKA_EMERYTALNA_UOP;
  const re = podstawaSpol * SKLADKA_RENTOWA_UOP;
  const ch = podstawaSpol * SKLADKA_CHOROBOWA_UOP;
  const spoleczne = em + re + ch;

  const podstawaZdrow = (podstawaSpol - spoleczne) + chorobowe;
  const zdrow = podstawaZdrow * ZDROW_PROC;

  const ppkKw = ppk ? bruttoUop*PPK_PROC : 0;

  const ulgiOdDochod = darow + internet;
  const podstawaOpodPrzed = bruttoUop - spoleczne - KUP_MIESIECZNIE_UOP - ulgiOdDochod;
  const podstawaOpod = podstawaOpodPrzed>0 ? Math.floor(podstawaOpodPrzed) : 0;

  let zaliczka = 0;
  if(!pit0){
    let pod = (podstawaOpod*PIT_STAWKA) - KWOTA_ZMN;
    pod -= ulgaDziecko;
    zaliczka = pod>0 ? Math.floor(pod) : 0;
  }

  const sumaPotr = spoleczne + zdrow + zaliczka + ppkKw;
  const netto = bruttoUop - sumaPotr;

  // wypis
  const potrHTML = [
    li('Składka emerytalna', em),
    li('Składka rentowa', re),
    li('Składka chorobowa', ch),
    li('Składka zdrowotna', zdrow),
    li('PPK (prac.)', ppkKw),
  ].join('');
  document.getElementById('uop_potr').innerHTML = potrHTML;
  set('uop_suma_potr', PLN(sumaPotr));

  const podsHTML = [
    li('Przychód (brutto)', bruttoUop),
    li('Podstawa ZUS', podstawaSpol),
    li('Podstawa składki zdrow.', podstawaZdrow),
    li('Podstawa opodatkowania', podstawaOpodPrzed),
    li('Zaliczka PIT', zaliczka),
  ].join('');
  document.getElementById('uop_pods').innerHTML = podsHTML;
  set('uop_netto', PLN(netto));
});

// ===== ZLECENIE =====
document.getElementById('z_calc').addEventListener('click', ()=>{
  const tryb = document.querySelector('input[name="z_tryb"]:checked').value;
  const stawkaKwota = num('z_stawka_kwota');
  const zmian = int('z_zmian');
  const dl = int('z_dl_zm');

  const student = document.getElementById('z_student').checked;
  const chorDob = document.getElementById('z_chor').checked;
  const pit0 = document.getElementById('z_pit0').checked;
  const pit2 = document.getElementById('z_pit2').checked;

  const godz = zmian*dl;
  const brutto = (tryb==='godz') ? stawkaKwota*godz : stawkaKwota;

  if(brutto<=0){
    document.getElementById('z_potr').innerHTML = '';
    document.getElementById('z_pods').innerHTML = li('Komunikat','Wpisz dane');
    set('z_netto','—');
    return;
  }

  if(student){
    document.getElementById('z_potr').innerHTML = '';
    document.getElementById('z_pods').innerHTML = [
      li('Przychód (brutto)', brutto),
      li('Podstawa ZUS', 0),
      li('Podstawa zdrow.', 0),
      li('Podstawa opodatkowania', 0),
      li('Zaliczka PIT', 0)
    ].join('');
    set('z_netto', PLN(brutto));
    return;
  }

  const podstawaZUS = brutto;
  const em = podstawaZUS*SKLADKA_EMERYTALNA_ZLEC;
  const re = podstawaZUS*SKLADKA_RENTOWA_ZLEC;
  const ch = chorDob ? podstawaZUS*SKLADKA_CHOR_ZLEC_DOBR : 0;
  const spoleczne = em + re + ch;

  const podstawaZdrow = brutto - spoleczne;
  const zdrow = podstawaZdrow * ZDROW_PROC;

  let zaliczka = 0, podstawaOpodPrzed = 0;
  if(!pit0){
    const kup = (brutto - spoleczne) * KUP_ZLEC_PROC;
    podstawaOpodPrzed = brutto - spoleczne - kup;
    const podstawaOpod = podstawaOpodPrzed>0 ? Math.floor(podstawaOpodPrzed) : 0;
    let pod = podstawaOpod * PIT_STAWKA;
    if(pit2) pod -= KWOTA_ZMN;
    zaliczka = pod>0 ? Math.floor(pod) : 0;
  }

  const sumaPotr = spoleczne + zdrow + zaliczka;
  const netto = brutto - sumaPotr;

  document.getElementById('z_potr').innerHTML = [
    li('Składka emerytalna', em),
    li('Składka rentowa', re),
    li('Składka chorobowa', ch),
    li('Składka zdrowotna', zdrow)
  ].join('');

  document.getElementById('z_pods').innerHTML = [
    li('Przychód (brutto)', brutto),
    li('Podstawa ZUS', podstawaZUS),
    li('Podstawa zdrow.', podstawaZdrow),
    li('Podstawa opodatkowania', podstawaOpodPrzed),
    li('Zaliczka PIT', zaliczka)
  ].join('');

  set('z_netto', PLN(netto));
});
}); // end DOMContentLoaded




