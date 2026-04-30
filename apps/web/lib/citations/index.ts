/**
 * Aggregator for every supported citation format.
 */
export { formatApa } from './apa';
export { formatChicago } from './chicago';
export { formatMla } from './mla';
export { formatBibtex } from './bibtex';
export { formatRis } from './ris';
export { getCitationMissingFields } from './missingFields';
export type { MissingField, CitationFieldKey } from './missingFields';

export type CitationFormat = 'apa' | 'chicago' | 'mla' | 'bibtex' | 'ris';
