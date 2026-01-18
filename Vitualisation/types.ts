// src/components/ui/DataTable/types.ts

import { PrefetchConfig } from '@/hooks/usePrefetch'
import { FilterGroup } from '@/types/api'

// ============================================================================
// TYPE POUR LE MODE DE PAGINATION
// ============================================================================

/**
 * Mode de pagination du DataTable
 * 
 * - 'page' : Pagination classique avec navigation par numéros de pages
 *            L'utilisateur clique sur les boutons pour changer de page
 *            Les données d'une seule page sont affichées à la fois
 * 
 * - 'infinite' : Scroll infini avec chargement automatique
 *               Les données se chargent automatiquement quand l'utilisateur
 *               atteint le bas du tableau. Les données s'accumulent.
 * 
 * - 'virtualized' : Scroll infini avec virtualisation des lignes
 *                   Combine le chargement infini avec le rendu virtuel
 *                   Seules les lignes visibles sont dans le DOM
 *                   Idéal pour les grands volumes de données (1000+ lignes)
 */
export type PaginationMode = 'page' | 'infinite' | 'virtualized'

// ============================================================================
// CONFIGURATION DE LA VIRTUALISATION
// ============================================================================

/**
 * Configuration pour le mode virtualisé
 * Permet de personnaliser le comportement de la virtualisation
 */
export interface VirtualizationConfig {
  /**
   * Hauteur de chaque ligne en pixels
   * IMPORTANT : Doit être constante pour toutes les lignes
   * @default 48
   */
  rowHeight?: number
  
  /**
   * Nombre de lignes à pré-rendre au-dessus et en-dessous de la zone visible
   * Plus ce nombre est élevé, plus le scroll sera fluide mais plus le DOM sera lourd
   * @default 5
   */
  overscan?: number
  
  /**
   * Hauteur du conteneur du tableau en pixels
   * Si non spécifié, utilise fixedHeight ou une hauteur par défaut
   * @default 600
   */
  containerHeight?: number
  
  /**
   * Seuil de lignes restantes avant de déclencher le chargement de la page suivante
   * Ex: si scrollThreshold = 10, on charge quand il reste 10 lignes avant la fin
   * @default 10
   */
  scrollThreshold?: number
  
  /**
   * Afficher un indicateur de position dans le scroll
   * Utile pour les très grands ensembles de données
   * @default true
   */
  showScrollIndicator?: boolean
}

/**
 * Valeurs par défaut pour la configuration de virtualisation
 * Utilisées quand aucune configuration n'est fournie
 */
export const DEFAULT_VIRTUALIZATION_CONFIG: Required<VirtualizationConfig> = {
  rowHeight: 48,
  overscan: 5,
  containerHeight: 600,
  scrollThreshold: 10,
  showScrollIndicator: true,
}

// ============================================================================
// CONFIGURATION DES COLONNES
// ============================================================================

/**
 * Configuration d'une colonne du tableau
 * Définit comment une colonne doit être affichée et se comporter
 */
export interface ColumnConfig<T = any> {
  /** Clé unique de la colonne, correspond au champ dans les données */
  key: string
  
  /** Libellé affiché dans l'en-tête de la colonne */
  label: string
  
  /** Fonction de rendu personnalisé pour le contenu des cellules */
  render?: (item: T) => React.ReactNode
  
  /** La colonne peut être triée */
  sortable?: boolean
  
  /** La colonne peut être filtrée */
  filterable?: boolean
  
  /** Visible par défaut (true si non spécifié) */
  defaultVisible?: boolean
  
  /** Placeholder personnalisé pour le champ de filtre */
  filterPlaceholder?: string
  
  /** Largeur en pixels */
  width?: number
  
  /** Largeur minimum en pixels */
  minWidth?: number
  
  /** Largeur maximum en pixels */
  maxWidth?: number
  
  /** Ordre d'affichage (calculé automatiquement si non spécifié) */
  order?: number
  
  /** Visibilité actuelle (état interne) */
  visible?: boolean
}

