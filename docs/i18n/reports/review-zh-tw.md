# Cross-review report: zh-tw

- Strings reviewed: 466
- Flagged: 48 (high: 4, medium: 14, low: 30)
- Model: gemini-pro-latest

## Flagged items

### [high] features.stats.1.label

- source: Low MOQ
- translation: 最低訂購量
- issue: The terminology sheet explicitly states never to translate industry abbreviations such as 'MOQ'.
- suggestion: 低 MOQ

### [high] metadata.home.title

- source: Better Bags Myanmar - Premium OEM Backpack Factory
- translation: Better Bags 緬甸 - 高品質後背包 OEM 代工廠
- issue: According to the terminology sheet, the brand name 'Better Bags Myanmar' must not be translated. 'Better Bags 緬甸' violates this rule.
- suggestion: Better Bags Myanmar - 高品質後背包 OEM 代工廠

### [high] metadata.blogList.title

- source: Blog - Better Bags Myanmar | Industry Insights
- translation: 部落格 - Better Bags 緬甸 | 產業洞察
- issue: According to the terminology sheet, the brand name 'Better Bags Myanmar' must not be translated.
- suggestion: 部落格 - Better Bags Myanmar | 產業洞察

### [high] metadata.blogList.description

- source: Explore backpack manufacturing insights, industry trends, and sustainability practices from Better Bags Myanmar.
- translation: 探索 Better Bags 緬甸的後背包製造洞察、產業趨勢與永續實踐。
- issue: According to the terminology sheet, the brand name 'Better Bags Myanmar' must not be translated.
- suggestion: 探索 Better Bags Myanmar 的後背包製造洞察、產業趨勢與永續實踐。

### [medium] whatSetsUsApart.items.2.title

- source: Capacity-Locked 4-Month Lead Time
- translation: 固定生產週期
- issue: Factual drift: The translation omits the specific timeframe "4-Month" and the concept of "Capacity-Locked" from the source text.
- suggestion: 鎖定產能的 4 個月交期

### [medium] marketPositioning.quadrants.0.description

- source: Cost-efficient Myanmar production paired with Japanese-grade QC — high margins, low risk, scalable bulk orders.
- translation: 兼顧製造成本與日式品管，讓您以高利潤、低風險放心承接大單。
- issue: Factual drift: The translation omits "Myanmar production" (緬甸生產), which is a key selling point in the source text.
- suggestion: 具成本優勢的緬甸生產搭配日式品管，讓您以高利潤、低風險放心承接大單。

### [medium] faq.sections.2.items.1.q

- source: What is your lead time for sample/prototype production?
- translation: 樣品/原型的製作週期多久？
- issue: The terminology sheet specifies "lead time" as "交期". The translation uses "製作週期" (production cycle) and the phrasing "多久" is slightly informal.
- suggestion: Change to "樣品/原型的交期需要多久？" to align with the terminology sheet and improve the professional tone.

### [medium] glossary.terms.bom.definition

- source: A comprehensive list of all raw materials, components, and hardware needed to manufacture a product, including quantities and specifications.
- translation: 製造產品所需的所有原物料、部件與五金配件的完整清單,包含數量與規格。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 製造產品所需的所有原物料、部件與五金配件的完整清單，包含數量與規格。

### [medium] glossary.terms.ykk.definition

- source: The world's largest zipper manufacturer, headquartered in Japan. YKK zippers are considered the industry standard for quality and reliability in bag manufacturing.
- translation: 全球最大的拉鍊製造商,總部位於日本。YKK 拉鍊被視為袋包製造中品質與可靠性的業界標準。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 全球最大的拉鍊製造商，總部位於日本。YKK 拉鍊被視為袋包製造中品質與可靠性的業界標準。

### [medium] glossary.terms.pantone.definition

- source: A standardized color matching system used worldwide to ensure consistent color reproduction across different materials and production runs.
- translation: 全球通用的標準化色彩比對系統,用於確保不同材質與生產批次之間的顏色一致性。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 全球通用的標準化色彩比對系統，用於確保不同材質與生產批次之間的顏色一致性。

### [medium] glossary.terms.grs.definition

