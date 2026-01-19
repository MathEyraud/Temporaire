/**
 * COMPOSANT VIEWSELECTOR
 * =======================
 * 
 * Dropdown de sélection des vues de tableau personnalisées.
 * Intègre les actions d'édition, suppression et définition par défaut.
 * 
 * FONCTIONNALITÉS :
 * - Affichage de la vue courante avec indicateur de modifications
 * - Liste des vues disponibles avec étoile pour la vue par défaut
 * - Actions inline (éditer, supprimer, définir par défaut)
 * - Recherche si beaucoup de vues
 * - Bouton de création de nouvelle vue
 * 
 * DESIGN : Intégré dans la toolbar du DataTable (Design B)
 * 
 * @file ViewSelector.tsx
 * @version 1.0
 */

"use client"

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { TableView, ViewSelectorProps } from '@/types/table-views'

// ============================================================================
// ICÔNES SVG
// ============================================================================

/** Icône chevron bas */
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

/** Icône étoile (pleine) */
const StarFilledIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

/** Icône étoile (vide) */
const StarOutlineIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

/** Icône crayon (éditer) */
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

/** Icône corbeille (supprimer) */
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

/** Icône sauvegarde */
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
)

/** Icône plus */
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

/** Icône check */
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

/** Icône recherche */
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * ViewSelector - Dropdown de sélection des vues
 */