// ============================================================================
// CONFIGURATION DU TRI
// ============================================================================

/**
 * Configuration du tri actif
 * Stocke quelle colonne est triée et dans quel sens
 */
export interface SortConfig {
  /** Clé de la colonne triée */
  key: string
  
  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

// ============================================================================
// ÉTAT DES COLONNES
// ============================================================================

/**
 * État complet d'une colonne avec ses paramètres de gestion
 * Étend ColumnConfig avec les propriétés d'état
 */
export interface ColumnState extends ColumnConfig {
  /** La colonne est actuellement visible */
  visible: boolean
  
  /** Position dans l'ordre d'affichage */
  order: number
  
  /** Largeur actuelle (peut différer de la largeur initiale après redimensionnement) */
  width?: number
}

// ============================================================================
// ÉTATS DE GESTION DES COLONNES
// ============================================================================

/**
 * État du redimensionnement d'une colonne
 */
export interface ResizeState {
  /** Clé de la colonne en cours de redimensionnement */
  columnKey: string | null
  
  /** Position X initiale de la souris */
  startX: number
  
  /** Largeur initiale de la colonne */
  startWidth: number
}

/**
 * État du drag & drop des colonnes
 */
export interface DragState {
  /** Clé de la colonne en cours de déplacement */
  draggedColumn: string | null
  
  /** Clé de la colonne survolée (cible potentielle) */
  targetColumn: string | null
}

// ============================================================================
// PROPS DU COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Props du composant DataTable
 * Définit toutes les propriétés que peut recevoir le composant principal
 */
export interface DataTableProps<T = any> {
  // ==========================================
  // CONFIGURATION DE BASE
  // ==========================================
  
  /** Titre affiché dans la barre d'outils du tableau */
  title: string
  
  /** URL de l'endpoint API pour récupérer les données */
  endpoint: string
  
  /** Clé unique pour le cache React Query */
  queryKey: string[]
  
  /** Configuration des colonnes du tableau */
  columns: ColumnConfig<T>[]
  
  // ==========================================
  // CONFIGURATION DE LA PAGINATION
  // ==========================================
  
  /**
   * Mode de pagination
   * - 'page' : Navigation classique par pages (défaut)
   * - 'infinite' : Scroll infini avec chargement automatique
   * - 'virtualized' : Scroll infini avec virtualisation (recommandé pour 100+ lignes)
   * @default 'page'
   */
  paginationMode?: PaginationMode
  
  /** Nombre d'éléments par page/chargement par défaut */
  defaultPageSize?: number
  
  /** Options de taille de page pour le sélecteur (mode 'page' uniquement) */
  pageSizeOptions?: number[]
  
  /**
   * Limite maximale d'éléments à charger en mode infinite/virtualized
   * Permet de limiter la consommation mémoire
   */
  maxInfiniteItems?: number
  
  /** Afficher le message de fin en mode infinite */
  showInfiniteEndMessage?: boolean
  
  // ==========================================
  // CONFIGURATION DE LA VIRTUALISATION
  // ==========================================
  
  /**
   * Configuration de la virtualisation (mode 'virtualized' uniquement)
   * Permet de personnaliser hauteur des lignes, overscan, etc.
   */
  virtualizationConfig?: VirtualizationConfig
  
  // ==========================================
  // CONFIGURATION DES FONCTIONNALITÉS
  // ==========================================
  
  /** Autoriser la suppression d'éléments */
  allowDelete?: boolean
  
  /** Autoriser l'édition d'éléments */
  allowEdit?: boolean
  
  /** Autoriser le clic sur les lignes */
  allowClick?: boolean
  
  /** Autoriser la création de nouveaux éléments */
  allowCreate?: boolean
  
  /** Message de confirmation pour la suppression */
  deleteConfirmMessage?: string
  
  /** Autoriser le tri sur les colonnes */
  allowSorting?: boolean
  
  /** Autoriser le redimensionnement des colonnes */
  allowColumnResize?: boolean
  
