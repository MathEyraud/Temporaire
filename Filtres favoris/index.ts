/**
 * EXPORTS CENTRALISÉS - TABLE VIEWS
 * ==================================
 * 
 * Ce fichier sert de point d'entrée unique pour tous les composants
 * liés aux vues de tableaux personnalisées.
 * 
 * USAGE :
 * ```tsx
 * import { ViewSelector, ViewSaveModal, ViewDeleteModal } from '@/components/ui/TableViews'
 * ```
 * 
 * @file index.ts
 * @version 1.0
 */

// ============================================================================
// COMPOSANTS UI
// ============================================================================

/**
 * ViewSelector : Dropdown de sélection des vues
 * 
 * Fonctionnalités :
 * - Affichage de la vue courante
 * - Liste des vues disponibles
 * - Actions inline (éditer, supprimer, définir par défaut)
 * - Bouton de création
 */
export { default as ViewSelector } from './ViewSelector'

/**
 * ViewSaveModal : Modal de création/édition de vue
 * 
 * Fonctionnalités :
 * - Création d'une nouvelle vue
 * - Édition d'une vue existante
 * - Mode "mettre à jour ou créer"
 * - Validation des données
 */
export { default as ViewSaveModal } from './ViewSaveModal'

/**
 * ViewDeleteModal : Modal de confirmation de suppression
 * 
 * Fonctionnalités :
 * - Confirmation avant suppression
 * - Avertissement si vue par défaut
 * - État de chargement
 */
export { default as ViewDeleteModal } from './ViewDeleteModal'

// ============================================================================
// RE-EXPORT DES TYPES
// ============================================================================

/**
 * Re-export des types pour faciliter l'import
 * 
 * USAGE :
 * ```tsx
 * import { ViewSelector, TableView, EntityType } from '@/components/ui/TableViews'
 * ```
 */
export type {
  // Types principaux
  TableView,
  EntityType,
  CreateTableViewDto,
  UpdateTableViewDto,
  TableViewsListResponse,
  
  // Types des props des composants
  ViewSelectorProps,
  ViewSaveModalProps,
  ViewDeleteModalProps,
  ViewModalMode,
  
  // Types utilitaires
  ViewValidationError,
  UseTableViewsReturn,
} from '@/types/table-views'

// ============================================================================
// RE-EXPORT DU HOOK
// ============================================================================

/**
 * Re-export du hook useTableViews
 * 
 * USAGE :
 * ```tsx
 * import { useTableViews, ViewSelector } from '@/components/ui/TableViews'
 * 
 * const { views, currentView, createView } = useTableViews(EntityType.MONDES)
 * ```
 */
export { useTableViews, default as useTableViewsHook } from '@/hooks/useTableViews'

// ============================================================================
// RE-EXPORT DES UTILITAIRES
// ============================================================================

/**
 * Re-export des fonctions utilitaires et constantes
 */
export {
  // Enum
  EntityType,
  
  // Validation
  validateCreateView,
  validateUpdateView,
  
  // Colonnes disponibles
  AVAILABLE_COLUMNS,
  getAvailableColumns,
  isColumnValid,
  areColumnsValid,
  getInvalidColumns,
  
  // Labels
  ENTITY_TYPE_LABELS,
  getEntityTypeLabel,
} from '@/types/table-views'
