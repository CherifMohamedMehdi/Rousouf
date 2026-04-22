/**
 * Mock donors for the DonorsWall.
 *
 * Strictly only the privacy-safe fields are exposed — see PublicDonor in
 * types/directus.ts. Every entry here represents a donor who explicitly
 * opted in by ticking the "show my name on the homepage" checkbox.
 *
 * In production, /api/donors/highlights queries the `donations` collection
 * filtered to `status = succeeded AND is_anonymous = false AND
 * display_on_homepage = true` and returns the same PublicDonor shape.
 */
import type { PublicDonor } from '@/types/directus';

export const mockDonors: PublicDonor[] = [
  { id: 'd-01', display_name: 'Amal', month: '2024-03' },
  { id: 'd-02', display_name: 'Sami Ben Amor', month: '2024-03' },
  { id: 'd-03', display_name: 'Nadia Khalfaoui', month: '2024-02' },
  { id: 'd-04', display_name: 'Marwan', month: '2024-02' },
  { id: 'd-05', display_name: 'Imen', month: '2024-02' },
  { id: 'd-06', display_name: 'Yosra Trabelsi', month: '2024-01' },
  { id: 'd-07', display_name: 'Fondation Dignité', month: '2024-01' },
  { id: 'd-08', display_name: 'Karim Laabidi', month: '2024-01' },
  { id: 'd-09', display_name: 'Salma', month: '2023-12' },
  { id: 'd-10', display_name: 'Hatem', month: '2023-12' },
  { id: 'd-11', display_name: 'Leila Msellem', month: '2023-11' },
  { id: 'd-12', display_name: 'Ahmed', month: '2023-11' },
  { id: 'd-13', display_name: 'Rania', month: '2023-11' },
  { id: 'd-14', display_name: 'Mehdi Cherif', month: '2023-10' },
  { id: 'd-15', display_name: 'Houda', month: '2023-10' },
  { id: 'd-16', display_name: 'Collectif Al-Karama', month: '2023-09' },
  { id: 'd-17', display_name: 'Jihed', month: '2023-09' },
  { id: 'd-18', display_name: 'Dorra', month: '2023-08' },
  { id: 'd-19', display_name: 'Anouar', month: '2023-08' },
  { id: 'd-20', display_name: 'Lamia', month: '2023-07' },
  { id: 'd-21', display_name: 'Emna Ayadi', month: '2023-07' },
  { id: 'd-22', display_name: 'Ramzi', month: '2023-06' },
  { id: 'd-23', display_name: 'Syrine', month: '2023-06' },
  { id: 'd-24', display_name: 'Walid', month: '2023-05' },
  { id: 'd-25', display_name: 'Fatma', month: '2023-05' },
];
