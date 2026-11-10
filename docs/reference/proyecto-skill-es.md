---
name: proyecto
description: Arranca un proyecto nuevo o desarrolla una feature con el flujo Claude arquitecta → Codex revisa el plan → Claude programa → Codex revisa el código, integrado con GitHub (issues, ramas, PR, CI, rulesets) y ejecutado por bloques con puntos de control. Usar con "/proyecto init", "/proyecto feature <nombre>", "/proyecto release" o "/proyecto estado".
argument-hint: init | feature <nombre> | release | estado
disable-model-invocation: true
---

# Flujo de proyecto profesional por bloques (Claude Code + Codex + GitHub)

Argumentos recibidos: `$ARGUMENTS`

- `init` → **Parte A**: arranque del proyecto y del repositorio de GitHub.
- `feature <nombre>` → **Parte B**: ciclo completo de una feature (issue → PR → merge).
- `release` → **Parte C**: publicar una versión.
- `estado` → lee el fichero de estado, di en qué bloque estamos, qué falta, y muestra `gh issue list --assignee @me` y `gh pr status`.
- Sin argumentos → pregunta qué modo quiere el usuario.

## Reglas de ejecución (obligatorias)

1. **Un bloque cada vez.** Al terminar un bloque muestra: qué has hecho (ficheros, comandos y resultado), el criterio "Hecho cuando" y si se cumple, y termina con:
   `🛑 Punto de control — responde "sigue", "repite" o indica cambios.`
   Después **detente** y espera.
2. Si el usuario dice "sigue todo", encadena bloques **hasta el siguiente bloque marcado con ⚠️**, donde siempre te detienes.
3. Estado persistente para retomar en otra sesión:
   - Parte A: `docs/setup-estado.md`
   - Parte B: sección `## Estado` de `docs/plans/<AAAAMMDD>-<nombre>.md`
   Marca cada bloque con `[x]` al completarlo.
4. **GitHub es la fuente de verdad del trabajo**: todo cambio nace de un issue, vive en una rama, entra por PR con CI verde y se fusiona con squash. Nunca se trabaja directamente sobre `main`.
5. Acciones que requieren confirmación explícita del usuario aunque estén permitidas: push, crear repo, cambiar ajustes del repo, rulesets, merge, releases, borrar ramas o ficheros.
6. No apliques en bloque las sugerencias de Codex: clasifícalas y deja que el usuario elija.
7. Los comandos `/codex:*` son del plugin `codex@openai-codex`. Si no puedes invocarlos tú, pide al usuario que los ejecute y te confirme el resultado. Sin plugin, alternativa: `codex exec --sandbox read-only "<prompt de revisión>"`.
8. Ejecutor de tareas: **`just`** (funciona igual en Windows, Linux, macOS y CI). Todos los comandos del proyecto van en el `justfile`: `just setup | lint | test | build`.
9. Usa `gh` para todo lo de GitHub. Para cuerpos largos usa `--body-file` con un fichero temporal en vez de texto en línea (evita problemas de comillas en PowerShell).
10. Responde en español; commits, títulos de PR y ramas en el formato definido abajo.

## Convenciones fijas

- Ramas: `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<issue>-<slug>`, `docs/<issue>-<slug>`.
- Commits y títulos de PR: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`). Como se fusiona con squash, **el título de la PR es el commit que queda en `main`**.
- Cada PR enlaza su issue con `Closes #<n>` y su plan.
- Versionado semántico `vMAJOR.MINOR.PATCH`.

---

# Parte A — Arranque (`/proyecto init`)

## A0. Entorno
Detecta el sistema operativo y comprueba: `git --version`, `git config user.name`, `git config user.email`, `gh --version`, `gh auth status`, `just --version`, `codex --version`, `node --version`.
Comprueba si el plugin de Codex está instalado (comandos `/codex:*` o subagente `codex:codex-rescue`).
Si falta algo, da el comando de instalación adecuado al sistema:
- just: `winget install Casey.Just` (Windows) · `brew install just` · `cargo install just`
- gh: `winget install GitHub.cli` · `brew install gh`; luego `gh auth login`
- Si `gh auth status` no muestra el scope `workflow`: `gh auth refresh -s workflow` (sin él no se pueden subir ficheros de `.github/workflows`).
- Codex: `npm install -g @openai/codex` y `codex login`
- Plugin: `/plugin marketplace add openai/codex-plugin-cc`, `/plugin install codex@openai-codex`, `/reload-plugins`, `/codex:setup`

