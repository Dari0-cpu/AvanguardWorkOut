/* ====================================================================
   AVANGUARD WORKOUT - PDF EXPORT
   ==================================================================== */

function downloadPDF() {
    const dayId = document.getElementById('export-day-selector').value;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    if (!day) return;

    const themeColor = THEMES[appState.theme] ? THEMES[appState.theme][500] : '#ef4444';

    // Iniziamo a costruire la stringa HTML
    let html = `
        <div style="padding: 30px; font-family: 'Inter', sans-serif; color: #18181b; background: #ffffff; width: 800px; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: ${themeColor}; margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase;">AVANGUARD WORKOUT</h1>
                <h2 style="margin: 8px 0; font-size: 22px; color: #52525b; font-weight: 800;">Report Carichi: ${escapeHtml(day.name)}</h2>
                <div style="display: inline-block; background: #f3f4f6; padding: 8px 18px; border-radius: 99px; margin-top: 10px;">
                    <span style="color: #71717a; font-size: 14px;">Atleta: <strong style="color: #18181b;">${escapeHtml(currentUser.name)}</strong> &nbsp;•&nbsp; Settimana: <strong style="color: #18181b;">S${appState.week}</strong></span>
                </div>
            </div>
    `;

    day.exercises.forEach(ex => {
        html += `
            <div style="margin-bottom: 24px; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; background: #fafafa;">
                <h3 style="margin-top: 0; margin-bottom: 16px; color: ${themeColor}; font-size: 18px; border-bottom: 2px solid ${themeColor}30; padding-bottom: 10px;">${escapeHtml(ex.name)}</h3>
                
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <tr>
        `;

        let firstW = null, lastW = null;

        for (let w = 1; w <= 6; w++) {
            const logKey = `w${w}_${currentUser.id}_${day.id}_${ex.id}`;
            const log = appState.logs[logKey];

            let wArray = log ? (log.weights || []) : [];
            if (log && log.weight && wArray.length === 0) wArray.push(log.weight);

            let valText = "-";
            if (wArray.length > 0 && wArray.some(val => val !== '')) {
                valText = wArray.map(val => val || '-').join(' + ');
                const firstNum = parseFloat(wArray[0]);
                if (!isNaN(firstNum)) {
                    if (firstW === null) firstW = firstNum;
                    lastW = firstNum;
                }
            }

            html += `
                        <td style="padding: 0 4px; vertical-align: top;">
                            <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px 2px; text-align: center;">
                                <div style="font-size: 11px; color: #a1a1aa; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">Sett ${w}</div>
                                <div style="font-size: 15px; font-weight: 900; color: #18181b;">${valText}<span style="font-size: 10px; color: #a1a1aa; margin-left: 2px;">kg</span></div>
                            </div>
                        </td>
            `;
        }

        let trendHtml = `<span style="color: #a1a1aa;">-</span>`;
        if (firstW !== null && lastW !== null) {
            const diff = lastW - firstW;
            if (diff > 0) trendHtml = `<span style="color: #16a34a; font-weight: 900; background: #dcfce7; padding: 4px 10px; border-radius: 8px;">+${diff} kg 📈</span>`;
            else if (diff < 0) trendHtml = `<span style="color: #dc2626; font-weight: 900; background: #fee2e2; padding: 4px 10px; border-radius: 8px;">${diff} kg 📉</span>`;
            else trendHtml = `<span style="color: #ca8a04; font-weight: 900; background: #fef9c3; padding: 4px 10px; border-radius: 8px;">Stabile ➖</span>`;
        }

        html += `
                    </tr>
                </table>
                
                <div style="margin-top: 16px; font-size: 14px; text-align: right; font-weight: 700;">
                    Trend di Progressione: ${trendHtml}
                </div>
            </div>
        `;
    });

    html += `
            <div style="text-align: center; margin-top: 40px; font-size: 12px; font-weight: 700; color: #a1a1aa;">
                Generato automaticamente da Avanguard WorkOut
            </div>
        </div>
    `;

    const opt = {
        margin:       10,
        filename:     `Avanguard_${day.name.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  {
            scale: 2,
            useCORS: true,
            windowWidth: 800 // Questa regola forza la generazione come se fossi su un monitor da PC
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Usiamo direttamente '.from(html)', niente 'document.appendChild', quindi niente foglio bianco!
    html2pdf().set(opt).from(html).save();
}