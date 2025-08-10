from js import document
import math

# --- Stałe z Twojego programu ---
SKLADKA_EMERYTALNA_UOP = 0.0976
SKLADKA_RENTOWA_UOP    = 0.0150
SKLADKA_CHOROBOWA_UOP  = 0.0245
SUMA_SKLADEK_SPOLECZNYCH_UOP = SKLADKA_EMERYTALNA_UOP + SKLADKA_RENTOWA_UOP + SKLADKA_CHOROBOWA_UOP
KUP_MIESIECZNIE_UOP = 250.0
WSPOLCZYNNIK_URLOPOWY_2025 = 20.75

SKLADKA_EMERYTALNA_ZLEC = 0.0976
SKLADKA_RENTOWA_ZLEC    = 0.0150
SKLADKA_CHOROBOWA_ZLEC_DOBROWOLNA = 0.0245

KUP_ZLECENIE_PROCENT = 0.20
SKLADKA_ZDROWOTNA_PROCENT = 0.09
STAWKA_PIT = 0.12

PPK_PRACOWNIK_STAWKA = 0.02
KWOTA_ZMNIEJSZAJACA_MIESIECZNIE = 300.0
STAWKA_WYNAGRODZENIA_CHOROBOWEGO = 0.80

STAWKI_NOCNE_2025 = {
    "Styczeń": 5.55, "Luty": 5.83, "Marzec": 5.55, "Kwiecień": 5.55, "Maj": 5.83, "Czerwiec": 5.83,
    "Lipiec": 5.07, "Sierpień": 5.83, "Wrzesień": 5.30, "Październik": 5.07, "Listopad": 6.48, "Grudzień": 5.83
}

def num(el_id):
    v = document.getElementById(el_id).value.strip().replace(',', '.')
    return float(v) if v else 0.0

def i(el_id):
    v = document.getElementById(el_id).value.strip().replace(',', '.')
    return int(float(v)) if v else 0

def checked(el_id):
    return document.getElementById(el_id).checked

def pln(x): 
    return f"{x:,.2f} zł".replace(",", " ").replace(".", ",")

# ========== UOP ==========
def calc_uop(event=None):
    # wejścia
    kwota_brutto = num("uop_brutto")
    zm_dz  = i("uop_zm_dz")
    zm_noc = i("uop_zm_noc")
    dl_zm  = i("uop_dl_zm")
    premia = num("uop_premia")
    ng_dz  = i("uop_ng_dz")
    ng_noc = i("uop_ng_noc")
    ng_noc_100 = i("uop_ng_noc_100")
    dni_l4 = i("uop_l4")
    dni_url = i("uop_urlop")
    miesiac = document.getElementById("uop_miesiac").value

    ppk = checked("uop_ppk")
    pit0 = checked("uop_pit0")
    darow = num("uop_darowizny")
    internet = num("uop_internet")
    ulga_dziecko = num("uop_dziecko")

    # stawka godzinowa (dla nadgodzin i nocnych)
    standardowe_godz = (zm_dz + zm_noc) * dl_zm
    stawka_h = (kwota_brutto / standardowe_godz) if standardowe_godz > 0 else 0.0

    dodatek_noc = (zm_noc * dl_zm) * STAWKI_NOCNE_2025[miesiac]
    wynagrodzenie_ng = (ng_dz * stawka_h * 1.5) + (ng_noc * stawka_h * 1.5) + (ng_noc_100 * stawka_h * 2.0)

    wynagrodzenie_za_prace = kwota_brutto + premia + dodatek_noc + wynagrodzenie_ng

    ekwiwalent = (wynagrodzenie_za_prace / WSPOLCZYNNIK_URLOPOWY_2025) * dni_url if (dni_url > 0 and wynagrodzenie_za_prace > 0) else 0.0

    podstawa_spol = wynagrodzenie_za_prace + ekwiwalent

    chorobowe = ((kwota_brutto * (1 - SUMA_SKLADEK_SPOLECZNYCH_UOP)) / 30) * dni_l4 * STAWKA_WYNAGRODZENIA_CHOROBOWEGO \
                if (dni_l4 > 0 and kwota_brutto > 0) else 0.0

    brutto_uop = podstawa_spol + chorobowe

    emerytalna = podstawa_spol * SKLADKA_EMERYTALNA_UOP
    rentowa    = podstawa_spol * SKLADKA_RENTOWA_UOP
    chor       = podstawa_spol * SKLADKA_CHOROBOWA_UOP
    spoleczne  = emerytalna + rentowa + chor

    podstawa_zdrow = (podstawa_spol - spoleczne) + chorobowe
    zdrow = podstawa_zdrow * SKLADKA_ZDROWOTNA_PROCENT

    ppk_kwota = brutto_uop * PPK_PRACOWNIK_STAWKA if ppk else 0.0

    ulgi_od_dochodu = darow + internet
    podstawa_opod_przed = brutto_uop - spoleczne - KUP_MIESIECZNIE_UOP - ulgi_od_dochodu
    podstawa_opod = math.floor(podstawa_opod_przed) if podstawa_opod_przed > 0 else 0.0

    zaliczka = 0.0
    if not pit0:
      podatek = (podstawa_opod * STAWKA_PIT) - KWOTA_ZMNIEJSZAJACA_MIESIECZNIE
      podatek -= ulga_dziecko
      zaliczka = math.floor(podatek) if podatek > 0 else 0.0

    suma_potracen = spoleczne + zdrow + zaliczka + ppk_kwota
    netto = brutto_uop - suma_potracen

    out = {
      "Przychód (brutto)": brutto_uop,
      "Podstawa ZUS": podstawa_spol,
      "Skł. emerytalna": emerytalna,
      "Skł. rentowa": rentowa,
      "Skł. chorobowa": chor,
      "Składka zdrowotna": zdrow,
      "Podstawa opodatk.": podstawa_opod_przed,
      "Zaliczka PIT": zaliczka,
      "PPK (prac.)": ppk_kwota,
      "NA RĘKĘ": netto
    }
    document.getElementById("uop_out").textContent = "\n".join([f"{k}: {pln(v)}" for k,v in out.items()])

