/**
 * Mock pages singleton content. Matches docs/SCHEMA.md §8.2.
 */
import type { PagesSingleton } from '@/types/directus';

export const mockPages: PagesSingleton = {
  mission_ar: 'رفوف أرشيف مفتوح للمعرفة المدنية التونسية: تقارير، دراسات، أوراق سياسات أنتجها المجتمع المدني منذ 2011. هدفنا حفظ هذا الإنتاج وإتاحته لكل من يحتاجه — من صحفيين وباحثين وطلبة وناشطين.',
  mission_fr: 'Roufouf est une archive ouverte du savoir citoyen tunisien : rapports, études et notes de politique produits par la société civile depuis 2011. Notre mission est de préserver cette production et de la rendre accessible à tous — journalistes, chercheur·es, étudiant·es, et acteurs de la société civile.',
  mission_en: 'Roufouf is an open archive of Tunisian civic knowledge: reports, studies, and policy briefs produced by civil society since 2011. Our mission is to preserve this output and make it accessible to everyone who needs it — journalists, researchers, students, and civil-society practitioners.',
  about_body_ar: 'يجمع المشروع عمل عشرات المنظمات التونسية. نتحقق من كل وثيقة قبل نشرها ونحفظ بياناتها الوصفية بدقة. البحث يعمل بالعربية والفرنسية والإنجليزية، وكل ما في الأرشيف مفتوح للتحميل المجاني.',
  about_body_fr: 'Le projet regroupe le travail de dizaines d\'organisations tunisiennes. Chaque document est vérifié avant publication, et ses métadonnées soigneusement conservées. La recherche fonctionne en arabe, français et anglais, et tout le contenu de l\'archive est librement téléchargeable.',
  about_body_en: 'The project gathers the work of dozens of Tunisian organizations. Every document is verified before publication, with its metadata carefully preserved. Search works in Arabic, French, and English, and everything in the archive is freely downloadable.',
  impact_callouts_ar: [
    { title: 'نحفظ', body: 'كل وثيقة تُحفظ بصيغة PDF مع سجل كامل من البيانات الوصفية حتى لا تضيع.' },
    { title: 'نُتيح', body: 'البحث والتحميل مجانيان للجميع، بدون تسجيل.' },
    { title: 'نترجم', body: 'ملخصات متاحة بثلاث لغات لتوسيع مدى الوصول.' },
  ],
  impact_callouts_fr: [
    { title: 'Nous préservons', body: 'Chaque document est archivé en PDF avec ses métadonnées complètes pour qu\'il ne se perde pas.' },
    { title: 'Nous ouvrons', body: 'La recherche et le téléchargement sont gratuits, sans inscription.' },
    { title: 'Nous traduisons', body: 'Des résumés disponibles en trois langues pour élargir la portée.' },
  ],
  impact_callouts_en: [
    { title: 'We preserve', body: 'Every document is archived as a PDF with its full metadata so nothing is lost.' },
    { title: 'We open up', body: 'Search and downloads are free, with no registration required.' },
    { title: 'We translate', body: 'Summaries available in three languages to widen the reach.' },
  ],
  transparency_note_ar: 'نعالج بيانات المتبرعين بحد أدنى: لا نبيعها ولا نشاركها. لا يظهر أي اسم على الصفحة الرئيسية إلا بعد موافقة صريحة من صاحبه.',
  transparency_note_fr: 'Nous traitons les données des donateurs au strict minimum : jamais vendues, jamais partagées. Aucun nom n\'apparaît sur la page d\'accueil sans le consentement explicite de la personne concernée.',
  transparency_note_en: 'We process donor data to the strict minimum — never sold, never shared. No name appears on the homepage without that person\'s explicit consent.',
  social_twitter: 'https://x.com/example',
  social_linkedin: 'https://www.linkedin.com/company/example',
  social_facebook: 'https://facebook.com/example',
  social_youtube: 'https://youtube.com/@example',
};