**Hecho cuando:** todo responde o el usuario decide continuar sin algo.

## A1. Definición del proyecto ⚠️
Pregunta **todo en un solo mensaje**:
1. Nombre del repo (kebab-case) y descripción de una línea
2. Objetivo en una o dos frases
3. Lenguaje(s) y toolchain
4. Plataforma objetivo
5. Visibilidad: público o privado (avisa: en repos **privados** con cuenta gratuita, los rulesets y la protección de ramas requieren GitHub Pro; con el GitHub Student Developer Pack, Pro es gratuito)
6. Licencia (MIT, Apache-2.0, GPL-3.0, propietaria…)
7. ¿Activar revisión de Codex en GitHub (Codex cloud) y/o la app de Claude para GitHub?
8. Restricciones (dependencias prohibidas, hardware concreto, normativa)

Crea `docs/setup-estado.md` con las respuestas y la lista de bloques A0–A10.

**Hecho cuando:** el usuario confirma.

## A2. Estructura y tareas
Crea, adaptado al stack:
```
AGENTS.md  CLAUDE.md  README.md  LICENSE  CHANGELOG.md  justfile  .gitignore  .editorconfig
.claude/settings.json
docs/architecture.md  docs/plans/  docs/decisions/
src/  tests/
```
`justfile` con recetas `setup`, `lint`, `test`, `build` y comandos reales del stack. Si aún no hay tests, crea uno mínimo que pase.
`README.md` con: descripción, requisitos, `just setup`, `just test`, estructura y badge de CI (se completa en A6).
Ejecuta `just setup`, `just lint`, `just test`.

**Hecho cuando:** los tres pasan.

## A3. Contexto compartido para agentes
`AGENTS.md` (lo leen Codex local, Codex en GitHub y Claude):
```markdown
# AGENTS.md
## Proyecto
<objetivo>
## Stack
<stack>
## Comandos
`just setup` · `just lint` · `just test` · `just build`
## Flujo de trabajo
- Todo cambio: issue → rama `tipo/<issue>-<slug>` → PR con `Closes #<n>` → CI verde → squash merge.
- Conventional Commits en commits y títulos de PR.
- Cada cambio de comportamiento lleva test. Cambios pequeños; nada de refactors no pedidos.
## Límites
- No tocar `.env*`, `secrets/` ni ficheros generados.
- No añadir dependencias sin justificarlo en el plan.
- Nunca push directo ni force-push a `main`.
## Revisión de código (también para Codex en GitHub)
Prioriza: errores de lógica, casos límite, tests ausentes o débiles, seguridad, cambios de comportamiento no documentados. Ignora estilo que ya cubre el linter.
## Terminado =
`just lint && just test` en verde, CI verde, plan actualizado y revisión de Codex resuelta.
```
`CLAUDE.md`:
```markdown
@AGENTS.md
## Claude Code
- Features: `/proyecto feature <nombre>`. Versiones: `/proyecto release`.
- Antes de dar algo por terminado: `just lint && just test`.
- No apliques sugerencias de Codex sin confirmación del usuario.
```

**Hecho cuando:** ambos existen y reflejan A1.

## A4. Permisos y hooks de Claude Code
`.claude/settings.json`:
```json
{
  "permissions": {
    "allow": [
      "Bash(just:*)",
      "Bash(git status)", "Bash(git diff:*)", "Bash(git log:*)", "Bash(git add:*)",
      "Bash(git commit:*)", "Bash(git switch:*)", "Bash(git fetch:*)", "Bash(git pull --ff-only:*)",
      "Bash(gh issue:*)", "Bash(gh pr view:*)", "Bash(gh pr list:*)", "Bash(gh pr checks:*)",
      "Bash(gh pr diff:*)", "Bash(gh pr status:*)", "Bash(gh pr comment:*)", "Bash(gh run:*)",
      "Bash(gh label list:*)", "Bash(gh repo view:*)"
    ],
    "ask": [
      "Bash(git push:*)", "Bash(gh pr create:*)", "Bash(gh pr ready:*)", "Bash(gh pr merge:*)",
      "Bash(gh repo create:*)", "Bash(gh repo edit:*)", "Bash(gh api:*)", "Bash(gh release:*)",
      "Bash(gh label create:*)", "Bash(git branch -d:*)"
    ],
    "deny": [
      "Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)",
      "Bash(git push --force:*)", "Bash(git push -f:*)", "Bash(git push origin main:*)",
      "Bash(git reset --hard:*)", "Bash(gh repo delete:*)", "Bash(gh secret:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [ { "type": "command", "command": "just lint" } ] }
    ]
  }
}
```
Explica que la protección real de `main` está en el servidor (ruleset de A7); los `deny` son una segunda barrera local.

**Hecho cuando:** JSON válido y aprobado por el usuario.

## A5. CI y plantillas de GitHub
Crea:

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: extractions/setup-just@v2
      # + paso de setup del toolchain del stack (setup-python, toolchain C/C++, etc.)
      - run: just setup
      - run: just lint
      - run: just test
      - run: just build
```
El nombre del job (`check`) es el que exigirá el ruleset.

