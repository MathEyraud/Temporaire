// src/components/ui/DataTable/index.ts

/**
 * INDEX DES EXPORTS DU MODULE DATATABLE
 * 
 * Ce fichier centralise tous les exports du système DataTable.
 * Il permet d'importer les composants et types de manière organisée.
 * 
 * USAGE :
 * ```typescript
 * // Import du composant principal
 * import { DataTable } from '@/components/ui/DataTable'
 * 
 * // Import avec types
 * import { DataTable, ColumnConfig, PaginationMode, VirtualizationConfig } from '@/components/ui/DataTable'
 * 
 * // Import des sous-composants (si besoin)
 * import { TableHeader, Pagination, VirtualizedTableBody } from '@/components/ui/DataTable'
 * ```
 */

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * DataTable : Composant principal de tableau de données
 * 
 * Supporte 3 modes de pagination :
 * - 'page' : Navigation classique par pages
 * - 'infinite' : Scroll infini avec chargement automatique
 * - 'virtualized' : Scroll infini avec virtualisation (recommandé pour 100+ lignes)
 * 
 * @example
 * ```tsx
 * <DataTable<Personnage>
 *   title="Personnages"
 *   endpoint="/personnage"
 *   queryKey={['personnages']}
 *   columns={columns}
 *   paginationMode="virtualized"
 *   virtualizationConfig={{ rowHeight: 52 }}
 * />
 * ```
 */
export { default as DataTable } from './DataTable'

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

/**
 * TableHeader : En-têtes du tableau avec tri et redimensionnement
 */
export { default as TableHeader } from './TableHeader'

/**
 * TableFilters : Système de filtrage simple par colonnes
 */
export { default as TableFilters, TableRowFilters } from './TableFilters'

/**
 * AdvancedFilterBuilder : Constructeur de filtres complexes
 */
export { AdvancedFilterBuilder } from './AdvancedFilterBuilder'

/**
 * ColumnManager : Modal de gestion des colonnes
 */
export { default as ColumnManager } from './ColumnManager'

/**
 * TableToolbar : Barre d'outils du tableau
 */
export { default as TableToolbar } from './TableToolbar'

/**
 * Pagination : Contrôles de pagination classique
 */
export { default as Pagination } from './Pagination'

/**
 * InfiniteScroll : Détecteur de scroll pour chargement automatique
 */
export { default as InfiniteScroll } from './InfiniteScroll'

/**
 * VirtualizedTableBody : Corps du tableau avec virtualisation
 * Utilisé automatiquement en mode 'virtualized'
 * Peut aussi être utilisé directement pour des cas personnalisés
 */
export { default as VirtualizedTableBody } from './VirtualizedTableBody'

/**
 * TruncatedCell : Cellule avec troncature et tooltip
 */
export { default as TruncatedCell } from './TruncatedCell'

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type { 
  /**
   * DataTableProps : Props du composant principal
   */
  DataTableProps, 
  
  /**
   * ColumnConfig : Configuration d'une colonne
   */
  ColumnConfig, 
  
  /**
   * SortConfig : Configuration du tri
   */
  SortConfig, 
  
  /**
   * ColumnState : État d'une colonne (visibilité, largeur, ordre)
   */
  ColumnState,
  
  /**
   * ResizeState : État du redimensionnement
   */
  ResizeState,
  
  /**
   * DragState : État du drag & drop des colonnes
   */
  DragState,
  
  /**
   * PaginationMode : Mode de pagination ('page' | 'infinite' | 'virtualized')
   */
  PaginationMode,
  
  /**
   * VirtualizationConfig : Configuration de la virtualisation
   * 
   * @example
   * ```typescript
   * const config: VirtualizationConfig = {
   *   rowHeight: 52,          // Hauteur des lignes en px
   *   overscan: 5,            // Lignes à pré-rendre
   *   containerHeight: 600,   // Hauteur du conteneur
   *   scrollThreshold: 10,    // Seuil pour charger plus
   *   showScrollIndicator: true
   * }
   * ```
   */
  VirtualizationConfig,
  
  /**
   * VirtualizedTableBodyProps : Props du corps virtualisé
   */
  VirtualizedTableBodyProps,
  
  /**
   * ScrollPositionIndicatorProps : Props de l'indicateur de position
   */
  ScrollPositionIndicatorProps,
} from './types'

/**
 * Constantes exportées
 */
export { DEFAULT_VIRTUALIZATION_CONFIG } from './types'

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export { default } from './DataTable'

/**
 * RÉSUMÉ DE L'ARCHITECTURE :
 * =========================
 * 
 * Ce module organise un système de tableau de données complet :
 * 
 * 1. UN COMPOSANT PRINCIPAL (DataTable)
 *    └── Orchestre tous les sous-composants
 *    └── Supporte 3 modes : 'page', 'infinite', 'virtualized'
 * 
 * 2. DES SOUS-COMPOSANTS SPÉCIALISÉS :
 *    ├── TableToolbar         → Barre d'outils
 *    ├── TableHeader          → En-têtes avec tri  
 *    ├── TableFilters         → Filtrage simple
 *    ├── AdvancedFilterBuilder → Filtres complexes
 *    ├── ColumnManager        → Gestion des colonnes
 *    ├── Pagination           → Navigation par pages
 *    ├── InfiniteScroll       → Chargement automatique
 *    ├── VirtualizedTableBody → Rendu virtualisé (NOUVEAU)
 *    └── TruncatedCell        → Cellules tronquées
 * 
 * 3. DES TYPES TYPESCRIPT
 *    └── Définissent toutes les structures de données
 * 
 * MODES DE PAGINATION :
 * ====================
 * 
 * 'page' (défaut)
 *   → Pagination classique avec boutons
 *   → Idéal pour < 100 éléments par page
 * 
 * 'infinite'
 *   → Scroll infini avec chargement automatique
 *   → Toutes les lignes sont dans le DOM
 *   → Idéal pour < 500 éléments total
 * 
 * 'virtualized' (NOUVEAU)
 *   → Scroll infini + virtualisation
 *   → Seules les lignes visibles sont dans le DOM
 *   → Idéal pour 100+ à 5000+ éléments
 *   → Navigation directe via l'ascenseur
 */
