export interface DSAQuestion {
  id: string
  title: string
  topics: string[] // Updated to support multiple topics as array
  difficulty: "Easy" | "Medium" | "Hard"
  link?: string
  isSolved: boolean
  reviseLater?: boolean // Added revise later functionality
  notes?: string
  createdAt: Date
  solvedAt?: Date,
}

export interface Topic {
  name: string
  count: number
  solvedCount: number
}

export interface AppStats {
  totalQuestions: number
  solvedQuestions: number
  topics: Topic[]
}
