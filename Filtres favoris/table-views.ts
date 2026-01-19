/**
 * TYPES POUR LES VUES DE TABLEAUX
 * ================================
 * 
 * Ce fichier définit tous les types TypeScript nécessaires pour
 * la fonctionnalité de vues personnalisées des tableaux.
 * 
 * Les vues permettent aux utilisateurs de :
 * - Sauvegarder une configuration de colonnes visibles
 * - Créer plusieurs vues par type de tableau
 * - Définir une vue par défaut qui se charge automatiquement
 * 
 * @file table-views.ts
 * @version 1.0
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Types d'entités disponibles pour les vues de tableaux
 * 
 * IMPORTANT : Cette enum doit être synchronisée avec le backend.
 * Chaque valeur correspond à un endpoint de tableau dans l'application.
 */
export enum EntityType {
  // Entités principales
  MONDES = 'mondes',
  PERSONNAGES = 'personnages',
  EVENEMENTS = 'evenements',
  LIEUX = 'lieux',
  RACES = 'races',
  ROMANS = 'romans',

  // Relations entre entités
  RELATIONS_PERSONNAGES = 'relations-personnages',
  RELATIONS_PERSO_EVENTS = 'relations-perso-events',
  RELATIONS_PERSO_ROMANS = 'relations-perso-romans',
  RELATIONS_EVENT_LIEUX = 'relations-event-lieux',
  RELATIONS_EVENT_ROMANS = 'relations-event-romans',

  // Autres entités
  CARACTERISTIQUES_MONDE = 'caracteristiques-monde',
  CARACTERISTIQUES_PERSONNAGE = 'caracteristiques-personnage',
  SYSTEM_CALENDARS = 'system-calendars',
}

// ============================================================================
// INTERFACES PRINCIPALES (API)
// ============================================================================

/**
 * Interface représentant une vue de tableau
 * Correspond exactement à l'entité côté backend
 */
export interface TableView {
  /** Identifiant unique (UUID) */
  id: string

  /** Nom de la vue (1-50 caractères) */
  name: string

  /** Type d'entité concerné */
  entityType: EntityType

  /** Liste des colonnes visibles (1-20 colonnes) */
  visibleColumns: string[]

  /** Indique si c'est la vue par défaut de l'utilisateur */
  isDefault: boolean

  /** ID de l'utilisateur propriétaire */
  userId: string

  /** Date de création (ISO 8601) */
  createdAt: string

  /** Date de dernière modification (ISO 8601) */
  updatedAt: string
}

/**
 * DTO pour créer une nouvelle vue
 * Envoyé au backend via POST /table-views
 */
export interface CreateTableViewDto {
  /** Nom de la vue (1-50 caractères) */
  name: string

  /** Type d'entité concerné */
  entityType: EntityType

  /** Liste des colonnes visibles (1-20 colonnes) */
  visibleColumns: string[]

  /** Définir comme vue par défaut (optionnel, défaut: false) */
  isDefault?: boolean
}

/**
 * DTO pour mettre à jour une vue existante
 * Envoyé au backend via PATCH /table-views/:id
 * Tous les champs sont optionnels (mise à jour partielle)
 */
export interface UpdateTableViewDto {
  /** Nouveau nom de la vue */
  name?: string

  /** Nouvelles colonnes visibles */
  visibleColumns?: string[]

  /** Définir/retirer comme vue par défaut */
  isDefault?: boolean
}

// ============================================================================
// RÉPONSES API
// ============================================================================

/**
 * Réponse de la liste des vues (GET /table-views?entityType=X)
 */
export interface TableViewsListResponse {
  /** Liste des vues */
  data: TableView[]

  /** Nombre total de vues */
  total: number
}

/**
 * Erreur API générique
 */
export interface TableViewApiError {
  /** Code HTTP */
  statusCode: number

  /** Message(s) d'erreur */
  message: string | string[]

  /** Type d'erreur */
  error: string
}

// ============================================================================
// TYPES FRONTEND - ÉTAT ET COMPOSANTS
// ============================================================================

/**
 * Mode du modal de sauvegarde de vue
 */
export type ViewModalMode = 'create' | 'edit' | 'update-or-create'

/**
 * État interne du hook useTableViews
 */
export interface TableViewsState {
  /** Liste des vues chargées */
  views: TableView[]

