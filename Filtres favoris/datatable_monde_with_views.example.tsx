/**
 * EXEMPLE D'INTÉGRATION - DATATABLE AVEC VUES PERSONNALISÉES
 * ===========================================================
 * 
 * Cet exemple montre comment intégrer le système de vues personnalisées
 * dans un composant DataTable métier existant (ex: datatable_monde.tsx).
 * 
 * APPROCHE : Composition
 * Le hook useTableViews est utilisé dans le composant métier,
 * puis les données sont passées au DataTable via props.
 * 
 * @file datatable_monde_with_views.tsx
 * @example
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// Composants DataTable existants
import { DataTable } from '@/components/ui/DataTable'
import type { ColumnConfig, ColumnState, PaginationMode } from '@/components/ui/DataTable'

// Nouveaux composants pour les vues
import { 
  ViewSelector, 
  ViewSaveModal, 
  ViewDeleteModal,
  useTableViews,
  EntityType,
  TableView,
  CreateTableViewDto,
  UpdateTableViewDto,
  ViewModalMode,
} from '@/components/ui/TableViews'

// Types métier
import { Monde } from '@/types/monde'
import { FilterGroup } from '@/types/api'

// Modals existants
import MondeModal from '../FormModal/MondeModal'
import CreateMondeModal from '../CreateModal/CreateMondeModal'

// ============================================================================
// CONFIGURATION DES COLONNES
// ============================================================================

/**
 * Configuration des colonnes du tableau Mondes
 * Chaque colonne définit son comportement (tri, filtre, rendu, etc.)
 */
