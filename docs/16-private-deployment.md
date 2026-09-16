# Privat mobilversion på Vercel

Publiceringsdatum: 2026-09-16. Projekt: `sunspot-private`, konto/team `calletennis-7918s-projects`. Appkod: `be4f6f6`, Next.js 16.3.5, Node 24.x.

Adress: https://sunspot-private.vercel.app/

Deploy-ID: `dpl_9sZZfc34HWBjsKQADVWWnEFVC3rC`, status READY. Bygge cirka en minut inklusive installation. Vercel registrerade första publiceringen som **production** och gav den stabila adressen, trots CLI-valet `--target preview`. Inloggningsskydd för **all** var därför aktiverat och verifierat före uppladdningen och gäller även den stabila adressen. Det är en privat testversion, inte en öppet tillgänglig lansering.

## Åtkomst

Öppna adressen i mobilens webbläsare och logga in på det Vercel-konto som äger projektet, eller ett konto som har fått åtkomst. Datorn behöver inte vara igång och mobilen behöver inte använda samma wifi. Skyddet hanteras i projektets Deployment Protection; `ssoProtection.deploymentType` är `all`. En oinloggad begäran till både startsidan och event-API:t omdirigeras till inloggning. Ingen publik bypass-länk delas.

## Funktioner och begränsningar

Karta, byggnadsskuggor, tidsreglage, platsfilter, väder och event körs i den hostade versionen. Inbjudningar kräver fortfarande en gemensam beständig databas och returnerar ett förklarande 503-svar på Vercel. Lokal SQLite-data, sessionsfiler, miljöfiler och skärmbilder är exkluderade med `.vercelignore`. Funktionen för solnotiser förutsätter fortfarande en öppen app och användarens tillstånd; bakgrundspush är inte implementerad.

Git-repot är inte kopplat till automatisk publicering i detta nya Vercel-projekt. Framtida publiceringar görs av en autentiserad projektmedlem med Vercel CLI. Publicera en preview med `vercel deploy`, kontrollera den och uppdatera den stabila adressen med `vercel deploy --prod`. Behåll inloggningsskyddet. Vercels projektkoppling och CLI:s behörigheter ligger utanför versionshanteringen.

## Verifiering

Vercel-bygget passerade. Den riktiga eventkällan returnerade 54 event för testveckan och väder-API:t returnerade tillgänglig, färsk prognos. Kartan och eventpanelen testades i en autentiserad mobilvy på den riktiga deploymenten: inga sidfel, inget horisontellt överflöde och tidsreglaget åtkomligt. Oinloggad åtkomst till startsida och event-API returnerade 302 till inloggning. Automatiserad kontroll använde Vercel CLI:s skyddade åtkomst; skyddet stängdes aldrig av.

Ingen separat kontinuerlig övervakning eller loggexport har konfigurerats. Vercels standardloggar är tillgängliga för projektägaren.

Källa för åtkomstskydd: [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).
