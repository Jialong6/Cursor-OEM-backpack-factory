# Cross-review report: nl

- Strings reviewed: 504
- Flagged: 14 (high: 0, medium: 8, low: 6)
- Model: gemini-pro-latest

## Flagged items

### [medium] bento.trust.more

- source: +20 more
- translation: +20 meer
- issue: '+20 meer' is a literal translation of '+20 more' and sounds unnatural in Dutch.
- suggestion: +20 andere

### [medium] about.vision.desc

- source: To be recognized worldwide as the most trusted and forward-thinking backpack manufacturing partner—setting industry benchmarks in quality, innovation, sustainability, and operational excellence, while creating lasting value for our clients, employees, communities, and the environment.
- translation: Wereldwijd erkend worden als de meest betrouwbare en vooruitstrevende productiepartner voor rugzakken — met de maatstaf in kwaliteit, innovatie, duurzaamheid en operationele excellentie, en blijvende waarde voor onze klanten, medewerkers, gemeenschappen en het milieu.
- issue: The phrase 'met de maatstaf in kwaliteit' is an unnatural translation of 'setting industry benchmarks in quality'. It literally means 'with the benchmark'. Also, 'creating lasting value' is translated as a noun phrase 'en blijvende waarde' which breaks the flow.
- suggestion: Wereldwijd erkend worden als de meest betrouwbare en vooruitstrevende productiepartner voor rugzakken — die de maatstaf zet in kwaliteit, innovatie, duurzaamheid en operationele excellentie, en blijvende waarde creëert voor onze klanten, medewerkers, gemeenschappen en het milieu.

### [medium] about.values.0.desc

- source: We conduct our business with honesty, accountability, and the highest ethical standards—building trust with every commitment to our customers, employees, and partners.
- translation: Wij werken eerlijk, aanspreekbaar en volgens de hoogste ethische normen — en bouwen zo met elke afspraak vertrouwen op bij klanten, medewerkers en partners.
- issue: The word 'accountability' is translated as 'aanspreekbaar' (approachable/responsive). In a corporate context, 'verantwoordelijk' or 'met verantwoordelijkheidsgevoel' is the correct term for accountability.
- suggestion: Wij werken eerlijk, met verantwoordelijkheidsgevoel en volgens de hoogste ethische normen — en bouwen zo met elke afspraak vertrouwen op bij klanten, medewerkers en partners.

### [medium] customization.features.0.highlights.3

- source: Multi-functional, Eco-friendly, Fishing, Accessories
- translation: Multifunctioneel, duurzaam, vissen, accessoires
- issue: The word 'vissen' translates to the verb 'fishing' or the plural noun 'fishes', which sounds unnatural in a list of bag categories. The standard Dutch B2B/retail term for this category is 'hengelsport'.
- suggestion: Multifunctioneel, duurzaam, hengelsport, accessoires

### [medium] faq.sections.2.items.0.a

- source: Most orders go through 1–2 sample revisions (e.g. 2nd / 3rd sample) before the PP sample is approved and bulk production is scheduled; additional revision packages can be arranged as needed.
- translation: De meeste orders doorlopen 1–2 samplerevisies (bijv. 2e/3e sample) voordat de PP Sample wordt goedgekeurd en de bulkproductie wordt ingepland; extra revisierondes zijn in overleg mogelijk.
- issue: Incorrect article and spacing/capitalization. 'Sample' is a neuter noun ('het'), and Dutch spelling rules dictate that English compound nouns should be written with a hyphen if it's an abbreviation + word ('PP-sample').
- suggestion: De meeste orders doorlopen 1–2 samplerevisies (bijv. 2e/3e sample) voordat het PP-sample wordt goedgekeurd en de bulkproductie wordt ingepland; extra revisierondes zijn in overleg mogelijk.

### [medium] faq.sections.2.items.4.a

- source: Yes, a PP sample must be formally approved by you before mass production begins.
- translation: Ja, de PP Sample moet formeel door u zijn goedgekeurd voordat de massaproductie start.
- issue: Incorrect article and spacing/capitalization for 'PP Sample'. It should be 'het PP-sample'.
- suggestion: Ja, het PP-sample moet formeel door u zijn goedgekeurd voordat de massaproductie start.

### [medium] faq.sections.3.items.3.a

- source: Standard bulk lead time is about 3 months from PP sample approval to factory completion, including overseas material sourcing and Myanmar production scheduling. Consolidation delays and production-queue timing may extend this on a per-project basis.
- translation: De standaard levertijd voor bulk is circa 3 maanden, van goedkeuring van de PP Sample tot gereed af fabriek, inclusief internationale materiaalinkoop en productieplanning in Myanmar. Consolidatievertragingen en de productiewachtrij kunnen dit per project verlengen.
- issue: Incorrect article and spacing/capitalization for 'PP Sample'. It should be 'het PP-sample'.
- suggestion: De standaard levertijd voor bulk is circa 3 maanden, van goedkeuring van het PP-sample tot gereed af fabriek, inclusief internationale materiaalinkoop en productieplanning in Myanmar. Consolidatievertragingen en de productiewachtrij kunnen dit per project verlengen.

### [medium] languageBanner.message

- source: You have been automatically redirected to the {language} version
- translation: U bent automatisch doorgestuurd naar de {language} versie
- issue: Variable interpolation issue: If {language} is a noun like 'Nederlands' or 'Engels', 'de {language} versie' results in grammatically incorrect Dutch (e.g., 'de Nederlands versie' instead of 'de Nederlandse versie'). Rewording avoids this inflection problem.
- suggestion: U bent automatisch doorgestuurd naar de versie in het {language}