const COLUMNS_CONFIG: ColumnConfig<Monde>[] = [
  {
    key: 'nom',
    label: 'Nom',
    sortable: true,
    filterable: true,
    defaultVisible: true,
    width: 200,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    filterable: true,
    defaultVisible: true,
    width: 300,
    render: (monde) => (
      <span className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
        {monde.description || '-'}
      </span>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    filterable: true,
    defaultVisible: true,
    width: 120,
  },
  {
    key: 'statut',
    label: 'Statut',
    sortable: true,
    filterable: true,
    defaultVisible: true,
    width: 100,
    render: (monde) => (
      <span className={`
        px-2 py-1 text-xs font-medium rounded-full
        ${monde.statut === 'actif' 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
      `}>
        {monde.statut}
      </span>
    ),
  },
  {
    key: 'niveau_technologique',
    label: 'Niveau Tech.',
    sortable: true,
    filterable: false,
    defaultVisible: false,  // Masqué par défaut
    width: 120,
  },
  {
    key: 'niveau_magie',
    label: 'Niveau Magie',
    sortable: true,
    filterable: false,
    defaultVisible: false,  // Masqué par défaut
    width: 120,
  },
  {
    key: 'population_estimee',
    label: 'Population',
    sortable: true,
    filterable: false,
    defaultVisible: false,  // Masqué par défaut
    width: 120,
    render: (monde) => (
      <span>{monde.population_estimee?.toLocaleString('fr-FR') || '-'}</span>
    ),
  },
  {
    key: 'dateCreation',
    label: 'Date création',
    sortable: true,
    filterable: false,
    defaultVisible: false,  // Masqué par défaut
    width: 130,
    render: (monde) => (
      <span>
        {monde.dateCreation 
          ? new Date(monde.dateCreation).toLocaleDateString('fr-FR')
          : '-'
        }
      </span>
    ),
  },
]

// ============================================================================
// INTERFACE PROPS
// ============================================================================

interface ListeMondeWithViewsProps {
  // Filtres prédéfinis
  componentFilters?: FilterGroup
  useAdvancedFilters?: boolean
  
  // Configuration
  title?: string
  defaultPageSize?: number
  
  // Actions
  allowDelete?: boolean
  allowCreate?: boolean
  allowEdit?: boolean
  allowClick?: boolean
  showAdvancedFilterBuilder?: boolean
  
  // Pagination
  paginationMode?: PaginationMode
  maxInfiniteItems?: number
  showInfiniteEndMessage?: boolean
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ListeMondeWithViews({
  componentFilters,
  useAdvancedFilters = true,
  title = "Mondes",
  defaultPageSize = 10,
  allowDelete = true,
  allowCreate = true,
  allowEdit = true,
  allowClick = true,
  showAdvancedFilterBuilder = true,
  paginationMode = 'page',
  maxInfiniteItems,
  showInfiniteEndMessage,
}: ListeMondeWithViewsProps) {
  
  const router = useRouter()

  // ==========================================
  // HOOK POUR LES VUES PERSONNALISÉES
  // ==========================================
  
  /**
   * Ce hook gère tout le cycle de vie des vues :
   * - Chargement automatique des vues au montage
   * - Application de la vue par défaut
   * - CRUD (créer, modifier, supprimer)
   * - Gestion du cache React Query
   */
  const {
    views,
    currentView,
    hasUnsavedChanges,
    isLoading: isViewsLoading,
    isMutating,
    selectView,
    createView,
    updateView,
    deleteView,
    setDefaultView,
    markAsModified,
    clearModified,
  } = useTableViews(EntityType.MONDES, {
    onViewChange: (view) => {
      console.log('📋 Vue changée:', view?.name || 'Toutes les colonnes')
    }
  })

  // ==========================================
  // ÉTATS POUR LES MODALS
  // ==========================================
  
  // Modal de sauvegarde
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [saveModalMode, setSaveModalMode] = useState<ViewModalMode>('create')
  const [viewToEdit, setViewToEdit] = useState<TableView | null>(null)
  
  // Modal de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [viewToDelete, setViewToDelete] = useState<TableView | null>(null)
  
  // Modals métier existants
  const [selectedMonde, setSelectedMonde] = useState<Monde | null>(null)
  const [isMondeModalOpen, setIsMondeModalOpen] = useState(false)
  const [isCreateMondeModalOpen, setIsCreateMondeModalOpen] = useState(false)

  // ==========================================
  // ÉTAT DES COLONNES VISIBLES
  // ==========================================
  
  /**
   * Les colonnes actuellement visibles.
   * Initialisées depuis la vue par défaut ou la config par défaut.
   */
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    // Par défaut, prendre les colonnes avec defaultVisible: true
    return COLUMNS_CONFIG
      .filter(col => col.defaultVisible !== false)
      .map(col => col.key)
  })

  /**
   * Synchroniser les colonnes visibles quand la vue courante change
   */
  useEffect(() => {
    if (currentView) {
      // La vue définit les colonnes visibles
      setVisibleColumnKeys(currentView.visibleColumns)
      clearModified()
    }
  }, [currentView, clearModified])

  /**
   * Colonnes filtrées selon la visibilité
   * Ces colonnes sont passées au DataTable
   */
  const visibleColumns = useMemo(() => {
    return COLUMNS_CONFIG.map((col, index) => ({
      ...col,
      visible: visibleColumnKeys.includes(col.key),
      order: index,
    }))
  }, [visibleColumnKeys])

  // ==========================================
  // HANDLERS POUR LES COLONNES
  // ==========================================
  
  /**
   * Appelé quand l'utilisateur modifie la visibilité des colonnes
   * via le ColumnManager du DataTable
   */
  const handleColumnVisibilityChange = useCallback((columns: ColumnState[]) => {
    const newVisibleKeys = columns
      .filter(col => col.visible)
      .map(col => col.key)
    
    setVisibleColumnKeys(newVisibleKeys)
    
    // Marquer comme modifié si différent de la vue courante
    if (currentView) {
      const isDifferent = 
        newVisibleKeys.length !== currentView.visibleColumns.length ||
        !newVisibleKeys.every(key => currentView.visibleColumns.includes(key))
      
      if (isDifferent) {
        markAsModified()
      }
    } else {
      // Pas de vue sélectionnée, considérer comme modifié
      // si différent de la config par défaut
      const defaultKeys = COLUMNS_CONFIG
        .filter(col => col.defaultVisible !== false)
        .map(col => col.key)
      
      const isDifferent = 
        newVisibleKeys.length !== defaultKeys.length ||
        !newVisibleKeys.every(key => defaultKeys.includes(key))
      
      if (isDifferent) {
        markAsModified()
      }
    }
  }, [currentView, markAsModified])

  // ==========================================
  // HANDLERS POUR LES VUES
  // ==========================================
  
  /**
   * Ouvrir le modal de sauvegarde
   */
  const handleSaveClick = useCallback(() => {
    if (currentView && hasUnsavedChanges) {
      // Mode "mettre à jour ou créer"
      setSaveModalMode('update-or-create')
      setViewToEdit(currentView)
    } else if (currentView) {
      // Mode édition simple (juste le nom, pas les colonnes)
      setSaveModalMode('edit')
      setViewToEdit(currentView)
    } else {
      // Mode création
      setSaveModalMode('create')
      setViewToEdit(null)
    }
    setIsSaveModalOpen(true)
  }, [currentView, hasUnsavedChanges])

  /**
   * Éditer une vue (depuis le dropdown)
   */
  const handleEditView = useCallback((view: TableView) => {
    setSaveModalMode('edit')
    setViewToEdit(view)
    setIsSaveModalOpen(true)
  }, [])

  /**
   * Supprimer une vue (depuis le dropdown)
   */
  const handleDeleteView = useCallback((view: TableView) => {
    setViewToDelete(view)
    setIsDeleteModalOpen(true)
  }, [])

  /**
   * Définir une vue par défaut
   */
  const handleSetDefault = useCallback(async (view: TableView) => {
    try {
      await setDefaultView(view.id)
    } catch (error) {
      console.error('Erreur lors de la définition par défaut:', error)
    }
  }, [setDefaultView])

  /**
   * Soumettre le modal de sauvegarde
   */
  const handleSaveSubmit = useCallback(async (
    data: CreateTableViewDto | UpdateTableViewDto,
    viewId?: string
  ) => {
    try {
      if (viewId) {
        // Mise à jour
        await updateView(viewId, data as UpdateTableViewDto)
      } else {
        // Création
        await createView(data as CreateTableViewDto)
      }
      setIsSaveModalOpen(false)
      setViewToEdit(null)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      // L'erreur sera affichée par le hook (toast à implémenter)
    }
  }, [createView, updateView])

  /**
   * Confirmer la suppression
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!viewToDelete) return
    
    try {
      await deleteView(viewToDelete.id)
      setIsDeleteModalOpen(false)
      setViewToDelete(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }, [viewToDelete, deleteView])

  // ==========================================
  // HANDLERS MÉTIER (EXISTANTS)
  // ==========================================
  
  const handleRowClick = useCallback((monde: Monde) => {
    if (allowClick) {
      router.push(`/monde/${monde.id}`)
    }
  }, [allowClick, router])

  const handleEdit = useCallback((monde: Monde) => {
    setSelectedMonde(monde)
    setIsMondeModalOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    setIsCreateMondeModalOpen(true)
  }, [])

  const handleSort = useCallback((key: string, direction: 'ASC' | 'DESC') => {
    console.log('Tri appliqué:', { key, direction })
  }, [])

  // ==========================================
  // RENDU
  // ==========================================
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        
        {/* ==========================================
            SÉLECTEUR DE VUES (AU-DESSUS DU TABLEAU)
            
            Note: Tu peux aussi intégrer ce composant directement
            dans la TableToolbar du DataTable si tu préfères.
            ========================================== */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          
          <ViewSelector
            entityType={EntityType.MONDES}
            views={views}
            currentView={currentView}
            hasUnsavedChanges={hasUnsavedChanges}
            isLoading={isViewsLoading}
            onViewChange={selectView}
            onSaveClick={handleSaveClick}
            onEditView={handleEditView}
            onDeleteView={handleDeleteView}
            onSetDefault={handleSetDefault}
          />
        </div>

        {/* ==========================================
            DATATABLE
            ========================================== */}
        <DataTable<Monde>
          // Configuration de base
          title=""  // Titre vide car on l'affiche au-dessus avec le ViewSelector
          endpoint="/monde"
          queryKey={['mondes']}
          columns={visibleColumns}
          
          // Pagination
          defaultPageSize={defaultPageSize}
          paginationMode={paginationMode}
          maxInfiniteItems={maxInfiniteItems}
          showInfiniteEndMessage={showInfiniteEndMessage}
          
          // Tri
          allowSorting={true}
          defaultSort={{ key: 'nom', direction: 'ASC' }}
          onSort={handleSort}
          
          // Gestion des colonnes
          allowColumnResize={true}
          allowColumnReorder={true}
          // IMPORTANT : Callback pour détecter les changements de colonnes
          onColumnSettingsChange={handleColumnVisibilityChange}
          
          // Actions
          allowDelete={allowDelete}
          allowCreate={allowCreate}
          allowEdit={allowEdit}
          allowClick={allowClick}
          deleteConfirmMessage="Êtes-vous sûr de vouloir supprimer ce monde ?"
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onCreate={handleCreate}
          
          // Filtres
          showFiltersInTable={true}
          showFiltersInPanel={true}
          useAdvancedFilters={useAdvancedFilters}
          showAdvancedFilterBuilder={showAdvancedFilterBuilder}
          componentFilters={componentFilters}
          
          // Style
          className="shadow-lg"
        />
      </div>

      {/* ==========================================
          MODALS VUES
          ========================================== */}
      
      {/* Modal de sauvegarde de vue */}
      <ViewSaveModal
        isOpen={isSaveModalOpen}
        mode={saveModalMode}
        entityType={EntityType.MONDES}
        viewToEdit={viewToEdit}
        currentVisibleColumns={visibleColumnKeys}
        isLoading={isMutating}
        onSubmit={handleSaveSubmit}
        onClose={() => {
          setIsSaveModalOpen(false)
          setViewToEdit(null)
        }}
      />
      
      {/* Modal de confirmation de suppression */}
      <ViewDeleteModal
        isOpen={isDeleteModalOpen}
        viewToDelete={viewToDelete}
        isLoading={isMutating}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setViewToDelete(null)
        }}
      />

      {/* ==========================================
          MODALS MÉTIER (EXISTANTS)
          ========================================== */}
      
      {selectedMonde && (
        <MondeModal
          isOpen={isMondeModalOpen}
          onClose={() => setIsMondeModalOpen(false)}
          monde={selectedMonde}
          onSaved={() => {
            // Rafraîchir automatiquement via React Query
          }}
        />
      )}

      <CreateMondeModal
        isOpen={isCreateMondeModalOpen}
        onClose={() => setIsCreateMondeModalOpen(false)}
        onCreated={(newMonde) => {
          console.log('Nouveau monde créé:', newMonde)
        }}
      />
    </div>
  )
}

