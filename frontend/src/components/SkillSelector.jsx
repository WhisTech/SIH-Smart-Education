import { useState, useRef, useEffect, useMemo } from 'react'

const COMMON_SKILL_NAMES = [
  'Statistical Analysis',
  'Data Interpretation',
  'Data Management',
  'Data Visualization',
  'Official Statistics',
  'Survey Methodology',
  'Data Quality Management',
  'Report Writing & Presentation'
]

export default function SkillSelector({
  skills = [],
  skillsLoading = false,
  skillsError = '',
  selectedSkillIds = [],
  onToggleSkill,
  onRemoveSkill,
  onAddSkill,
  disabled = false
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)

  // Map the 8 common skills from loaded skills by name
  const commonSkills = useMemo(() => {
    if (!skills || skills.length === 0) return []
    const matched = []
    for (const targetName of COMMON_SKILL_NAMES) {
      const match = skills.find(
        (s) => s.name.toLowerCase() === targetName.toLowerCase()
      ) || skills.find(
        (s) => s.name.toLowerCase().startsWith(targetName.toLowerCase())
      ) || skills.find(
        (s) => s.name.toLowerCase().includes(targetName.toLowerCase())
      )
      if (match && !matched.some((m) => m.id === match.id)) {
        matched.push(match)
      }
    }
    return matched
  }, [skills])

  // Filter search results (up to 12 matches not yet selected)
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query || !skills || skills.length === 0) return []

    return skills
      .filter((s) => {
        // Exclude already selected skills from search dropdown
        if (selectedSkillIds.includes(s.id)) return false
        const nameMatch = s.name.toLowerCase().includes(query)
        const catMatch = s.category && s.category.toLowerCase().includes(query)
        return nameMatch || catMatch
      })
      .slice(0, 14)
  }, [skills, searchQuery, selectedSkillIds])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])



  const handleSelect = (skillId) => {
    if (skillId && !selectedSkillIds.includes(skillId)) {
      onAddSkill(skillId)
    }
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) {
      if (e.key === 'ArrowDown' && searchResults.length > 0) {
        setIsSearchOpen(true)
        setActiveIndex(0)
        e.preventDefault()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < searchResults.length) {
        handleSelect(searchResults[activeIndex].id)
      } else if (searchResults.length > 0) {
        handleSelect(searchResults[0].id)
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div className="compact-skills-selector">
      {/* 1. SEARCH INPUT WITH POPOVER */}
      <div className="search-skills-wrapper" ref={wrapperRef}>
        <div className="search-input-box-container">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            id="skill-search-input"
            type="text"
            className="skill-search-input-box"
            placeholder={
              skillsLoading
                ? 'Loading skills catalog...'
                : 'Search skills catalog (e.g. regression, python, survey, data)...'
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled || skillsLoading}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="skills-results-popover"
            aria-expanded={isSearchOpen && Boolean(searchQuery.trim())}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('')
                setIsSearchOpen(false)
              }}
              aria-label="Clear search"
              disabled={disabled}
            >
              ✕
            </button>
          )}
        </div>

        {/* POPOVER SEARCH RESULTS */}
        {isSearchOpen && searchQuery.trim() && (
          <div
            id="skills-results-popover"
            className="search-results-popover"
            role="listbox"
            aria-label="Search results"
          >
            {searchResults.length === 0 ? (
              <div className="no-search-results">
                No skills found matching &ldquo;{searchQuery}&rdquo;. Try another search term.
              </div>
            ) : (
              searchResults.map((skill, index) => (
                <div
                  key={skill.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-result-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSelect(skill.id)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="result-main">
                    <span className="result-cat">{skill.category || 'Skill'}</span>
                    <span className="result-name">{skill.name}</span>
                  </div>
                  {skill.description && (
                    <span className="result-desc">{skill.description}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {skillsError && (
        <span className="field-hint field-hint-error">{skillsError}</span>
      )}

      {/* 2. COMMON SKILLS QUICK SELECTION SHORTCUTS */}
      {commonSkills.length > 0 && (
        <div className="common-skills-block">
          <span className="common-skills-title">Common Skills</span>
          <div className="common-skills-pills">
            {commonSkills.map((s) => {
              const isSelected = selectedSkillIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`common-skill-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleSkill(s.id)}
                  aria-pressed={isSelected}
                  disabled={disabled}
                >
                  <span className="pill-check">{isSelected ? '☑' : '☐'}</span>
                  <span className="pill-name">{s.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. SELECTED SKILLS CHIPS */}
      <div className="selected-skills-block">
        <span className="selected-skills-title">
          Selected Skills ({selectedSkillIds.length})
        </span>

        {selectedSkillIds.length === 0 ? (
          <p className="no-skills-selected">
            No skills selected yet. Click a common skill or search above.
          </p>
        ) : (
          <div className="skill-chips-container" aria-label="Selected skills list">
            {selectedSkillIds.map((skillId) => {
              const skillObj = skills.find((s) => s.id === skillId)
              const label = skillObj ? skillObj.name : skillId
              const category = skillObj?.category || 'Skill'
              return (
                <span key={skillId} className="skill-chip">
                  <span className="chip-category">{category}</span>
                  <span className="chip-name">{label}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => onRemoveSkill(skillId)}
                    aria-label={`Remove ${label}`}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
