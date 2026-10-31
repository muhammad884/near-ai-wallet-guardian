import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class Boundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="card">
          <span className="tag-demo">ERROR</span>
          <p>This page failed to load. The rest of the app still works.</p>
        </div>
      )
    }
    return this.props.children
  }
}
