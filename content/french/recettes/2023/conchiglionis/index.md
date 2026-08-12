---
title: "Conchiglionis ricotta et épinard"
date: 2023-02-05T17:26:00Z
draft: false
hidden: false

image: "thumbnail.jpeg"
thumbnail: "thumbnail.jpeg"

"recettes/order": ["Plat"]
"recettes/tags": ["Pates"]
"recettes/copiosity": ["Copieux"]
copiosityLevel: 3
veganLevel: "vegetarian"
intolerances: ["gluten", "lactose", "egg", "nuts"]
quantityMin: "2"
quantityMax: "8"
durationMin: "50"
"recettes/duration": ["Long"]
---

{{<v/begin id="person" default-value="4" min="2" max="8">}}
{{<v/begin id="piece" default-value="5" min="4" max="8">}}

{{<v/expr link-to="person,piece">}}
  person * piece
{{</v/expr>}}

{{<recettes/section fa-icon="fa-bowl-food">}} Ingrédients {{</recettes/section>}}

{{<v/container>}}
  {{<v/input id="person" fa-icon="fa-users" suffix="personnes">}}
  {{<v/input id="piece" fa-icon="fa-users" suffix="pièces / personnes">}}
{{</v/container>}}

- {{<v value="20" step="1">}} conchiglionis

#### Pour la farce

- {{<v value="500" unit="g">}} d'épinards _(frais de préférence)_
- {{<v value="300" unit="g">}} de ricotta
- {{<v value="300" unit="g">}} grammes de parmesan
- Noix de muscade (optionnel)
- {{<v value="1" step="1">}} oeuf

#### Pour la sauce

- {{<v value="400" unit="g">}} de tomates pelées
- {{<v value="1" step="1">}} gousses d'ail
- {{<v value="1" step="1">}} oignon
- Huile d'olive
- Sel et poivre
- Basilic

{{<recettes/step-section step="1" >}} Préparation {{</recettes/step-section>}}

1. Commencez par préchauffer le four à 180 degrés
2. Pour la préparation de la sauce : ciselez finement l'oignon et pressez l'ail. Faites revenir à feu doux dans un peu d'huile d'olive. Ajoutez les tomates pelées concassées. Salez, poivrez et laissez cuire à feu doux 10 minutes. A la fin de la cuisson, ajoutez le basilic ciselé hors du feu, rectifiez l'assaisonnement et mélangez.
3. Portez un grand volume d'eau à ébullition et y faire cuire les pâtes 5 minutes de moins que ce qu'indique le paquet.
4. Pendant ce temps, mélangez les épinards, la ricotta, le parmesan et l'oeuf. Assaisonnez en sel, poivre, noix de muscade. Mélangez.
5. Faites rafraîchir les pâtes sous un filet d'eau froide puis égouttez. Mettez la sauce dans un plat allant au four, garnissez les pâtes avec la farce et déposez les sur la sauce.
6. Parsemez de parmesan et enfournez pour 25-30 min à 180 degrés.
7. Dégustez !

{{<v/end>}}
