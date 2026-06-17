# Development

## 1. Prerequisites and Basics

First, make sure you have the following installed:

- [Hugo v0.142.0](https://gohugo.io/getting-started/installing/)
- A node js package manager (Either bun or npm)

If you use VSCode, those extensions are recommended :

- [Markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
- [Tailwind CSS Intelissense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

Then, install all of the dependencies and update the modules (the commands are the same for Bun):

```bash
npm i
npm run update-modules
```

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

## 2. Maintaining the website

### Members list

#### a. Be notified of the changes

The member list is maintained in a Google Sheet at the time of the writing. Google Sheets supports sending emails notifications when the content changes (Google Sheets > Tools > Notifications).

#### b. What to do when the member list is updated

1. Download the member list as CSV
2. Run the python scripts `npm run update-members <path to the csv file>`. It should generate a file `poles.yaml` in the root directory.
3. Use the `poles.yaml` file to update the members list of the website.
