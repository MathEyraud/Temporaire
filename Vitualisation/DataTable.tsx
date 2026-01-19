"use client";

// ==========================================
// IMPORTS
// ==========================================
import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react'
import { useGetPaginatedData, useDeleteData } from '@/hooks/useApi'
import { useInfiniteData } from '@/hooks/useInfiniteData'
import { PaginationParams, FilterGroup } from '@/types/api'

// Composants internes - Chaque composant gère une fonctionnalité spécifique
import TableHeader from './TableHeader'           // En-têtes avec tri et redimensionnement
import TableFilters, { TableRowFilters } from './TableFilters'  // Système de filtrage simple
import ColumnManager from './ColumnManager'       // Modal de gestion des colonnes
import TableToolbar from './TableToolbar'         // Barre d'outils et indicateurs
import Pagination from './Pagination'             // Contrôles de navigation pagination
import InfiniteScroll from './InfiniteScroll'     // Détection scroll infini
import { AdvancedFilterBuilder } from './AdvancedFilterBuilder'  // Constructeur de filtres complexes
import TruncatedCell from './TruncatedCell' //Affichage tronqué du contenu des cellules avec tooltip

// Types TypeScript - Définissent la structure des données et des props
import { DataTableProps, ColumnState, SortConfig, PaginationMode } from './types'
import { useTablePrefetch } from '@/hooks/usePrefetch';

/**
 * COMPOSANT PRINCIPAL DATATABLE
 * 
 * Ce composant est le cœur du système de tableau. Il gère :
 * - L'état global de toutes les fonctionnalités
 * - La coordination entre les sous-composants
 * - Les appels API pour récupérer les données
 * - La synchronisation des filtres, tri et pagination
 * 
 * MODES DE PAGINATION :
 * - 'page' (défaut) : Navigation classique avec boutons de page
 * - 'infinite' : Scroll infini avec chargement automatique
 * 
 * Le composant utilise des génériques TypeScript (<T extends { id: number }>)
 * pour être réutilisable avec différents types de données, avec la contrainte
 * que chaque élément doit avoir un 'id' numérique.
 */