  /** Vue actuellement sélectionnée (null = toutes les colonnes) */
  currentView: TableView | null

  /** Indique si les colonnes ont été modifiées depuis la sélection de la vue */
  hasUnsavedChanges: boolean

  /** Erreur éventuelle */
  error: string | null
}

/**
 * Props du composant ViewSelector (dropdown de sélection)
 */
export interface ViewSelectorProps {
  /** Type d'entité du tableau */
  entityType: EntityType

  /** Liste des vues disponibles */
  views: TableView[]

  /** Vue actuellement sélectionnée */
  currentView: TableView | null

  /** Indique si des modifications non sauvegardées existent */
  hasUnsavedChanges: boolean

  /** État de chargement */
  isLoading: boolean

  /** Callback lors du changement de vue */
  onViewChange: (view: TableView | null) => void

  /** Callback pour ouvrir le modal de sauvegarde */
  onSaveClick: () => void

  /** Callback pour éditer une vue */
  onEditView: (view: TableView) => void

  /** Callback pour supprimer une vue */
  onDeleteView: (view: TableView) => void

  /** Callback pour définir une vue par défaut */
  onSetDefault: (view: TableView) => void
}

/**
 * Props du modal de sauvegarde de vue
 */
export interface ViewSaveModalProps {
  /** Le modal est-il ouvert ? */
  isOpen: boolean

  /** Mode du modal */
  mode: ViewModalMode

  /** Type d'entité */
  entityType: EntityType

  /** Vue à éditer (si mode = 'edit') */
  viewToEdit?: TableView | null

  /** Colonnes actuellement visibles (pour la création) */
  currentVisibleColumns: string[]

  /** État de chargement */
  isLoading: boolean

  /** Callback lors de la soumission */
  onSubmit: (data: CreateTableViewDto | UpdateTableViewDto, viewId?: string) => Promise<void>

  /** Callback lors de l'annulation */
  onClose: () => void
}

/**
 * Props du modal de confirmation de suppression
 */
export interface ViewDeleteModalProps {
  /** Le modal est-il ouvert ? */
  isOpen: boolean

  /** Vue à supprimer */
  viewToDelete: TableView | null

  /** État de chargement */
  isLoading: boolean

  /** Callback de confirmation */
  onConfirm: () => Promise<void>

  /** Callback d'annulation */
  onClose: () => void
}

// ============================================================================
// RETOUR DU HOOK useTableViews
// ============================================================================

/**
 * Interface de retour du hook useTableViews
 * Contient toutes les données et fonctions nécessaires pour gérer les vues
 */
export interface UseTableViewsReturn {
  // === DONNÉES ===
  
  /** Liste des vues de l'utilisateur pour ce type d'entité */
  views: TableView[]

  /** Vue actuellement sélectionnée (null = toutes les colonnes) */
  currentView: TableView | null

  /** Vue par défaut de l'utilisateur (peut être différente de currentView) */
  defaultView: TableView | null

  /** Indique si des modifications non sauvegardées existent */
  hasUnsavedChanges: boolean

  // === ÉTATS ===
  
  /** Chargement initial des vues */
  isLoading: boolean

  /** Une mutation (create/update/delete) est en cours */
  isMutating: boolean

  /** Erreur éventuelle */
  error: string | null

  // === ACTIONS ===
  
  /** Sélectionner une vue (null pour revenir à "toutes les colonnes") */
  selectView: (view: TableView | null) => void

  /** Créer une nouvelle vue */
  createView: (data: CreateTableViewDto) => Promise<TableView>

  /** Mettre à jour une vue existante */
  updateView: (id: string, data: UpdateTableViewDto) => Promise<TableView>

  /** Supprimer une vue */
  deleteView: (id: string) => Promise<void>

  /** Définir une vue comme vue par défaut */
  setDefaultView: (id: string) => Promise<void>

  /** Marquer que les colonnes ont été modifiées */
  markAsModified: () => void

  /** Réinitialiser le flag de modifications */
  clearModified: () => void

  /** Recharger la liste des vues */
  refetch: () => void
}

// ============================================================================
// CONFIGURATION DES COLONNES DISPONIBLES PAR ENTITÉ
// ============================================================================

/**
 * Type pour mapper les colonnes disponibles par type d'entité
 */
