## About idoneo-business

Shared React package for the Idoneo Next.js apps. It holds the screens and API clients that every product reuses: business profile, user profile, billing, team access, recommendations, and product feedback.

**What it exports**

- **Business** — `BusinessForm`, `BusinessProvider`, and business profile API helpers
- **Account** — `ProfilePage`, `TeamAdminsCard`, billing, and profile types
- **Growth** — `RecommendationsPage` (affiliate invites) and `FeedbackPanel`
- **HTTP** — `configureBusinessHttp`, `createBusinessHttp`, and `ApiError`

Apps install it from GitHub `main` and talk to the same Humano / CMS8 API (Sanctum, team context).

## Built by IDONEO

**[IDONEO](https://www.idoneo.dev)** is the software studio behind this package and the Idoneo product suite.

These tools help companies **scale operations** and **innovate with structure**: run the business day to day, then turn innovation into a repeatable system.

**[Humano](https://humano.app)** is the operating layer those apps connect to. **CMS8 (Simplicity)** is the multi-tenant backend.

## Usage

Peer dependencies: React 19+ and TanStack Query 5.

```sh
npm install git+https://github.com/diego-mascarenhas/idoneo-business.git#main
```

```ts
import { BusinessForm, ProfilePage, RecommendationsPage } from 'idoneo-business'
import 'idoneo-business/styles.css'
```

Point `package.json` at `#main`. After merging this repo, refresh the lockfile in each app (`npm update idoneo-business`) so production installs the current commit.

For local work, symlink the package from a sibling folder:

```sh
ln -sfn ../idoneo-business node_modules/idoneo-business
```

## Contributing

Thank you for considering contributing to idoneo-business.

## Security Vulnerabilities

If you discover a security vulnerability, please send an e-mail to Diego Mascarenhas Goytía via [diego.mascarenhas@icloud.com](mailto:diego.mascarenhas@icloud.com). All security vulnerabilities will be promptly addressed.

## License

idoneo-business is open-sourced software licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html).

### Additional Terms

By deploying this software, you agree to notify the original author at [diego.mascarenhas@icloud.com](mailto:diego.mascarenhas@icloud.com) or by visiting [https://www.linkedin.com/in/diego-mascarenhas/](https://www.linkedin.com/in/diego-mascarenhas/). Any modifications or enhancements must be shared with the original author.
