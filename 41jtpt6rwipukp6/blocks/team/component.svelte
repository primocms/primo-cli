<section class="team">
  <div class="pala-block-container">
    {#if title || subtitle}
      <div class="team-header">
        {#if title}
          <h2>{title}</h2>
        {/if}
        {#if subtitle}
          <p>{subtitle}</p>
        {/if}
      </div>
    {/if}

    {#if members?.length}
      <div class="team-grid">
        {#each members as member}
          <div class="team-member">
            <div class="member-image">
              {#if member.photo?.url}
                <img src={member.photo.url} alt={member.photo.alt || member.name} />
              {:else}
                <div class="photo-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              {/if}
            </div>
            {#if member.name}
              <h3>{member.name}</h3>
            {/if}
            {#if member.role}
              <span class="role">{member.role}</span>
            {/if}
            {#if member.bio}
              <p>{member.bio}</p>
            {/if}
            {#if member.linkedin}
              <div class="social-links">
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.team {
  padding: 6rem 0;
  background: white;
}

.team-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
}

.team-header h2 {
  font-family: var(--theme-heading-font, system-ui);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.team-header p {
  font-size: 1.125rem;
  color: #64748b;
  line-height: 1.7;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2.5rem;
}

.team-member {
  text-align: center;
}

.member-image {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.member-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.team-member:hover .member-image img {
  transform: scale(1.05);
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.team-member h3 {
  font-family: var(--theme-heading-font, system-ui);
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.role {
  display: block;
  font-size: 0.875rem;
  color: #6366f1;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.team-member p {
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.3s ease;
}

.social-links a:hover {
  background: #6366f1;
  color: white;
}

@media (max-width: 1024px) {
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .team {
    padding: 4rem 0;
  }

  .team-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}
</style>
