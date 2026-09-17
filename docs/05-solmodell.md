# Solmodell och precision

Status: föreslagen metod för ett datatest. Ingen modell eller tröskel är ännu validerad. Samma resultatkrav gäller oavsett om vi återanvänder ShadeMap eller bygger egen beräkning; metodstegen nedan beskriver vad resultatet behöver ta hänsyn till.

## Vad vi beräknar

En plats består av en eller flera **vistelseytor**: exempelvis en uteservering på västra sidan av byggnaden eller en viss gräsyta. Solresultatet gäller den valda ytan och höjden, inte hela verksamheten eller parken.

Tre separata uppgifter ska bevaras genom hela systemet:

1. **Geometrisk soltillgång:** vilka delar av ytan kan nås av direkt solljus utan blockerande hinder?
2. **Väderutsikt:** vad säger prognosen om moln, strålning, regn och temperatur?
3. **Datakvalitet:** hur väl känner vi yta, hinder och prognosens aktualitet?

”Sannolikhet för sol: 82 %” ska inte visas utan en separat kalibrerad sannolikhetsmodell. Molnandel är inte samma sak som sannolikheten att solen syns vid ett bord.

## Föreslagen geometriberäkning

1. Transformera ytor, byggnader och terräng till ett lämpligt lokalt metersystem och ett gemensamt höjdsystem. WGS84 används för utbyte och kartpositioner, inte för avståndsgeometri i grader.
2. Skapa jämnt fördelade eller areaviktade provpunkter inom varje yta. Föreslagen utvärderingshöjd är 1 meter över den faktiska vistelsenivån. Takytor kräver alltså känd takhöjd.
3. Beräkna solens azimut och höjd för rätt ögonblick. SunCalc är en kandidat för solposition, inte för hindermodellen. Vinkelkonventionen måste normaliseras vid integration. [SunCalc](https://github.com/mourner/suncalc).
4. Testa fri sikt från varje provpunkt mot solen genom kända hinder och terräng. För Köpenhamn prövas DHM:s yt- och terrängraster som underlag, eventuellt kompletterade med byggnadsgeometri. Träd inkluderas bara om användbart underlag finns; annars markeras den begränsningen.
5. Beräkna andelen solbelyst area. Punkter med ofullständigt hinderunderlag är okända, inte solbelysta.
6. Sampla först var femte minut och förfina vid övergångar vid behov. Detta är modellens numeriska upplösning, inte dess uppmätta noggrannhet.

En ytmodell beskriver en övre yta och kan inte ensam beskriva fria utrymmen under trädkronor, broar eller överhäng. I datatestet ska sådana fall kontrolleras särskilt. En modell som behandlar en hel trädkrona som ett massivt hinder ända till marken får inte presenteras som verifierad skugga under kronan. Se [dataunderlaget för Köpenhamn](04-data-och-genomforbarhet.md).

Horisontskuggor kräver underlag även utanför pilotområdets gräns. Bufferten bestäms utifrån terräng, högsta relevanta hinder och lägsta accepterade solhöjd. En fast, för liten radie får inte ge falsk ”fri sikt”. Underlaget måste täcka strålens relevanta väg eller ge resultatet okänt.

När solen är under horisonten är geometrisk soltillgång noll. Nära horisonten förstoras geometri- och atmosfärfel; exakt hantering ska avgöras i datatestet och kan kräva att resultat markeras osäkert.

## Från areor till solfönster

Föreslagna starttrösklar, att justera mot fältdata:

| Klass | Definition |
| --- | --- |
| Möjlig direkt sol | Minst 50 % av den kontrollerade vistelseytan är geometriskt solbelyst. |
| Delvis sol | Mer än 0 men mindre än 50 % av ytan är solbelyst. |
| Skugga | Ingen provyta har direkt geometrisk sol. |
| Okänt | Relevant geometri eller tillräcklig täckning saknas. |

En stor park kan inte få ett meningsfullt solfönster med en enda areatröskel. Den delas därför i mindre vistelseytor. Tröskeln säger inte att det finns lediga sittplatser.

Ett **solfönster** är ett sammanhängande intervall i klassen möjlig direkt sol. Luckor med skugga, delvis sol eller okänt bryter intervallet. Intervall lagras som start inklusive och slut exklusive för att undvika dubbelräkning.

För ett valt besök beräknas:

- **Längsta sammanhängande tid:** längsta överlappningen mellan ett solfönster och besökets tidsintervall.
- **Total möjlig soltid:** summan av överlappningarna mellan alla solfönster och besöket.
- **Sol kvar från ankomst:** tid till slutet av det solfönster som ankomsten ligger i, annars noll.

Exempel: fönstren 14.00–15.00 och 15.30–17.00 ger under besöket 14.30–16.30 totalt 90 minuter men högst 60 minuter sammanhängande sol. Under besöket 15.30–17.00 blir båda måtten 90 minuter. Inga av dessa tal tar hänsyn till moln.

Visa tider som ungefärliga, normalt avrundade till kvart. Låt avrundning ske konservativt: början framåt och slut bakåt, och räkna visad längd från de visade gränserna. Kortare fönster som då försvinner kan betecknas ”kort solglimt”; skapa aldrig ett längre löfte genom avrundning.

## Väderlagret

Hämta prognoser för de celler som täcker pilotområdet och bevara giltighetstid, hämtningstid och leverantörens modellkörning om den finns. En prognoscell kan betjäna många platser. Den är inte en observation på varje uteservering.

Yr/MET Norway är primärt integrationsspår. Locationforecast skiljer på värden vid en tidpunkt (`instant`) och prognoser för efterföljande intervall (`next_1_hours`, `next_6_hours` och `next_12_hours`). Tillgängliga fält och tidssteg varierar. Vi måste använda intervallets verkliga längd och får inte presentera sex timmars nederbörd som en timmes. [MET:s prognosformat](https://docs.api.met.no/doc/ForecastJSON.html).

I MVP:n visas leverantörens väderutsikt bredvid geometriska fönster. Vi multiplicerar inte geometriska soltimmar med ”1 minus molnandel” för att skapa påstådd faktisk soltid. En samlad solbedömning får införas först efter separat validering.

För MET följer hämtningen `Expires` och använder villkorliga anrop med `If-Modified-Since`. Anrop identifieras med applikation och kontaktväg och sprids över tid. [MET:s användningsvillkor](https://docs.api.met.no/doc/TermsOfService.html).

Bevara både `updated_at`, hämtningstid och cachegiltighet. Ny hämtning eller HTTP 304 får inte framstå som en ny prognoskörning. Visa utgången cache när uppdatering misslyckas; en fast tretimmarsgräns ska inte användas för alla prognosprodukter. Gräns för ytterligare varning om gammal modell fastställs utifrån observerad uppdateringstakt.

## Datakvalitet

Kvaliteten för geometri och väder bedöms separat. Att prognosen är färsk gör inte en felplacerad uteservering säker.

- **Kontrollerad:** yta och relevanta hinder har granskats; resultatet ligger inom observerad tolerans för testade situationer.
- **Begränsad:** användbar modell med tydlig känd lucka, exempelvis träd eller förenklad takform.
- **Otillräcklig:** underlaget räcker inte för solfönster; visa okänt.

En enstaka användarrapport höjer inte automatiskt kvaliteten. Rapporten är underlag för granskning.

## Validering före pilot

Använd tio ytor som omfattar smal gata, öppet läge, hög byggnad, park med träd och en yta nära importgränsen. Håll modelljustering och slututvärdering åtskilda: använd fem ytor för justering och fem andra som låst kontrollgrupp.

Samla minst 100 märkta punkt/tid-observationer totalt, varav minst 50 på kontrollgruppen, över minst tre dagar och flera tidpunkter. Geometrin ska observeras när direkt sol går att bedöma; molnskugga får inte etiketteras som byggnadsskugga. Registrera även minst 20 övergångar mellan sol och skugga, varav minst 10 i kontrollgruppen. Spara datum, exakt provpunkt, observerad status och förutsättningar; undvik identifierbara personer i eventuella bilder.

Föreslagna godkännandemål på kontrollgruppen: minst 90 % korrekta sol/skugga-klassningar för punkter med tillräckligt underlag och medianfel högst 15 minuter för övergångarna. Redovisa dessutom falskt utlovad sol, 90:e percentil för tidsfel och andel resultat som blivit okända. Hög träffsäkerhet får inte döljas bakom mycket låg täckning.

Separat krävs minst åtta av tio ytor med tillräckligt underlag. Dessa små prover motiverar bara en begränsad pilot och får inte beskrivas som bevis för helårsnoggrannhet. Träd och låg sol kräver kompletterande säsongsprov.

Tekniska referensfall ska täcka natt, sommartidsbyte, azimutkonvention, en känd byggnadsskugga, brutna solfönster, olika höjdsystem och saknade hinder. Väderbedömningen utvärderas separat från geometrin.
