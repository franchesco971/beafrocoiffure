// Pages légales : métadonnées et textes par défaut (modèles à compléter puis à faire valider).
// Format du texte : `## Titre`, `- élément de liste`, `[texte](lien)`, paragraphes séparés par une ligne vide.

export const LEGAL_KEYS = ["legal.mentions", "legal.privacy", "legal.terms"] as const;
export type LegalKey = (typeof LEGAL_KEYS)[number];

export const LEGAL_PAGES: Record<LegalKey, { path: string; title: string; description: string }> = {
  "legal.mentions": {
    path: "/mentions-legales",
    title: "Mentions légales",
    description: "Éditeur, hébergeur et informations légales du site BeAfro Coiffure & Beauté.",
  },
  "legal.privacy": {
    path: "/confidentialite",
    title: "Politique de confidentialité",
    description: "Données collectées, durées de conservation et exercice de vos droits (RGPD).",
  },
  "legal.terms": {
    path: "/cgv",
    title: "Conditions générales de vente et de réservation",
    description: "Réservation, tarifs, annulation et modalités de paiement des prestations BeAfro Coiffure & Beauté.",
  },
};

/** Marqueur des informations que la cliente doit encore renseigner dans les textes par défaut. */
export const LEGAL_PLACEHOLDER = "[à compléter";

const MENTIONS = `## Éditeur du site
Le site beafrocoiffure.fr est édité par BeAfro Coiffure & Beauté [à compléter : forme juridique, capital éventuel].

- SIRET : [à compléter]
- Adresse : [à compléter]
- Directrice de la publication : [à compléter]
- Contact : voir la page [Contact](/contact).

## Hébergement
Le site est hébergé par [à compléter : nom, adresse et téléphone de l’hébergeur].

## Propriété intellectuelle
Les textes, photographies, vidéos, logos et créations présents sur ce site appartiennent à BeAfro Coiffure & Beauté ou sont utilisés avec l’accord de leurs auteurs et des personnes représentées. Toute reproduction, même partielle, sans autorisation écrite préalable est interdite.

## Conseil beauté et bien-être
Les conseils, séances de testing et accompagnements de l’espace Beauté & Bien-être ne constituent pas une prestation médicale et ne remplacent pas l’avis d’un professionnel de santé.

## Responsabilité
Les informations du site (prestations, durées, tarifs) sont données à titre indicatif et peuvent évoluer. BeAfro Coiffure & Beauté ne peut être tenue responsable des interruptions du site ni des contenus des sites vers lesquels il renvoie.

## Données personnelles
Le traitement de vos données est décrit dans la [politique de confidentialité](/confidentialite).`;

const PRIVACY = `## Responsable du traitement
BeAfro Coiffure & Beauté [à compléter : adresse] est responsable des données collectées sur ce site. Vous pouvez nous joindre depuis la page [Contact](/contact).

## Données collectées
Nous ne collectons que les données nécessaires :

- Réservation : prénom, nom, téléphone, adresse e-mail, précisions facultatives, prestations et créneau choisis.
- Contact : nom, adresse e-mail et message.
- Inscription à un événement : nom, adresse e-mail et téléphone (facultatif).
- Avis : prénom ou pseudo, note et texte, publiés après modération.

## Finalités et bases légales
- Gérer vos rendez-vous et vous contacter à leur sujet : exécution de la prestation que vous demandez.
- Répondre à vos messages et gérer vos inscriptions : votre consentement, recueilli par une case à cocher.
- Publier votre avis : votre consentement, en le déposant.
- Sécuriser le site et limiter les abus (limitation du nombre de demandes) : intérêt légitime.

## Durée de conservation
- Fiches clientes et rendez-vous : 3 ans après le dernier rendez-vous, puis anonymisation.
- Messages de contact et inscriptions aux événements : 3 ans, puis suppression ou anonymisation.
- Avis : tant qu’ils sont publiés, ou jusqu’à votre demande de retrait.

## Destinataires
Vos données ne sont accessibles qu’à BeAfro Coiffure & Beauté et à ses prestataires techniques (hébergement, envoi d’e-mails) qui agissent sur ses instructions. Elles ne sont ni vendues, ni utilisées à des fins publicitaires.

## Vos droits
Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, leur portabilité, la limitation du traitement, ou vous y opposer. Vous pouvez aussi retirer votre consentement à tout moment. Écrivez-nous depuis la page [Contact](/contact) : nous répondons dans un délai d’un mois.

Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL : [www.cnil.fr](https://www.cnil.fr).

## Cookies
Ce site n’utilise que des cookies techniques strictement nécessaires à son fonctionnement (session de l’espace d’administration). Il ne dépose aucun cookie de mesure d’audience ni de publicité : aucun bandeau de consentement n’est donc requis.

Certaines pages peuvent intégrer une vidéo hébergée par YouTube (mode sans cookie) ou Vimeo : ces services peuvent déposer des cookies lorsque vous lancez la lecture.`;

const TERMS = `## Objet
Les présentes conditions encadrent les réservations de prestations de coiffure et de beauté & bien-être proposées par BeAfro Coiffure & Beauté, en ligne ou directement auprès de la coiffeuse.

## Prestations et tarifs
Les prestations, leurs durées indicatives et leurs tarifs en euros figurent sur le site. Certaines prestations sont proposées sur devis : le tarif est alors confirmé avant la prestation. La durée réelle dépend de la longueur, de la densité et de l’état des cheveux. [à compléter : mention de TVA applicable]

## Réservation
Vous choisissez une ou plusieurs prestations, un créneau, puis vous renseignez vos coordonnées. Certaines prestations nécessitent une validation : la réservation est alors une demande, confirmée par la coiffeuse. Un lien personnel vous permet de consulter, d’annuler ou de demander la modification de votre rendez-vous.

## Annulation et modification
L’annulation en ligne est possible jusqu’au délai indiqué sur la page de votre rendez-vous. Au-delà, contactez-nous directement. Une modification est une demande, acceptée selon les disponibilités.

## Retard et absence
Un retard important peut raccourcir la prestation ou nécessiter un report. [à compléter : conditions en cas de retard ou d’absence sans prévenir]

## Paiement et acompte
Le règlement a lieu à l’issue de la prestation, par [à compléter : moyens de paiement acceptés]. Un acompte peut être demandé pour certaines prestations : il est alors indiqué avant la validation de la réservation.

## Droit de rétractation
Pour une réservation faite à distance, vous disposez en principe de 14 jours pour vous rétracter. En réservant un rendez-vous avant la fin de ce délai, vous demandez que la prestation commence avant son expiration ; une fois la prestation complètement exécutée, vous renoncez à votre droit de rétractation.

## Santé et allergies
Merci de nous signaler avant la prestation toute allergie, sensibilité du cuir chevelu ou traitement en cours. Le conseil beauté et bien-être ne constitue pas une prestation médicale.

## Médiation de la consommation
En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation : [à compléter : nom et coordonnées du médiateur].

## Droit applicable
Les présentes conditions sont soumises au droit français.`;

export const DEFAULT_LEGAL: Record<LegalKey, { body: string }> = {
  "legal.mentions": { body: MENTIONS },
  "legal.privacy": { body: PRIVACY },
  "legal.terms": { body: TERMS },
};
