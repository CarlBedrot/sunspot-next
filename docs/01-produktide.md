# Produktidé

Status: förslag, 2026-09-16.

## Problemet

En väderprognos kan säga att det blir soligt, men hjälper inte användaren välja rätt sida av en gata eller rätt del av en park. En plats kan ligga i byggnadsskugga under hela den planerade träffen. Samtidigt sker planeringen med vänner ofta separat från sökandet efter plats och tid.

Vår hypotes är att kombinationen **plats + solfönster + väder + enkel inbjudan** gör det lättare att faktiskt komma iväg och umgås utomhus.

Användarens formulering **”Sun guides your decision”** förtydligar riktningen: utgå från vad du vill göra och låt solen hjälpa dig välja var och när. Första aktiviteterna är promenad, barbesök och restaurangbesök. Barer, restauranger och parker är platskategorierna bakom förslagen.

## Vem vi börjar med

Personer som bor i pilotområdet och spontant planerar en uteservering, middag eller parkträff med några vänner. Deras lokalkännedom gör det också möjligt att upptäcka fel i plats- och solinformationen.

Tre centrala situationer:

1. **Nu:** ”Jag har en timme över. Var i närheten finns en bra chans till sol?”
2. **Senare idag:** ”Vi slutar 17. Vilken uteservering kan ha sol när vi kommer fram?”
3. **En annan dag:** ”Vilken tid på lördag passar bäst för en picknick med vänner?”

Turister och restaurangägare kan bli framtida målgrupper. De ska inte styra första versionens omfattning.

## Produktlöftet

Visa några relevanta, begripliga alternativ och hjälp användaren bestämma plats och tid. Varje förslag ska förklara varför det visas, till exempel:

> Möjlig direkt sol cirka 16.00–18.00 på den markerade uteserveringen. Prognosen visar växlande molnighet. Öppettider behöver bekräftas.

Detta är illustrativ text, inte en prognos för en verklig plats.

## Det som ska göra produkten bra

- **Rätt yta:** beräkningen gäller en uteservering eller en markerad parkyta, inte restaurangens entré eller parkens mittpunkt.
- **Rätt tid:** visa sammanhängande sol under besöket, inte bara dagens totala soltimmar.
- **Begriplig osäkerhet:** användaren ser skillnad på byggnadsskugga, moln och saknad data.
- **Låg tröskel:** utforska utan konto och bjud in via en vanlig länk.
- **Praktiska alternativ:** om önskad tid är dålig, föreslå en annan tid eller närliggande plats med en förklaring.

## Positionering

Skuggkartor finns redan. ShadeMap beskriver exempelvis simulering av byggnads-, träd- och terrängskuggor. Det visar att idén om en skuggkarta i sig inte är unik; det bevisar inte deras lokala precision eller vår datatillgång. [Källa: ShadeMap](https://shademap.app/help/).

Vår föreslagna inriktning är beslutet *var och när ska vi ses*, med kontrollerade vistelseytor och social planering. Att användare föredrar denna kombination framför befintliga verktyg är en hypotes att testa, inte ett fastställt konkurrensövertag.

## Vad framgång betyder

Det viktigaste är att en användare hittar ett användbart alternativ och att informationen stämmer tillräckligt bra vid besöket. Kartvisningar ensamma räcker inte som mått.

I den första användartesten vill vi se att minst 8 av 10 personer hittar en relevant plats och tid inom två minuter utan hjälp. Vi följer dessutom skapade träffar, första gästsvar och frivillig återkoppling efter besöket. Alla dessa är försöksmål, inte uppmätta resultat.

## Affärsmodell senare

Första piloten ska undersöka nytta och tillförlitlighet. Möjliga senare intäkter är konsumentfunktioner för mer avancerad planering eller verktyg för verksamheter att underhålla sin uteserveringsinformation. Betald synlighet får inte påverka beräknade solfönster och ska märkas tydligt. Ingen prissättning eller betalningsintegration ingår nu.
