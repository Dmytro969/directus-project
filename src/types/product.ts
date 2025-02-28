export interface Product {
  id: string | number;
  Name: string;
  is_new: boolean;
  Aroma: string;
  Effects: string;
  Type?: string;
  thc_purity?: string; 
  thc_purity_value?: number | null;
  
  // Поле Media може мати різні формати
  Media?: Array<
    | number 
    | string 
    | { id: string | number; [key: string]: any }
    | { 
        directus_files_id: string | number | { 
          id: string | number;
          filename_download?: string;
          type?: string;
          [key: string]: any
        }
      }
  > | null;
  
  // Ці поля додаються на фронтенді для відображення
  image?: string;
  mediaUrls?: string[] | null;
  videoUrls?: string[] | null;
} 