// ============================================================================
// NOTES D'INTÉGRATION
// ============================================================================

/**
 * MODIFICATIONS REQUISES DANS DataTable.tsx :
 * 
 * 1. Ajouter une prop `onColumnSettingsChange` qui est appelée
 *    quand l'utilisateur modifie la visibilité des colonnes :
 * 
 *    ```typescript
 *    interface DataTableProps<T> {
 *      // ...
 *      onColumnSettingsChange?: (columns: ColumnState[]) => void
 *    }
 *    ```
 * 
 * 2. Dans le composant DataTable, appeler ce callback quand
 *    `columnSettings` change (après le ColumnManager) :
 * 
 *    ```typescript
 *    useEffect(() => {
 *      if (onColumnSettingsChange) {
 *        onColumnSettingsChange(columnSettings)
 *      }
 *    }, [columnSettings, onColumnSettingsChange])
 *    ```
 * 
 * 3. Pour une intégration plus poussée, tu peux aussi :
 *    - Ajouter les props de vues directement dans DataTableProps
 *    - Intégrer le ViewSelector dans TableToolbar
 *    - Gérer les modals dans DataTable lui-même
 * 
 *    Mais l'approche composition (ce fichier) est plus flexible
 *    et ne modifie pas le comportement du DataTable existant.
 */
