# Security Policy

## Supported scope

This repository currently contains motion-design code and product specifications. It does not contain a deployed compliance service or production broker integration.

Security reports are still relevant when they involve:

- exposed credentials or personal information;
- unsafe dependency behavior;
- malicious asset handling;
- CI or repository configuration weaknesses;
- code that could misrepresent a simulated integration as a live one.

## Reporting

Do not open a public issue for a suspected vulnerability. Use GitHub private vulnerability reporting when it is enabled, or contact the repository owner privately through the GitHub account associated with the repository.

Include reproduction steps, affected files, impact, and any proposed mitigation. Do not include real investor, broker, or employee data in a report.

## Secrets

The project does not require runtime secrets for local Remotion preview or rendering. Never commit API keys, GitHub tokens, brokerage credentials, or production data. Local `.env*` files are ignored except for a deliberately sanitized `.env.example`.
