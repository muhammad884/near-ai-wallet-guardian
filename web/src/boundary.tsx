import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { message: string | null }

export class Boundary extends Component<Props, State> {
  state: State = { message: null }

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  render() {
    if (this.state.message !== null) {
      return (
        <div className="card">
          <span className="tag-demo">ERROR</span>
          <p>This page failed to load. The rest of the app still works.</p>
          <p className="muted">Details: {this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
