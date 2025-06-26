document.addEventListener('DOMContentLoaded', () => {

    // --- CONSTANTEN EN VARIABELEN ---
    const API_KEY_PLACEHOLDER = 'JOUW_OPENAI_API_SLEUTEL_HIER';
    const MAX_CHARS = 1500;
    let currentScenarioIndex = 0;

    const domElements = {
        scenarioBox: document.getElementById('scenario-box'),
        userResponseEl: document.getElementById('user-response'),
        analyzeBtn: document.getElementById('analyze-btn'),
        nextScenarioBtn: document.getElementById('next-scenario-btn'),
        analysisSection: document.getElementById('analysis-section'),
        scoreRow: document.getElementById('score-row'),
        feedbackGrid: document.getElementById('feedback-grid'),
        exampleContent: document.getElementById('example-content'),
        charCounterEl: document.getElementById('char-counter'),
    };

    const scenarios = [
        {
            id: 1,
            icon: "fa-mail-bulk",
            title: "Foutieve Factuur",
            meta: "Kanaal: E-mail | Klant: Herhaalde Klacht | Frustratie: Hoog",
            content: `<p><strong>Betreft: Foutieve factuur #2023-0456</strong></p><p>Geachte heer/mevrouw,</p><p>Dit is nu de DERDE keer dat ik contact opneem over dezelfde foutieve factuur... (volledige tekst)</p>`,
            example: `Geachte mevrouw Jansen,<br><br>Ik zie dat dit nu al drie keer misgaat. Dat hoort niet... (volledige tekst)`
        },
        {
            id: 2,
            icon: "fa-comments",
            title: "Leveringsvertraging",
            meta: "Kanaal: Chat | Klant: Eerste Keer | Frustratie: Matig",
            content: `<p><strong>Klant:</strong> Hoi, ik heb 3 dagen geleden een bestelling geplaatst... (volledige tekst)</p>`,
            example: `Hoi Lisa, ik snap dat je baalt van de vertraging... (volledige tekst)`
        },
        // ... (Voeg hier de volledige scenario-objecten toe zoals in de vorige versie)
    ];


    // --- FUNCTIES ---

    /**
     * Laadt een scenario en toont het in de UI.
     * @param {number} index - De index van het scenario in de 'scenarios' array.
     */
    function loadScenario(index) {
        const s = scenarios[index];
        domElements.scenarioBox.innerHTML = `
            <div class="scenario-header">
                <i class="fas ${s.icon}" style="color:var(--ff-yellow);font-size:1.3rem;"></i>
                <h2>Scenario #${s.id}: ${s.title}</h2>
            </div>
            <div class="scenario-meta">${s.meta}</div>
            <div class="scenario-content">${s.content}</div>
        `;
        domElements.userResponseEl.value = '';
        domElements.analysisSection.style.display = 'none';
        domElements.exampleContent.innerHTML = s.example;
        updateCharCounter();
    }
    
    /**
     * Update de karakterteller.
     */
    function updateCharCounter() {
        const count = domElements.userResponseEl.value.length;
        domElements.charCounterEl.textContent = `${count} / ${MAX_CHARS}`;
        domElements.charCounterEl.classList.toggle('limit-reached', count > MAX_CHARS);
    }

    /**
     * Roept de OpenAI API aan voor een analyse.
     * @param {object} scenario - Het huidige scenario-object.
     * @param {string} userText - De tekst ingevoerd door de gebruiker.
     * @returns {Promise<object|null>} Het JSON-antwoord van de AI of null bij een fout.
     */
    async function analyzeWithAI(scenario, userText) {
        const apiKey = API_KEY_PLACEHOLDER; // BELANGRIJK: Vul je sleutel hier in!
        if (apiKey === API_KEY_PLACEHOLDER) {
            alert("Fout: Geen API-sleutel gevonden. Plak je geheime API-sleutel in het 'script.js' bestand.");
            return null;
        }

        const systemPrompt = `Jij bent een AI-expert in klantenservice-training, genaamd FoneFluent... (volledige prompt zoals in vorige versie)`;
        
        setLoadingState(true);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: systemPrompt }],
                    temperature: 0.4,
                    response_format: { "type": "json_object" }
                })
            });

            if (!response.ok) throw new Error(`API Fout: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            console.error("Fout bij AI-analyse:", error);
            alert("Er ging iets mis bij de AI-analyse. Controleer je API-sleutel en internetverbinding. Zie de console (F12) voor details.");
            return null;
        } finally {
            setLoadingState(false);
        }
    }

    /**
     * Toont de analyse-resultaten in de UI.
     * @param {object} analysisData - Het data-object ontvangen van de AI.
     */
    function displayAnalysis(analysisData) {
        if (!analysisData) return;
        
        domElements.scoreRow.innerHTML = analysisData.scores.map(item => `
            <div class="score-card">
                <div class="score-title">${item.criterium}</div>
                <div class="score-value">${item.score}/10</div>
            </div>
        `).join('');

        domElements.feedbackGrid.innerHTML = `
            <div class="feedback-card positive">
                <h4><i class="fas fa-check-circle" style="color:var(--ff-positive);"></i> Sterke Punten</h4>
                <ul>${analysisData.feedback.sterke_punten.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
            <div class="feedback-card negative">
                <h4><i class="fas fa-exclamation-triangle" style="color:var(--ff-negative);"></i> Verbeterpunten</h4>
                <ul>${analysisData.feedback.verbeterpunten.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
        `;

        domElements.analysisSection.style.display = 'block';
        domElements.analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Stelt de laadstatus van de analyseknop in.
     * @param {boolean} isLoading - True als de knop een laadstatus moet tonen.
     */
    function setLoadingState(isLoading) {
        if (isLoading) {
            domElements.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI analyseert...';
            domElements.analyzeBtn.disabled = true;
        } else {
            domElements.analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyseer Mijn Reactie';
            domElements.analyzeBtn.disabled = false;
        }
    }
    
    /**
     * Verwerkt de 'Analyseer' knopklik.
     */
    async function handleAnalysisClick() {
        const userText = domElements.userResponseEl.value.trim();
        if (userText.length < 15) {
            return alert("Geef een uitgebreide reactie (minimaal 15 tekens).");
        }
        if (userText.length > MAX_CHARS) {
            return alert(`Je reactie is te lang. Houd het onder de ${MAX_CHARS} tekens.`);
        }
        
        const analysisData = await analyzeWithAI(scenarios[currentScenarioIndex], userText);
        if (analysisData) {
            displayAnalysis(analysisData);
        }
    }

    /**
     * Laadt het volgende scenario.
     */
    function handleNextScenarioClick() {
        currentScenarioIndex = (currentScenarioIndex + 1) % scenarios.length;
        loadScenario(currentScenarioIndex);
    }

    // --- INITIALISATIE & EVENT LISTENERS ---
    
    domElements.analyzeBtn.addEventListener('click', handleAnalysisClick);
    domElements.nextScenarioBtn.addEventListener('click', handleNextScenarioClick);
    domElements.userResponseEl.addEventListener('input', updateCharCounter);
    
    loadScenario(currentScenarioIndex);
});