`.github/workflows/pr-title.yml`: valida que el título de la PR siga Conventional Commits (acción `amannn/action-semantic-pull-request`, job llamado `pr-title`, permisos `pull-requests: read`).

`.github/pull_request_template.md`:
```markdown
## Qué y por qué
Closes #
Plan: docs/plans/

## Cómo se ha probado
- [ ] `just lint && just test` en local
- [ ] Tests nuevos para el cambio

## Revisión
- [ ] Plan revisado por Codex
- [ ] Código revisado por Codex y hallazgos resueltos

## Riesgos / notas
```
`.github/ISSUE_TEMPLATE/feature.yml` y `bug.yml` (formularios con objetivo/criterios de aceptación y pasos para reproducir/comportamiento esperado), y `config.yml` con `blank_issues_enabled: false`.
`.github/dependabot.yml` con el ecosistema del stack y siempre `github-actions`, frecuencia semanal.
`.github/CODEOWNERS` con `* @<usuario>`.

**Hecho cuando:** ficheros creados y coherentes con el `justfile`.

## A6. Repositorio en GitHub ⚠️
1. `git init -b main` (si no existe), `git add .`, commit `chore: estructura inicial del proyecto`.
2. Muestra y, con confirmación, ejecuta:
   ```bash
   gh repo create <nombre> --<private|public> --description "<descripción>" --source=. --remote=origin --push
   ```
3. Espera al primer run: `gh run watch` (o `gh run list --limit 1`). Si falla, arréglalo antes de seguir.
4. Añade el badge de CI al README en el siguiente cambio (no directamente en `main` después de A7).

**Hecho cuando:** repo creado, `main` subido y CI verde.

## A7. Configuración profesional del repo ⚠️
Con confirmación, ejecuta:

Ajustes de fusión y limpieza:
```bash
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge --enable-auto-merge
gh repo edit --enable-wiki=false
```
Seguridad (si alguna opción no está disponible para el plan del usuario, indícalo y sigue):
```bash
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
gh api -X PUT repos/:owner/:repo/vulnerability-alerts
```
Etiquetas:
```bash
gh label create feature --color 0E8A16 --description "Nueva funcionalidad" --force
gh label create bug --color D73A4A --description "Error" --force
gh label create chore --color C5DEF5 --description "Mantenimiento" --force
gh label create docs --color 0075CA --description "Documentación" --force
gh label create "needs-plan" --color FBCA04 --description "Requiere plan antes de implementar" --force
gh label create "codex-reviewed" --color 5319E7 --description "Revisado por Codex" --force
```
Ruleset para `main`: escribe `ruleset-main.json` en un temporal y aplica `gh api -X POST repos/:owner/:repo/rulesets --input ruleset-main.json`:
```json
{
  "name": "main-protegida",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "check" }, { "context": "pr-title" } ] } }
  ]
}
```
`required_approving_review_count: 0` porque en un repo personal no puedes aprobar tus propias PR; la garantía la dan la CI obligatoria y la resolución obligatoria de hilos de revisión (incluidos los de Codex). Si hay más colaboradores, súbelo a 1.
Borra el JSON temporal y verifica con `gh api repos/:owner/:repo/rulesets`.

**Hecho cuando:** ajustes aplicados y ruleset activo.

## A8. Revisores en GitHub (opcional, según A1)
- **Codex en GitHub**: el usuario debe activarlo en la web de Codex (configurar Codex cloud con el repo y activar *Code review*; opcionalmente *Automatic reviews*). Después basta con comentar `@codex review` en una PR. Codex en GitHub lee `AGENTS.md`.
- **Claude en GitHub**: en Claude Code, `/install-github-app` instala la app y el workflow para mencionar `@claude` en issues y PR.
Indica los pasos; el usuario los completa. No es imprescindible: el flujo local con el plugin funciona sin esto.

