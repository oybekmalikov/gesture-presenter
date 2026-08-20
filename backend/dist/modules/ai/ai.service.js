"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const response_1 = require("../../common/response");
let AiService = AiService_1 = class AiService {
    config;
    logger = new common_1.Logger(AiService_1.name);
    constructor(config) {
        this.config = config;
    }
    async generateOutline(dto) {
        const lang = dto.language || 'uz';
        const slideCount = dto.slideCount || 8;
        const audience = dto.targetAudience || (lang === 'ru' ? 'Специалисты предприятия' : 'Korxona mutaxassislari');
        const externalResult = await this.callExternalLlmForJson(`Quyidagi mavzu bo'yicha professional taqdimot rejasi (outline) yarat:
      Mavzu: ${dto.topic}
      Auditoriya: ${audience}
      Slaydlar soni: ${slideCount}
      Til: ${lang}
      Qo'shimcha izoh: ${dto.additionalNotes || 'yo`q'}
      
      JSON formatida qaytar: { title, targetAudience, estimatedMinutes, sections: [{ sectionTitle, description, subtopics: [] }], suggestedTags: [] }`);
        if (externalResult) {
            return (0, response_1.successResponse)(externalResult, response_1.MESSAGES.FETCHED);
        }
        const outline = this.buildSemanticOutline(dto.topic, audience, slideCount, lang);
        return (0, response_1.successResponse)(outline, {
            uz: 'Taqdimot rejasi muvaffaqiyatli generatsiya qilindi',
            ru: 'План презентации успешно сгенерирован',
        });
    }
    async generateSlides(dto) {
        const lang = dto.language || 'uz';
        const slideCount = dto.slideCount || (dto.outline?.length ? dto.outline.length : 6);
        const style = dto.style || 'corporate';
        const externalResult = await this.callExternalLlmForJson(`Quyidagi mavzu bo'yicha ${slideCount} ta slayd uchun to'liq kontent yarat:
      Mavzu: ${dto.topic}
      Uslub: ${style}
      Til: ${lang}
      Reja bandlari: ${dto.outline ? dto.outline.join(', ') : 'avtomatik'}
      
      JSON formatida qaytar: { slides: [{ slideNumber, title, keyPoints: [], speakerNotes, visualSuggestion }] }`);
        if (externalResult?.slides) {
            return (0, response_1.successResponse)({ topic: dto.topic, slides: externalResult.slides }, response_1.MESSAGES.FETCHED);
        }
        const slides = this.buildSemanticSlides(dto.topic, slideCount, lang, dto.outline);
        return (0, response_1.successResponse)({ topic: dto.topic, slides }, {
            uz: 'Slaydlar kontenti muvaffaqiyatli yaratildi',
            ru: 'Контент слайдов успешно сгенерирован',
        });
    }
    async generateMeta(dto) {
        const lang = dto.language || 'uz';
        const externalResult = await this.callExternalLlmForJson(`Quyidagi taqdimot uchun qisqa va qiziqarli tavsif (description), 5 ta hashtag/tag va 3 ta asosiy xulosa yarat:
      Sarlavha: ${dto.title}
      Mavjud matn: ${dto.content || ''}
      Til: ${lang}
      
      JSON format: { description, tags: [], keyTakeaways: [] }`);
        if (externalResult) {
            return (0, response_1.successResponse)(externalResult, response_1.MESSAGES.FETCHED);
        }
        const meta = this.buildSemanticMeta(dto.title, dto.content, lang);
        return (0, response_1.successResponse)(meta, {
            uz: 'Seminar tavsifi va teglari yaratildi',
            ru: 'Описание и теги семинара успешно созданы',
        });
    }
    async askAssistant(dto) {
        const externalResult = await this.callExternalLlmForText(`Siz Olmaliq KMK ning ichki taqdimotlar platformasi bo'yicha professional AI-yordamchisisiz.
      Foydalanuvchi savoli: ${dto.prompt}
      Qo'shimcha kontekst: ${dto.context || 'Mavjud emas'}`);
        if (externalResult) {
            return (0, response_1.successResponse)({
                answer: externalResult,
                relatedSuggestions: [
                    'Ushbu mavzuda slaydlar rejasini tuzish',
                    'Seminar tavsifi va teglarini yaratish',
                    '3D model yoki PDF fayllar qo`shish',
                ],
            }, response_1.MESSAGES.FETCHED);
        }
        const answer = this.buildSemanticChatAnswer(dto.prompt);
        return (0, response_1.successResponse)(answer, {
            uz: 'Javob muvaffaqiyatli tayyorlandi',
            ru: 'Ответ успешно подготовлен',
        });
    }
    getTemplates() {
        const templates = [
            {
                id: 'tech_innovation',
                titleUz: 'Texnologik Innovatsiya va Avtomatlashtirish',
                titleRu: 'Технологические Инновации и Автоматизация',
                descriptionUz: 'Ishlab chiqarish jarayonlarini raqamlashtirish, yangi uskunalar joriy etish va samaradorlikni oshirish loyihalari uchun.',
                descriptionRu: 'Для проектов цифровизации, внедрения нового оборудования и повышения эффективности производства.',
                slideCount: 8,
                tags: ['#innovatsiya', '#avtomatlashtirish', '#okmk', '#texnologiya'],
            },
            {
                id: 'safety_first',
                titleUz: 'Mehnat Muhofazasi va Sanoat Xavfsizligi',
                titleRu: 'Охрана Труда и Промышленная Безопасность',
                descriptionUz: 'Xavfsiz mehnat sharoitlari, PPE vositalari, xavf-xatarlarni baholash va favqulodda holatlar yo`riqnomasi.',
                descriptionRu: 'Безопасные условия труда, средства СИЗ, оценка рисков и регламенты действий в ЧС.',
                slideCount: 7,
                tags: ['#xavfsizlik', '#mehnat_muhofazasi', '#ppe', '#okmk_safety'],
            },
            {
                id: 'quarterly_report',
                titleUz: 'Choraklik Hisobot va KPI Ko`rsatkichlari',
                titleRu: 'Квартальный Отчёт и Показатели KPI',
                descriptionUz: 'Bo`lim yoki boshqarma faoliyatining rejali va amaldagi natijalari, grafiklar, byudjet va istiqboldagi rejalar.',
                descriptionRu: 'Плановые и фактические результаты подразделения, графики, бюджет и планы на будущее.',
                slideCount: 10,
                tags: ['#hisobot', '#kpi', '#statistika', '#rejalar'],
            },
            {
                id: 'mining_metallurgy',
                titleUz: 'Kon-metallurgiya Jarayonlari Tahlili',
                titleRu: 'Анализ Горно-металлургических Процессов',
                descriptionUz: 'Ruda qazib olish, boyitish fabrikasi, metallurgiya sexlari ish faoliyati va modellar ko`rgazmasi.',
                descriptionRu: 'Добыча руды, обогатительная фабрика, металлургические цеха и 3D демонстрация оборудования.',
                slideCount: 9,
                tags: ['#metallurgiya', '#konchilik', '#boyitish', '#3d_model'],
            },
        ];
        return (0, response_1.successResponse)(templates, response_1.MESSAGES.FETCHED);
    }
    buildSemanticOutline(topic, audience, slideCount, lang) {
        const isRu = lang === 'ru';
        const isEn = lang === 'en';
        const tags = this.extractTagsFromTopic(topic);
        const sections = isRu
            ? [
                {
                    sectionTitle: '1. Введение и Актуальность',
                    description: `Цели презентации по теме "${topic}" и предпосылки внедрения на предприятии`,
                    subtopics: ['Текущее состояние', 'Ключевые вызовы и цели', 'Ожидаемые результаты'],
                },
                {
                    sectionTitle: '2. Анализ и Текущие Показатели',
                    description: 'Технические и производственные данные, статистика процессов',
                    subtopics: ['Статистика за отчётный период', 'Сравнительный анализ', 'Узкие места и потенциал'],
                },
                {
                    sectionTitle: '3. Предлагаемое Решение / Методология',
                    description: 'Пошаговый план внедрения, технологическая схема и регламенты',
                    subtopics: ['Архитектура решения', 'Внедрение и этапы', 'Ресурсы и ответственные'],
                },
                {
                    sectionTitle: '4. Экономический Эффект и Безопасность',
                    description: 'Оценка затрат, окупаемости, экологических и safety стандартов',
                    subtopics: ['ROI и снижение издержек', 'Соответствие стандартам', 'Минимизация рисков'],
                },
                {
                    sectionTitle: '5. Выводы и Вопросы',
                    description: 'Итоговые рекомендации, дорожная карта и ответы на вопросы',
                    subtopics: ['Дорожная карта на следующий квартал', 'Контакты и рабочая группа', 'Сессия вопросов и ответов'],
                },
            ]
            : [
                {
                    sectionTitle: '1. Kirish va Dolzarblik',
                    description: `"${topic}" mavzusining korxonadagi ahamiyati va asosiy maqsadlari`,
                    subtopics: ['Hozirgi holat tahlili', 'Asosiy muammo va ehtiyojlar', 'Kutilayotgan natijalar'],
                },
                {
                    sectionTitle: '2. Tahlil va Amaldagi Ko`rsatkichlar',
                    description: 'Ishlab chiqarish va texnik ko`rsatkichlar tahlili',
                    subtopics: ['Statistik ma`lumotlar', 'Taqqoslash va xulosalar', 'Rivojlantirish imkoniyatlari'],
                },
                {
                    sectionTitle: '3. Taklif Etilayotgan Yechim va Texnologiya',
                    description: 'Bosqichma-bosqich tatbiq etish rejasi va texnik yechimlar',
                    subtopics: ['Yechim arxitekturasi', 'Amalga oshirish bosqichlari', 'Zarur resurslar va muddatlar'],
                },
                {
                    sectionTitle: '4. Iqtisodiy Samaradorlik va Xavfsizlik',
                    description: 'Xarajatlar, tejamkorlik va sanoat xavfsizligi talablari',
                    subtopics: ['Kutilayotgan iqtisodiy samara', 'Xavfsizlik choralari', 'Xatarlarni kamaytirish'],
                },
                {
                    sectionTitle: '5. Xulosa va Savol-Javob',
                    description: 'Amaliy takliflar, yo`l xaritasi va yakuniy xulosalar',
                    subtopics: ['Keyingi chorak yo`l xaritasi', 'Murojaat va mas`ullar', 'Savol-javob sessiyasi'],
                },
            ];
        return {
            title: topic,
            targetAudience: audience,
            estimatedMinutes: Math.round(slideCount * 2.5),
            sections,
            suggestedTags: tags,
        };
    }
    buildSemanticSlides(topic, slideCount, lang, customOutline) {
        const isRu = lang === 'ru';
        const slides = [];
        const defaultTitlesUz = [
            `Kirish: ${topic}`,
            'Mavzuning Dolzarbligi va Asosiy Muammolar',
            'Amaldagi Holat va Tahliliy Ma`lumotlar',
            'Taklif Qilinayotgan Innovatsion Yechim',
            'Texnologik Jarayon va Sxema',
            'Iqtisodiy Samaradorlik va KPI O`sishi',
            'Sanoat Xavfsizligi va Nazorat Tizimi',
            'Kelgusi Rejalar va Xulosalar',
        ];
        const defaultTitlesRu = [
            `Введение: ${topic}`,
            'Актуальность и Ключевые Проблемы',
            'Текущее Состояние и Аналитические Данные',
            'Предлагаемое Инновационное Решение',
            'Технологический Процесс и Схема',
            'Экономическая Эффективность и Рост KPI',
            'Промышленная Безопасность и Контроль',
            'Дальнейшие Планы и Заключение',
        ];
        const titles = customOutline && customOutline.length > 0
            ? customOutline
            : (isRu ? defaultTitlesRu : defaultTitlesUz);
        const actualCount = Math.min(slideCount, titles.length);
        for (let i = 0; i < actualCount; i++) {
            const slideNum = i + 1;
            const title = titles[i] || (isRu ? `Слайд ${slideNum}` : `${slideNum}-slayd`);
            if (isRu) {
                slides.push({
                    slideNumber: slideNum,
                    title,
                    keyPoints: [
                        `Ключевой аспект: базовый фактор реализации по разделу "${title}"`,
                        'Оптимизация производственных ресурсов и времени исполнения',
                        'Контрольные индикаторы качества и показатели эффективности',
                    ],
                    speakerNotes: `Уважаемые коллеги! В данном слайде акцентируем внимание на практических результатах внедрения по теме ${topic}.`,
                    visualSuggestion: slideNum === 1
                        ? 'Титульный слайд с логотипом предприятия и 3D моделью'
                        : 'Круговая диаграмма, схема технологического потока или таблица сравнения показателей',
                });
            }
            else {
                slides.push({
                    slideNumber: slideNum,
                    title,
                    keyPoints: [
                        `Asosiy omil: "${title}" bo'yicha ishlab chiqarishdagi amaliy yondashuv`,
                        'Resurslarni tejash va ish jarayonini optimallashtirish chora-tadbirlari',
                        'Sifat nazorati va natijalarni baholash indikatorlari',
                    ],
                    speakerNotes: `Hurmatli hamkasblar! Mazkur slaydda biz ${topic} bo'yicha asosiy ko'rsatkichlar va ularning amaliyotdagi samarasini ko'rib chiqamiz.`,
                    visualSuggestion: slideNum === 1
                        ? 'Korxona logotipi, seminar mavzusi va 3D obyekt render tasviri'
                        : 'Jadval, ustunli diagramma yoki jarayon blok-sxemasi',
                });
            }
        }
        return slides;
    }
    buildSemanticMeta(title, content, lang = 'uz') {
        const isRu = lang === 'ru';
        const tags = this.extractTagsFromTopic(title);
        if (isRu) {
            return {
                description: `Презентация и подробный семинар на тему "${title}". Рассматриваются ключевые производственные процессы, инновационные решения и практические рекомендации для специалистов ОКМК.`,
                tags,
                keyTakeaways: [
                    'Повышение эффективности и оптимизация рабочего процесса',
                    'Соблюдение регламентов промышленной безопасности',
                    'Внедрение передовых методик и цифровых инструментов',
                ],
            };
        }
        return {
            description: `"${title}" mavzusidagi seminar va taqdimot. Ushbu materialda OKMK korxonasi faoliyatiga oid muhim tahlillar, yangi texnologiyalar va amaliy tavsiyalar batafsil yoritilgan.`,
            tags,
            keyTakeaways: [
                'Ishlab chiqarish samaradorligini oshirish va vaqtni tejash',
                'Sanoat xavfsizligi va mehnat muhofazasi talablariga to`liq rioya qilish',
                'Raqamli vositalar va innovatsiyalarni amaliyotga joriy etish',
            ],
        };
    }
    buildSemanticChatAnswer(prompt) {
        const lower = prompt.toLowerCase();
        let answer = `Taqdimotingizni yanada mukammal qilish uchun quyidagilarni tavsiya qilaman:

1. **Struktura**: Har bir slayd 1 ta asosiy g'oyani ifodalashi va 3-4 tadan ortiq banddan iborat bo'lmasligi lozim.
2. **Vizual vositalar**: Matndan ko'ra 3D model (.step/.glb), diagramma va taqqoslash grafiklaridan foydalanish tinglovchilarda kuchli taassurot qoldiradi.
3. **Jonli efir**: Taqdimotni jonli efir sifatida o'tkazishda chat va real-vaqt reaksiyalari orqali auditoriya bilan faol muloqot o'rnating.`;
        if (lower.includes('3d') || lower.includes('step') || lower.includes('model')) {
            answer = `3D modellardan taqdimotda foydalanish bo'yicha tavsiyalar:
- Bizning tizim .step, .stp va .glb formatlarini qo'llab-quvvatlaydi (100MB gacha).
- Jonli efir paytida ma'ruzachi 3D modelni aylantirganda yoki masshtabini o'zgartirganda, bu barcha tomoshabinlar ekranida real-vaqtda bir xil aks etadi.
- Murakkab uskunalar uchun qismlarga ajratilgan (exploded view) holatidan foydalaning.`;
        }
        else if (lower.includes('xavfsizlik') || lower.includes('safety') || lower.includes('ppe')) {
            answer = `Mehnat muhofazasi va sanoat xavfsizligi taqdimotlari bo'yicha:
- Statistik ma'lumotlar va qoidabuzarliklarning oldini olish choralarini birinchi o'ringa qo'ying.
- Shaxsiy himoya vositalari (PPE) kiyilish qoidalari bo'yicha ko'rgazmali misollar va video lavhalardan foydalaning.`;
        }
        return {
            answer,
            relatedSuggestions: [
                'Ushbu mavzuda slaydlar rejasini tuzish',
                'Seminar tavsifi va teglarini yaratish',
                'Taqdimotga 3D fayllar yuklash',
            ],
        };
    }
    extractTagsFromTopic(topic) {
        const rawTags = ['#okmk'];
        const lower = topic.toLowerCase();
        if (lower.includes('ai') || lower.includes('suniy') || lower.includes('intellekt')) {
            rawTags.push('#ai', '#suniy_intellekt', '#avtomatlashtirish');
        }
        if (lower.includes('kon') || lower.includes('mining') || lower.includes('ruda')) {
            rawTags.push('#konchilik', '#mining', '#ruda');
        }
        if (lower.includes('metall') || lower.includes('mis') || lower.includes('rux')) {
            rawTags.push('#metallurgiya', '#mis_zavodi');
        }
        if (lower.includes('xavfsizlik') || lower.includes('safety') || lower.includes('muhofaza')) {
            rawTags.push('#xavfsizlik', '#mehnat_muhofazasi', '#ppe');
        }
        if (lower.includes('hisobot') || lower.includes('kpi') || lower.includes('reja')) {
            rawTags.push('#kpi', '#hisobot', '#statistika');
        }
        if (lower.includes('energiya') || lower.includes('tejamkorlik')) {
            rawTags.push('#energiya', '#tejamkorlik');
        }
        if (rawTags.length <= 2) {
            rawTags.push('#taqdimot', '#seminar', '#innovatsiya');
        }
        return Array.from(new Set(rawTags));
    }
    async callExternalLlmForJson(prompt) {
        const apiUrl = this.config.get('AI_API_URL');
        const apiKey = this.config.get('AI_API_KEY');
        const model = this.config.get('AI_MODEL', 'gpt-4o-mini');
        if (!apiUrl)
            return null;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an enterprise presentation assistant. Always respond with pure valid JSON only without markdown code blocks.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.7,
                }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content)
                return null;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        }
        catch (err) {
            this.logger.warn(`External AI API call skipped: ${err.message}`);
            return null;
        }
    }
    async callExternalLlmForText(prompt) {
        const apiUrl = this.config.get('AI_API_URL');
        const apiKey = this.config.get('AI_API_KEY');
        const model = this.config.get('AI_MODEL', 'gpt-4o-mini');
        if (!apiUrl)
            return null;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        }
        catch (err) {
            this.logger.warn(`External AI API text call skipped: ${err.message}`);
            return null;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map