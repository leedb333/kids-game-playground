import { GameArt } from '../Art'
import type { GameDefinition } from '../games/registry'
import './game-grid.css'

type Props = {
  games: readonly GameDefinition[]
  onChoose: (game: GameDefinition) => void
}

export function GameGrid({ games, onChoose }: Props) {
  return <section className="home-games" aria-labelledby="game-list-heading">
    <h2 className="sr-only" id="game-list-heading">게임 목록</h2>
    <div className="game-grid">
      {games.map(game => (
        <button
          key={game.id}
          className={`card ${game.color}`}
          aria-label={game.title}
          onClick={() => onChoose(game)}
        >
          <GameArt id={game.id} />
          <span className="game-title">{game.title}</span>
          <span className="caption">{game.caption}</span>
        </button>
      ))}
    </div>
  </section>
}
