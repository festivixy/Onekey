import React from 'react';
import { Instagram } from 'lucide-react';
import { TeamMember, SectionKey } from '../store/teamStore';
import { resolveTeamImageSrc } from '../utils/teamImageUrl';

const CONCERTMASTER_LABELS: Record<NonNullable<TeamMember['concertmasterType']>, string> = {
  concertmaster:    'Concertmaster',
  principal_second: 'Principal Second Violin',
};

const SECTION_ROLE_LABELS: Partial<Record<SectionKey, string>> = {
  founders:       'Co-Founder',
  leadership:     'Manager',
  communications: 'Communications',
  coordinators:   'Homework Help Coordinator',
  finance:        'Financial Manager',
  concertmasters: 'Concertmaster',
  techdesign:     'Tech & Design',
  alumni:         'Alumni',
};

const GROUP_SECTION_LABELS: Partial<Record<SectionKey, Record<'onekey' | 'vanstring', string>>> = {
  leadership:     { onekey: 'Onekey Manager',         vanstring: 'Vanstring Manager' },
  communications: { onekey: 'Onekey Communications',  vanstring: 'Vanstring Communications' },
};

interface TeamMemberCardProps {
  member: TeamMember;
  compact?: boolean;
  hideBio?: boolean;
  currentSection?: SectionKey;
  currentGroup?: 'onekey' | 'vanstring';
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, compact = false, hideBio = false, currentSection, currentGroup }) => {
  const imageSrc = resolveTeamImageSrc(member.image);
  const displayedRole = (() => {
    if (currentSection === 'concertmasters' && member.concertmasterType) {
      return CONCERTMASTER_LABELS[member.concertmasterType];
    }
    if (currentSection && currentGroup && GROUP_SECTION_LABELS[currentSection]) {
      return GROUP_SECTION_LABELS[currentSection]?.[currentGroup];
    }
    if (currentSection) {
      const label = SECTION_ROLE_LABELS[currentSection];
      if (label) return label;
    }
    return member.role;
  })();

  return (
    <article className={`team-card${compact ? ' team-card--compact' : ''}`}>
      <div className="team-card__photo-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={member.name} className="team-card__photo" loading="lazy" />
        ) : (
          <div className="team-card__photo-fallback">{member.name.charAt(0)}</div>
        )}
      </div>

      <div className="team-card__info">
        <h3 className="team-card__name">{member.name}</h3>
        <p className="team-card__role">{displayedRole}</p>
        {member.school && !compact && <p className="team-card__school">{member.school}</p>}
        {!compact && !hideBio && member.bio && <p className="team-card__bio">{member.bio}</p>}
        {member.instagram && (
          <a
            href={member.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="team-card__ig-btn"
            aria-label={`${member.name} on Instagram`}
          >
            <Instagram size={18} strokeWidth={1.25} aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
};

export default TeamMemberCard;
