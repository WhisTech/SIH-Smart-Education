import { useTranslation } from 'react-i18next'

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation()

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value)
  }

  // Ensure language fallback in UI just in case i18n.language is undefined during init
  const currentLang = i18n.language ? (i18n.language.includes('-') ? i18n.language.split('-')[0] : i18n.language) : 'en'

  return (
    <div className={`language-selector ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span aria-hidden="true" style={{ fontSize: '18px' }}>🌐</span>
      <select
        value={currentLang}
        onChange={handleLanguageChange}
        aria-label="Select Language"
        className="language-dropdown"
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '14px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="mr">मराठी</option>
      </select>
    </div>
  )
}