- source: An international certification that verifies recycled content in products and tracks the supply chain from recycled input to finished product.
- translation: 一項國際認證,用於驗證產品中的回收成分含量,並追蹤從回收原料到成品的完整供應鏈。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 一項國際認證，用於驗證產品中的回收成分含量，並追蹤從回收原料到成品的完整供應鏈。

### [medium] glossary.terms.oeko-tex.definition

- source: An independent testing and certification system for textile products at all stages of production, ensuring they are free from harmful substances.
- translation: 針對各生產階段紡織品的獨立檢測與認證系統,確保產品不含有害物質。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 針對各生產階段紡織品的獨立檢測與認證系統，確保產品不含有害物質。

### [medium] glossary.terms.cif.definition

- source: A shipping term where the seller covers the cost of goods, insurance, and freight charges to deliver products to the buyer's designated port.
- translation: 一種國際貿易條件,由賣方負擔貨物成本、保險與運費,將產品運送至買方指定港口。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 一種國際貿易條件，由賣方負擔貨物成本、保險與運費，將產品運送至買方指定港口。

### [medium] glossary.terms.exw.definition

- source: A shipping term where the buyer is responsible for all transportation costs and risks from the manufacturer's facility to the final destination.
- translation: 一種國際貿易條件,由買方自行承擔自製造商工廠至最終目的地的全部運輸成本與風險。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 一種國際貿易條件，由買方自行承擔自製造商工廠至最終目的地的全部運輸成本與風險。

### [medium] glossary.terms.pp-sample.definition

- source: A sample produced before mass production begins to verify design, materials, and construction. Must be approved by the buyer before production starts.
- translation: 量產前製作的樣品,用於確認設計、材質與結構。須經買方核可後,方可正式進入量產。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 量產前製作的樣品，用於確認設計、材質與結構。須經買方核可後，方可正式進入量產。

### [medium] glossary.terms.top-sample.definition

- source: A sample pulled from the actual production line during manufacturing to verify that quality and specifications match the approved PP sample.
- translation: 量產期間自實際產線抽取的樣品,用於確認品質與規格是否與已核可的 PP 樣品一致。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 量產期間自實際產線抽取的樣品，用於確認品質與規格是否與已核可的 PP 樣品一致。

### [medium] glossary.terms.tpu.definition

- source: A flexible, durable plastic material used for waterproof coatings, labels, and patches on backpacks. Known for its excellent abrasion and weather resistance.
- translation: 一種柔韌且耐用的塑膠材料,用於後背包的防水塗層、標籤與貼片,以優異的耐磨性與耐候性著稱。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 一種柔韌且耐用的塑膠材料，用於後背包的防水塗層、標籤與貼片，以優異的耐磨性與耐候性著稱。

### [medium] metadata.home.description

- source: Top-tier custom backpack manufacturer in Myanmar. 20+ years of experience, 600+ employees, primarily serving Japanese brands.
- translation: 緬甸頂級客製化後背包製造商。20+ 年經驗、600+ 名專業員工，長期服務日本與多國品牌。
- issue: Factual drift: 'primarily serving Japanese brands' was translated to '長期服務日本與多國品牌' (serving Japanese and multi-national brands), which adds unverified information not present in the source text.
- suggestion: 緬甸頂級客製化後背包製造商。擁有 20+ 年經驗、600+ 名員工，主要服務日本品牌。

### [low] costAdvantage.title

- source: Why Myanmar: The Cost-vs-Lead-Time Sweet Spot
- translation: 為何選擇緬甸:成本與交期的最佳平衡
- issue: Uses a half-width colon instead of a full-width colon, which violates Traditional Chinese punctuation conventions.
- suggestion: 為何選擇緬甸：成本與交期的最佳平衡

### [low] costAdvantage.subtitle

- source: Same product, same destination (Japan). Different trade-offs. See how our Myanmar production stacks up against China and Vietnam.
- translation: 同樣的產品,同樣外銷日本,取捨卻不相同。看看緬甸生產與中國、越南的比較。
- issue: Uses half-width commas instead of full-width commas.
- suggestion: 同樣的產品，同樣外銷日本，取捨卻不相同。看看緬甸生產與中國、越南的比較。

