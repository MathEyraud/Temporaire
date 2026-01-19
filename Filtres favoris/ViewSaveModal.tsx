/**
 * COMPOSANT VIEWSAVEMODAL
 * ========================
 * 
 * Modal pour créer ou éditer une vue de tableau.
 * Gère trois cas d'usage :
 * - Création d'une nouvelle vue
 * - Édition d'une vue existante (nom, isDefault)
 * - Mise à jour ou création (quand l'utilisateur a modifié les colonnes)
 * 
 * FONCTIONNALITÉS :
 * - Champ nom avec validation
 * - Checkbox "Définir par défaut"
 * - Choix entre "Mettre à jour" et "Créer nouvelle" (mode update-or-create)
 * - Affichage du nombre de colonnes
 * - États de chargement
 * 
 * @file ViewSaveModal.tsx
 * @version 1.0
 */

"use client"

import { useState, useEffect, useCallback, memo } from 'react'
import {
  ViewSaveModalProps,
  ViewModalMode,
  CreateTableViewDto,
  UpdateTableViewDto,
  validateCreateView,
  validateUpdateView,
  ViewValidationError,
} from '@/types/table-views'

// ============================================================================
// ICÔNES SVG
// ============================================================================

/** Icône de fermeture (X) */
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/** Icône d'information */
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

/** Icône de spinner (chargement) */
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ViewSaveModal = memo(({
  isOpen,
  mode,
  entityType,
  viewToEdit,
  currentVisibleColumns,
  isLoading,
  onSubmit,
  onClose,
}: ViewSaveModalProps) => {
  // ==========================================
  // ÉTAT LOCAL
  // ==========================================
  
  /** Nom de la vue */
  const [name, setName] = useState('')
  
  /** Définir comme vue par défaut */
  const [isDefault, setIsDefault] = useState(false)
  
  /** Choix de l'action en mode "update-or-create" */
  const [action, setAction] = useState<'update' | 'create'>('update')
  
  /** Erreurs de validation */
  const [errors, setErrors] = useState<ViewValidationError[]>([])

  // ==========================================
  // INITIALISATION DES VALEURS
  // ==========================================
  
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && viewToEdit) {
        // Mode édition : pré-remplir avec les valeurs existantes
        setName(viewToEdit.name)
        setIsDefault(viewToEdit.isDefault)
        setAction('update')
      } else if (mode === 'update-or-create' && viewToEdit) {
        // Mode mise à jour ou création : garder le nom de la vue existante
        setName(viewToEdit.name)
        setIsDefault(viewToEdit.isDefault)
        setAction('update')
      } else {
        // Mode création : valeurs vides
        setName('')
        setIsDefault(false)
        setAction('create')
      }
      setErrors([])
    }
  }, [isOpen, mode, viewToEdit])

  // ==========================================
  // HANDLERS
  // ==========================================
  
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    // Effacer l'erreur du champ nom quand l'utilisateur tape
    setErrors(prev => prev.filter(err => err.field !== 'name'))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Déterminer si on crée ou on met à jour
    const isCreating = mode === 'create' || (mode === 'update-or-create' && action === 'create')
    
    if (isCreating) {
      // Validation pour la création
      const createData: CreateTableViewDto = {
        name: name.trim(),
        entityType,
        visibleColumns: currentVisibleColumns,
        isDefault,
      }
      
      const validationErrors = validateCreateView(createData)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }
      
      await onSubmit(createData)
    } else {
      // Validation pour la mise à jour
      const updateData: UpdateTableViewDto = {
        name: name.trim(),
        visibleColumns: currentVisibleColumns,
        isDefault,
      }
      
      const validationErrors = validateUpdateView(updateData, entityType)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }
      
      await onSubmit(updateData, viewToEdit?.id)
    }
  }, [mode, action, name, entityType, currentVisibleColumns, isDefault, viewToEdit, onSubmit])

  // ==========================================
  // HELPERS
  // ==========================================
  
  const getFieldError = (field: string): string | undefined => {
    return errors.find(err => err.field === field)?.message
  }

  const getTitle = (): string => {
    switch (mode) {
      case 'create':
        return 'Créer une nouvelle vue'
      case 'edit':
        return 'Modifier la vue'
      case 'update-or-create':
        return action === 'update' ? 'Mettre à jour la vue' : 'Créer une nouvelle vue'
      default:
        return 'Sauvegarder la vue'
    }
  }

  const getSubmitLabel = (): string => {
    if (isLoading) return 'Enregistrement...'
    switch (mode) {
      case 'create':
        return 'Créer la vue'
      case 'edit':
        return 'Enregistrer les modifications'
      case 'update-or-create':
        return action === 'update' ? 'Mettre à jour' : 'Créer la vue'
      default:
        return 'Enregistrer'
    }
  }

  // ==========================================
  // RENDU CONDITIONNEL
  // ==========================================
  
  if (!isOpen) return null

  // ==========================================
  // RENDU
  // ==========================================
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay sombre */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Conteneur centré */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal */}
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          
          {/* ========== HEADER ========== */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getTitle()}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ========== FORMULAIRE ========== */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              
              {/* Info colonnes */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <InfoIcon />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">
                    {currentVisibleColumns.length} colonne{currentVisibleColumns.length > 1 ? 's' : ''} sélectionnée{currentVisibleColumns.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 mt-0.5">
                    La vue sauvegardera cette configuration de colonnes.
                  </p>
                </div>
              </div>

              {/* Choix action (mode update-or-create uniquement) */}
              {mode === 'update-or-create' && viewToEdit && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Action
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="update"
                        checked={action === 'update'}
                        onChange={() => {
                          setAction('update')
                          setName(viewToEdit.name)
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mettre à jour "{viewToEdit.name}"
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="create"
                        checked={action === 'create'}
                        onChange={() => {
                          setAction('create')
                          setName('')
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Créer une nouvelle vue
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Champ nom */}
              <div className="space-y-1">
                <label 
                  htmlFor="view-name" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nom de la vue
                </label>
                <input
                  id="view-name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Ex: Vue minimaliste, Vue export..."
                  maxLength={50}
                  disabled={mode === 'update-or-create' && action === 'update' && !!viewToEdit}
                  className={`
                    w-full px-3 py-2 text-sm
                    bg-white dark:bg-gray-700 
                    border rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                    ${getFieldError('name') 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                />
                {getFieldError('name') && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {getFieldError('name')}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {name.length}/50 caractères
                </p>
              </div>

              {/* Checkbox vue par défaut */}
              <div className="flex items-start gap-2">
                <input
                  id="view-default"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="view-default" className="text-sm cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-300">
                    Définir comme vue par défaut
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Cette vue sera chargée automatiquement à l'ouverture du tableau.
                  </p>
                </label>
              </div>

              {/* Erreur générale */}
              {errors.length > 0 && !getFieldError('name') && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {errors[0].message}
                  </p>
                </div>
              )}
            </div>

            {/* ========== FOOTER ========== */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || (mode !== 'edit' && currentVisibleColumns.length === 0)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <SpinnerIcon />}
                {getSubmitLabel()}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
})

ViewSaveModal.displayName = 'ViewSaveModal'

export default ViewSaveModal
