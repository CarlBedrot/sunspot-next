# Lugnare karta och responsiv mobilvy

Uppdatering 2026-09-17. Alla platser finns kvar i underlaget. Kartan visar bara markörer inom aktuell vy, grupperar närliggande platser av samma kategori vid zoom 11–16 och visar enskilda platser från zoom 17. Ett tryck på en grupp zoomar in. Event och vald plats behåller sina egna markörer. Sökning och platslistan omfattar hela det filtrerade urvalet, även utanför kartutsnittet.

## Rendering

Tidigare tömdes markörlagret och varje Leaflet-markör skapades om vid uppdateringar. Nu återanvänds markörer med stabil identitet; position, etikett och utseende uppdateras bara när de ändras. Markörer utanför vyn tas bort. När solberäkningen pågår behålls markörerna internt men gamla solresultat visas inte. Event fortsätter följa vald tid oberoende av solberäkningen.

Byggnadsskuggorna beräknas och rasteriseras i `shadow-render.worker.js` med OffscreenCanvas. UI-tråden kopierar den färdiga bilden. En aktiv renderingsbegäran och högst en väntande begäran begränsar kön; den väntande ersätts av senaste vyn. Versionsnummer hindrar gamla svar från att målas efter tidsändring, zoomning eller panorering. Bildresurser stängs efter användning och arbetaren avslutas när lagret tas bort. Befintlig solanalys fortsätter i sin separata worker.

`shadowRenderer.js` delar samma geometri, hål, väggprojektioner, täckningsgräns och nattläge mellan worker och reservritning. Saknat OffscreenCanvas eller worker-fel använder huvudtråden med 90 ms debounce. Bakgrundsritningens lägre belastning kan därför inte garanteras på äldre webbläsare. Ingen träd-/terrängmodell har lagts till.

## Mobilvy

Den separata sidhuvudraden döljs på kartvyn; Mina träffar nås i filterpanelen. Zoom-, lager- och informationsknappar öppnas med Kartverktyg ovanför tidskontrollen. Veckodagar, exakt klockslag och veckoreglage behålls. Överflödiga ändpunktsrubriker döljs på mobil och kortet tar mindre höjd. Safe-area-avstånd och reducerad rörelse respekteras. Detta är fortfarande en webbapp, inte en native iOS-app.

## Verifiering och mätning

47 enhetstester omfattar tidigare sol-/event-/API-funktioner samt markörgruppernas fullständighet, vald plats, separata event, stabil identitet och projektion. `test:map` testar gruppering och zoom, sökning efter Fælledparken, mobilverktyg, fallbackens skuggtäckning, senaste tidsbild, nattläge och liten skärm. Browser-, sol- och eventsviter verifierar övriga flöden.

Ett lokalt Chromium-test vid 390×844 minskade markörernas DOM-antal från 153 till 19 i startvyn. Samma 45-stegs dragsekvens på utvecklingsservern registrerade tidigare 46 långa huvudtrådsuppgifter (sammanlagt cirka 5,8 sekunder); efter ändringen registrerades 0. Det separata `test:map` registrerar mätvärden i `artifacts/map-performance.json` utan en maskinberoende tidsgräns. Detta är laboratoriemätningar på utvecklingsdatorn, inte ett löfte om bildfrekvens på en fysisk iPhone. GPU-/canvasfärgavrundning kan skilja mellan renderingsvägarna; testet jämför skuggornas alfa/täckning med en liten antialiasing-tolerans.

## Hostad kontroll

Commit `ffdca50` byggdes och testades först som skyddad Vercel-preview. `test:map` passerade även där: 19 markörer, 0 långa huvudtrådsuppgifter i dragsekvensen och identisk alfakanal i worker-/reservritningen. Browser-, sol- och eventsviterna passerade lokalt; produktionsbygget och lint passerade. Ingen fysisk iPhone ingick i dessa automatiska tester.
