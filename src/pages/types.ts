export type Route =
  | { name: 'home' }
  | { name: 'newProject' }
  | { name: 'editProject'; projectId: string }
  | { name: 'addUpdate'; projectId: string }
  | { name: 'addAIResource'; projectId: string }
  | { name: 'addTimeResource'; projectId: string }
  | { name: 'search' }