export type AvailableColumnsMap = {
  [key in EntityType]: string[]
}

/**
 * Configuration des colonnes disponibles par type d'entité
 * 
 * ⚠️ IMPORTANT : Cette configuration doit être synchronisée avec le backend.
 * Si le backend ajoute de nouvelles colonnes, il faut les ajouter ici aussi.
 */
export const AVAILABLE_COLUMNS: AvailableColumnsMap = {
  // === ENTITÉS PRINCIPALES ===

  [EntityType.MONDES]: [
    'id',
    'nom',
    'description',
    'dateCreation',
    'statut',
    'type',
    'niveau_technologique',
    'niveau_magie',
    'population_estimee',
  ],

  [EntityType.PERSONNAGES]: [
    'id',
    'nom',
    'prenom',
    'surnom',
    'description',
    'dateNaissance',
    'dateMort',
    'sexe',
    'statut',
    'alignement',
    'occupation',
    'monde',
    'raceEspece',
  ],

  [EntityType.EVENEMENTS]: [
    'id',
    'nom',
    'description',
    'dateDebut',
    'dateFin',
    'importance',
    'statut',
    'monde',
    'parent',
  ],

  [EntityType.LIEUX]: [
    'id',
    'nom',
    'description',
    'type',
    'statut',
    'monde',
    'parent',
  ],

  [EntityType.RACES]: [
    'id',
    'nom',
    'description',
    'type',
    'esperanceVie',
    'taille_moyenne',
    'monde',
  ],

  [EntityType.ROMANS]: [
    'id',
    'nom',
    'description',
    'datePublication',
    'statut',
    'tome',
    'monde',
  ],

  // === RELATIONS ===

  [EntityType.RELATIONS_PERSONNAGES]: [
    'id',
    'nom',
    'description',
    'dateDebut',
    'dateFin',
    'personnage1',
    'personnage2',
    'monde',
  ],

  [EntityType.RELATIONS_PERSO_EVENTS]: [
    'id',
    'role',
    'nom',
    'description',
    'personnage',
    'evenement',
    'monde',
  ],

  [EntityType.RELATIONS_PERSO_ROMANS]: [
    'id',
    'role',
    'nom',
    'description',
    'personnage',
    'roman',
    'monde',
  ],

  [EntityType.RELATIONS_EVENT_LIEUX]: [
    'id',
    'nom',
    'type',
    'description',
    'evenement',
    'lieu',
    'monde',
  ],

  [EntityType.RELATIONS_EVENT_ROMANS]: [
    'id',
    'nom',
    'importance',
    'description',
    'evenement',
    'roman',
    'monde',
  ],

  // === AUTRES ENTITÉS ===

  [EntityType.CARACTERISTIQUES_MONDE]: [
    'id',
    'nom',
    'type',
    'description',
    'monde',
    'raceEspece',
    'parent',
  ],

  [EntityType.CARACTERISTIQUES_PERSONNAGE]: [
    'id',
    'nom',
    'type',
    'description',
    'dateDebut',
    'dateFin',
    'personnage',
    'monde',
    'parent',
  ],

  [EntityType.SYSTEM_CALENDARS]: [
    'id',
    'nom',
    'description',
    'occurence',
    'monde',
    'parent',
  ],
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère les colonnes disponibles pour un type d'entité
 */
export function getAvailableColumns(entityType: EntityType): string[] {
  return AVAILABLE_COLUMNS[entityType] || []
}

/**
 * Vérifie si une colonne est valide pour un type d'entité
 */
export function isColumnValid(entityType: EntityType, column: string): boolean {
  const availableColumns = getAvailableColumns(entityType)
  return availableColumns.includes(column)
}

/**
 * Vérifie si toutes les colonnes sont valides pour un type d'entité
 */
export function areColumnsValid(entityType: EntityType, columns: string[]): boolean {
  return columns.every((col) => isColumnValid(entityType, col))
}

/**
 * Récupère les colonnes invalides pour un type d'entité
 */
export function getInvalidColumns(entityType: EntityType, columns: string[]): string[] {
  const availableColumns = getAvailableColumns(entityType)
  return columns.filter((col) => !availableColumns.includes(col))
}

// ============================================================================
// VALIDATION CÔTÉ CLIENT
// ============================================================================

/**
 * Interface pour les erreurs de validation
 */
export interface ViewValidationError {
  field: string
  message: string
}

/**
 * Valide les données de création d'une vue
 * Utilisé avant l'envoi au backend pour un feedback immédiat
 */
export function validateCreateView(data: CreateTableViewDto): ViewValidationError[] {
  const errors: ViewValidationError[] = []

  // Validation du nom
  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Le nom de la vue est obligatoire',
    })
  } else if (data.name.length > 50) {
    errors.push({
      field: 'name',
      message: 'Le nom ne peut pas dépasser 50 caractères',
    })
  }

  // Validation de l'entityType
  if (!data.entityType) {
    errors.push({
      field: 'entityType',
      message: "Le type d'entité est obligatoire",
    })
  } else if (!Object.values(EntityType).includes(data.entityType)) {
    errors.push({
      field: 'entityType',
      message: "Type d'entité invalide",
    })
  }

  // Validation des colonnes
  if (!data.visibleColumns || data.visibleColumns.length === 0) {
    errors.push({
      field: 'visibleColumns',
      message: 'Au moins 1 colonne doit être visible',
    })
  } else if (data.visibleColumns.length > 20) {
    errors.push({
      field: 'visibleColumns',
      message: 'Maximum 20 colonnes peuvent être visibles',
    })
  } else if (data.entityType) {
    // Vérifier que les colonnes sont valides
    const invalidColumns = getInvalidColumns(data.entityType, data.visibleColumns)
    if (invalidColumns.length > 0) {
      errors.push({
        field: 'visibleColumns',
        message: `Colonnes invalides : ${invalidColumns.join(', ')}`,
      })
    }
  }

  return errors
}

