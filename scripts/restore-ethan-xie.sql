UPDATE team_members
SET is_active = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE name = 'Ethan Xie' AND is_active = 0;

INSERT INTO team_members (id, name, role, school, bio, instagram, image, sections, group_name, concertmaster_type, is_active, created_at, updated_at)
SELECT
  'ethan-xie',
  'Ethan Xie',
  'Tech & Design',
  'West Point Grey Academy',
  'Hi there! I''m a student entering grade 10, and I''m passionate about music, technology, and engineering. I enjoy creating projects such as building drones. At OneKey, I''ve volunteered through music, and this year, I''ve been one of the main developers of this site. I look forward to working with OneKey in the future!',
  'https://www.instagram.com/ethanx421/',
  '/pics/ethanxie.jpg',
  '["techdesign"]',
  NULL,
  NULL,
  1,
  '2024-01-01T00:00:00Z',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Ethan Xie');
