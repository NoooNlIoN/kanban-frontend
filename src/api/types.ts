export interface Board {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  owner_id: number;
}

export interface BoardsResponse {
  boards: Board[];
  total: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

// Типы ролей пользователей
export type UserRole = "owner" | "admin" | "member";

export interface Member extends User {
  role: UserRole;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface Reaction {
  id: number;
  emoji: string;
  user_id: number;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author: User;
  reactions: Reaction[];
}

export interface Card {
  id: number;
  title: string;
  description: string;
  position?: number;
  order: number;
  column_id: number;
  color?: string;
  completed?: boolean;
  deadline?: string | null;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  assigned_users: (User | number)[];
  labels: Label[];
  tags?: Tag[];
}

export interface Column {
  id: number;
  title: string;
  position?: number;
  order: number;
  board_id: number;
  created_at: string;
  updated_at: string;
  cards: Card[];
}

export interface BoardPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
  can_assign: boolean;
}

// Интерфейс для добавления пользователя на доску
export interface AddUserRequest {
  email: string;
  role: UserRole;
}

// Интерфейс для удаления пользователя с доски
export interface RemoveUserRequest {
  user_id: number;
}

// Интерфейс для передачи прав владельца
export interface TransferOwnershipRequest {
  new_owner_id: number;
}

// Интерфейс для изменения роли пользователя
export interface ChangeRoleRequest {
  user_id: number;
  role: UserRole;
}

export interface BoardComplete extends Board {
  columns: Column[];
  members: Member[];
  permissions: BoardPermissions;
}

// Типы для статистики досок
export interface BoardStatistics {
  total_cards: number;
  completed_cards: number;
  pending_cards: number;
  completion_percentage: number;
  overdue_cards: number;
  total_comments: number;
  avg_completion_time?: number;
}

export interface BoardFullStatsResponse extends Board {
  columns: Column[];
  statistics: BoardStatistics;
}

export interface UserBoardsStatsResponse {
  boards: BoardFullStatsResponse[];
  total_boards: number;
  global_statistics: BoardStatistics;
}

// Интерфейсы для тегов
export interface Tag {
  id: number;
  name: string;
  color: string;
  board_id: number;
}

export interface TagCreate {
  name: string;
  color: string;
  board_id: number;
}

export interface TagUpdate {
  name?: string;
  color?: string;
}

export interface TagAssignment {
  tag_id: number;
  card_id: number;
}

export interface TagResponse {
  status: string;
  message: string;
} 