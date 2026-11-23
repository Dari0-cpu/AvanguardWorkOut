/* ====================================================================
   AVANGUARD WORKOUT - PDF EXPORT VETTORIALE (jsPDF)
   Nitido, leggibile, multi-pagina senza tagli, supporta 1 giorno o tutta la scheda
   ==================================================================== */

function hexToRgb(hex) {
    const clean = String(hex || '#f43f5e').replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Pulisce caratteri non supportati dal font PDF standard Helvetica (WinAnsi)
function pdfSafeText(str) {
    return String(str ?? '')
        .replace(/[’‘]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/•/g, '-')
        .replace(/×/g, 'x')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function downloadPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Libreria PDF non caricata. Ricarica la pagina con connessione attiva.");
        return;
    }

    const selected = document.getElementById('export-day-selector').value;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser) return;

    const daysToExport = selected === '__ALL__'
        ? currentUser.days
        : currentUser.days.filter(d => d.id === selected);

    if (!daysToExport.length) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();   // 210mm
    const pageH = doc.internal.pageSize.getHeight();  // 297mm
    const margin = 14;
    const contentW = pageW - margin * 2;              // 182mm

    // Colore accent (su sfondo bianco evitiamo il bianco del tema Titanium)
    const resolvedTheme = getResolvedTheme(appState.theme, 'light');
    const accentRgb = hexToRgb(resolvedTheme[500]);

    const todayStr = new Date().toLocaleDateString('it-IT');
    let y = 0;

    // ---- HEADER PRINCIPALE ----
    doc.setFillColor(...accentRgb);
    doc.rect(0, 0, pageW, 3.5, 'F');

    y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...accentRgb);
    doc.text('AVANGUARD WORKOUT', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(110, 115, 128);
    doc.text(`Generato il ${todayStr}`, pageW - margin, y, { align: 'right' });

    y += 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(24, 24, 27);
    const titleLabel = selected === '__ALL__'
        ? 'Report Carichi - Scheda Completa'
        : `Report Carichi - ${pdfSafeText(daysToExport[0].name)}`;
    doc.text(titleLabel, margin, y);

    // Barra metadati atleta + peso corporeo
    y += 5.5;
    doc.setFillColor(244, 246, 249);
    doc.setDrawColor(226, 230, 238);
    doc.roundedRect(margin, y, contentW, 11, 2.5, 2.5, 'FD');

    const userWeights = getUserWeights();
    const curW = userWeights['w' + appState.week];
    const goalW = getUserWeightGoal();

    let metaText = `Atleta: ${pdfSafeText(currentUser.name)}   |   Settimana attiva: S${appState.week}`;
    if (curW != null) metaText += `   |   Peso S${appState.week}: ${curW.toFixed(1)} kg`;
    if (goalW != null) metaText += `   |   Obiettivo: ${goalW.toFixed(1)} kg`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(63, 68, 81);
    doc.text(metaText, margin + 4, y + 6.8);

    y += 16;

    // Helper salto pagina
    function ensureSpace(neededHeight) {
        if (y + neededHeight > pageH - 16) {
            doc.addPage();
            doc.setFillColor(...accentRgb);
            doc.rect(0, 0, pageW, 2.5, 'F');
            y = 14;
        }
    }

    // ---- LOOP GIORNI ----
    daysToExport.forEach((day, dIdx) => {
        if (daysToExport.length > 1) {
            ensureSpace(14);
            if (dIdx > 0) y += 3;
            doc.setFillColor(...accentRgb);
            doc.roundedRect(margin, y, 2.2, 7.5, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(24, 24, 27);
            doc.text(pdfSafeText(day.name), margin + 5, y + 5.5);
            y += 11;
        }

        if (!day.exercises || day.exercises.length === 0) {
            ensureSpace(10);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9.5);
            doc.setTextColor(130, 135, 145);
            doc.text('Nessun esercizio inserito in questo giorno.', margin, y + 4);
            y += 10;
            return;
        }

        // ---- LOOP ESERCIZI ----
        day.exercises.forEach(ex => {
            const cardH = 34;
            ensureSpace(cardH + 4);

            // Riquadro esterno esercizio
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(224, 228, 236);
            doc.setLineWidth(0.35);
            doc.roundedRect(margin, y, contentW, cardH, 3, 3, 'FD');

            // Barra laterale colorata
            doc.setFillColor(...accentRgb);
            doc.roundedRect(margin, y, 1.8, cardH, 1, 1, 'F');

            // Dati troncati al numero di blocchi + trend multi-blocco condiviso con app.js
            const reportData = getExerciseReportData(currentUser.id, day.id, ex);
            const trendLabel = pdfSafeText(reportData.trend.pdfLabel);

            let badgeBg = [243, 244, 246];
            let badgeFg = [113, 118, 128];
            if (reportData.trend.status === 'up') {
                badgeBg = [220, 252, 231];
                badgeFg = [21, 128, 61];
            } else if (reportData.trend.status === 'down') {
                badgeBg = [254, 226, 226];
                badgeFg = [185, 28, 28];
            } else if (reportData.trend.status === 'flat') {
                badgeBg = [254, 249, 195];
                badgeFg = [161, 98, 7];
            }

            // Pillola Trend in alto a destra (calcolata prima per dare maxWidth sicuro al titolo)
            const trendFontSize = trendLabel.length > 14 ? 7.5 : 8.5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(trendFontSize);
            const pillW = Math.max(22, Math.min(68, doc.getTextWidth(trendLabel) + 8));
            const pillX = margin + contentW - pillW - 4;
            doc.setFillColor(...badgeBg);
            doc.roundedRect(pillX, y + 3.5, pillW, 6.5, 2, 2, 'F');
            doc.setTextColor(...badgeFg);
            doc.text(trendLabel, pillX + pillW / 2, y + 7.9, { align: 'center', maxWidth: pillW - 3 });

            const titleMaxW = Math.max(85, contentW - pillW - 14);

            // Nome esercizio
            const rawTarget = getRawTargetForWeek(ex, appState.week);
            const parsed = parseTargetAndRests(rawTarget);
            const rests = (Array.isArray(ex.rests) && ex.rests.length) ? ex.rests : parsed.rests;
            const restStr = rests.filter(Boolean).length ? `  |  Rec: ${rests.filter(Boolean).join(' / ')}` : '';

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(18, 20, 26);
            doc.text(pdfSafeText(ex.name), margin + 5.5, y + 6.5, { maxWidth: titleMaxW });

            // Sottotitolo Target + Recuperi
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(110, 116, 128);
            doc.text(pdfSafeText(`Target: ${parsed.cleanTarget}${restStr}`), margin + 5.5, y + 11.2, { maxWidth: titleMaxW });

            // Griglia 6 settimane S1..S6
            const gridX = margin + 5;
            const gridY = y + 14.5;
            const gap = 2;
            const colW = (contentW - 9 - gap * 5) / 6;
            const boxH = 16;

            for (let w = 1; w <= 6; w++) {
                const bx = gridX + (w - 1) * (colW + gap);
                const isCurrent = (w === appState.week);

                if (isCurrent) {
                    doc.setFillColor(249, 250, 252);
                    doc.setDrawColor(...accentRgb);
                    doc.setLineWidth(0.45);
                } else {
                    doc.setFillColor(248, 249, 251);
                    doc.setDrawColor(230, 233, 240);
                    doc.setLineWidth(0.25);
                }
                doc.roundedRect(bx, gridY, colW, boxH, 2, 2, 'FD');

                // Header Sett
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(...(isCurrent ? accentRgb : [135, 140, 152]));
                doc.text(`SETT ${w}`, bx + colW / 2, gridY + 5, { align: 'center' });

                // Valore peso troncato al numero reale di blocchi
                const val = pdfSafeText(reportData.weeks[w - 1]?.text || '-');
                const fontSize = val.length > 10 ? 7.5 : (val.length > 6 ? 8.5 : 10);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(fontSize);
                doc.setTextColor(...(val === '-' ? [170, 174, 182] : [20, 22, 28]));
                doc.text(val === '-' ? '-' : `${val} kg`, bx + colW / 2, gridY + 12, { align: 'center', maxWidth: colW - 2 });
            }

            y += cardH + 4;
        });
    });

    // ---- FOOTER SU TUTTE LE PAGINE ----
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(230, 233, 240);
        doc.setLineWidth(0.25);
        doc.line(margin, pageH - 11, pageW - margin, pageH - 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 145, 156);
        doc.text('Avanguard WorkOut - Report Progressioni', margin, pageH - 6.5);
        doc.text(`Pagina ${p} di ${totalPages}`, pageW - margin, pageH - 6.5, { align: 'right' });
    }

    const fileSlug = selected === '__ALL__'
        ? 'Scheda_Completa'
        : pdfSafeText(daysToExport[0].name).replace(/[^a-zA-Z0-9]+/g, '_');
    doc.save(`Avanguard_${fileSlug}.pdf`);
}