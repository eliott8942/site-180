# Development

## 1. Prerequisites and Basics

First, make sure you have the following installed:

- [Hugo v0.142.0](https://gohugo.io/getting-started/installing/)
- A js runtime and package manager (either bun or node/npm)
- [Node.js v22](https://nodejs.org/en). It's needed as a fallback for some operations hugo does (like postcss), where bun might not implement
yet the necessary API calls.

If you use VSCode, those extensions are recommended :

- [Markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
- [Tailwind CSS Intelissense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

Then, install all of the dependencies and update the modules (the commands are the same for Bun):

```bash
npm i
npm run update-modules
```

Finally, be ready to spend a lot of time learning how to write hugo partials and understanding those who already exists, because the syntax is just awfull. I hope i'm not just blindman again and i didn't figured how to write cleaner partials.

### Run the website locally

To run the development server (the one that includes drafts)

```bash
npm run dev
```

To run a production ready server

```bash
npm run build
```

### Deployment

If you're on the [official repo](https://github.com/180-C/site-180), the website is automatically deployed on [https://180c.ch](https://180c.ch) when a commit is pushed to the `master` branch.