/**
 * Valide les données de mise à jour d'une vue
 */
export function validateUpdateView(
  data: UpdateTableViewDto,
  entityType: EntityType
): ViewValidationError[] {
  const errors: ViewValidationError[] = []

  // Validation du nom (si fourni)
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Le nom ne peut pas être vide',
      })
    } else if (data.name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Le nom ne peut pas dépasser 50 caractères',
      })
    }
  }

  // Validation des colonnes (si fournies)
  if (data.visibleColumns !== undefined) {
    if (data.visibleColumns.length === 0) {
      errors.push({
        field: 'visibleColumns',
        message: 'Au moins 1 colonne doit être visible',
      })
    } else if (data.visibleColumns.length > 20) {
      errors.push({
        field: 'visibleColumns',
        message: 'Maximum 20 colonnes peuvent être visibles',
      })
    } else {
      const invalidColumns = getInvalidColumns(entityType, data.visibleColumns)
      if (invalidColumns.length > 0) {
        errors.push({
          field: 'visibleColumns',
          message: `Colonnes invalides : ${invalidColumns.join(', ')}`,
        })
      }
    }
  }

  return errors
}

// ============================================================================
// HELPERS POUR LES LABELS
// ============================================================================

/**
 * Labels français pour les types d'entités
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.MONDES]: 'Mondes',
  [EntityType.PERSONNAGES]: 'Personnages',
  [EntityType.EVENEMENTS]: 'Événements',
  [EntityType.LIEUX]: 'Lieux',
  [EntityType.RACES]: 'Races',
  [EntityType.ROMANS]: 'Romans',
  [EntityType.RELATIONS_PERSONNAGES]: 'Relations entre personnages',
  [EntityType.RELATIONS_PERSO_EVENTS]: 'Relations personnage-événement',
  [EntityType.RELATIONS_PERSO_ROMANS]: 'Relations personnage-roman',
  [EntityType.RELATIONS_EVENT_LIEUX]: 'Relations événement-lieu',
  [EntityType.RELATIONS_EVENT_ROMANS]: 'Relations événement-roman',
  [EntityType.CARACTERISTIQUES_MONDE]: 'Caractéristiques de monde',
  [EntityType.CARACTERISTIQUES_PERSONNAGE]: 'Caractéristiques de personnage',
  [EntityType.SYSTEM_CALENDARS]: 'Calendriers système',
}

/**
 * Récupère le label d'un type d'entité
 */
export function getEntityTypeLabel(entityType: EntityType): string {
  return ENTITY_TYPE_LABELS[entityType] || entityType
}
