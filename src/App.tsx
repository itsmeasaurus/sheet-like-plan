import './App.css'
import TaskTimeline from './components/TaskTimeline'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Task Timeline</h1>
      </header>
      <main className="app-main">
        <TaskTimeline />
      </main>
    </div>
  )
}

export default App