**Hecho cuando:** el usuario confirma lo que ha activado (o que lo omite).

## A9. PR de prueba de extremo a extremo
Valida el circuito completo con un cambio pequeño:
1. `gh issue create --title "chore: añadir badge de CI al README" --label chore --assignee @me --body-file <tmp>`
2. `gh issue develop <n> --name chore/<n>-badge-ci --base main --checkout`
3. Añade el badge, commit `docs: añadir badge de CI`, push.
4. `gh pr create --title "docs: añadir badge de CI" --body-file <tmp con plantilla y Closes #n>`
5. Pide `/codex:review --base main` (y `@codex review` si A8 activó Codex en GitHub).
6. `gh pr checks --watch`; con confirmación, `gh pr merge --squash --auto`.
7. `git switch main && git pull --ff-only`, borra la rama local. Verifica que el issue se cerró.

**Hecho cuando:** PR fusionada, issue cerrado, `main` actualizado.

## A10. Cierre
Marca `docs/setup-estado.md` como completado y resume: URL del repo, protecciones activas, revisores configurados. Propón la primera feature: `/proyecto feature <nombre>`.

---

# Parte B — Feature (`/proyecto feature <nombre>`)

Roles: **Claude arquitecta → Codex revisa el plan → Claude programa → Codex revisa el código → el usuario decide.** Todo queda trazado en el issue y la PR.

## B0. Sincronización
`git switch main && git pull --ff-only`. Comprueba con `git status` que no hay cambios pendientes. Si los hay, detente y pregunta.

## B1. Issue y rama
Pide (en un solo mensaje) objetivo y criterios de aceptación si faltan. Usa un issue existente si el usuario da su número.
```bash
gh issue create --title "feat: <nombre>" --label feature --label needs-plan --assignee @me --body-file <tmp>
gh issue develop <n> --name feat/<n>-<slug> --base main --checkout
```
(`gh issue develop` enlaza la rama con el issue en GitHub.)

**Hecho cuando:** issue creado y rama enlazada activa.

## B2. Plan (Claude arquitecta) ⚠️
Solo lectura: explora el código y **no edites nada salvo el plan**.
Crea `docs/plans/<AAAAMMDD>-<nombre>.md`:
```markdown
# Plan: <nombre> (#<n>)
## Objetivo y criterios de aceptación
## Enfoque
## Archivos a crear / modificar
## Tests que demostrarán que funciona
## Riesgos y casos límite
## Fuera de alcance
## Revisión de Codex
## Estado
- [x] B1 Issue y rama
- [x] B2 Plan
- [ ] B3 Revisión del plan (Codex)
- [ ] B4 Tests + PR borrador
- [ ] B5 Implementación
- [ ] B6 Verificación
- [ ] B7 Revisión de código (Codex)
- [ ] B8 Correcciones
- [ ] B9 Merge
```
Las decisiones de arquitectura relevantes van además como ADR en `docs/decisions/NNNN-titulo.md`.
Commit `docs: plan de <nombre>`.

**Hecho cuando:** el usuario aprueba el plan.

## B3. Codex revisa el plan ⚠️
Pide al usuario:
```
/codex:adversarial-review revisa docs/plans/<fichero>: supuestos ocultos, casos límite, alternativas más simples y riesgos
```
Clasifica cada objeción en **aceptar / discutible / rechazar** con una línea de motivo. Actualiza el plan solo con lo aprobado y anota el resumen en `## Revisión de Codex`.
Commit `docs: plan de <nombre> revisado`. Publica el resumen en el issue: `gh issue comment <n> --body-file <tmp>` y quita la etiqueta: `gh issue edit <n> --remove-label needs-plan`.

**Hecho cuando:** plan revisado y aprobado.

## B4. Tests primero + PR borrador
Escribe los tests del plan, ejecuta `just test` y **confirma que fallan por la razón esperada**. Commit `test: <nombre>`.
Con confirmación, push y PR en borrador para que la CI corra desde el principio:
```bash
git push -u origin feat/<n>-<slug>
gh pr create --draft --title "feat: <nombre>" --body-file <tmp con plantilla, Closes #<n> y ruta del plan>
```
(Es normal que la CI falle en este punto: los tests nuevos aún no pasan.)

