/**
 * COMPOSANT VIEWDELETEMODAL
 * ==========================
 * 
 * Modal de confirmation pour la suppression d'une vue de tableau.
 * Affiche un avertissement clair et demande confirmation avant suppression.
 * 
 * FONCTIONNALITÉS :
 * - Affichage du nom de la vue à supprimer
 * - Avertissement si c'est la vue par défaut
 * - Boutons Annuler / Confirmer
 * - État de chargement pendant la suppression
 * 
 * @file ViewDeleteModal.tsx
 * @version 1.0
 */

"use client"

import { memo } from 'react'
import { ViewDeleteModalProps } from '@/types/table-views'

// ============================================================================
// ICÔNES SVG
// ============================================================================

/** Icône de fermeture (X) */
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/** Icône d'alerte (triangle) */
const AlertIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

const ViewDeleteModal = memo(({
  isOpen,
  viewToDelete,
  isLoading,
  onConfirm,
  onClose,
}: ViewDeleteModalProps) => {
  // ==========================================
  // RENDU CONDITIONNEL
  // ==========================================
  
  if (!isOpen || !viewToDelete) return null

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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Supprimer la vue
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors disabled:opacity-50"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ========== CONTENU ========== */}
          <div className="px-6 py-4">
            <p className="text-gray-700 dark:text-gray-300">
              Êtes-vous sûr de vouloir supprimer la vue{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{viewToDelete.name}"
              </span>
              {' '}?
            </p>
            
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cette action est irréversible.
            </p>

            {/* Avertissement si vue par défaut */}
            {viewToDelete.isDefault && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="font-medium">Attention :</span> Cette vue est actuellement définie comme vue par défaut. 
                  Après suppression, le tableau affichera toutes les colonnes par défaut.
                </p>
              </div>
            )}

            {/* Info sur les colonnes */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cette vue contient{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {viewToDelete.visibleColumns.length} colonne{viewToDelete.visibleColumns.length > 1 ? 's' : ''}
                </span>
                .
              </p>
            </div>
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
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Suppression...
                </>
              ) : (
                'Supprimer la vue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

ViewDeleteModal.displayName = 'ViewDeleteModal'

export default ViewDeleteModal