  /** Autoriser la réorganisation des colonnes */
  allowColumnReorder?: boolean
  
  // ==========================================
  // CONFIGURATION DES FILTRES
  // ==========================================
  
  /** Afficher les filtres dans les en-têtes du tableau */
  showFiltersInTable?: boolean
  
  /** Afficher les filtres dans un panneau séparé */
  showFiltersInPanel?: boolean
  
  /** Utiliser les filtres avancés (POST avec FilterGroup) */
  useAdvancedFilters?: boolean
  
  /** Afficher le constructeur de filtres avancés */
  showAdvancedFilterBuilder?: boolean
  
  /** Filtres imposés par le composant parent */
  componentFilters?: FilterGroup
  
  // ==========================================
  // CONFIGURATION DU TRI
  // ==========================================
  
  /** Tri par défaut au chargement */
  defaultSort?: SortConfig
  
  // ==========================================
  // CONFIGURATION DE L'AFFICHAGE
  // ==========================================
  
  /** Hauteur fixe du tableau en pixels */
  fixedHeight?: number
  
  /** Classes CSS additionnelles */
  className?: string
  
  // ==========================================
  // CONFIGURATION DU PREFETCH
  // ==========================================
  
  /** Configuration du préchargement des pages de détail */
  prefetchConfig?: PrefetchConfig
  
  // ==========================================
  // CALLBACKS
  // ==========================================
  
  /** Appelé lors du clic sur une ligne */
  onRowClick?: (item: T) => void
  
  /** Appelé lors du clic sur le bouton Modifier */
  onEdit?: (item: T) => void
  
  /** Appelé lors du clic sur le bouton Créer */
  onCreate?: () => void
  
  /** Appelé lors d'un changement de tri */
  onSort?: (sortConfig: SortConfig) => void
  
  /** Appelé lors d'un changement de filtres */
  onFiltersChange?: (filters: Record<string, string>) => void
}

// ============================================================================
// PROPS DES SOUS-COMPOSANTS VIRTUALISÉS
// ============================================================================

/**
 * Props du composant VirtualizedTableBody
 * Gère le rendu virtualisé des lignes du tableau
 */
export interface VirtualizedTableBodyProps<T> {
  /** Données à afficher */
  data: T[]
  
  /** Configuration des colonnes visibles */
  columns: ColumnState[]
  
  /** Configuration de virtualisation */
  virtualizationConfig: Required<VirtualizationConfig>
  
  /** Hauteur du conteneur */
  containerHeight: number
  
  /** Callback pour le clic sur une ligne */
  onRowClick?: (item: T) => void
  
  /** Callback pour l'édition */
  onEdit?: (item: T) => void
  
  /** Callback pour la suppression */
  onDelete?: (id: number) => void
  
  /** Afficher les actions */
  showActions?: boolean
  
  /** Autoriser la suppression */
  allowDelete?: boolean
  
  /** Autoriser l'édition */
  allowEdit?: boolean
  
  /** Autoriser le clic */
  allowClick?: boolean
  
  /** ID de l'élément en cours de suppression */
  deletingId?: number | null
  
  /** Callback quand on approche de la fin (pour charger plus) */
  onNearEnd?: () => void
  
  /** Indique si plus de données sont disponibles */
  hasMore?: boolean
  
  /** Indique si un chargement est en cours */
  isLoadingMore?: boolean
  
  /** Nombre total d'éléments (pour l'indicateur) */
  totalItems?: number
  
  /** Props de prefetch pour chaque ligne */
  getRowPrefetchProps?: (item: T) => Record<string, unknown>
}

/**
 * Props du composant ScrollPositionIndicator
 * Affiche la position actuelle dans le scroll
 */
export interface ScrollPositionIndicatorProps {
  /** Index de la première ligne visible */
  startIndex: number
  
  /** Index de la dernière ligne visible */
  endIndex: number
  
  /** Nombre total de lignes */
  totalRows: number
  
  /** Visible ou non */
  visible: boolean
}