const ViewSelector = memo(({
  entityType,
  views,
  currentView,
  hasUnsavedChanges,
  isLoading,
  onViewChange,
  onSaveClick,
  onEditView,
  onDeleteView,
  onSetDefault,
}: ViewSelectorProps) => {
  // ==========================================
  // ÉTAT LOCAL
  // ==========================================
  
  /** Dropdown ouvert/fermé */
  const [isOpen, setIsOpen] = useState(false)
  
  /** Terme de recherche */
  const [searchTerm, setSearchTerm] = useState('')
  
  /** Référence au conteneur pour détecter les clics extérieurs */
  const containerRef = useRef<HTMLDivElement>(null)
  
  /** Référence à l'input de recherche pour le focus */
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ==========================================
  // GESTION DU CLIC EXTÉRIEUR
  // ==========================================
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ==========================================
  // FOCUS SUR L'INPUT DE RECHERCHE
  // ==========================================
  
  useEffect(() => {
    if (isOpen && searchInputRef.current && views.length > 5) {
      // Petit délai pour laisser le dropdown s'afficher
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, views.length])

  // ==========================================
  // HANDLERS
  // ==========================================
  
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev)
    if (isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  const handleViewSelect = useCallback((view: TableView | null) => {
    onViewChange(view)
    setIsOpen(false)
    setSearchTerm('')
  }, [onViewChange])

  const handleEditClick = useCallback((e: React.MouseEvent, view: TableView) => {
    e.stopPropagation()
    onEditView(view)
    setIsOpen(false)
  }, [onEditView])

  const handleDeleteClick = useCallback((e: React.MouseEvent, view: TableView) => {
    e.stopPropagation()
    onDeleteView(view)
    setIsOpen(false)
  }, [onDeleteView])

  const handleSetDefaultClick = useCallback((e: React.MouseEvent, view: TableView) => {
    e.stopPropagation()
    onSetDefault(view)
  }, [onSetDefault])

  // ==========================================
  // FILTRAGE DES VUES
  // ==========================================
  
  const filteredViews = views.filter(view =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ==========================================
  // TEXTE DU BOUTON
  // ==========================================
  
  const buttonLabel = currentView 
    ? currentView.name 
    : 'Toutes les colonnes'

  // ==========================================
  // RENDU
  // ==========================================
  
  return (
    <div className="flex items-center gap-2">
      {/* ========== DROPDOWN ========== */}
      <div className="relative" ref={containerRef}>
        {/* Bouton principal */}
        <button
          onClick={toggleDropdown}
          disabled={isLoading}
          className={`
            inline-flex items-center gap-2 px-3 py-2 
            text-sm font-medium rounded-md
            border transition-colors
            ${isLoading 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-wait' 
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }
          `}
        >
          {/* Indicateur de vue par défaut */}
          {currentView?.isDefault && (
            <StarFilledIcon className="w-4 h-4 text-yellow-500" />
          )}
          
          {/* Label */}
          <span className="max-w-[150px] truncate">
            Vue: {buttonLabel}
          </span>
          
          {/* Indicateur de modifications */}
          {hasUnsavedChanges && (
            <span className="w-2 h-2 bg-orange-500 rounded-full" title="Modifications non sauvegardées" />
          )}
          
          {/* Chevron */}
          <ChevronDownIcon />
        </button>

        {/* Menu déroulant */}
        {isOpen && (
          <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            
            {/* Recherche (si beaucoup de vues) */}
            {views.length > 5 && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <SearchIcon />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher une vue..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Liste des vues */}
            <div className="max-h-64 overflow-y-auto py-1">
              
              {/* Option "Toutes les colonnes" */}
              <button
                onClick={() => handleViewSelect(null)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${!currentView ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}
                `}
              >
                <span>Toutes les colonnes</span>
                {!currentView && <CheckIcon />}
              </button>

              {/* Séparateur */}
              {views.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              )}

              {/* Liste des vues */}
              {filteredViews.length === 0 && searchTerm && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                  Aucune vue trouvée
                </div>
              )}

              {filteredViews.map((view) => (
                <div
                  key={view.id}
                  className={`
                    group flex items-center justify-between px-3 py-2
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer
                    ${currentView?.id === view.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                  `}
                  onClick={() => handleViewSelect(view)}
                >
                  {/* Partie gauche : étoile + nom */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Étoile (cliquable pour définir par défaut) */}
                    <button
                      onClick={(e) => handleSetDefaultClick(e, view)}
                      className={`
                        flex-shrink-0 p-0.5 rounded transition-colors
                        ${view.isDefault 
                          ? 'text-yellow-500' 
                          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-500'
                        }
                      `}
                      title={view.isDefault ? 'Vue par défaut' : 'Définir par défaut'}
                    >
                      {view.isDefault ? (
                        <StarFilledIcon className="w-4 h-4" />
                      ) : (
                        <StarOutlineIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Nom de la vue */}
                    <span className={`
                      truncate text-sm
                      ${currentView?.id === view.id 
                        ? 'text-blue-700 dark:text-blue-300 font-medium' 
                        : 'text-gray-700 dark:text-gray-200'
                      }
                    `}>
                      {view.name}
                    </span>
                  </div>

                  {/* Partie droite : actions (visibles au hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Indicateur de sélection */}
                    {currentView?.id === view.id && (
                      <CheckIcon />
                    )}
                    
                    {/* Bouton éditer */}
                    <button
                      onClick={(e) => handleEditClick(e, view)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                      title="Modifier"
                    >
                      <EditIcon />
                    </button>
                    
                    {/* Bouton supprimer */}
                    <button
                      onClick={(e) => handleDeleteClick(e, view)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      title="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Séparateur + Action créer */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onSaveClick()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <PlusIcon />
                <span>Nouvelle vue depuis l'actuelle</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== BOUTON SAUVEGARDER ========== */}
      <button
        onClick={onSaveClick}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-1.5 px-3 py-2
          text-sm font-medium rounded-md
          transition-colors
          ${hasUnsavedChanges
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={hasUnsavedChanges 
          ? 'Sauvegarder les modifications' 
          : currentView 
            ? 'Mettre à jour la vue' 
            : 'Créer une nouvelle vue'
        }
      >
        <SaveIcon />
        <span className="hidden sm:inline">
          {hasUnsavedChanges 
            ? 'Sauvegarder' 
            : currentView 
              ? 'Mettre à jour' 
              : 'Sauvegarder'
          }
        </span>
      </button>
    </div>
  )
})

ViewSelector.displayName = 'ViewSelector'

export default ViewSelector
