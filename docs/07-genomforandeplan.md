# Genomförandeplan

Status: plan för en verifierad pilot. M0 är gjort och en separat lokal prototyp av användarflödet är byggd enligt [versionsstatusen](10-prototypstatus.md). Datavalideringen i M1 och användartesten är inte genomförda. Inga tidsskattningar ska betraktas som leveranslöften.

## Milstolpar

| Steg | Leverans | Kriterium för att gå vidare |
| --- | --- | --- |
| M0 · Dokumentation | Produktidé, avgränsning, källstudie och plan. | Dokumenten är sammanhängande och antaganden är synliga. Första utkastet finns i detta repo. |
| M1 · Datatest | Tio definierade ytor, ett faktiskt geometriutdrag, väderprov och jämförelse av beräkningsalternativ. | Minst åtta ytor har tillräckligt underlag; villkor är dokumenterade; kvalitetsmålen i solmodellen har prövats på kontrollgruppen. |
| M2 · Flödesprototyp | Interaktiv prototyp med markerad exempeldata för sökning, plats och inbjudan. | Minst 8 av 10 testpersoner hittar plats och tid inom två minuter; de förstår skillnaden på solfönster och väder. |
| M3 · Fungerande pilot | 30–50 granskade platser, riktig sol-/väderdata och träffar med gästsvar. | MVP-kraven uppfylls, behörigheter och felvägar testas och driftskostnaderna ryms i beslutad budget. |
| M4 · Begränsad lansering | Ett mindre antal lokala användare använder produkten vid riktiga besök. | Uppföljning visar användbarhet och dokumenterade fel kan hanteras innan expansion. |

Designarbete med uttrycklig exempeldata kan gå parallellt med M1. En publik solprodukt förutsätter att datan och precisionen klarar granskningen. Expansion till fler städer är en egen milstolpe efter M4.

## Den första utvecklingsinsatsen efter dokumentationsfasen

Bygg ett litet reproducerbart experiment, inte hela applikationen. Det ska ta tio ytor och ett datum som indata och producera solfönster med käll- och kvalitetsinformation. Prova återanvändning av ShadeMap först. En enkel karta eller tabell räcker för granskning.

Leveransen ska innehålla källmanifest, geometri- och licensbedömning, resultat för tydliga referensfall, fältprotokoll och rekommendation om egen beräkning eller extern tjänst. Skriv sedan en kort beslutsnotering om vad resultaten faktiskt stöder.

## Prioriterad backlogg

Ägare betyder föreslaget ansvar för framtida arbete, inte att arbete redan har tilldelats eller utförts.

| ID | Arbete | Beroende | Föreslagen ägare | Klart när |
| --- | --- | --- | --- | --- |
| D1 | Avgränsa pilotområde och tio testytor i Köpenhamn | Bekräftad pilotstad | Produkt/data | Ytor har källa, höjdantagande och kontrollstatus. |
| D2 | Hämta DHM-prov och granska rättigheter | D1 | Teknik/data | Terräng- och ytdata kan läsas, höjder och mätår tolkas och tillåten användning är dokumenterad. |
| D3 | Prova Yr/MET Locationforecast och tidskoppling | D1 | Teknik | Verkliga svar visar enheter, tidsintervall och luckor; identifiering, attribution och cache följer leverantörens villkor. |
| D4 | Prova ShadeMap SDK/export och jämför med DHM-spåret | D1; D2 för eget underlag | Teknik | Tio kontrollplatser prövas, inklusive olika kartutsnitt. Export, lagring, mobilprestanda och kostnad är bedömda. Egen motor motiveras bara om återanvändning inte räcker. |
| D5 | Genomför oberoende observationer | D4 | Lokal testansvarig | Kontrollgrupp och övergångar enligt solmodellen har protokollförts. |
| P1 | Testa koncept med tio personer | M0 | Produkt | Nytta, förståelse och vanligaste invändningar sammanfattas. |
| P2 | Rita och testa mobilflödet | P1 | Design/produkt | Användare väljer aktivitet och tid, förstår kartans skugglager och kan bjuda in vänner. |
| T1 | Fastställ stack och driftbudget | D3–D5 | Teknik/produkt | Ett motiverat beslut med mätvärden och verkliga kostnadsunderlag finns. |
| T2 | Importera pilotplatser | Godkänd M1 | Data | 30–50 ytor har granskats; osäkra ytor är markerade eller opublicerade. |
| T3 | Bygg aktivitetssökning, karta och solfönster | T1–T2, P2 | Teknik | M1–M6 samt M11–M12 i MVP-tabellen fungerar med verkliga data. |
| T4 | Bygg träffar och gästsvar | T1, P2 | Teknik | M7–M9 fungerar med aktivitet, mötespunkt, separata behörigheter och planversioner. |
| T5 | Felrapportering och lanseringskontroll | T3–T4 | Teknik/produkt | M10, återkoppling, radering och degraderade lägen fungerar. |

Fältobservationer kräver rätt förhållanden och fysisk eller annan oberoende verifierbar närvaro. Enbart en annan rendering av samma modell räcker inte som verklighetskontroll. Dokumentationsarbetet har inte genomfört dessa observationer.

## Största riskerna och åtgärderna

| Risk | Tidig signal | Åtgärd |
| --- | --- | --- |
| Fel yta eller geometri | Modellen lägger provpunkter inne i huset eller skuggtider avviker kraftigt. | Rätta ytan och höjderna; publicera inte precisa fönster förrän kontrollen håller. |
| Träd ger falska solförslag | Parker ser soliga ut i modell men skuggiga i observationer. | Begränsa till kontrollerade delytor, komplettera hinderdata eller visa okänt. |
| Datavillkor stoppar vald lösning | Rätt till lagring eller kommersiell användning saknas. | Byt källa/tjänst eller minska omfattningen innan integrationen byggs. |
| Användarna litar för mycket på tiderna | Solfönster tolkas som vädergaranti. | Ändra språk och presentation och testa förståelsen igen. |
| Social funktion blir för tung | Konto eller vänlista krävs för att svara. | Behåll den avgränsade länkinbjudan i piloten. |
| Driftkostnad skalar dåligt | Anrop eller beräkning växer med varje kartinteraktion. | Förberäkna och dela cache per yta/prognoscell; mät innan expansion. |
| Värden tror att ändringar meddelas automatiskt | Gäster kommer till gammal tid efter ändring. | Visa tydlig instruktion att dela på nytt och versionsmarkera alla svar. |

## Mätning i pilot

Mät hur många utforskningar som leder till platsval, hur många skapade träffar som får minst ett gästsvar och frivillig återkoppling efter besök. ”Delad länk” får inte räknas som levererad inbjudan; vi kan normalt bara observera delningsförsöket och senare länköppning/svar.

Samla inte exakta användarkoordinater eller inbjudningsnycklar i analys. Få deltagare och bra kvalitativ återkoppling är mer användbart i detta skede än stora mängder svårtolkad statistik.

## Om datatestet inte håller

Pröva först ett mindre område, bättre ytor eller bättre hinderdata. Om solfönstren ändå inte kan göras användbara, gör om produktlöftet till kontrollerade platsbeskrivningar och väder utan tidsbestämd skuggprognos. Det är ett produktbeslut som ska dokumenteras; en sådan version får inte lanseras med samma precisa sollöfte.
