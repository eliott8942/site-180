# Maintaining the website

This document describe some procedures and some utilities that should help you maintaining the website content in the long term.

To do this, this document is splitted in sections. Each of the subtitles here will represent a section of the website. Currently there are four : Association (Members list), Blog, Crieur (Place map), Fringale (Books we sell) and Recettes (Cooking).

Here are some advices before we begin:

- **First and foremost, you should take a look at Hugo documentation.** This will help you understand the project structure, and where to place the images and text.
- Also, try to modify the existing content to see the effect on the pages. Avoid commiting those modifications please.

## Association (Members list) [`content/association`]

### a. Be notified of the changes

The member list is maintained in a Google Sheet at the time of the writing. Google Sheets supports sending emails notifications when the content changes (Google Sheets > Tools > Notifications).

### b. What to do when the member list is updated

1. Download the member list as CSV
2. Run the python scripts `npm run update-members <path to the csv file>`. It should generate a file `poles.yaml` in the root directory.
3. Use the `poles.yaml` file to update the members list of the website. The file that handles this is `content/association/_index.md`
