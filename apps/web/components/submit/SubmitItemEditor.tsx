/**
 * SubmitItemEditor — a single row in the submit form showing the file
 * status, metadata editor, duplicate banners, and submit button.
 *
 * The "Auto-detected" badge appears beside each field that was populated
 * from the PDF extraction pipeline. Users can edit any field and the
 * badge stays until they type, making provenance visible.
 */
'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { SubmitItem, SubmitItemMetadata } from './types';
import type { DocumentType, Governorate, Language, Organization, Theme } from '@/types/directus';
import { pickLabel, pickLocalizedName } from '@/lib/i18n/taxonomy';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  item: SubmitItem;
  themes: Theme[];
  documentTypes: DocumentType[];
  governorates: Governorate[];
  languages: Language[];
  organizations: Organization[];
  onChange(id: string, patch: Partial<SubmitItemMetadata>): void;
  onConfirmNotDuplicate(id: string): void;
  onRemove(id: string): void;
}

export default function SubmitItemEditor({
  item,
  themes,
  documentTypes,
  governorates,
  languages,
  organizations,
  onChange,
  onConfirmNotDuplicate,
  onRemove,
}: Props) {
  const t = useTranslations('submit');
  const locale = useLocale() as Locale;
  const m = item.metadata;

  const processing = [
    'extracting',
    'hashing',
    'checking_duplicates',
    'submitting',
    'queued',
  ].includes(item.state);

  return (
    <article className="rounded-xl border border-border bg-white p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brand-blue">{item.file.name}</p>
          <p className="text-xs text-brand-ink-soft">
            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
        {processing ? (
          <span className="inline-flex items-center gap-1 text-xs text-brand-ink-soft">
            <Loader2 size={12} className="animate-spin" aria-hidden="true" /> {t('processing')}
          </span>
        ) : null}
        {item.state === 'submitted' ? (
          <Badge tone="teal">{t('success.title')}</Badge>
        ) : null}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-xs text-brand-ink-soft underline hover:text-brand-blue"
        >
          Remove
        </button>
      </header>

      {item.duplicateCheck?.exact ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle size={16} aria-hidden="true" /> {t('duplicate.exactTitle')}
          </p>
          <p className="mt-1 text-sm text-red-800">{t('duplicate.exactBody')}</p>
          <Link
            href={`/${locale}/documents/${item.duplicateCheck.exact.id}`}
            className="mt-2 inline-block text-sm font-medium text-red-900 underline"
          >
            {t('duplicate.viewMatch')}: {item.duplicateCheck.exact.title}
          </Link>
        </div>
      ) : null}

      {item.duplicateCheck?.fuzzy?.length && !item.duplicateCheck.exact && !item.confirmedNotDuplicate ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle size={16} aria-hidden="true" /> {t('duplicate.fuzzyTitle')}
          </p>
          <p className="mt-1 text-sm text-amber-900">{t('duplicate.fuzzyBody')}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {item.duplicateCheck.fuzzy.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/${locale}/documents/${f.id}`}
                  className="font-medium text-amber-900 underline"
                >
                  {f.title}
                </Link>{' '}
                <span className="text-xs text-amber-800">
                  ({Math.round(f.similarity * 100)}%)
                </span>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => onConfirmNotDuplicate(item.id)}
          >
            {t('duplicate.notDuplicate')}
          </Button>
        </div>
      ) : null}

      {item.state === 'error' ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {item.error ?? 'Something went wrong'}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field
          label={t('fields.title')}
          auto={m.auto.title}
          autoLabel={t('autodetected')}
          input={
            <input
              type="text"
              value={m.title}
              onChange={(e) => onChange(item.id, { title: e.target.value, auto: { ...m.auto, title: false } })}
              className={inputCls}
            />
          }
        />
        <Field
          label={t('fields.author')}
          input={
            <input
              type="text"
              value={m.author}
              onChange={(e) => onChange(item.id, { author: e.target.value })}
              className={inputCls}
            />
          }
        />
        <Field
          label={t('fields.organization')}
          input={
            <select
              value={m.organization}
              onChange={(e) => onChange(item.id, { organization: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {pickLocalizedName(o, locale)}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label={t('fields.datePublished')}
          auto={m.auto.year}
          autoLabel={t('autodetected')}
          input={
            <input
              type="date"
              value={m.date_published}
              onChange={(e) => onChange(item.id, { date_published: e.target.value, auto: { ...m.auto, year: false } })}
              className={inputCls}
            />
          }
        />
        <Field
          label={t('fields.language')}
          auto={m.auto.language}
          autoLabel={t('autodetected')}
          input={
            <select
              value={m.language}
              onChange={(e) => onChange(item.id, { language: e.target.value as SubmitItemMetadata['language'], auto: { ...m.auto, language: false } })}
              className={inputCls}
            >
              <option value="">—</option>
              {languages.map((l) => (
                <option key={l.id} value={l.slug}>
                  {pickLabel(l, locale)}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label={t('fields.documentType')}
          input={
            <select
              value={m.document_type}
              onChange={(e) => onChange(item.id, { document_type: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {pickLabel(dt, locale)}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label={t('fields.themes')}
          fullWidth
          input={
            <ChipPicker
              options={themes.map((th) => ({ value: th.id, label: pickLabel(th, locale) }))}
              selected={m.themes}
              onChange={(next) => onChange(item.id, { themes: next })}
            />
          }
        />
        <Field
          label={t('fields.governorates')}
          fullWidth
          input={
            <ChipPicker
              options={governorates.map((g) => ({ value: g.id, label: pickLabel(g, locale) }))}
              selected={m.governorates}
              onChange={(next) => onChange(item.id, { governorates: next })}
            />
          }
        />
        <Field
          label={t('fields.keywords')}
          fullWidth
          input={
            <input
              type="text"
              value={m.keywords}
              onChange={(e) => onChange(item.id, { keywords: e.target.value })}
              className={inputCls}
            />
          }
        />
        <Field
          label={t('fields.sourceUrl')}
          fullWidth
          input={
            <input
              type="url"
              inputMode="url"
              placeholder="https://"
              value={m.source_url}
              onChange={(e) => onChange(item.id, { source_url: e.target.value })}
              className={inputCls}
            />
          }
        />
        <Field
          label={t('fields.abstract')}
          fullWidth
          input={
            <textarea
              rows={4}
              value={m.abstract}
              onChange={(e) => onChange(item.id, { abstract: e.target.value })}
              className={inputCls}
            />
          }
        />
      </div>

      {(m.auto.title || m.auto.year || m.auto.language) ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-brand-ink-soft">
          <Sparkles size={12} aria-hidden="true" /> {t('autodetectedHint')}
        </p>
      ) : null}
    </article>
  );
}

const inputCls =
  'h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold';

function Field({
  label,
  input,
  auto,
  autoLabel,
  fullWidth,
}: {
  label: string;
  input: React.ReactNode;
  auto?: boolean;
  autoLabel?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? 'md:col-span-2' : ''}>
      <span className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
        {label}
        {auto ? <Badge tone="gold">{autoLabel}</Badge> : null}
      </span>
      {input}
    </label>
  );
}

function ChipPicker({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange(next: string[]): void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-white p-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() =>
              onChange(active ? selected.filter((x) => x !== opt.value) : [...selected, opt.value])
            }
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              active
                ? 'bg-brand-blue text-white'
                : 'bg-white text-brand-ink-soft hover:text-brand-blue'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