### [low] costAdvantage.countries.2.name

- source: Myanmar (Better Bags)
- translation: 緬甸(Better Bags)
- issue: Uses half-width parentheses. In Traditional Chinese typography, full-width parentheses are standard.
- suggestion: 緬甸（Better Bags）

### [low] costAdvantage.takeaway

- source: Trade 2 months of extra lead time for 10% lower cost — that's our value proposition for OEM buyers.
- translation: 以多 2 個月的交期,換取 10% 的成本節省——這正是我們為 OEM 代工客戶提供的核心價值。
- issue: Uses a half-width comma instead of a full-width comma.
- suggestion: 以多 2 個月的交期，換取 10% 的成本節省——這正是我們為 OEM 代工客戶提供的核心價值。

### [low] customization.features.4.highlights.3

- source: Graphics, taglines, custom artwork
- translation: 圖案、標語、客製藝術設計
- issue: 「客製藝術設計」為「custom artwork」的直譯。在製造業與印刷業中，「artwork」通常指「圖稿」或「設計圖」。
- suggestion: 圖案、標語、客製圖稿

### [low] customization.features.7.desc

- source: Fully customizable branding—even for private label requirements.
- translation: 全方位可客製的品牌方案——完整滿足私有品牌 (Private Label) 需求。
- issue: Inconsistent terminology. The title uses "自有品牌" for Private Label, but the description uses "私有品牌". In Taiwan, "自有品牌" is the standard and more natural B2B term.
- suggestion: 全方位可客製的品牌方案——完整滿足自有品牌 (Private Label) 需求。

### [low] faq.sections.1.items.2.q

- source: How is your quotation process structured?
- translation: 你們的報價流程是怎樣的？
- issue: The phrasing "是怎樣的" is slightly colloquial for a formal B2B website.
- suggestion: Change to "你們的報價流程為何？" or "你們的報價流程是如何進行的？" for a more professional tone.

### [low] contact.subtitle

- source: Ready to Start Your Backpack Project?
- translation: 準備好啟動您的後背包專案了嗎?
- issue: Uses a half-width question mark instead of the standard full-width question mark for Traditional Chinese.
- suggestion: 準備好啟動您的後背包專案了嗎？

### [low] contact.intro

- source: Fill out the form below and we'll get back to you within 24 hours. For urgent inquiries, call or WhatsApp us directly.
- translation: 請填寫下方表單,我們將於24小時內回覆。如需緊急洽詢,歡迎直接來電,或透過WhatsApp與我們聯絡。
- issue: Uses half-width commas instead of standard full-width commas for Traditional Chinese. Missing spaces around numbers and English words for better typography.
- suggestion: 請填寫下方表單，我們將於 24 小時內回覆。如需緊急洽詢，歡迎直接來電，或透過 WhatsApp 與我們聯絡。

### [low] contact.form.phoneNumber.label

- source: Phone Number (Optional)
- translation: 電話號碼(選填)
- issue: Uses half-width parentheses which violates Traditional Chinese typography conventions.
- suggestion: 電話號碼（選填）

### [low] contact.form.subject.placeholder

- source: e.g. Custom Travel Backpack Inquiry
- translation: 例如:客製化旅行後背包詢價
- issue: Uses a half-width colon which violates Traditional Chinese typography conventions.
- suggestion: 例如：客製化旅行後背包詢價

### [low] contact.form.message.label

- source: Your Message (Optional)
- translation: 您的訊息(選填)
- issue: Uses half-width parentheses, which violates Traditional Chinese (Taiwan) typography conventions.
- suggestion: 您的訊息（選填）

### [low] contact.form.message.placeholder

- source: Please describe your project needs, target quantity, timeline, and any special requirements...
- translation: 請說明您的專案需求、目標數量、時程,以及任何特殊要求...
- issue: Uses a half-width comma instead of a full-width comma.
- suggestion: 請說明您的專案需求、目標數量、時程，以及任何特殊要求...

### [low] contact.form.orderQuantity.label