function DataTable<T extends { id: number }>({
  // ==========================================
  // PROPS DE CONFIGURATION DE BASE
  // ==========================================
  title,                    // Titre affiché dans la barre d'outils
  endpoint,                 // URL de l'API pour récupérer les données
  queryKey,                 // Clé unique pour le cache React Query
  columns,                  // Configuration des colonnes du tableau
  defaultPageSize = 10,     // Nombre d'éléments par page par défaut
  pageSizeOptions = [5, 10, 20, 50, 100],
  
  // ==========================================
  // PROPS DE MODE DE PAGINATION
  // ==========================================
  paginationMode = 'page',        // Mode de pagination ('page' | 'infinite')
  maxInfiniteItems,               // Limite max d'éléments en mode infinite
  showInfiniteEndMessage = true,  // Afficher le message de fin en mode infinite
  
  // ==========================================
  // PROPS DE FONCTIONNALITÉS OPTIONNELLES
  // ==========================================
  allowDelete = false,      // Autoriser la suppression d'éléments
  allowEdit = false,      // Autoriser l'edition d'éléments
  allowClick = false,      // Autoriser le clic sur un élément
  allowCreate = false,      // Autoriser la création de nouveaux éléments
  deleteConfirmMessage = "Êtes-vous sûr de vouloir supprimer cet élément ?",
  allowSorting = true,      // Autoriser le tri des colonnes
  defaultSort,              // Configuration de tri par défaut
  allowColumnResize = true, // Autoriser le redimensionnement des colonnes
  allowColumnReorder = true,// Autoriser le réordonnancement par drag&drop
  
  // ==========================================
  // PROPS DE CALLBACKS VERS LE PARENT
  // ==========================================
  onRowClick,               // Fonction appelée au clic sur une ligne
  onEdit,                   // Fonction d'édition d'un élément
  onCreate,                 // Fonction de création d'un nouvel élément
  onSort,                   // Callback optionnel lors du tri
  
  // ==========================================
  // PROPS DE STYLE ET AFFICHAGE
  // ==========================================
  className = "",           // Classes CSS personnalisées
  
  // ==========================================
  // PROPS DE CONFIGURATION DES FILTRES
  // ==========================================
  showFiltersInTable = true,        // Afficher les filtres sous les en-têtes
  showFiltersInPanel = true,        // Afficher les filtres dans un panneau dédié
  useAdvancedFilters = true,        // Activer le système de filtres avancés
  componentFilters,                 // Filtres prédéfinis par le composant parent
  showAdvancedFilterBuilder = true,  // Afficher le constructeur de filtres complexes

  // ==========================================
  // PROPS DE TAILLE DU TABLEAU
  // ==========================================
  fixedWidth,           // Largeur fixe du tableau
  fixedHeight,          // Hauteur fixe optionnelle (IMPORTANT pour infinite scroll)

  //Export CSV
  exportFilename,

  // Configuration du prefetch
  prefetchConfig,

}: DataTableProps<T>) {
  
  // ==========================================
  // ÉTAT LOCAL - GESTION DES COLONNES
  // ==========================================
  
  /**
   * État des colonnes avec leurs propriétés d'affichage
   * Transforme la configuration initiale en état mutable incluant :
   * - visible : si la colonne est affichée
   * - order : ordre d'affichage
   * - width : largeur actuelle
   */
  const [columnSettings, setColumnSettings] = useState<ColumnState[]>(() => {
    return columns.map((col, index) => ({
      ...col,                                    // Copie toute la configuration de base
      visible: col.defaultVisible !== false,    // Visible par défaut sauf si explicitement false
      order: index,                             // Ordre basé sur la position dans le tableau
      width: col.width                          // Largeur initiale si définie
    }))
  })
  
  // État d'ouverture du modal de gestion des colonnes
  const [showColumnManager, setShowColumnManager] = useState(false)

  // ==========================================
  // ÉTAT LOCAL - FILTRES
  // ==========================================
  
  /**
   * Filtres simples par colonne - stockage clé/valeur
   * Exemple : { "name": "john", "status": "active" }
   */
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  
  /**
   * Filtres complexes construits par l'utilisateur
   * Structure hiérarchique permettant des conditions AND/OR imbriquées
   */
  const [userComplexFilters, setUserComplexFilters] = useState<FilterGroup | undefined>()
  
  // États d'ouverture des panneaux de filtres
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSimpleFilters, setShowSimpleFilters] = useState(false)

  // ==========================================
  // ÉTAT LOCAL - TRI ET PAGINATION
  // ==========================================
  
  /**
   * Configuration du tri actuel
   * Contient la colonne triée et la direction (ASC/DESC)
   */
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(defaultSort)
  
  /**
   * Paramètres de pagination pour l'API
   * Cet objet est directement envoyé au backend
   */
  const [paginationParams, setPaginationParams] = useState<PaginationParams>({
    page: 1,                                          // Numéro de page (basé 1)
    limit: defaultPageSize,                           // Nombre d'éléments par page
    filters: {},                                      // Filtres simples
    sortBy: defaultSort ? defaultSort.key : undefined,      // Colonne de tri
    sortOrder: defaultSort ? defaultSort.direction : undefined  // Direction du tri
  })

  // ==========================================
  // RÉFÉRENCE POUR LE CONTENEUR DE SCROLL
  // ==========================================
  
  /**
   * Référence vers le conteneur du tableau
   * Utilisé pour le scroll infini et le calcul de positions
   */
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // PREFETCH - Amélioration des performances de navigation
  // ==========================================
  
  const { getRowPrefetchProps, resetPrefetchCache } = useTablePrefetch(prefetchConfig);

  // ==========================================
  // RÉINITIALISER LE CACHE LORS DES CHANGEMENTS DE DONNÉES
  // ==========================================

  // quand les données changent (pagination, filtres, etc.)
  useEffect(() => {
    // Réinitialiser le cache de prefetch quand les données changent
    resetPrefetchCache();
  }, [paginationParams.page, paginationParams.limit, columnFilters, userComplexFilters, resetPrefetchCache]);

  // ==========================================
  // EFFETS - GESTION DES FILTRES
  // ==========================================
  
  /**
   * Synchronisation des filtres simples avec les paramètres API
   */
  useEffect(() => {
    setPaginationParams(prev => ({
      ...prev,
      filters: columnFilters, // Met à jour les filtres dans les paramètres API
      page: 1                 // Remet à la page 1 lors d'un nouveau filtre
    }))
  }, [columnFilters])

  /**
   * Synchronisation du tri avec les paramètres API
   * Se déclenche immédiatement (pas de debounce) car le tri est une action ponctuelle
   */
  useEffect(() => {
    setPaginationParams(prev => ({
      ...prev,
      sortBy: sortConfig ? sortConfig.key : undefined,
      sortOrder: sortConfig ? sortConfig.direction : undefined,
      page: 1  // Retour à la page 1 lors d'un changement de tri
    }))
  }, [sortConfig])

  // ==========================================
  // HOOKS DE DONNÉES - MODE PAGE (CLASSIQUE)
  // ==========================================
  
  /**
   * Clé de cache pour React Query (mode pagination classique)
   * Inclut tous les paramètres qui influencent les données récupérées
   */
  const cacheKey = [
    ...queryKey,                                  // Clé de base fournie par le parent
    JSON.stringify(paginationParams),             // Paramètres de pagination et tri
    JSON.stringify(componentFilters),             // Filtres prédéfinis du composant
    JSON.stringify(userComplexFilters),           // Filtres avancés de l'utilisateur
    useAdvancedFilters ? 'advanced' : 'legacy'    // Mode de filtrage
  ]

  /**
   * Hook pour pagination classique (mode 'page')
   * N'est utilisé que si paginationMode === 'page'
   */
  const paginatedQuery = useGetPaginatedData<T>(
    cacheKey,
    endpoint,
    paginationParams,
    {
      componentFilters,
      userComplexFilters,
      useAdvancedFilters
    }
  )

  // ==========================================
  // HOOKS DE DONNÉES - MODE INFINITE SCROLL
  // ==========================================
  
  /**
   * Hook pour scroll infini (mode 'infinite')
   * N'est utilisé que si paginationMode === 'infinite'
   */
  const infiniteQuery = useInfiniteData<T>(
    queryKey,
    endpoint,
    {
      limit: paginationParams.limit,
      filters: paginationParams.filters,
      sortBy: paginationParams.sortBy,
      sortOrder: paginationParams.sortOrder
    },
    {
      componentFilters,
      userComplexFilters,
      useAdvancedFilters,
      maxItems: maxInfiniteItems
    }
  )

  // ==========================================
  // SÉLECTION DES DONNÉES SELON LE MODE
  // ==========================================
  
  /**
   * Données et états unifiés selon le mode de pagination
   * Permet au reste du composant de fonctionner de manière identique
   */
  const isInfiniteMode = paginationMode === 'infinite'
  
  // Données à afficher
  const data: T[] = isInfiniteMode 
    ? infiniteQuery.data 
    : (paginatedQuery.data?.data || [])
  
  // État de chargement initial
  const isLoading = isInfiniteMode 
    ? infiniteQuery.isLoading 
    : paginatedQuery.isLoading
  
  // Erreur éventuelle
  const error = isInfiniteMode 
    ? infiniteQuery.error 
    : paginatedQuery.error
  
  // Fonction de rechargement
  const refetch = isInfiniteMode 
    ? infiniteQuery.refetch 
    : paginatedQuery.refetch

  // Données paginées (mode page uniquement)
  const paginatedData = paginatedQuery.data

  /**
   * Hook pour la suppression d'éléments
   * Gère automatiquement l'invalidation du cache après suppression
   */
  const deleteAuth = useDeleteData(
    (id) => `${endpoint}/${id}`,  // Construction de l'URL de suppressio
    queryKey                      // Clé pour invalider le cache
  )

  // ==========================================
  // FONCTIONS - GESTION DES COLONNES
  // ==========================================
  
  /**
   * Bascule la visibilité d'une colonne
   * useCallback évite la recréation de la fonction à chaque rendu
   */
  const toggleColumnVisibility = useCallback((key: string) => {
    setColumnSettings(prev => 
      prev.map(col => 
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    )
  }, [])

  /**
   * Déplace une colonne vers le haut ou le bas dans l'ordre d'affichage
   */
  const moveColumn = useCallback((key: string, direction: 'up' | 'down') => {
    setColumnSettings(prev => {
      // Trier par l'ordre actuel pour avoir la séquence correcte
      const sortedSettings = [...prev].sort((a, b) => a.order - b.order)
      const currentIndex = sortedSettings.findIndex(col => col.key === key)
      
      if (currentIndex === -1) return prev

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      // Vérifier les limites
      if (targetIndex < 0 || targetIndex >= sortedSettings.length) {
        return prev
      }

      // Effectuer le déplacement
      const newSettings = [...sortedSettings]
      const [movedItem] = newSettings.splice(currentIndex, 1)  // Retirer l'élément
      newSettings.splice(targetIndex, 0, movedItem)            // L'insérer à la nouvelle position
      
      // Recalculer les ordres
      return newSettings.map((col, index) => ({
        ...col,
        order: index
      }))
    })
  }, [])

  /**
   * Met à jour la largeur d'une colonne après redimensionnement
   */
  const handleColumnResize = useCallback((key: string, width: number) => {
    setColumnSettings(prev => 
      prev.map(col => 
        col.key === key ? { ...col, width } : col
      )
    )
  }, [])

  /**
   * Réordonne les colonnes par drag & drop
   * dragKey : colonne déplacée, dropKey : position de destination
   */
  const handleColumnReorder = useCallback((dragKey: string, dropKey: string) => {
    setColumnSettings(prev => {
      const sortedSettings = [...prev].sort((a, b) => a.order - b.order)
      const dragIndex = sortedSettings.findIndex(col => col.key === dragKey)
      const dropIndex = sortedSettings.findIndex(col => col.key === dropKey)
      
      if (dragIndex === -1 || dropIndex === -1) return prev

      // Effectuer le réordonnancement
      const newSettings = [...sortedSettings]
      const [draggedItem] = newSettings.splice(dragIndex, 1)
      newSettings.splice(dropIndex, 0, draggedItem)
      
      // Recalculer les ordres
      return newSettings.map((col, index) => ({
        ...col,
        order: index
      }))
    })
  }, [])

  /**
   * Remet les colonnes dans leur configuration initiale
   */
  const resetColumns = useCallback(() => {
    setColumnSettings(
      columns.map((col, index) => ({
        ...col,
        visible: col.defaultVisible !== false,
        order: index,
        width: col.width
      }))
    )
  }, [columns])

  // ==========================================
  // FONCTIONS - GESTION DU TRI
  // ==========================================
  
  /**
   * Gère le tri d'une colonne
   * Met à jour l'état local et appelle le callback parent si fourni
   */
  const handleSort = useCallback((key: string, direction: 'ASC' | 'DESC') => {
    const newSortConfig = { key, direction }
    setSortConfig(newSortConfig)
    onSort?.(key, direction)  // Appel optionnel au parent
  }, [onSort])

  // ==========================================
  // FONCTIONS - GESTION DES FILTRES
  // ==========================================
  
  /**
   * Met à jour un filtre de colonne spécifique
   * Supprime le filtre si la valeur est vide
   */
  const handleColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setColumnFilters(prev => {
      if (value.trim() === '') {
        // Supprimer le filtre si la valeur est vide
        const { [columnKey]: removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [columnKey]: value.trim()
      }
    })
  }, [])

  /**
   * Vide tous les filtres simples
   */
  const clearAllFilters = useCallback(() => {
    setColumnFilters({})
  }, [])

  /**
   * Met à jour les filtres complexes et remet à la page 1
   */
  const handleUserComplexFiltersChange = useCallback((newFilters?: FilterGroup) => {
    setUserComplexFilters(newFilters)
    setPaginationParams(prev => ({ 
      ...prev, 
      page: 1 
    }))
  }, [])

  // ==========================================
  // FONCTIONS - GESTION DE LA PAGINATION (MODE PAGE)
  // ==========================================
  
  /**
   * Change la page courante
   */
  const handlePageChange = useCallback((newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }))
  }, [])

  /**
   * Change le nombre d'éléments par page et remet à la page 1
   */
  const handlePageSizeChange = useCallback((newLimit: number) => {
    setPaginationParams(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }))
  }, [])

  // ==========================================
  // FONCTIONS - ACTIONS TABLEAU
  // ==========================================
  
  /**
   * Gère la suppression d'un élément avec confirmation
   */
  const handleDelete = useCallback((id: string | number) => {
    if (confirm(deleteConfirmMessage)) {
      deleteAuth.mutate(id)  // Déclenche la mutation de suppression
    }
  }, [deleteConfirmMessage, deleteAuth])

  /**
   * Actualise manuellement les données
   */
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // ==========================================
  // FONCTIONS UTILITAIRES
  // ==========================================
  
  /**
   * Rendu du contenu d'une cellule avec gestion de la troncature
   * Utilise le renderer personnalisé si fourni, sinon affiche la valeur avec troncature
   * Supporte les propriétés imbriquées avec la notation point (ex: "user.name")
   */
  const renderCellContent = useCallback((item: T, column: ColumnState) => {
    // Si un renderer personnalisé est défini, l'utiliser
    if (column.render) {
      const content = column.render(item)
      return <TruncatedCell>{content}</TruncatedCell>
    }
    
    // Sinon, extraire la valeur selon la clé (support des propriétés imbriquées)
    const keys = column.key.split('.')
    let value: any = item
    
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined || value === null) break
    }
    
    const displayValue = value?.toString() || '-'
    return <TruncatedCell>{displayValue}</TruncatedCell>
  }, [])

  // ==========================================
  // DONNÉES DÉRIVÉES
  // ==========================================
  
  /**
   * Colonnes visibles triées par leur ordre d'affichage
   */
  const visibleColumns = useMemo(() => 
  columnSettings
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order),
  [columnSettings]
)

  const activeFiltersCount = Object.keys(columnFilters).length
  const hasActiveFilters = activeFiltersCount > 0

  // ==========================================
  // FONCTIONS EXPORT
  // ==========================================
  
  /**
   * Extrait la valeur brute d'une cellule pour l'export CSV
   * Similaire à renderCellContent mais retourne une string au lieu d'un composant
   * Gère les renderers personnalisés en essayant d'extraire le texte
   */
  const getRawCellValue = useCallback((item: T, column: ColumnState): string => {
    // Si un renderer personnalisé est défini
    if (column.render) {
      const renderedContent = column.render(item)
      
      // Si le renderer retourne un string, l'utiliser directement
      if (typeof renderedContent === 'string') {
        return renderedContent
      }
      
      // Si c'est un nombre, le convertir
      if (typeof renderedContent === 'number') {
        return renderedContent.toString()
      }
      
      // Si c'est un objet React, essayer d'extraire le texte
      if (renderedContent && typeof renderedContent === 'object' && 'props' in renderedContent) {
        // Cas courant : <span>text</span> ou {text}
        const props = (renderedContent as any).props
        if (props && typeof props.children === 'string') {
          return props.children
        }
        if (props && typeof props.children === 'number') {
          return props.children.toString()
        }
      }
      
      // Fallback : essayer toString() ou extraire la valeur brute de la colonne
      if (renderedContent && typeof renderedContent.toString === 'function') {
        const stringValue = renderedContent.toString()
        // Éviter [object Object]
        if (stringValue !== '[object Object]') {
          return stringValue
        }
      }
    }
    
    // Extraction standard de la valeur (même logique que renderCellContent)
    const keys = column.key.split('.')
    let value: any = item
    
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined || value === null) break
    }
    
    return value?.toString() || '-'
  }, [])

  /**
   * Exporte les données visibles en CSV
   */
  const exportToCSV = useCallback((filename: string = 'export.csv') => {
    // Génération intelligente du nom de fichier
    let finalFilename = filename

    if (filename === 'export.csv') {
      const baseName = exportFilename || 'datatable'
      const dateStamp = new Date().toISOString().split('T')[0]
      finalFilename = `${baseName}_export_${dateStamp}.csv`
    }

    const csvContent = [
      // En-têtes : labels des colonnes visibles
      visibleColumns.map(col => {
        // Échapper les guillemets dans les en-têtes
        const label = col.label.replace(/"/g, '""')
        return label.includes(',') || label.includes('"') || label.includes('\n') 
          ? `"${label}"` 
          : label
      }).join(','),
      
      // Données : une ligne par élément avec valeurs brutes
      ...data.map((item) => (
        visibleColumns.map(col => {
          const rawValue = getRawCellValue(item, col)
          
          // Échapper les caractères spéciaux CSV
          if (typeof rawValue === 'string' && (
            rawValue.includes(',') || 
            rawValue.includes('"') || 
            rawValue.includes('\n') ||
            rawValue.includes('\r')
          )) {
            return `"${rawValue.replace(/"/g, '""')}"`
          }
          
          return rawValue
        }).join(',')
      ))
    ].join('\n')

    // Création et téléchargement du fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Nettoyer l'URL pour libérer la mémoire
    URL.revokeObjectURL(url)
  }, [visibleColumns, data, getRawCellValue, exportFilename])

  // ==========================================
  // RENDU - ÉTATS DE CHARGEMENT
  // ==========================================
  
  /**
   * Affichage pendant le chargement initial des données
   * Note: En mode infinite, on n'affiche pas le loader pour les pages suivantes ici
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-lg text-gray-600 dark:text-gray-300">Chargement des données...</span>
        </div>
      </div>
    )
  }

  /**
   * Affichage en cas d'erreur avec possibilité de retry
   */
  if (error) {
    return (
      <div className="p-6 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-red-800 dark:text-red-200 font-medium">Erreur lors du chargement des données</p>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error.message}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  
  return (
    <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        style={{
          width: fixedWidth ? (typeof fixedWidth === 'number' ? `${fixedWidth}px` : fixedWidth) : 'auto'
        }}
      >
      
      {/* ==========================================
          BARRE D'OUTILS
          ========================================== */}
      <TableToolbar
        title={title}
        simpleFiltersCount={activeFiltersCount}
        hasComplexFilters={!!userComplexFilters}
        hasComponentFilters={!!componentFilters}
        onClearSimpleFilters={clearAllFilters}
        onClearComplexFilters={() => handleUserComplexFiltersChange(undefined)}
        showAdvancedFilterBuilder={showAdvancedFilterBuilder}
        onToggleSimpleFilters={() => setShowSimpleFilters(!showSimpleFilters)}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        simpleFiltersOpen={showSimpleFilters}
        advancedFiltersOpen={showAdvancedFilters}
        onToggleColumnManager={() => setShowColumnManager(true)}
        onRefresh={handleRefresh}
        onExport={exportToCSV}
        allowCreate={allowCreate}
        onCreate={onCreate}
      />

      {/* ==========================================
          PANNEAU DE FILTRES AVANCÉS
          Interface de construction de filtres complexes
          ========================================== */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-6">
            <AdvancedFilterBuilder
              columns={columns}
              filters={userComplexFilters}
              onChange={handleUserComplexFiltersChange}
            />
          </div>
        </div>
      )}

      {/* ==========================================
          PANNEAU DE FILTRES SIMPLES
          Filtres par colonne dans un panneau dédié
          ========================================== */}
      {showFiltersInPanel && showSimpleFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-6">
            <TableFilters
              columns={columnSettings}
              columnFilters={columnFilters}
              onFilterChange={handleColumnFilterChange}
              onClearAll={clearAllFilters}
              showInTable={false}
              showInPanel={true}
            />
          </div>
        </div>
      )}

      {/* ==========================================
          MESSAGE AUCUN RÉSULTAT APRÈS FILTRAGE
          Affiché quand des filtres sont actifs mais aucun résultat
          ========================================== */}
      {!data.length && (hasActiveFilters || userComplexFilters) && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">Aucun résultat trouvé</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Essayez de modifier vos critères de recherche</p>
          
          {/* Boutons pour vider les filtres */}
          <div className="flex justify-center space-x-4 mt-4">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm"
              >
                Vider les filtres simples
              </button>
            )}
            {userComplexFilters && (
              <button
                onClick={() => handleUserComplexFiltersChange(undefined)}
                className="px-4 py-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-sm"
              >
                Vider les filtres avancés
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MESSAGE AUCUNE DONNÉE DISPONIBLE
          Affiché quand il n'y a aucune donnée ET aucun filtre actif
          ========================================== */}
      {!data.length && !hasActiveFilters && !userComplexFilters && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">Aucune donnée disponible</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {allowCreate && onCreate 
              ? "Cliquez sur \"Nouveau\" pour créer votre premier élément"
              : "Les données apparaîtront ici une fois disponibles"
            }
          </p>
        </div>
      )}

      {/* ==========================================
          TABLEAU DES DONNÉES
          Le tableau principal avec les données, en-têtes et filtres
          ========================================== */}
      {data.length > 0 && (
        <div 
          ref={tableContainerRef}
          className="border-t border-gray-200 dark:border-gray-700 overflow-y-auto"
          style={{
            overflowX: 'auto',
            height: fixedHeight ? (typeof fixedHeight === 'number' ? `${fixedHeight}px` : fixedHeight) : 'auto',
            // En mode infinite sans hauteur fixe, on définit une hauteur max par défaut
            maxHeight: isInfiniteMode && !fixedHeight ? '600px' : undefined
          }}
        >
         <table 
            className="datatable-fixed min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            
            {/* EN-TÊTES */}
            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
              {/* En-têtes avec fonctionnalités de tri, redimensionnement et drag&drop */}
              <TableHeader
                columns={visibleColumns}
                onSort={allowSorting ? handleSort : undefined}
                sortConfig={sortConfig}
                onColumnResize={allowColumnResize ? handleColumnResize : undefined}
                onColumnReorder={allowColumnReorder ? handleColumnReorder : undefined}
                allowDelete={allowDelete}
                onEdit={!!onEdit}
              />
              
              {/* Ligne de filtres sous les en-têtes (si activée) */}
              {showFiltersInTable && (
                <TableRowFilters
                  columns={visibleColumns}
                  columnFilters={columnFilters}
                  onFilterChange={handleColumnFilterChange}
                  allowDelete={allowDelete}
                  onEdit={!!onEdit}
                />
              )}
            </thead>
            
            {/* CORPS DU TABLEAU */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item) => (
                <tr 
                  key={item.id} 
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    ${onRowClick && allowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={allowClick && onRowClick ? () => onRowClick?.(item) : undefined}
                  {...getRowPrefetchProps(item)}
                >
                  {/* CELLULES DE DONNÉES */}
                  {visibleColumns.map((column) => (
                    <td 
                      key={column.key} 
                      className="datatable-cell px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                      style={{ 
                        // CRUCIAL : largeurs fixes avec table-layout:fixed
                        width: column.width ? `${column.width}px` : `${100 / visibleColumns.length}%`,
                        minWidth: 0, // Permet la troncature même avec du contenu long
                        maxWidth: column.width ? `${column.width}px` : `${100 / visibleColumns.length}%`,
                        overflow: 'hidden', // Cache le débordement
                        whiteSpace: 'nowrap' // Empêche le retour à la ligne
                      }}
                    >
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                  
                  {/* COLONNE ACTIONS */}
                  {(allowDelete || ( allowEdit && onEdit)) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {/* Bouton d'édition */}
                        {allowEdit && onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()  // Empêche le clic sur la ligne
                              onEdit(item)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Bouton de suppression */}
                        {allowDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()  // Empêche le clic sur la ligne
                              handleDelete(item.id)
                            }}
                            disabled={deleteAuth.isLoading}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Supprimer"
                          >
                            {/* Spinner pendant la suppression, icône poubelle sinon */}
                            {deleteAuth.isLoading ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 dark:border-red-400 border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ==========================================
              COMPOSANT INFINITE SCROLL (MODE INFINITE)
              Placé à la fin du tableau pour détecter le scroll
              ========================================== */}
          {isInfiniteMode && (
            <InfiniteScroll
              onLoadMore={() => infiniteQuery.fetchNextPage()}
              hasMore={infiniteQuery.hasNextPage}
              isLoading={infiniteQuery.isFetchingNextPage}
              showEndMessage={showInfiniteEndMessage}
              loadingText="Chargement des données..."
              endText={`${infiniteQuery.loadedItems} éléments chargés sur ${infiniteQuery.totalItems}`}
            />
          )}
        </div>
      )}

      {/* ==========================================
          PAGINATION (MODE PAGE UNIQUEMENT)
          ========================================== */}
      {!isInfiniteMode && paginatedData && data.length > 0 && (
        <Pagination
          currentPage={paginatedData.page}
          totalPages={paginatedData.totalPages}
          totalItems={paginatedData.total}
          pageSize={paginationParams.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}

      {/* ==========================================
          INDICATEUR DE COMPTEUR (MODE INFINITE)
          Affiché en bas pour indiquer le nombre d'éléments chargés
          ========================================== */}
      {isInfiniteMode && data.length > 0 && !infiniteQuery.isFetchingNextPage && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
            <span className="font-medium">{infiniteQuery.loadedItems}</span> éléments affichés
            {infiniteQuery.totalItems > 0 && (
              <span> sur <span className="font-medium">{infiniteQuery.totalItems}</span> au total</span>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          GESTIONNAIRE DE COLONNES (MODAL)
          ========================================== */}
      <ColumnManager
        columns={columnSettings}
        onToggleVisibility={toggleColumnVisibility}
        onMoveColumn={moveColumn}
        onResetColumns={resetColumns}
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />
    </div>
  )
}

// ==========================================
// EXPORT
// ==========================================

export default memo(DataTable) as typeof DataTable

export type { DataTableProps, ColumnConfig, SortConfig, PaginationMode } from './types'
