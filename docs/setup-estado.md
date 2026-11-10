# Estado del arranque (Parte A)

> Fichero interno del flujo `/proyecto`. Se puede borrar o mover cuando termine el arranque.

## Definición del proyecto (A1)

| # | Campo | Valor |
| --- | --- | --- |
| 1 | Repo | `project-kickstart` |
| 1 | Descripción | "Claude Code plugin that bootstraps and runs professional GitHub projects: issue → plan → PR → review → merge → release." |
| 2 | Objetivo | Convertir el flujo de `/proyecto` (SKILL.md actual) en un plugin de Claude Code profesional, en inglés, publicado en un marketplace y en GitHub, para que cualquiera pueda instalarlo y como pieza de portfolio. |
| 3 | Lenguaje / toolchain | Contenido: Markdown (skills/commands) + JSON (`.claude-plugin/plugin.json`, `marketplace.json`). Tooling: Node.js ≥ 20 sin dependencias de runtime (tests con `node:test`), `markdownlint-cli2`, validación de manifiestos y frontmatter, `just` como ejecutor de tareas. |
| 4 | Plataforma | Multiplataforma: Windows (PowerShell / Git Bash), macOS y Linux. |
| 5 | Visibilidad | Privado mientras se prueba → público al publicar v1.0.0. Sin GitHub Pro: en A7 se aplican ajustes, seguridad y etiquetas; el ruleset de `main` se aplica al hacer el repo público. |
| 6 | Licencia | MIT (uso libre y gratuito para todos; solo exige conservar el aviso de copyright) |
| 7 | Revisores | Solo Codex en local (plugin `codex@openai-codex`): revisión de planes (`/codex:adversarial-review`) y de código (`/codex:review`). Sin app de Claude en GitHub (descartada para no consumir cuota de Claude Pro); Codex cloud omitido por ahora. |
| 8 | Restricciones | Debe funcionar para cualquier usuario: idioma del contenido en inglés (respondiendo en el idioma del usuario), sin depender de herramientas opcionales (Codex, `just`) de forma obligatoria (detectar y ofrecer alternativas), comandos compatibles con PowerShell y bash, sin dependencias de runtime. |

## Bloques

- [x] A0 Entorno
- [x] A1 Definición del proyecto
- [x] A2 Estructura y tareas
- [x] A3 Contexto compartido para agentes
- [x] A4 Permisos y hooks de Claude Code
- [x] A5 CI y plantillas de GitHub
- [x] A6 Repositorio en GitHub — <https://github.com/AndressAlvarezz/project-kickstart> (privado), CI verde
- [x] A7 Configuración profesional del repo (parcial: ver "Al activar Pro o hacer público")
- [x] A8 Revisores en GitHub — omitido: revisión solo con Codex en local. App de Claude y secret retirados por el usuario.
- [x] A9 PR de prueba de extremo a extremo — #5 → PR #6 fusionada con squash (2a8a310), CI verde en main
- [x] A10 Cierre — arranque completado el 2026-11-11

## Pendientes anotados

- Icono del plugin (`.claude-plugin/icon.png`, PNG cuadrado 512–2048 px): aviso del validador oficial; necesario antes de enviar al directorio de plugins. Solo cuenta el primer envío.
- `npm audit`: aviso de KaTeX (dependencia transitiva de desarrollo vía `markdownlint`, sin corrección disponible). No afecta al plugin publicado; Dependabot lo vigilará.
- Activar GitHub Pro vía Student Developer Pack → permitiría el ruleset en privado.
- PRs #1–#4 de Dependabot (actions v4 → versiones nuevas, sin el aviso de Node 20): revisar y fusionar tras A7.

## Al activar Pro o hacer público el repo

Aplicado en A7: solo squash, borrar rama al fusionar, sin wiki, alertas de Dependabot y correcciones automáticas de seguridad, etiquetas.
Rechazado por GitHub en privado sin Pro (aplicar entonces):

```sh
gh api -X POST repos/:owner/:repo/rulesets --input .github/rulesets/main-protected.json
gh repo edit --enable-auto-merge
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
gh api repos/:owner/:repo/rulesets   # verificar
```

Mientras tanto: sin `--auto` en los merges (fusionar a mano tras CI verde) y la única barrera contra push a `main` son los `deny` de `.claude/settings.json`.

## Resumen del arranque

- Repo: <https://github.com/AndressAlvarezz/project-kickstart> (privado hasta v1.0.0).
- Activo: solo squash merge, borrado de rama al fusionar, alertas y correcciones de Dependabot, plantillas de issue/PR, CI (`check` + `cross-platform` Windows/macOS + `pr-title`), etiquetas, `deny` locales en `.claude/settings.json`.
- Pendiente de Pro o repo público: ruleset de `main`, auto-merge, secret scanning (ver sección anterior).
- Revisión: Codex en local (`/codex:adversarial-review` para planes, `/codex:review` para código).
- Siguiente: primera feature con `/proyecto feature`.
