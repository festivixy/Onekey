import { PhotoCategory } from '../services/firebaseService';

import { photoUrl as P } from '../utils/photoUrl';

// Hardcoded photos shipped with the codebase, shown read-only in the admin Photo Manager
// so the admin can see what's already wired into the site alongside uploaded photos.
export interface BuiltinPhoto {
  src: string;
  category: PhotoCategory;
  label: string;
}

export const BUILTIN_PHOTOS: BuiltinPhoto[] = [
  // OneKey
  { src: P('/pics/onekey.jpg'),                 category: 'onekey',    label: 'OneKey hero photo' },
  { src: P('/pics/onekey_team.jpg'),            category: 'onekey',    label: 'OneKey team' },
  { src: P('/pics/onekey_history.jpg'),         category: 'onekey',    label: 'OneKey history' },
  { src: P('/pics/onekey_cavell.jpg'),          category: 'onekey',    label: 'Cavell Gardens visit' },
  { src: P('/pics/onekey_cellos.jpg'),          category: 'onekey',    label: 'Cellos group photo' },
  { src: P('/pics/onekey_perform_mic.jpg'),     category: 'onekey',    label: 'Senior home mic moment' },
  { src: P('/pics/vanstringsh.jpg'),            category: 'onekey',    label: 'Seniors watching a performance' },
  { src: P('/pics/curtispiano3.JPG'),           category: 'onekey',    label: 'Piano performance' },
  { src: P('/pics/onekey_homework.jpg'),        category: 'onekey',    label: 'Homework help session' },

  // Vanstring
  { src: P('/pics/vanstring.jpg'),            category: 'vanstring', label: 'Vanstring hero' },
  { src: P('/pics/vanstring_team.jpg'),       category: 'vanstring', label: 'Vanstring team' },
  { src: P('/pics/vanstring_history.jpg'),    category: 'vanstring', label: 'Vanstring history' },
  { src: P('/pics/vanstring_member_1.jpg'),   category: 'vanstring', label: 'Vanstring members 1' },
  { src: P('/pics/vanstring_member_2.jpg'),   category: 'vanstring', label: 'Vanstring members 2' },
  { src: P('/pics/vanstring_member_3.jpg'),   category: 'vanstring', label: 'Vanstring members 3' },

  // Richmond Hospital
  { src: P('/pics/RHFcheck2025.jpg'),        category: 'richmond-hospital', label: 'Richmond Hospital 2025 cheque' },
  { src: P('/pics/RHFcheck.JPG'),            category: 'richmond-hospital', label: 'Richmond Hospital 2023 cheque' },

  // Vancouver Aquarium
  { src: P('/pics/aquarium-fundraiser.jpg'), category: 'vancouver-aquarium', label: 'Sea otters (concert poster)' },
];
