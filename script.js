document.addEventListener('DOMContentLoaded', function () {

    // Funkcja konwersji przecinków na kropki
    function parseNumber(value) {
        if (!value) return 0;
        return parseFloat(value.toString().replace(',', '.')) || 0;
    }

    // Pobieramy elementy z DOM
    const bruttoInput = document.getElementById('brutto');
    const etatInput = document.getElementById('etat');
    const wynikBrutto = document.getElementById('wynik-brutto');
    const wynikNetto = document.getElementById('wynik-netto');
    const obliczBtn = document.getElementById('oblicz');

    // Obsługa automatycznej zamiany przecinka na kropkę w polach input
    document.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => {
        input.addEventListener('input', function () {
            if (this.value.includes(',')) {
                this.value = this.value.replace(/,/g, '.');
            }
        });
    });

    // Funkcja do obliczeń — przykładowa logika
    function obliczWynagrodzenie() {
        const brutto = parseNumber(bruttoInput.value);
        const etat = parseNumber(etatInput.value);

        // Prosta symulacja składek ZUS + podatek
        const skladki = brutto * 0.1371; // przykładowa suma składek
        const podatek = (brutto - skladki) * 0.12; // przykładowa stawka podatku
        const netto = brutto - skladki - podatek;

        // Przeliczenie proporcjonalne do etatu
        const bruttoPrzeliczone = brutto * etat;
        const nettoPrzeliczone = netto * etat;

        wynikBrutto.textContent = bruttoPrzeliczone.toFixed(2) + ' zł';
        wynikNetto.textContent = nettoPrzeliczone.toFixed(2) + ' zł';
    }

    // Kliknięcie przycisku „Oblicz”
    obliczBtn.addEventListener('click', obliczWynagrodzenie);

});






