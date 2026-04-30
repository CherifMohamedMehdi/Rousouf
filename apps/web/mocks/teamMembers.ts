/**
 * Mock team members displayed on the About page.
 * Shapes match docs/SCHEMA.md §8.1.
 */
import type { TeamMember } from '@/types/directus';

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Mehdi Cherif',
    role_ar: 'المدير التنفيذي',
    role_fr: 'Directeur exécutif',
    role_en: 'Executive Director',
    bio_ar: 'باحث وناشط في المجتمع المدني منذ 2013.',
    bio_fr: 'Chercheur et militant de la société civile depuis 2013.',
    bio_en: 'Civil society researcher and advocate since 2013.',
    photo: { id: 'photo-mehdi', url: '/team/mehdi.svg' },
    linkedin_url: 'https://www.linkedin.com/in/example',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'tm-2',
    name: 'Imen Ben Yaghlane',
    role_ar: 'منسقة الأرشيف',
    role_fr: 'Coordinatrice de l\'archive',
    role_en: 'Archive Coordinator',
    bio_ar: 'متخصصة في علم المكتبات والأرشيف الرقمي.',
    bio_fr: 'Spécialiste en sciences de l\'information et archivage numérique.',
    bio_en: 'Specialist in library science and digital archiving.',
    photo: { id: 'photo-imen', url: '/team/imen.svg' },
    linkedin_url: 'https://www.linkedin.com/in/example',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'tm-3',
    name: 'Walid Trabelsi',
    role_ar: 'مهندس البرمجيات',
    role_fr: 'Ingénieur logiciel',
    role_en: 'Software Engineer',
    bio_ar: 'مطور ويب متخصص في الأنظمة متعددة اللغات.',
    bio_fr: 'Développeur web spécialisé dans les systèmes multilingues.',
    bio_en: 'Web developer specialized in multilingual systems.',
    photo: { id: 'photo-walid', url: '/team/walid.svg' },
    linkedin_url: 'https://www.linkedin.com/in/example',
    sort_order: 3,
    is_active: true,
  },
];