# ========== ZLECENIE ==========
def calc_zlec(event=None):
    stawka = num("z_stawka")
    zmian = i("z_zmian")
    dl = i("z_dl_zm")
    brutto_mies = num("z_brutto_mies")  # jeśli podane, nadpisze stawkę*godziny

    godziny = zmian * dl
    brutto = brutto_mies if brutto_mies > 0 else (stawka * godziny)
    if brutto <= 0:
        document.getElementById("z_out").textContent = "Wpisz dane."
        return

    if document.getElementById("z_student").checked:
        # student – tylko brutto==netto
        document.getElementById("z_out").textContent = f"Przychód: {pln(brutto)}\nNA RĘKĘ: {pln(brutto)}"
        return

    chor_dob = document.getElementById("z_chor").checked
    pit0 = document.getElementById("z_pit0").checked
    pit2 = document.getElementById("z_pit2").checked

    podstawa_zus = brutto
    em = podstawa_zus * SKLADKA_EMERYTALNA_ZLEC
    re = podstawa_zus * SKLADKA_RENTOWA_ZLEC
    ch = podstawa_zus * SKLADKA_CHOROBOWA_ZLEC_DOBROWOLNA if chor_dob else 0.0
    spoleczne = em + re + ch

    podstawa_zdrow = brutto - spoleczne
    zdrow = podstawa_zdrow * SKLADKA_ZDROWOTNA_PROCENT

    zaliczka = 0.0
    podstawa_opod_przed = 0.0
    if not pit0:
        kup = (brutto - spoleczne) * KUP_ZLECENIE_PROCENT
        podstawa_opod_przed = brutto - spoleczne - kup
        podstawa_opod = math.floor(podstawa_opod_przed) if podstawa_opod_przed > 0 else 0.0
        podatek = podstawa_opod * STAWKA_PIT
        if pit2:
            podatek -= KWOTA_ZMNIEJSZAJACA_MIESIECZNIE
        zaliczka = math.floor(podatek) if podatek > 0 else 0.0

    potr = spoleczne + zdrow + zaliczka
    netto = brutto - potr

    out = {
      "Przychód (brutto)": brutto,
      "Podstawa ZUS": podstawa_zus,
      "Skł. emerytalna": em,
      "Skł. rentowa": re,
      "Skł. chorobowa": ch,
      "Podstawa zdrow.": podstawa_zdrow,
      "Składka zdrowotna": zdrow,
      "Podstawa opodatk.": podstawa_opod_przed,
      "Zaliczka PIT": zaliczka,
      "NA RĘKĘ": netto
    }
    document.getElementById("z_out").textContent = "\n".join([f"{k}: {pln(v)}" for k,v in out.items()])

# podpięcie przycisków
document.getElementById("uop_calc").addEventListener("click", calc_uop)
document.getElementById("z_calc").addEventListener("click", calc_zlec)