**Hecho cuando:** tests fallando como se espera y PR borrador abierta.

## B5. Implementación
Código mínimo para que pasen los tests, siguiendo el plan. Si necesitas desviarte, detente y explica antes de seguir. Commits pequeños y atómicos. Sugiere `/compact` si el contexto está muy cargado.
Push al terminar (con confirmación) y `gh pr checks`.

**Hecho cuando:** `just test` pasa en local.

## B6. Verificación
`just lint && just test && just build` en local y `gh pr checks --watch` en remoto. Comprueba cada criterio de aceptación. Si la CI falla, `gh run view --log-failed` y corrige.

**Hecho cuando:** local y CI en verde, criterios cubiertos.

## B7. Codex revisa el código ⚠️
Local (siempre):
```
/codex:review --base main --background
/codex:status
/codex:result
```
Para cambios de diseño importantes añade `/codex:adversarial-review --base main`.
En GitHub (si A8 lo activó): `gh pr ready <pr>` (marcar como lista dispara la revisión automática si está activada) o `gh pr comment <pr> --body "@codex review"`.
Clasifica todos los hallazgos en una tabla: severidad (alta/media/baja), archivo, problema, propuesta, recomendación (aplicar / no aplicar).
Publica la tabla en la PR: `gh pr comment <pr> --body-file <tmp>`.

**Hecho cuando:** el usuario ha elegido qué aplicar.

## B8. Correcciones
Aplica solo lo aprobado, un commit por hallazgo (`fix:` o `refactor:`). Push y repite B6.
Para hallazgos descartados, responde en el hilo correspondiente explicando el motivo; todos los hilos deben quedar resueltos (el ruleset lo exige).
Si algo se atasca: `/codex:rescue fix <problema> with the smallest safe patch`. Si los cambios fueron grandes, repite B7.
Añade la etiqueta: `gh pr edit <pr> --add-label codex-reviewed`.

**Hecho cuando:** CI verde y todos los hilos resueltos.

## B9. Merge ⚠️
Actualiza el plan (estado y desviaciones) y añade la entrada a `CHANGELOG.md` en `## [Unreleased]`. Push.
Si sigue en borrador: `gh pr ready <pr>`. Revisa que el título cumple Conventional Commits (será el commit en `main`).
Con confirmación:
```bash
gh pr merge <pr> --squash --auto
gh pr checks <pr> --watch
```
Tras el merge: `git switch main && git pull --ff-only`, `git branch -d feat/<n>-<slug>`. Verifica que el issue se cerró (`gh issue view <n>`).

**Hecho cuando:** PR fusionada, issue cerrado, `main` local actualizado.

---

# Parte C — Release (`/proyecto release`)

## C1. Preparación ⚠️
Lista los cambios desde la última etiqueta: `git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline` (o todo si no hay etiquetas). Propón la versión según SemVer (`feat` → MINOR, `fix` → PATCH, `!`/BREAKING CHANGE → MAJOR) y espera confirmación.

## C2. Publicación ⚠️
Rama `chore/release-vX.Y.Z`: mueve `## [Unreleased]` del `CHANGELOG.md` a `## [X.Y.Z] - AAAA-MM-DD`, PR `chore: release vX.Y.Z`, CI verde y merge como en B9. Después, con confirmación:
```bash
git switch main && git pull --ff-only
gh release create vX.Y.Z --target main --title "vX.Y.Z" --generate-notes
```
Adjunta artefactos de build si procede (`gh release upload vX.Y.Z <ficheros>`).

**Hecho cuando:** release publicada.

---

## Atajos según el tipo de tarea
- **Bug**: B0 → B1 (label `bug`, rama `fix/…`) → test que reproduce el bug (B4) → B5 → B6 → B7 → B8 → B9. Si se atasca, `/codex:rescue --background investigate <bug>` en paralelo.
- **Cambio trivial** (typo, doc): issue + rama + PR igualmente (el ruleset no permite otra vía), sin plan ni revisión adversarial.
- **Dos enfoques posibles**: dos worktrees y dos PR borrador; Claude implementa uno y Codex (`/codex:rescue`) el otro. Compara diffs y CI, cierra la PR descartada con un comentario explicando por qué.
- **Dependabot**: revisa la PR, `gh pr checks`, y si está verde y es menor/patch, merge con squash.