### [low] bento.brand.subtitle

- source: #Top Tier Custom Backpacks Factory in Myanmar
- translation: #Toonaangevende fabriek voor maatwerk rugzakken in Myanmar
- issue: Incorrect spacing in 'maatwerk rugzakken' (Engelse ziekte). In Dutch, compound nouns should be written as a single word.
- suggestion: #Toonaangevende fabriek voor maatwerkrugzakken in Myanmar

### [low] banner.line2

- source: #Top Tier Custom Backpacks Factory in Myanmar
- translation: #Toonaangevende rugzakkenfabriek voor maatwerk in Myanmar
- issue: 'rugzakkenfabriek voor maatwerk' is slightly clunky. 'fabriek voor maatwerkrugzakken' is more natural and consistent with the rest of the copy.
- suggestion: #Toonaangevende fabriek voor maatwerkrugzakken in Myanmar

### [low] features.list.0.desc

- source: With production bases in both Shandong (Rizhao), China and Yangon, Myanmar — supported by a dedicated sampling and development center in Qingdao — we offer unparalleled flexibility to meet our customers' diverse needs. Our Myanmar factory is fully equipped to handle large-volume production with speed and efficiency, while our long-established Shandong operation (20+ years of expertise) excels at design, sampling, sourcing, and personalized project management. Whether you need rapid prototyping, small custom batches, or are scaling up to large bulk orders, our dual-factory model ensures your requirements are fulfilled with agility and precision.
- translation: Met productielocaties in Shandong (Rizhao), China en Yangon, Myanmar — plus een eigen sample- en ontwikkelcentrum in Qingdao — spelen wij flexibel in op uiteenlopende wensen. Onze fabriek in Myanmar is volledig ingericht op snelle en efficiënte productie van grote volumes, terwijl onze vestiging in Shandong (20+ jaar ervaring) sterk is in ontwerp, bemonstering, inkoop en persoonlijk projectmanagement. Of u nu snel een prototype nodig heeft, kleine maatwerkseries of grote bulkorders: ons model met twee fabrieken levert wendbaar en precies.
- issue: The phrase 'levert wendbaar en precies' at the end of the sentence is grammatically awkward in Dutch. 'Leveren' does not pair naturally with 'wendbaar' as an adverb in this context. The source says 'ensures your requirements are fulfilled with agility and precision'.
- suggestion: Met productielocaties in Shandong (Rizhao), China en Yangon, Myanmar — plus een eigen sample- en ontwikkelcentrum in Qingdao — spelen wij flexibel in op de uiteenlopende wensen van onze klanten. Onze fabriek in Myanmar is volledig ingericht op snelle en efficiënte productie van grote volumes, terwijl onze vestiging in Shandong (20+ jaar ervaring) sterk is in ontwerp, bemonstering, inkoop en persoonlijk projectmanagement. Of u nu snel een prototype nodig heeft, kleine maatwerkseries of grote bulkorders: ons model met twee fabrieken zorgt ervoor dat we flexibel en nauwkeurig aan uw eisen kunnen voldoen.

### [low] faq.sections.1.items.2.a

- source: We first provide an estimated quotation based on your tech pack and details. A final binding quote is issued after prototype/sample approval. Prices are quoted FOB Yangon for Myanmar bulk orders, or FOB Qingdao for sample and rush orders from our Shandong facility. CIF quotes are available on request.
- translation: Eerst geven wij een indicatieve offerte op basis van uw tech pack en gegevens. De definitieve, bindende offerte volgt na goedkeuring van het prototype of de sample. Prijzen zijn FOB Yangon voor bulkorders uit Myanmar, of FOB Qingdao voor sample- en spoedorders uit onze vestiging in Shandong. CIF-offertes zijn op aanvraag beschikbaar.
- issue: In Dutch, the English loanword 'sample' is a neuter noun, so it should be 'het sample' instead of 'de sample'.
- suggestion: Eerst geven wij een indicatieve offerte op basis van uw tech pack en gegevens. De definitieve, bindende offerte volgt na goedkeuring van het prototype of het sample. Prijzen zijn FOB Yangon voor bulkorders uit Myanmar, of FOB Qingdao voor sample- en spoedorders uit onze vestiging in Shandong. CIF-offertes zijn op aanvraag beschikbaar.

### [low] blogDetail.cta.title

- source: Ready to Start Your Custom Backpack Project?
- translation: Klaar om uw eigen rugzakproject te starten?
- issue: The word 'Custom' is translated as 'eigen' (own). While natural, it slightly loses the specific B2B manufacturing emphasis on 'customization' (maatwerk).
- suggestion: Klaar om uw maatwerk rugzakproject te starten? / Klaar om uw rugzakproject op maat te starten?

### [low] metadata.home.description

- source: Top-tier custom backpack manufacturer in Myanmar. 20+ years of experience, 600+ employees, primarily serving Japanese brands.
- translation: Toonaangevende fabrikant van maatwerk rugzakken in Myanmar. 20+ jaar ervaring, 600+ medewerkers, voornamelijk voor Japanse merken.
- issue: Incorrect spacing in compound noun (Engelse ziekte). In Dutch, 'maatwerk' and 'rugzakken' should be written as a single word.
- suggestion: Toonaangevende fabrikant van maatwerkrugzakken in Myanmar. 20+ jaar ervaring, 600+ medewerkers, voornamelijk voor Japanse merken.

