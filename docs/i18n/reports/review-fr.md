# Cross-review report: fr

- Strings reviewed: 497
- Flagged: 13 (high: 0, medium: 6, low: 7)
- Model: gemini-pro-latest

## Flagged items

### [medium] banner.p1.pre

- source: At Better Bags, we provide a 
- translation: Chez Better Bags, nous vous proposons une solution 
- issue: When combined with the highlight 'guichet unique', the resulting phrase 'une solution guichet unique' is grammatically awkward in French. It is more natural to say 'proposons un guichet unique'.
- suggestion: Chez Better Bags, nous vous proposons un 

### [medium] costAdvantage.takeaway

- source: Trade 2 months of extra lead time for 10% lower cost — that's our value proposition for OEM buyers.
- translation: Accepter 2 mois de délai supplémentaires en échange d'un coût réduit de 10 % : voilà notre proposition de valeur pour les acheteurs OEM.
- issue: Grammar error: 'délai' is singular but 'supplémentaires' is plural. They must agree.
- suggestion: Accepter 2 mois de délai supplémentaire en échange d'un coût réduit de 10 % : voilà notre proposition de valeur pour les acheteurs OEM.

### [medium] customization.features.7.highlights.2

- source: Metal Patches
- translation: Écussons métalliques
- issue: In the bag manufacturing industry, 'metal patches' (metal logos or plates) are typically translated as 'plaques métalliques' or 'étiquettes métalliques'. 'Écussons' is almost exclusively used for embroidered or woven patches.
- suggestion: Plaques métalliques

### [medium] faq.sections.1.items.2.a

- source: We first provide an estimated quotation based on your tech pack and details. A final binding quote is issued after prototype/sample approval. Prices are quoted FOB Yangon for Myanmar bulk orders, or FOB Qingdao for sample and rush orders from our Shandong facility. CIF quotes are available on request.
- translation: Nous établissons d'abord un devis estimatif sur la base de votre Tech Pack et de vos spécifications. Le devis définitif et engageant est émis après validation du prototype ou de l'échantillon. Les prix s'entendent FOB Yangon pour les productions en série au Myanmar, et FOB Qingdao pour les échantillons et commandes urgentes issus de notre site du Shandong. Des devis CIF sont disponibles sur demande.
- issue: The phrase "devis définitif et engageant" is a literal translation of "final binding quote". In French B2B commerce, the standard terminology is "devis ferme et définitif".
- suggestion: Nous établissons d'abord un devis estimatif sur la base de votre Tech Pack et de vos spécifications. Un devis ferme et définitif est émis après validation du prototype ou de l'échantillon. Les prix s'entendent FOB Yangon pour les productions en série au Myanmar, et FOB Qingdao pour les échantillons et commandes urgentes issus de notre site du Shandong. Des devis CIF sont disponibles sur demande.

### [medium] faq.sections.1.items.3.a

- source: Payment terms are tiered: New clients pay 30% T/T deposit with the PO, with the 70% balance T/T after inspection passes. Long-term clients enjoy a credit line — T/T within 1 week of the B/L copy or pickup. For large or special orders we also accept L/C to safeguard both sides.
- translation: Nos conditions de paiement sont échelonnées : les nouveaux clients versent un acompte de 30 % par virement T/T à la commande (PO), le solde de 70 % étant réglé par T/T après réussite de l'inspection. Les clients de longue date bénéficient d'un encours de crédit : paiement par T/T sous 1 semaine à compter de la copie du B/L ou de l'enlèvement. Pour les commandes importantes ou particulières, nous acceptons également la L/C afin de sécuriser les deux parties.
- issue: "après réussite de l'inspection" is a literal translation of "after inspection passes" and sounds unnatural. "après validation de l'inspection" is the correct industry phrasing.
- suggestion: Nos conditions de paiement sont échelonnées : les nouveaux clients versent un acompte de 30 % par virement T/T à la commande (PO), le solde de 70 % étant réglé par T/T après validation de l'inspection. Les clients de longue date bénéficient d'un encours de crédit : paiement par T/T sous 1 semaine à compter de la copie du B/L ou de l'enlèvement. Pour les commandes importantes ou particulières, nous acceptons également la L/C afin de sécuriser les deux parties.

### [medium] blog.subtitle

- source: Stay updated with industry trends, customization tips, and company news
- translation: Restez informé des tendances du secteur, de nos conseils en personnalisation et des actualités de notre maison
- issue: The term 'maison' is typically used for luxury fashion houses, wineries, or heritage brands. For a B2B backpack manufacturing factory, 'entreprise' or 'société' is the correct professional register.
- suggestion: Restez informé des tendances du secteur, de nos conseils en personnalisation et des actualités de notre entreprise

