# Första versionen

Status: föreslagen MVP. Förutsätter att datatestet i [genomförandeplanen](07-genomforandeplan.md) klaras.

## Omfattning

Ett avgränsat pilotområde i Köpenhamn, 30–50 manuellt kontrollerade platser och tre kategorier: barer, restauranger och parker. Exakt område väljs inför datatestet. Parker representeras av utvalda vistelseytor. Caféer kan läggas till om samma datamodell räcker, men är inget lanseringskrav.

Datumväljaren omfattar idag och de följande sex dagarna. Väder visas endast för intervall som leverantören faktiskt täcker. Produktens sjudagarsvy innebär inte att alla dagar har samma prognoskvalitet.

Aktivitetsvalen är promenad, barbesök och restaurangbesök. Arbetsförslaget för promenader är en park med en tydlig mötespunkt; solinformationen avser markerade vistelseytor. En soloptimerad promenadrutt är ett separat kommande steg. Yr/MET Norway är önskat primärt väderspår.

## Funktioner och acceptans

| ID | Funktion | Klar när |
| --- | --- | --- |
| M1 | Utforska karta och lista | Samma platser och vald tid visas i båda; listan fungerar även om kartan inte laddar. |
| M2 | Välj datum, starttid och längd | Användaren kan ange lokal tid och 30, 60, 90 eller 120 minuters besök; valen bevaras vid byte mellan karta och lista. |
| M3 | Filtrera | Kategori, avstånd från vald punkt och minsta sammanhängande solfönster kan väljas. Avstånd betecknas fågelväg. |
| M4 | Se solfönster | Platskort visar beräknad början, slut och sammanhängande längd inom besöket. Detaljsidan visar även dagens övriga fönster. |
| M5 | Förstå underlaget | Varje plats visar vilken yta beräkningen gäller, datakvalitet, väderprognosens ålder och kända begränsningar. |
| M6 | Se öppettider | Status avser hela besöket. Saknad eller osäker information visas som okänd och räknas inte som bekräftat öppet. |
| M7 | Skapa och dela träff | Värden väljer aktivitet, plats/mötespunkt, start, slut och valfri kort text och får separata länkar för delning och hantering. |
| M8 | Svara på inbjudan | Gästen kan öppna länken och svara ja/kanske/nej med visningsnamn utan konto; eget svar går att ändra i samma webbläsare. |
| M9 | Hantera ändringar | Värden kan ändra eller ställa in. Inbjudningssidan visar aktuell version och kräver nytt svar efter ändrad aktivitet, plats/mötespunkt eller tid. |
| M10 | Rapportera platsfel | Ett enkelt formulär kan rapportera fel yta, öppettid eller skuggning; rapporten granskas före ändring av modell eller platsdata. |
| M11 | Välj aktivitet | Promenad, barbesök och restaurangbesök ger relevanta platsförslag; aktiviteten följer med till inbjudan. |
| M12 | Utforska skugglager | Tidsvalet styr både lager och platskort; gatunamn förblir läsbara, lagret kan stängas av och otillräckligt underlag markeras. |

Geolokalisering är frivillig. Manuell kartpunkt eller område fungerar alltid. Ingen adressbok behövs för att bjuda in.

## Sortering

Filtrera först på aktivitet, område, kategori och valt besök. Bland platser med tillräckligt underlag prioriteras de som har bekräftat öppet hela besöket, därefter längsta sammanhängande beräknade solfönster under besöket och därefter kortast avstånd. För parker används känd tillgänglighet i stället för restaurangöppettider.

Okända öppettider och ofullständigt solunderlag visas med egna etiketter längre ned. Bekräftat stängda platser visas som alternativa tider, inte som aktuella rekommendationer. Vädret är en separat signal; närliggande platser får inte en påhittad skillnad i molnighet om de använder samma prognoscell.

Filter för ”minst 60 minuter” avser sammanhängande geometrisk soltillgång inom besöket. Det måste stå i gränssnittet att moln kan minska den faktiska solen.

## Utanför första versionen

- Flera städer och obegränsad automatisk platsimport.
- Native-appar, vänregister, kontaktimport och intern chatt.
- Automatiska mejl, SMS eller pushnotiser. Användaren delar länken själv.
- Bordsbokning, betalning, köstatus och garanti om lediga solplatser.
- Fotorealistisk 3D-karta eller solberäkning på varje enskilt bord.
- Soloptimerad ruttplanering med prognos längs varje del av promenaden.
- Realtidsobservation av moln över en viss gata.
- Exakta solprocenttal, AI-genererade solomdömen och användarrapporter som automatiskt ersätter modellresultat.

## Krav för en pilotrelease

- Datatestets kvalitetsmål är uppnådda och avvikelser dokumenterade.
- Alla publicerade platser har spårbar källa, kontrollerad vistelseyta och granskningsdatum.
- Mobilflödena fungerar på iOS Safari och Android Chrome; lista, datumval och inbjudan fungerar med tangentbord och skärmläsare.
- Saknat väder, saknad geometri, nekad position och felande kartleverantör har begripliga tillstånd.
- Inbjudningar är inte publikt listade; en gäst kan inte ändra värdens träff eller en annan gästs svar.
- Ingen precision eller aktuell observation antyds som vi inte har stöd för.
