# joltkin-frontend

This starter React project has been generated using AlgoKit. See below for default getting started instructions.

## Current Focus (Nov 2025)

- We are skipping the upcoming Algorand Startup Challenge and will re-evaluate once the product aligns with that program’s timelines.
- Immediate priority is customer discovery and demand validation for the pilot Stripe checkout flow so we can verify there is a repeatable use case before scaling.
- When traction is demonstrated, we will pursue non-dilutive, equity-free funding (grants, ecosystem programs) rather than taking dilutive capital prematurely.

## Setup

### Initial Setup

#### 1. Clone the Repository

Start by cloning this repository to your local machine.

#### 2. Install Pre-requisites

Ensure the following pre-requisites are installed and properly configured:

- **npm**: Node package manager. Install from [Node.js Installation Guide](https://nodejs.org/en/download/). Verify with `npm -v` to see version `18.12`+.
- **AlgoKit CLI**: Essential for project setup and operations. Install the latest version from [AlgoKit CLI Installation Guide](https://github.com/algorandfoundation/algokit-cli#install). Verify installation with `algokit --version`, expecting `2.0.0` or later.

#### 3. Bootstrap Your Local Environment

Run the following commands within the project folder:

- **Install Project Dependencies**: With `algokit project bootstrap all`, ensure all dependencies are ready.

### Development Workflow

#### Terminal

Directly manage and interact with your project using AlgoKit commands:

1. **Build Contracts**: `algokit project run build` builds react web app and links with smart contracts in workspace, if any.
2. Remaining set of command for linting, testing and deployment can be found in respective [package.json](./package.json) file and [.algokit.toml](./.algokit.toml) files.

#### VS Code

For a seamless experience with breakpoint debugging and other features:

1. **Open Project**: In VS Code, open the repository root.
2. **Install Extensions**: Follow prompts to install recommended extensions.
3. **Debugging**:
   - Use `F5` to start debugging.
   - **Windows Users**: Select the Python interpreter at `./.venv/Scripts/python.exe` via `Ctrl/Cmd + Shift + P` > `Python: Select Interpreter` before the first run.

#### Other IDEs

While primarily optimized for VS Code, Jetbrains WebStorm has base support for this project:

1. **Open Project**: In your JetBrains IDE, open the repository root.
2. **Automatic Setup**: The IDE should configure the Python interpreter and virtual environment.
3. **Debugging**: Use `Shift+F10` or `Ctrl+R` to start debugging. Note: Windows users may encounter issues with pre-launch tasks due to a known bug. See [JetBrains forums](https://youtrack.jetbrains.com/issue/IDEA-277486/Shell-script-configuration-cannot-run-as-before-launch-task) for workarounds.

## AlgoKit Workspaces and Project Management

This project supports both standalone and monorepo setups through AlgoKit workspaces. Leverage [`algokit project run`](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/project/run.md) commands for efficient monorepo project orchestration and management across multiple projects within a workspace.

> Please note, by default frontend is pre configured to run against Algorand LocalNet. If you want to run against TestNet or MainNet, comment out the current environment variable and uncomment the relevant one in [`.env`](.env) file that is created after running bootstrap command and based on [`.env.template`](.env.template).

### Stripe test checkout variables

To exercise the pilot Stripe checkout flow, populate the following keys in your `.env` (copy of `.env.template`):

- `VITE_STRIPE_PUBLISHABLE_KEY` – the `pk_test_...` key from your Stripe dashboard.
- `VITE_CHECKOUT_API_BASE` – base URL for the checkout API (e.g., `http://localhost:3001` when the `nft_mint_server` is running locally). Leave blank in production to default to same-origin requests.
- `VITE_STRIPE_PRICE_ID` – the `price_...` identifier that the landing page CTA should sell. Create it from a Stripe Product → Pricing plan.

The associated secret keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) live in `projects/joltkin-contracts/nft_mint_server/.env` and must be configured before the backend can create sessions or accept webhooks.

With those values set, the “Sell Stripe Test Ticket” card on the homepage will create a Checkout Session via `/api/stripe/checkout-session`, redirect the user to Stripe-hosted checkout, and emit telemetry so judges can confirm the pilot loop.

### Continuous Integration

This project uses [GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) to define CI workflows, which are located in the [.github/workflows](`../../.github/workflows`) folder.

For pull requests and pushes to `main` branch against this repository the following checks are automatically performed by GitHub Actions:

- `install`: Installs dependencies using `npm`
- `lint`: Lints the codebase using `ESLint`
- `build`: Builds the codebase using `vite`

> Please note, if you instantiated the project via `algokit init` without explicitly specifying the `--no-workspace` flag, we will automatically attempt to move the contents of the `.github` folder to the root of the workspace.

### Continuous Deployment

The project template provides base Github Actions workflows for continuous deployment to [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/). These workflows are located in the [`.github/workflows`](./.github/workflows) folder.

**Please note**: when configuring the github repository for the first time. Depending on selected provider you will need to set the provider secrets in the repository settings. Default setup provided by the template allows you to manage the secrets via environment variables and secrets on your github repository.

#### Setting up environment variables and secrets for webapp deployment

For Vercel:

1. Retrieve your [Vercel Access Token](https://vercel.com/support/articles/how-do-i-use-a-vercel-api-access-token)
2. Install the [Vercel CLI](https://vercel.com/cli) and run `vercel login`
3. Inside your folder, run `vercel link` to create a new Vercel project
4. Inside the generated `.vercel` folder, save the `projectId` and `orgId` from the `project.json`
5. Inside GitHub, add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as [secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).
6. Create an .env file containing ENV vars for the project (pointing to testnet or mainnet), drag and drop the .env file to upload initial batch of default environment variables to your vercel project.
7. Upon invocation, CD pipeline will pull the VITE_ prefixed environment variables, build the project and deploy to the specified environment.

For Netlify:

1. Retrieve your [Netlify Access Token](https://docs.netlify.com/cli/get-started/#obtain-a-token-in-the-netlify-ui)
2. Inside your folder run `netlify login`
3. Inside your folder run `netlify sites:create` to create a new site, obtain NETLIFY_SITE_ID from the output
4. Inside GitHub, add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` as [secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).
5. Define the VITE_ prefixed environment variables in netlify environment variables under site settings.
6. Upon invocation, CD pipeline will build the project and deploy to the specified environment.

> If you prefer alternative deployment methods, you can modify the relevant workflow files from the [`.github/workflows`](./.github/workflows) folder or modify deploy scripts in `.algokit.toml`.

## Algorand Wallet integrations

The template comes with [`use-wallet`](https://github.com/txnlab/use-wallet) integration, which provides a React hook for connecting to an Algorand wallet providers. The following wallet providers are included by default:

- LocalNet:
- - [KMD/Local Wallet](https://github.com/TxnLab/use-wallet#kmd-algorand-key-management-daemon) - Algorand's Key Management Daemon (KMD) is a service that manages Algorand private keys and signs transactions. Works best with AlgoKit LocalNet and allows you to easily test and interact with your dApps locally.
- TestNet and others:
- - [Pera Wallet](https://perawallet.app).
- - [Defly Wallet](https://defly.app).
- - [Exodus Wallet](https://www.exodus.com).
- - [Daffi Wallet](https://www.daffi.me).

Refer to official [`use-wallet`](https://github.com/txnlab/use-wallet) documentation for detailed guidelines on how to integrate with other wallet providers (such as WalletConnect v2). Too see implementation details on the use wallet hook and initialization of extra wallet providers refer to [`App.tsx`](./src/App.tsx).

## Tools

This project makes use of React and Tailwind to provider a base project configuration to develop frontends for your Algorand dApps and interactions with smart contracts. The following tools are in use:

- [AlgoKit Utils](https://github.com/algorandfoundation/algokit-utils-ts) - Various TypeScript utilities to simplify interactions with Algorand and AlgoKit.
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom designs.
- [daisyUI](https://daisyui.com/) - A component library for Tailwind CSS.
- [use-wallet](https://github.com/txnlab/use-wallet) - A React hook for connecting to an Algorand wallet providers.
- [npm](https://www.npmjs.com/): Node.js package manager
- [jest](https://jestjs.io/): JavaScript testing framework
- [playwright](https://playwright.dev/): Browser automation library
- [Prettier](https://prettier.io/): Opinionated code formatter
- [ESLint](https://eslint.org/): Tool for identifying and reporting on patterns in JavaScript
- Github Actions workflows for build validation
It has also been configured to have a productive dev experience out of the box in [VS Code](https://code.visualstudio.com/), see the [.vscode](./.vscode) folder.

## Integrating with smart contracts and application clients

Refer to the detailed guidance on [integrating with smart contracts and application clients](./src/contracts/README.md). In essence, for any smart contract codebase generated with AlgoKit or other tools that produce compile contracts into ARC34 compliant app specifications, you can use the `algokit generate` command to generate TypeScript or Python typed client. Once generated simply drag and drop the generated client into `./src/contracts` and import it into your React components as you see fit.
