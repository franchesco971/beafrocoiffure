// Catégories issues du cahier des charges (M2). Tarifs et durées : gérés en base, pas ici.
export const HAIR_SERVICES = [
  {
    title: "Départ de locks",
    text: "Le premier jour de votre lockstyle : une technique choisie selon votre longueur et votre texture.",
  },
  {
    title: "Création de MicroLocks",
    text: "Fines, légères, infiniment polyvalentes : une pose minutieuse, mèche après mèche.",
  },
  {
    title: "Entretien et resserrage de locks",
    text: "Racines reprises, cuir chevelu apaisé : des locks nettes et en bonne santé.",
  },
  {
    title: "Réparation et reprise de locks",
    text: "Locks fragilisées, relâchées ou cassées : on les reprend avec patience et précision.",
  },
  {
    title: "Soins capillaires",
    text: "Hydrater, nourrir, fortifier : des soins ciblés pour des cheveux texturés vivants.",
  },
  {
    title: "Coiffures naturelles et protectrices",
    text: "Des styles qui subliment votre texture tout en protégeant la fibre.",
  },
  {
    title: "Coupes et colorations",
    text: "Formes et nuances pensées pour la façon dont vos cheveux se comportent vraiment.",
  },
  {
    title: "Diagnostic et accompagnement capillaire",
    text: "Analyse du cuir chevelu et de la fibre, puis une routine construite pour vous.",
  },
] as const;

export const WELLNESS_OFFERS = [
  "Conseil sur les produits",
  "Séances de testing de produits",
  "Accompagnements personnalisés",
] as const;

export const BOOKING_STEPS = [
  { title: "Choisissez", text: "Une ou plusieurs prestations compatibles entre elles." },
  { title: "Voyez le planning", text: "Les créneaux libres, en temps réel." },
  { title: "Dites-nous qui vous êtes", text: "Nom, prénom, téléphone et e-mail. Aucun compte à créer." },
  { title: "Recevez la confirmation", text: "Par e-mail, avec un rappel avant votre rendez-vous." },
] as const;
