export interface TreatmentRecord {
  year: string;
  district: string;
  community: number;
  patients: number;
  ratio?: number;
}

export type SortOption = 'patients_desc' | 'patients_asc' | 'community_desc' | 'district_asc';