### [low] whatSetsUsApart.subtitle

- source: Three operational disciplines that separate Better Bags from typical OEM factories.
- translation: Trois disciplines opérationnelles qui séparent Better Bags des usines OEM ordinaires.
- issue: The verb 'séparent' is a literal translation of 'separate' and sounds slightly unnatural in this context. 'Démarquent' or 'distinguent' is much more idiomatic for business positioning.
- suggestion: Trois disciplines opérationnelles qui démarquent Better Bags des usines OEM ordinaires.

### [low] customization.features.3.highlights.0

- source: Pantone-matched custom dyes
- translation: Teintures personnalisées calées sur nuancier Pantone
- issue: The phrase 'calées sur' is a bit colloquial for a formal B2B context.
- suggestion: Teintures sur mesure avec correspondance Pantone

### [low] faq.sections.0.items.1.a

- source: No, we are a pure OEM/ODM manufacturer and do not have our own product catalogue. All products are custom-made to client specifications.
- translation: Non, nous sommes un fabricant purement OEM/ODM et ne disposons pas de catalogue propre. Tous nos produits sont fabriqués sur mesure selon le cahier des charges de chaque client.
- issue: The phrasing 'de catalogue propre' is slightly unnatural. 'De notre propre catalogue' is much more idiomatic in French.
- suggestion: Non, nous sommes un fabricant purement OEM/ODM et ne disposons pas de notre propre catalogue. Tous nos produits sont fabriqués sur mesure selon le cahier des charges de chaque client.

### [low] faq.sections.0.items.5.q

- source: How will I know the timeline for my project?
- translation: Comment connaîtrai-je le calendrier de mon projet ?
- issue: "Comment connaîtrai-je" is grammatically correct but sounds slightly unnatural and stilted in a B2B FAQ context.
- suggestion: Comment serai-je informé du calendrier de mon projet ?

### [low] faq.sections.2.items.3.q

- source: Does the sample fee include shipping?
- translation: Les frais d'échantillon incluent-ils l'expédition ?
- issue: "frais d'échantillon" is slightly clunky. "frais d'échantillonnage" or "coûts de l'échantillon" is more natural in French.
- suggestion: Les frais d'échantillonnage incluent-ils l'expédition ?

### [low] faq.sections.2.items.3.a

- source: No, the sample fee does not cover shipping or potential third-party costs (e.g. molds, plates). Express shipping (e.g. FedEx, DHL) can be arranged at additional cost.
- translation: Non, les frais d'échantillon ne couvrent ni l'expédition ni les éventuels coûts de prestataires tiers (moules, plaques, etc.). Un envoi express (FedEx ou DHL, par exemple) peut être organisé moyennant un coût supplémentaire.
- issue: Same as the question above, "frais d'échantillon" should be adapted for better flow.
- suggestion: Non, les frais d'échantillonnage ne couvrent ni l'expédition ni les éventuels coûts de prestataires tiers (moules, plaques, etc.). Un envoi express (FedEx ou DHL, par exemple) peut être organisé moyennant un coût supplémentaire.

### [low] testimonials.items.0.quote

- source: If I had to rate them on a 10-point scale, I would give a 9. There was something small I noticed on my second visit to the Myanmar factory, but apart from that everything has been really good — more than enough for our current needs. We did run into a few challenges on the production line, but that happens at every factory; outside of those, there were no real issues. Overall, I think they are doing a solid, dependable job.
- translation: Si je devais les noter sur une échelle de 10 points, je leur donnerais un 9. J'ai remarqué un petit détail lors de ma deuxième visite de l'usine au Myanmar, mais en dehors de cela, tout s'est vraiment bien passé — plus que suffisant pour nos besoins actuels. Nous avons rencontré quelques difficultés sur la ligne de production, mais cela arrive dans toutes les usines ; en dehors de ces épisodes, il n'y a eu aucun véritable problème. Dans l'ensemble, je pense qu'ils accomplissent un travail solide et fiable.
- issue: "échelle de 10 points" is a literal translation of "10-point scale" and sounds slightly unnatural. The standard French idiom is "sur une échelle de 1 à 10" or simply "sur 10".
- suggestion: Si je devais les noter sur une échelle de 1 à 10, je leur donnerais un 9. J'ai remarqué un petit détail lors de ma deuxième visite de l'usine au Myanmar, mais en dehors de cela, tout s'est vraiment bien passé — plus que suffisant pour nos besoins actuels. Nous avons rencontré quelques difficultés sur la ligne de production, mais cela arrive dans toutes les usines ; en dehors de ces épisodes, il n'y a eu aucun véritable problème. Dans l'ensemble, je pense qu'ils accomplissent un travail solide et fiable.