- source: Estimated Order Quantity (per design)
- translation: 預計訂單數量(每款設計)
- issue: Uses half-width parentheses.
- suggestion: 預計訂單數量（每款設計）

### [low] contact.form.techPackAvailability.label

- source: Do you have a tech pack or reference sample?
- translation: 您是否已有 Tech Pack(技術規格書)或參考樣品?
- issue: Uses half-width parentheses and a half-width question mark.
- suggestion: 您是否已有 Tech Pack（技術規格書）或參考樣品？

### [low] contact.form.techPackAvailability.optionLabels.0

- source: Yes, I have a tech pack
- translation: 是,我已有 Tech Pack
- issue: Uses a half-width comma.
- suggestion: 是，我已有 Tech Pack

### [low] contact.form.fileUpload.label

- source: Upload Files (Optional)
- translation: 上傳檔案(選填)
- issue: Uses half-width parentheses.
- suggestion: 上傳檔案（選填）

### [low] contact.form.fileUpload.description

- source: Upload tech packs, sketches, or sample photos. Max 5 files, 10MB each.
- translation: 可上傳 Tech Pack、草圖或樣品照片。最多5個檔案,每個檔案上限10MB。
- issue: Uses a half-width comma and lacks spacing around numbers.
- suggestion: 可上傳 Tech Pack、草圖或樣品照片。最多 5 個檔案，每個檔案上限 10MB。

### [low] contact.form.fileUpload.acceptedFormats

- source: Accepted formats: JPG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- translation: 支援格式:JPG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- issue: Uses a half-width colon.
- suggestion: 支援格式：JPG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

### [low] contact.form.fileUpload.errors.tooLarge

- source: File "{name}" is too large. Maximum size is {maxMb}MB
- translation: 檔案「{name}」過大,單一檔案上限 {maxMb}MB
- issue: Uses a half-width comma.
- suggestion: 檔案「{name}」過大，單一檔案上限 {maxMb}MB

### [low] contact.form.fileUpload.errors.unsupportedType

- source: File "{name}" has an unsupported type. Please upload images or documents.
- translation: 檔案「{name}」格式不支援,請上傳圖片或文件檔案。
- issue: Uses a half-width comma.
- suggestion: 檔案「{name}」格式不支援，請上傳圖片或文件檔案。

### [low] contact.form.fileUpload.errors.uploadFailed

- source: Some files failed to upload. Please remove them and try again.
- translation: 部分檔案上傳失敗,請移除後再試一次。
- issue: Uses a half-width comma.
- suggestion: 部分檔案上傳失敗，請移除後再試一次。

### [low] glossary.terms.bom.term

- source: BOM (Bill of Materials)
- translation: BOM(物料清單)
- issue: Uses half-width parentheses without spaces, which violates Traditional Chinese typography conventions. Full-width parentheses should be used.
- suggestion: BOM（物料清單）

### [low] glossary.terms.pantone.term

- source: Pantone (PMS)
- translation: Pantone(PMS 色票)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: Pantone（PMS 色票）

### [low] glossary.terms.grs.term

- source: GRS (Global Recycled Standard)
- translation: GRS(全球回收標準)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: GRS（全球回收標準）

### [low] glossary.terms.cif.term

- source: CIF (Cost, Insurance, and Freight)
- translation: CIF(含運保費價)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: CIF（含運保費價）

### [low] glossary.terms.exw.term

- source: EXW (Ex Works)
- translation: EXW(工廠交貨價)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: EXW（工廠交貨價）

### [low] glossary.terms.pp-sample.term

- source: PP Sample (Pre-Production Sample)
- translation: PP Sample(產前樣品)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: PP Sample（產前樣品）

### [low] glossary.terms.top-sample.term

- source: TOP Sample (Top of Production Sample)
- translation: TOP Sample(產中樣品)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: TOP Sample（產中樣品）

### [low] glossary.terms.tpu.term

- source: TPU (Thermoplastic Polyurethane)
- translation: TPU(熱塑性聚氨酯)
- issue: Uses half-width parentheses without spaces. Full-width parentheses should be used.
- suggestion: TPU（熱塑性聚氨酯）

