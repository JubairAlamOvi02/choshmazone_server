# 🧠 ChoshmaZone — MemoryBank Index

Welcome to the **MemoryBank** for **ChoshmaZone**. This directory contains the central source of truth for all architectural decisions, deployment procedures, progress tracking, and development runbooks.

---

## 📑 Documents Directory

| Document | Purpose & Description |
| :--- | :--- |
| 📘 [**projectOverview.md**](./projectOverview.md) | High-level summary of the brand, mission, value propositions, and core tech stack. |
| 🏗️ [**systemArchitecture.md**](./systemArchitecture.md) | Full architectural breakdown across Frontend, Backend, Database, and integrations. |
| 🚀 [**deploymentGuide.md**](./deploymentGuide.md) | Step-by-step runbook for deploying to a Hostinger Ubuntu VPS with Nginx, PM2, and SSL. |
| 📊 [**progress.md**](./progress.md) | Status tracker: completed milestones, current development state, and upcoming tasks. |
| 💻 [**developmentWorkflow.md**](./developmentWorkflow.md) | Local development setup, npm scripts, environment variables, and Git guidelines. |

---

## 🔒 Security Note
Never place production database credentials, JWT private keys, or API tokens into these markdown files. Production secrets must only reside inside the server's `.env` on your VPS.
